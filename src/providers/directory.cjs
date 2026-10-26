'use strict';
const { safeUrl, normalizeTitle } = require('../util.cjs');

const DIRECTORY_ORIGIN = 'https://a.111477.xyz';
function decodeEntities(text) {
  return String(text).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/<[^>]*>/g, '').trim();
}
function anchors(html, limit = 500) {
  const result = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    result.push({ href: decodeEntities(match[1]), text: decodeEntities(match[2]) });
    if (result.length >= Math.min(2000,limit)) break;
  }
  return result;
}
function filenameIdentity(filename, target, yearRequired = true) {
  const title = normalizeTitle(filename);
  const original = normalizeTitle(target.originalTitle.replace(/:/g, ''));
  const expected = `${original} ${target.year}`;
  if (yearRequired ? !title.startsWith(expected + ' ') : !title.startsWith(original + ' ')) return false;
  if (target.type === 'tv') {
    const match = /\bs(\d{1,3})[ ._-]*e(\d{1,3})\b/i.exec(filename.replace(/[._]/g, ' '));
    if (!match || Number(match[1]) !== target.season || Number(match[2]) !== target.episode) return false;
  }
  return !/\b(sample|trailer|featurette)\b/i.test(filename);
}

async function scanDirectory(http, target, settings = {}) {
  const origin = safeUrl(settings.directoryOrigin || DIRECTORY_ORIGIN);
  if (!origin) return [];
  const root = origin.replace(/\/$/, '');
  const title = target.originalTitle.replace(/:/g, '');
  const paths = target.type === 'movie' ? [`/movies/${encodeURIComponent(`${title} (${target.year})`)}/`] :
    [`/tvs/${encodeURIComponent(`${title} (${target.year})`)}/Season%20${String(target.season).padStart(2, '0')}/`,
      `/tvs/${encodeURIComponent(title)}/Season%20${String(target.season).padStart(2, '0')}/`,
      `/tvs/${encodeURIComponent(title)}/Season%20${target.season}/`];
  for (const path of paths) {
    if (http.expired()) break;
    const page = await http.text(root + path, { headers: { Referer: root + '/' } });
    if (!page) continue;
    const found = anchors(page.text);
    const subtitles = found.filter(x => /\.(srt|vtt)$/i.test(x.href) && /(?:[._-](?:tr|tur)|turkish|türkçe)/i.test(x.text || x.href))
      .map(x => ({ url: safeUrl(x.href, page.url), language: 'tr', releaseName: x.text, _scope: 'release' }));
    const out = [];
    for (const entry of found) {
      const url = safeUrl(entry.href, page.url);
      if (!url || !/\.(mp4|mkv)(?:$|[?#])/i.test(url)) continue;
      let filename;
      try { filename = decodeURIComponent(url.split('?')[0].split('/').pop()); } catch { continue; }
      // ID originates from canonical TMDB metadata; title/year are independently
      // checked against the directory and each release filename.
      if (!filenameIdentity(filename, target, true)) continue;
      out.push({ url, filename, headers: { Referer: root + '/' }, subtitles: subtitles.filter(s => s.url),
        subtitleBase: page.url, source: 'DahmerMovies', identity: target, identityConfidence: 95 });
    }
    if (out.length) return out.slice(0, 12);
  }
  return [];
}
module.exports = { scanDirectory, filenameIdentity, anchors, decodeEntities, DIRECTORY_ORIGIN };
