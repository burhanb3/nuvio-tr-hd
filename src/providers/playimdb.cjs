'use strict';
const { safeUrl, normalizeTitle } = require('../util.cjs');
const { matchesEpisode } = require('../matching.cjs');
const { filenameIdentity } = require('./directory.cjs');

const PLAY_API = 'https://streamdata.vaplayer.ru/api.php';
async function scanPlayImdb(http, target) {
  const query = `?tmdb=${target.tmdbId}&type=${target.type}` + (target.type === 'tv' ? `&season=${target.season}&episode=${target.episode}` : '');
  const result = await http.json(PLAY_API + query, { headers: { Referer: 'https://nextgencloudfabric.com/', Origin: 'https://nextgencloudfabric.com' } });
  if (String(result?.status_code) !== '200' || !Array.isArray(result?.data?.stream_urls)) return [];
  const data = result.data;
  if (data.imdb_id && target.imdbId && data.imdb_id !== target.imdbId) return [];
  const path = String(data.file_name || '').split('/');
  const filename = path.pop();
  const extraName = normalizeTitle(filename).replace(normalizeTitle(target.originalTitle), '');
  if (/\b(sample|trailer|featurette)\b/.test(extraName)) return [];
  if (target.type === 'tv') {
    // Episode release names commonly omit the series' first-air year. The
    // API's exact IMDb binding replaces that missing filename evidence only.
    const title = normalizeTitle(target.originalTitle), leaf = normalizeTitle(filename);
    // Some scene files start with their release group (e.g. untouchables-).
    // Their canonical series folder is separate API evidence; do not discard
    // it before matching. The leaf must still contain this exact title/S/E.
    const titleBound = leaf.startsWith(title + ' ') || (path.some(folder => normalizeTitle(folder).startsWith(title + ' ')) && (' ' + leaf + ' ').includes(' ' + title + ' '));
    if (!target.imdbId || data.imdb_id !== target.imdbId || !matchesEpisode(filename, target) || !titleBound) return [];
  } else if (!filenameIdentity(filename, target) && !(target.imdbId && data.imdb_id === target.imdbId &&
    target.releaseYears?.some(year => filenameIdentity(filename, { ...target, year })))) return [];
  const subtitles = (Array.isArray(result.default_subs) ? result.default_subs : []).map(s => ({ ...s,
    language: s.lang || s.language, url: s.url || s.file, _scope: 'paired' }));
  return data.stream_urls.slice(0, 6).map((url, index) => ({ url: safeUrl(url), filename, serverIndex: index + 1,
    headers: { Referer: 'https://nextgencloudfabric.com/', Origin: 'https://nextgencloudfabric.com' },
    subtitles, subtitleBase: PLAY_API, source: 'PlayIMDb', identity: target, identityImdbBound: !!target.imdbId && data.imdb_id === target.imdbId, identityConfidence: 95 })).filter(x => x.url);
}
module.exports = { scanPlayImdb, PLAY_API };
