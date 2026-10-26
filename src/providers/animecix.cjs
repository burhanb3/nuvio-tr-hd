'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('../util.cjs');
const { isTurkish } = require('../subtitles.cjs');
const ORIGIN = 'https://animecix.tv';
const PLAYER = 'https://tau-video.xyz';

function matchesAnime(record, target) {
  // Require all three canonical anchors. No first-result, substring title or
  // absolute-episode fallback: those can silently select another anime/cour.
  if (Number(record?.tmdb_id) !== target.tmdbId || Number(record.year) !== target.year) return false;
  if (record.imdb_id && target.imdbId && record.imdb_id !== target.imdbId) return false;
  if (target.type === 'tv' ? record.is_series !== true : record.is_series === true) return false;
  return [record.original_title, record.name, record.name_english, record.name_romanji]
    .some(title => normalizeTitle(title) === normalizeTitle(target.originalTitle));
}
async function scanAnimecix(http, target) {
  if (!target.isAnime) return [];
  let match;
  for (const title of (target.searchTitles || [target.originalTitle]).slice(0, 2)) {
    const query = String(title).trim().replace(/\s+/g, '-');
    const data = await http.json(`${ORIGIN}/secure/search/${encodeURIComponent(query)}?type=&limit=20`);
    match = data?.results?.find(record => matchesAnime(record, target));
    if (match) break;
  }
  if (!match || http.expired()) return [];
  const season = target.type === 'tv' ? target.season : 1, episode = target.type === 'tv' ? target.episode : 1;
  const data = await http.json(`${ORIGIN}/secure/episode-videos?titleId=${match.id}&episode=${episode}&season=${season}`);
  const sources = Array.isArray(data) ? data : [];
  const found = new Set();
  const selected = sources.filter(source => {
    const address = safeUrl(source.url);
    if (Number(source.title_id) !== Number(match.id) || Number(source.season_num) !== season || Number(source.episode_num) !== episode ||
        source.approved === false || source.category !== 'full' || !address || new URL(address).origin !== PLAYER) return false;
    const id = new URL(address).pathname.match(/^\/embed\/([a-f0-9]{24})$/i)?.[1];
    if (!id || found.has(id)) return false;
    found.add(id); source._embedId = id; return true;
  }).slice(0, 3);
  return (await mapLimit(selected, 2, async source => {
    const video = await http.json(`${PLAYER}/api/video/${source._embedId}`, { headers: { Referer: PLAYER + '/', Origin: PLAYER } });
    if (!video || video._id !== source._embedId || Number(video.title_id) !== Number(match.id) ||
        Number(video.season_number) !== season || Number(video.episode_number) !== episode || !Array.isArray(video.urls)) return [];
    const captions = [...(Array.isArray(source.captions) ? source.captions : []), ...(Array.isArray(video.captions) ? video.captions : [])]
      .filter(sub => sub && isTurkish(sub.language || sub.lang || sub.srclang))
      .map(sub => ({ url: sub.url || sub.src, language: 'tr', _scope: 'paired', identity: target }));
    const filename = `${target.originalTitle}.${target.year}` + (target.type === 'tv' ? `.S${String(season).padStart(2,'0')}E${String(episode).padStart(2,'0')}` : '');
    return video.urls.slice(0, 4).map(entry => {
      const url = safeUrl(entry?.url);
      if (!url || !/\.(mp4|mkv|m3u8)(?:$|[?#])/i.test(url)) return null;
      return { url, filename: `${filename}.${String(entry.label || '').replace(/[^A-Za-z0-9]/g, '')}.mp4`,
        identity: target, identityConfidence: 100, source: 'Animecix', sourceNote: String(source.extra || '').slice(0, 65),
        turkishSource: isTurkish(source.language), headers: { Referer: PLAYER + '/', Origin: PLAYER }, subtitles: captions };
    }).filter(Boolean);
  })).flat();
}
module.exports = { scanAnimecix, matchesAnime };
