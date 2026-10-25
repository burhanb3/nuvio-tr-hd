'use strict';
const { normalizeTitle, positiveInt } = require('./util.cjs');

async function resolveIdentity(http, tmdbId, mediaType, season, episode, key) {
  const id = positiveInt(tmdbId);
  const type = mediaType === 'movie' ? 'movie' : ['tv', 'series'].includes(mediaType) ? 'tv' : null;
  if (!id || !type || !key || (type === 'tv' && (!positiveInt(season) || !positiveInt(episode)))) return null;
  const meta = await http.json(`https://api.themoviedb.org/3/${type}/${id}?api_key=${encodeURIComponent(key)}&append_to_response=external_ids`);
  if (!meta || meta.id !== id) return null;
  const originalTitle = type === 'movie' ? meta.original_title : meta.original_name;
  const date = type === 'movie' ? meta.release_date : meta.first_air_date;
  const year = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? Number(date.slice(0, 4)) : null;
  if (!normalizeTitle(originalTitle) || !year) return null;
  return { tmdbId: id, originalTitle, year, type, season: type === 'tv' ? Number(season) : null,
    episode: type === 'tv' ? Number(episode) : null, imdbId: meta.imdb_id || meta.external_ids?.imdb_id || null,
    runtimeMinutes: type === 'movie' && Number(meta.runtime) > 0 ? Number(meta.runtime) : null };
}

function matchesIdentity(record, target, requireEpisode = true) {
  if (!record || typeof record !== 'object') return false;
  if (positiveInt(record.tmdbId) !== target.tmdbId || Number(record.year) !== target.year) return false;
  if (!normalizeTitle(record.originalTitle) || normalizeTitle(record.originalTitle) !== normalizeTitle(target.originalTitle)) return false;
  const type = record.type === 'series' ? 'tv' : record.type;
  if (type !== target.type) return false;
  return target.type !== 'tv' || !requireEpisode ||
    (positiveInt(record.season) === target.season && positiveInt(record.episode) === target.episode);
}

function matchesAddonMeta(meta, target, requestedId) {
  if (!meta || typeof meta !== 'object') return false;
  const type = meta.type === 'series' ? 'tv' : meta.type;
  if (type !== target.type || String(meta.id) !== requestedId) return false;
  const explicitTmdb = meta.tmdbId ?? meta.moviedb_id;
  if (explicitTmdb != null && positiveInt(explicitTmdb) !== target.tmdbId) return false;
  if (requestedId.startsWith('tmdb:') && requestedId !== `tmdb:${target.tmdbId}`) return false;
  if (requestedId.startsWith('tt') && requestedId !== target.imdbId) return false;
  const originalTitle = meta.originalTitle || meta.original_title || meta.original_name || meta.name;
  const yearText = String(meta.year || meta.releaseInfo || (meta.released || '').slice(0, 4));
  // A series may advertise a year range: only its first release year is relevant.
  const year = /^(\d{4})(?:$|[-–])/.exec(yearText)?.[1];
  return Number(year) === target.year && normalizeTitle(originalTitle) === normalizeTitle(target.originalTitle);
}

function matchesStreamFilename(stream, target) {
  if (stream.identity) return matchesIdentity(stream.identity, target);
  // For a stream-only addon, bind the exact queried TMDB/derived IMDb ID to an
  // explicit original title + year in the release filename. No fuzzy search.
  const filename = stream.behaviorHints?.filename;
  if (typeof filename !== 'string') return false;
  const normalized = normalizeTitle(filename);
  const expected = `${normalizeTitle(target.originalTitle)} ${target.year}`;
  if (!normalized.startsWith(expected + ' ')) return false;
  if (target.type === 'tv') {
    const episode = /\bs(\d{1,3})e(\d{1,3})\b/i.exec(filename.replace(/[._]/g, ' '));
    if (!episode || Number(episode[1]) !== target.season || Number(episode[2]) !== target.episode) return false;
  }
  return true;
}
module.exports = { resolveIdentity, matchesIdentity, matchesAddonMeta, matchesStreamFilename };
