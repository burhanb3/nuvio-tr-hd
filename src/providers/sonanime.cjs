'use strict';
const { safeUrl } = require('../util.cjs');
const { sameName, syntheticFilename } = require('./page-data.cjs');
const API = 'https://api.sonanime.com', ORIGIN = 'https://sonanime.com/';
// The search list no longer carries tmdb_id (Nov 2026); only the detail
// record does. A search row is therefore a lead (type + year + name, and a
// tmdb_id only when present); the detail must carry the exact TMDB id.
function matchesSonAnime(row, target, requireTmdb = true) {
  return !!row && (row.tmdb_id == null ? !requireTmdb : Number(row.tmdb_id) === target.tmdbId) && Number(row.anime_year) === target.year &&
    (target.type === 'tv' ? row.anime_type === 'anime' : ['movie', 'film'].includes(row.anime_type)) &&
    [row.anime_name, row.anime_name_en].some(name => sameName(name, target));
}
// Seconds since epoch (current API) or an ISO date (older records).
const expiresAt = value => typeof value === 'number' ? value * (value < 1e11 ? 1000 : 1) : Date.parse(value);
async function scanSonAnime(http, target) {
  if (!target.isAnime) return [];
  let match;
  for (const title of (target.searchTitles || [target.originalTitle]).slice(0, 2)) {
    const rows = await http.json(`${API}/api/anime/search?q=${encodeURIComponent(title)}`);
    match = Array.isArray(rows) && rows.find(r => matchesSonAnime(r, target, false));
    if (match || http.expired()) break;
  }
  if (!match || !/^[a-z0-9-]{1,160}$/i.test(match.anime_link) || http.expired()) return [];
  const detail = await http.json(`${API}/api/anime/link/${encodeURIComponent(match.anime_link)}`);
  // The detail endpoint omits anime_type. Bind it to the typed search record.
  if (!detail || Number(detail.anime_id) !== Number(match.anime_id) ||
      !matchesSonAnime({ ...detail, anime_type: detail.anime_type || match.anime_type }, target)) return [];
  const season = target.type === 'tv' ? target.season : 1, episode = target.type === 'tv' ? target.episode : 1;
  const row = detail.episodes?.find(e => Number(e.anime_id) === Number(match.anime_id) && Number(e.anime_season) === season && Number(e.episode_number) === episode);
  if (!row || row.links_expire_at && !(expiresAt(row.links_expire_at) > Date.now())) return [];
  const seen = new Set();
  return [480,720,1080,360].map(q => {
    const url = safeUrl(row[`episode_link_${q}`]);
    if (!url || new URL(url).origin !== 'https://video.konununuzmani.com' || !new URL(url).pathname.startsWith('/video/') || seen.has(url)) return null;
    seen.add(url);
    return { url, source: 'SonAnime', identity: target, identityConfidence: 100, filename: syntheticFilename(target), filenameSynthetic: true,
      claimedQuality: q+'p', headers: { Referer: ORIGIN }, getOnly: true, subtitles: [] };
  }).filter(Boolean);
}
module.exports = { scanSonAnime, matchesSonAnime };
