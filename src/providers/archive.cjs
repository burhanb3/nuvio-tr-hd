'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('../util.cjs');

function archiveQuery(target, preferHd = false) {
  const title = target.originalTitle.replace(/["\\]/g, ' ');
  const q = `mediatype:movies AND title:"${title}" AND year:${target.year}` +
    (preferHd ? ' AND (title:(1080p OR 720p OR 2160p OR remastered) OR description:1080p)' : '');
  return `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=year&rows=4&output=json`;
}
async function scanArchive(http, target) {
  // Series item dates often mean an upload/episode date. Do not guess a season.
  if (target.type !== 'movie') return [];
  const results = await Promise.all([http.json(archiveQuery(target, true)), http.json(archiveQuery(target))]);
  const docs = [...new Map(results.flatMap(r => Array.isArray(r?.response?.docs) ? r.response.docs : []).map(d => [d.identifier, d])).values()];
  const groups = await mapLimit(docs.slice(0, 6), 2, async doc => {
    if (typeof doc.identifier !== 'string' || !/^[\w.-]+$/.test(doc.identifier)) return [];
    const data = await http.json(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`);
    const meta = data?.metadata;
    if (!meta || !Array.isArray(data.files) || meta.is_dark || meta.access_restricted === 'true') return [];
    const title = String(meta.original_title || meta.title || '').replace(/\s*\(\d{4}\)\s*$/, '');
    const year = Number(String(meta.year || meta.date || '').slice(0, 4));
    const actualTitle = normalizeTitle(title), expectedTitle = normalizeTitle(target.originalTitle);
    const releaseSuffix = actualTitle.startsWith(expectedTitle + ' ') ? actualTitle.slice(expectedTitle.length + 1) : '';
    const releaseTitle = releaseSuffix && new RegExp(`^(?:${target.year}|1080p|720p|2160p|remastered|restored)\\b`).test(releaseSuffix) &&
      !/\b(trailer|commercial|review|opening|teaser|documentary)\b/.test(releaseSuffix);
    if ((actualTitle !== expectedTitle && !releaseTitle) || year !== target.year) return [];
    if (meta.tmdb_id != null && Number(meta.tmdb_id) !== target.tmdbId) return [];
    if (meta.imdb_id && target.imdbId && !String(meta.imdb_id).includes(target.imdbId)) return [];
    const files = data.files.filter(f => typeof f.name === 'string' && f.private !== 'true');
    const urlFor = name => safeUrl(`https://archive.org/download/${encodeURIComponent(doc.identifier)}/${name.split('/').map(encodeURIComponent).join('/')}`);
    const subtitles = files.filter(f => /\.(srt|vtt)$/i.test(f.name) && /(?:[._-](tr|tur)|turkish)/i.test(f.name))
      .map(f => ({ url: urlFor(f.name), language: 'tr', releaseName: f.name, _scope: 'release' }));
    return files.filter(f => {
      if (!/\.(mp4|mkv)$/i.test(f.name) || /\b(sample|trailer|commercial|teaser)\b/i.test(f.name)) return false;
      // Archive item titles alone also match trailers. A feature must have a
      // plausible full length, not just the same title/year and a video header.
      const duration = Number(f.length);
      if (target.runtimeMinutes && (!duration || duration < target.runtimeMinutes * 60 * 0.7 || duration > target.runtimeMinutes * 60 * 1.35)) return false;
      return true;
    }).sort((a, b) => (Number(b.height) || 0) - (Number(a.height) || 0)).slice(0, 6)
      .map(f => ({ url: urlFor(f.name), filename: String(f.original || f.name).split('/').pop(), headers: {}, subtitles, subtitleBase: 'https://archive.org/',
        source: 'Internet Archive', identity: target, identityConfidence: meta.tmdb_id ? 100 : 90 }));
  });
  return groups.flat().filter(x => x.url);
}
module.exports = { scanArchive, archiveQuery };
