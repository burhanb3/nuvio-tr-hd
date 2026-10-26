'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('../util.cjs');
const { filenameIdentity } = require('./directory.cjs');
const { verifiedArchiveRecords, verifiedMetadataFile } = require('./archive-verified.cjs');
const { matchesEpisode } = require('../matching.cjs');

function archiveQuery(target, preferHd = false, titleYear = !preferHd) {
  const title = target.originalTitle.replace(/["\\]/g, ' ');
  const exclusions = ['sample','trailer','featurette','review','podcast','commercial','teaser']
    .filter(word => !normalizeTitle(title).split(' ').includes(word));
  const binding = target.type === 'tv' && preferHd && /^tt\d+$/.test(target.imdbId || '') ? `(title:"${title}" AND imdb_id:${target.imdbId})` :
    `title:"${title}" AND ` + (titleYear ? `(year:${target.year} OR title:${target.year})` : `year:${target.year}`);
  const q = `mediatype:movies AND ${binding}` +
    (titleYear && exclusions.length ? ` AND NOT title:(${exclusions.join(' OR ')})` : '') +
    (preferHd && target.type === 'movie' ? ' AND (title:(1080p OR 720p OR 2160p OR remastered) OR description:1080p)' : '');
  return `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=year&rows=12&sort[]=downloads%20desc&output=json`;
}
async function scanArchive(http, target, options = {}) {
  // General TV search requires an exact episode plus independent series
  // title/year or explicit IMDb binding. Content pins remain narrow repairs.
  const verifiedRecords = verifiedArchiveRecords(target);
  const expected = normalizeTitle(target.originalTitle);
  const searches = Promise.all([http.json(archiveQuery(target, true), { timeoutMs: 6500 }), http.json(archiveQuery(target), { timeoutMs: 6500 })]);
  // Existing exact repairs are checked while the general search is in flight.
  // A stalled search must not delay a known file's own metadata/probe work.
  const pinnedWork = mapLimit(verifiedRecords.map(r=>({identifier:r.item})),2,loadDoc);
  const results = await searches;
  const priority = doc => {
    if (!doc.title) return 1; // Older/custom search fixtures may omit this field.
    const title = normalizeTitle(String(doc.title));
    if (title === expected + ' ' + target.year || title.startsWith(expected + ' ' + target.year + ' ')) return 3;
    if (title === expected || new RegExp(`^(?:1080p|720p|2160p|remastered|restored)\\b`).test(title.startsWith(expected + ' ') ? title.slice(expected.length + 1) : '')) return 2;
    if (target.type === 'tv' && title.startsWith(expected+' ') && /^(?:season|sezon|s\d|complete|all seasons)\b/.test(title.slice(expected.length+1))) return 1;
    return 0;
  };
  const docs = [...new Map(results.flatMap(r => Array.isArray(r?.response?.docs) ? r.response.docs : []).map(d => [d.identifier, d])).values()]
    .filter(d=>!verifiedRecords.some(r=>r.item===d.identifier))
    .filter(d => priority(d) > 0 && !/\b(sample|trailer|featurette|review|podcast|commercial|teaser)\b/.test(normalizeTitle(d.title || '').replace(expected, '')))
    .sort((a,b) => priority(b) - priority(a));
  const groups = await mapLimit(docs.slice(0, Math.max(0,(options.onCandidates ? 12 : 8)-verifiedRecords.length)),2,loadDoc);
  const pinned = await pinnedWork;
  return [...pinned,...groups].flat().filter(x=>x.url);
  async function loadDoc(doc) {
    if (typeof doc.identifier !== 'string' || !/^[\w.-]+$/.test(doc.identifier)) return [];
    const data = await http.json(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`, { timeoutMs: 6500 });
    const meta = data?.metadata;
    if (!meta || !Array.isArray(data.files) || meta.is_dark || meta.access_restricted === 'true') return [];
    const verifiedRecord = verifiedRecords.find(r => r.item === doc.identifier);
    const pinnedFiles = data.files.filter(f => verifiedMetadataFile(verifiedRecord,f));
    const pinnedItem = pinnedFiles.length > 0;
    if (verifiedRecord && !pinnedItem) return [];
    const rawTitle = String(meta.original_title || meta.title || '');
    const title = rawTitle.replace(/\s*\(\d{4}\)\s*$/, '');
    const explicitYear = Number(String(meta.year || '').slice(0, 4));
    const datedYear = Number(String(meta.date || '').slice(0, 4));
    const actualTitle = normalizeTitle(title), expectedTitle = normalizeTitle(target.originalTitle);
    const releaseSuffix = actualTitle.startsWith(expectedTitle + ' ') ? actualTitle.slice(expectedTitle.length + 1) : '';
    const releaseTitle = releaseSuffix && new RegExp(`^(?:${target.year}|1080p|720p|2160p|remastered|restored)\\b`).test(releaseSuffix) &&
      !/\b(trailer|commercial|review|opening|teaser|documentary)\b/.test(releaseSuffix);
    const fullTitle = normalizeTitle(rawTitle);
    const titleYearBound = fullTitle === expectedTitle + ' ' + target.year || fullTitle.startsWith(expectedTitle + ' ' + target.year + ' ');
    const yearFromTitle = !explicitYear && datedYear !== target.year && titleYearBound;
    const seriesImdbBound = target.type === 'tv' && target.imdbId && String(meta.imdb_id || '').trim() === target.imdbId;
    const seriesTitle = target.type === 'tv' && (actualTitle === expectedTitle || actualTitle.startsWith(expectedTitle+' ') && /^(?:season|sezon|s\d|complete|all seasons)\b/.test(releaseSuffix));
    if (!pinnedItem && yearFromTitle && !(target.runtimeMinutes > 0)) return [];
    if (!pinnedItem && yearFromTitle && datedYear > 0 && datedYear < target.year) return [];
    if (explicitYear && explicitYear !== target.year) return [];
    if (!pinnedItem && ((actualTitle !== expectedTitle && !releaseTitle && !titleYearBound && !seriesTitle) ||
      (!explicitYear && datedYear !== target.year && !yearFromTitle && !seriesImdbBound))) return [];
    if (meta.tmdb_id != null && Number(meta.tmdb_id) !== target.tmdbId) return [];
    if (meta.imdb_id && target.imdbId) {
      const ids = String(meta.imdb_id).match(/tt\d+/g) || [];
      if (!ids.length || ids.some(id => id !== target.imdbId)) return [];
    }
    const files = data.files.filter(f => typeof f.name === 'string' && f.private !== 'true');
    const directory = typeof data.dir === 'string' && /^\/\d+\/items\/[\w.-]+$/.test(data.dir) && data.dir.endsWith('/items/' + doc.identifier) ? data.dir : null;
    // These are Archive's generated replica fields, not uploader-provided
    // arbitrary URLs. Avoid the extra front-door redirect on every range.
    const servers = [...new Set([data.d1, ...(Array.isArray(data.workable_servers) ? data.workable_servers : []), data.d2])]
      .filter(host => typeof host === 'string' && /^[a-z]{2}\d{4,8}\.(?:us|eu|ca)\.archive\.org$/.test(host)).slice(0,2);
    const urlsFor = name => {
      const path = name.split('/').map(encodeURIComponent).join('/');
      return directory && servers.length ? servers.map(host => safeUrl(`https://${host}${directory}/${path}`)).filter(Boolean) :
        [safeUrl(`https://archive.org/download/${encodeURIComponent(doc.identifier)}/${path}`)].filter(Boolean);
    };
    const urlFor = name => urlsFor(name)[0];
    const subtitles = files.filter(f => /\.(srt|vtt)$/i.test(f.name) && /(?:[._-](tr|tur)|turkish)/i.test(f.name))
      .map(f => ({ url: urlFor(f.name), language: 'tr', releaseName: f.name, _scope: 'release' }));
    const videos = files.filter(f => {
      if (pinnedItem && !verifiedMetadataFile(verifiedRecord,f)) return false;
      const extraName = normalizeTitle(f.name).replace(expectedTitle, '');
      if (!/\.(mp4|mkv)$/i.test(f.name) || /\b(sample|trailer|commercial|teaser)\b/.test(extraName)) return false;
      if (!pinnedItem && target.type === 'tv' && (!matchesEpisode(f.name,target) ||
        !normalizeTitle(f.name.split('/').pop()).startsWith(expectedTitle+' ') ||
        !seriesImdbBound && !filenameIdentity(f.name.split('/').pop(),target))) return false;
      // Missing release-year metadata is filled only by both the exact item
      // title/year AND an exact filename/year. An upload date is not a release
      // year. The real container duration is required again during probing.
      if (!pinnedItem && yearFromTitle && !filenameIdentity(f.name.split('/').pop(), target)) return false;
      // Archive item titles alone also match trailers. A feature must have a
      // plausible full length, not just the same title/year and a video header.
      const duration = Number(f.length);
      if (target.runtimeMinutes && duration > 0 && (duration < target.runtimeMinutes * 60 * 0.7 || duration > target.runtimeMinutes * 60 * 1.35)) return false;
      return true;
    });
    // Preserve HD originals, but also inspect smaller derivatives instead of
    // spending every slot on six large encodes of the same item.
    const small = videos.slice().sort((a,b) => (Number(a.size) || Infinity) - (Number(b.size) || Infinity)).slice(0,3);
    const hd = videos.slice().sort((a,b) => (Number(b.height) || 0) - (Number(a.height) || 0)).slice(0,3);
    const candidates = [...new Map([...small,...hd].map(f => [f.name,f])).values()]
      .map(f => ({ url: urlFor(f.name), filename: String(f.original || f.name).split('/').pop(), headers: {}, subtitles, subtitleBase: 'https://archive.org/',
        alternateUrls: urlsFor(f.name).slice(1),
        getOnly: true,
        ...(pinnedItem ? { expectedFile: verifiedMetadataFile(verifiedRecord,f) } : {}),
        ...(pinnedItem && verifiedRecord.burnedSubtitleLanguage ? { burnedSubtitleLanguage: verifiedRecord.burnedSubtitleLanguage } : {}),
        sourceItemId: doc.identifier, mediaFilename: f.name, releaseYearBasis: pinnedItem ? 'content-sample-pinned-file' : yearFromTitle ? 'exact-title-and-filename' : 'metadata',
        ...(yearFromTitle ? { durationTolerance: 0.1 } : {}),
        requireDuration: pinnedItem || yearFromTitle || target.runtimeMinutes > 0 && !(Number(f.length) > 0),
        source: 'Internet Archive', identity: target, identityConfidence: meta.tmdb_id ? 100 : 90 }));
    if (candidates.length && options.onCandidates && !http.expired()) await options.onCandidates(candidates);
    return candidates;
  }
}
module.exports = { scanArchive, archiveQuery };
