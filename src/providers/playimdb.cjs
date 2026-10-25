'use strict';
const { safeUrl } = require('../util.cjs');
const { filenameIdentity } = require('./directory.cjs');

const PLAY_API = 'https://streamdata.vaplayer.ru/api.php';
async function scanPlayImdb(http, target) {
  const query = `?tmdb=${target.tmdbId}&type=${target.type}` + (target.type === 'tv' ? `&season=${target.season}&episode=${target.episode}` : '');
  const result = await http.json(PLAY_API + query, { headers: { Referer: 'https://nextgencloudfabric.com/', Origin: 'https://nextgencloudfabric.com' } });
  if (String(result?.status_code) !== '200' || !Array.isArray(result?.data?.stream_urls)) return [];
  const data = result.data;
  if (data.imdb_id && target.imdbId && data.imdb_id !== target.imdbId) return [];
  const filename = String(data.file_name || '').split('/').pop();
  if (!filenameIdentity(filename, target)) return [];
  const subtitles = (Array.isArray(result.default_subs) ? result.default_subs : []).map(s => ({ ...s,
    language: s.lang || s.language, url: s.url || s.file, _scope: 'paired' }));
  return data.stream_urls.slice(0, 6).map(url => ({ url: safeUrl(url), filename,
    headers: { Referer: 'https://nextgencloudfabric.com/', Origin: 'https://nextgencloudfabric.com' },
    subtitles, subtitleBase: PLAY_API, source: 'PlayIMDb', identity: target, identityConfidence: 95 })).filter(x => x.url);
}
module.exports = { scanPlayImdb, PLAY_API };
