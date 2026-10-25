'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('./util.cjs');
const { isTurkish } = require('./subtitles.cjs');
const { matchesEpisode } = require('./matching.cjs');

const SUBTITLE_SERVICES = [
  'https://opensubtitles.stremio.homes/tr/ai-translated=false%7Cfrom=all%7Cauto-adjustment=false',
  'https://opensubtitles-v3.strem.io'
];
const TURKISH_SUBTITLE_SERVICES = ['https://altyazidb.online'];
function releaseKey(value) {
  return normalizeTitle(String(value || '').split('/').pop().replace(/\.(mkv|mp4|srt|vtt)$/i, '')
    .replace(/[._ -](tr|tur|turkish|sdh|forced|cc)$/i, ''));
}
function sourceFamily(value) {
  const text = String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/bluray|brrip|bdrip/.test(text)) return 'bluray';
  if (/webdl|webrip/.test(text)) return 'web';
  if (/hdtv/.test(text)) return 'hdtv';
  if (/hddvd/.test(text)) return 'hddvd';
  if (/dvdrip|dvd/.test(text)) return 'dvd';
  return null;
}
function cutSignature(value) {
  const text = normalizeTitle(value).replace(/ /g, '');
  return ['extended', 'directorscut', 'unrated', 'theatrical', 'uncut'].filter(t => text.includes(t)).join('|');
}
function scoreSubtitle(sub, candidate, video, target, allowLoose = false) {
  if (!isTurkish(sub.language || sub.lang || sub.lang_code) || sub.ai_translated === true || sub.ai_translated === 'true') return null;
  if (target.type === 'tv' && ((Number(sub.season) > 0 && Number(sub.season) !== target.season) ||
    (Number(sub.episode) > 0 && Number(sub.episode) !== target.episode))) return null;
  const name = String(sub.releaseName || sub.movieReleaseName || sub.title || sub.subtitleFileName || '');
  const file = candidate.filename || decodeFilename(candidate.url);
  const a = releaseKey(file), b = releaseKey(name);
  if (target.type === 'tv' && /\bs\d+[ ._-]*e\d+\b|\b\d+x\d+\b/i.test(name) && !matchesEpisode(name, target)) return null;
  const years = b.match(/\b(?:19|20)\d{2}\b/g);
  if (years?.some(y => Number(y) !== target.year) && !(target.type === 'tv' && sub._identityBound === true &&
    years.every(y => Number(y) >= target.year && Number(y) <= new Date().getFullYear() + 1))) return null;
  const hash = String(sub.moviehash || sub.videoHash || '').toLowerCase();
  if (video.videoHash && hash === video.videoHash.toLowerCase()) return { score: 100, label: 'Dosya hash eşleşmesi' };
  if (cutSignature(file) !== cutSignature(name) && sub._scope !== 'paired') return null;
  const titleYear = `${normalizeTitle(target.originalTitle)} ${target.year}`;
  const hasReleaseDetail = a.startsWith(titleYear + ' ') && a.length > titleYear.length + 4;
  if (!sub._releaseNotesOnly && hasReleaseDetail && b && (a === b || (' ' + b + ' ').includes(' ' + a + ' '))) return { score: 95, label: 'Tam sürüm eşleşmesi' };
  if (!sub._scope || sub._scope === 'paired') return { score: 90, label: 'Kaynakla eşlenmiş' };
  const title = normalizeTitle(target.originalTitle);
  // A looser release match must still be this film. The title-scoped IMDb
  // request is not permission to merge an explicitly different title/year.
  if (b !== title && b !== titleYear && !b.startsWith(titleYear + ' ') &&
      !(target.type === 'tv' && sub._identityBound === true && b.startsWith(title + ' ') && matchesEpisode(name, target))) return null;
  const family = sourceFamily(file);
  if (family && family === sourceFamily(name)) {
    const ignore = new Set((title + ' ' + target.year).split(' '));
    const words = value => new Set(value.split(' ').filter(w => w.length >= 3 && !ignore.has(w)));
    const x = words(a), y = words(b);
    const common = [...x].filter(w => y.has(w)).length;
    if (common >= 2) return { score: Math.min(85, 70 + common * 2), label: 'Sürüm benzerliği; senkron kontrolü önerilir' };
  }
  if (video.duration > 60) return { score: 50, label: 'Film eşleşmesi; süre kontrolü bekleniyor', requireDuration: true, ...(allowLoose ? { allowFilmFallback: true } : {}) };
  return allowLoose ? { score: 35, label: 'Film eşleşmesi; senkron belirsiz' } : null;
}
function decodeFilename(url) {
  try { return decodeURIComponent(String(url).split(/[?#]/)[0].split('/').pop()); } catch { return ''; }
}

function createSubtitleDiscovery(http, target, settings) {
  const cache = new Map();
  const bases = settings.subtitleUrls ? String(settings.subtitleUrls).split(/\s+/)
    .map(url => safeUrl(url, undefined, settings.allowHttp === true)?.replace(/\/manifest\.json(?:\?.*)?$/, '').replace(/\/$/, '')).filter(Boolean).slice(0, 3) :
    [...TURKISH_SUBTITLE_SERVICES, ...SUBTITLE_SERVICES];
  const type = target.type === 'tv' ? 'series' : 'movie';
  const id = target.imdbId + (target.type === 'tv' ? `:${target.season}:${target.episode}` : '');
  function lookup(url) {
    if (!cache.has(url)) cache.set(url, http.json(url, { timeoutMs: 9000 }));
    return cache.get(url);
  }
  function normalize(data, base) {
    return Array.isArray(data?.subtitles) ? data.subtitles.filter(s => s && isTurkish(s.lang || s.language || s.lang_code)).slice(0, 100)
      .map(s => {
        const release = String(s.releaseName || s.title || s.name || s.label || '');
        const title = normalizeTitle(target.originalTitle);
        // AltyaziDB returns release notes without a movie title. Its exact
        // IMDb+episode route supplies identity, never a full release/hash match.
        const named = base === 'https://altyazidb.online' && !normalizeTitle(release).startsWith(title + ' ') ?
          `${target.originalTitle}.${target.year}.${release}` : release;
        return { ...s, language: s.lang || s.language || s.lang_code, releaseName: named, _scope: 'title',
          _identityBound: true, _releaseNotesOnly: named !== release,
          _subtitleProvider: base === 'https://altyazidb.online' ? 'AltyazıDB' : 'OpenSubtitles', identity: target };
      }) : [];
  }
  function prefetch() {
    if (settings.autoSubtitles === false || !target.imdbId || http.expired()) return Promise.resolve([]);
    return mapLimit(bases, 3, async base => normalize(await lookup(`${base}/subtitles/${type}/${encodeURIComponent(id)}.json`), base));
  }
  const discover = async (candidate, video) => {
    if (settings.autoSubtitles === false || !target.imdbId || http.expired()) return [];
    const filename = candidate.filename || decodeFilename(video.url);
    const extras = [`filename=${encodeURIComponent(filename)}`, `videoSize=${video.size || 0}`];
    if (video.videoHash) extras.push(`videoHash=${video.videoHash}`);
    // Start title and hash requests together; one slow service must not add a
    // second serial timeout to every candidate. URL/credentials stay private.
    const titleResults = prefetch();
    let hashResults = Promise.resolve([]);
    // A title lookup is shared across alternatives. Request hash-aware results
    // only where a real hash exists, without losing the fast title response.
    const hashBase = bases.find(base => base.includes('opensubtitles.stremio.homes'));
    if (settings.hashLookups !== false && video.videoHash && hashBase && !http.expired()) {
      const hashUrl = `${hashBase}/subtitles/${type}/${encodeURIComponent(id)}/${extras.join('&')}.json`;
      hashResults = lookup(hashUrl).then(data => normalize(data, hashBase));
    }
    const [groups, hashed] = await Promise.all([titleResults, hashResults]);
    return [...hashed, ...groups.flat()];
  };
  discover.prefetch = prefetch;
  return discover;
}
module.exports = { createSubtitleDiscovery, scoreSubtitle, releaseKey, decodeFilename, SUBTITLE_SERVICES, TURKISH_SUBTITLE_SERVICES };
