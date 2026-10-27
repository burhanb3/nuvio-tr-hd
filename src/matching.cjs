'use strict';
const { normalizeTitle, positiveInt } = require('./util.cjs');

async function resolveIdentity(http, tmdbId, mediaType, season, episode, key) {
  const id = positiveInt(tmdbId);
  const type = mediaType === 'movie' ? 'movie' : ['tv', 'series', 'show', 'other'].includes(mediaType) ? 'tv' : null;
  const fail = reason => { http.note?.({ stage: 'identity', reason }); return null; };
  if (!id) return fail('invalid_tmdb_id');
  if (!type) return fail('invalid_media_type');
  if (!key) return fail('missing_tmdb_key');
  if (type === 'tv' && (!positiveInt(season) || !positiveInt(episode))) return fail('missing_episode');
  http.note?.({ stage: 'identity', reason: 'request_started' });
  const append = type === 'movie' ? 'external_ids,release_dates' : 'external_ids';
  const meta = await http.json(`https://api.themoviedb.org/3/${type}/${id}?api_key=${encodeURIComponent(key)}&append_to_response=${append}`, { timeoutMs: 10000 });
  if (!meta) return fail('tmdb_request_failed');
  if (meta.id !== id) return fail('tmdb_id_mismatch');
  const originalTitle = type === 'movie' ? meta.original_title : meta.original_name;
  const date = type === 'movie' ? meta.release_date : meta.first_air_date;
  const year = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? Number(date.slice(0, 4)) : null;
  if (!normalizeTitle(originalTitle) || !year) return fail('tmdb_metadata_incomplete');
  // A festival premiere and the wide release can fall in adjacent years.
  // Accept only years actually returned for this exact TMDB movie, never an
  // unverified +/- one-year filename heuristic or a later re-release.
  const releaseYears = type === 'movie' && Array.isArray(meta.release_dates?.results) ? [...new Set([year,
    ...meta.release_dates.results.slice(0,250).flatMap(country => Array.isArray(country?.release_dates) ? country.release_dates.slice(0,40) : [])
      .filter(r => [1,2,3,4].includes(r?.type) && /^\d{4}-\d{2}-\d{2}T/.test(String(r.release_date)))
      .map(r => Number(r.release_date.slice(0,4))).filter(y => Math.abs(y - year) <= 1)])].sort() : [year];
  http.note?.({ stage: 'identity', reason: 'ok', year, type });
  return { tmdbId: id, originalTitle, year, releaseYears, type, originalLanguage: typeof meta.original_language === 'string' ? meta.original_language : null,
    firstAirDate: type === 'tv' ? date : null, season: type === 'tv' ? Number(season) : null,
    searchTitles: [...new Set([meta.title || meta.name, originalTitle].filter(v => typeof v === 'string' && v.trim()))].slice(0, 2),
    isAnime: meta.genres?.some(g => g.id === 16) === true && (meta.original_language === 'ja' || meta.origin_country?.includes('JP') === true),
    ...(typeof meta.poster_path === 'string' && /^\/[A-Za-z0-9]+\.(jpg|png)$/i.test(meta.poster_path) ? { posterPath: meta.poster_path } : {}),
    episode: type === 'tv' ? Number(episode) : null, imdbId: meta.imdb_id || meta.external_ids?.imdb_id || null,
    runtimeMinutes: type === 'movie' && Number(meta.runtime) > 0 ? Number(meta.runtime) :
      type === 'tv' && Number(meta.episode_run_time?.[0]) > 0 ? Number(meta.episode_run_time[0]) : null };
}

function matchesEpisode(value, target) {
  const text = String(value).replace(/[._]/g, ' ');
  const found = [...text.matchAll(/\bs(\d{1,3})[ -]*e(\d{1,3})\b|\b(\d{1,2})x(\d{1,3})\b/gi)];
  return found.length > 0 && found.every(m => Number(m[1] || m[3]) === target.season && Number(m[2] || m[4]) === target.episode) &&
    !/\bs\d+[ -]*e\d+\s*[-+]\s*(?:e)?\d+\b/i.test(text);
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
async function resolveTranslatedTitles(http,target,key,languages=['tr','en']) {
  if(!key||http.expired())return [];
  const data=await http.json(`https://api.themoviedb.org/3/${target.type}/${target.tmdbId}/translations?api_key=${encodeURIComponent(key)}`,{timeoutMs:3000});
  if(data?.id!==target.tmdbId||!Array.isArray(data.translations))return [];
  const selected=languages.filter(l=>['tr','en','fr'].includes(l));
  return [...new Set(data.translations.filter(r=>selected.includes(r.iso_639_1))
    .map(r=>target.type==='movie'?r.data?.title:r.data?.name).filter(v=>typeof v==='string'&&v.trim()))].slice(0,4);
}
async function resolveAlternativeTitles(http,target,key) {
  if(!key||http.expired())return [];
  const data=await http.json(`https://api.themoviedb.org/3/${target.type}/${target.tmdbId}/alternative_titles?api_key=${encodeURIComponent(key)}`,{timeoutMs:3000});
  if(data?.id!==target.tmdbId)return [];
  const rows=target.type==='movie'?data.titles:data.results;
  return Array.isArray(rows)?[...new Set(rows.slice(0,150).filter(r=>['US','GB','TR'].includes(r.iso_3166_1))
    .map(r=>r.title).filter(t=>typeof t==='string'&&t.trim()&&t.length<=200))].slice(0,30):[];
}
module.exports = { resolveIdentity, resolveTranslatedTitles, resolveAlternativeTitles, matchesIdentity, matchesAddonMeta, matchesStreamFilename, matchesEpisode };
