'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('../util.cjs');
const { filenameIdentity } = require('./directory.cjs');
const { verifiedArchiveRecords, verifiedMetadataFile } = require('./archive-verified.cjs');
const { matchesEpisode } = require('../matching.cjs');
const { subtitleLanguage } = require('../subtitles.cjs');

function archiveNames(target,titles=[]){
  const original=normalizeTitle(target.originalTitle),names=[...new Set([target.originalTitle,...(target.searchTitles||[]),...titles].map(normalizeTitle).filter(Boolean))].slice(0,8);
  if(target.type!=='movie')return [original];
  // Some release headings contain both official names, for example the
  // localized title followed by the original. Neither half may be guessed.
  return [...new Set([...names,...names.filter(n=>n!==original).flatMap(n=>[n+' '+original,original+' '+n])])].sort((a,b)=>b.length-a.length);
}
function bilingualHint(value,target){
  if(target.type!=='movie')return false;
  const title=' '+normalizeTitle(value)+' ',original=' '+normalizeTitle(target.originalTitle)+' ',at=title.indexOf(original);
  if(at<0||at>200)return false;
  const tail=title.slice(at+original.length),yearAt=tail.indexOf(' '+target.year+' ');
  return at>0&&tail.startsWith(target.year+' ')||at===0&&yearAt>0&&yearAt<121;
}
function bilingualFileNames(files,target){
  if(target.type!=='movie')return [];
  const original=normalizeTitle(target.originalTitle),out=[];
  for(const file of files.slice(0,200)){
    if(typeof file?.name!=='string'||file.private==='true'||!/\.(mkv|mp4)$/i.test(file.name))continue;
    const parts=file.name.split('/').pop().split(/\s+[-–—]\s+/);
    if(parts.length!==2)continue;
    const originalFirst=normalizeTitle(parts[0])===original;
    const localized=originalFirst?parts[1].match(/^(.{1,120}?)\s*\(\s*(\d{4})\s*\)/):null;
    const prefix=originalFirst?localized?.[1]:parts[0];
    if(!prefix||prefix.length>120||/[\r\n\x00-\x1f]/.test(prefix)||
      /\b(?:19|20)\d{2}\b|\b(?:collection|anthology|trailer|review|documentary|sample|workprints?|fanedit|fan edit|recap|commentary|interview)\b/.test(normalizeTitle(prefix))||
      (originalFirst?Number(localized[2])!==target.year:!filenameIdentity(parts[1],target)))continue;
    // The prefix is a release label, not a newly asserted TMDB translation.
    // Accept only the combined heading; every video must still supply the
    // exact original title/year and pass the real duration/container probe.
    const name=originalFirst?original+' '+normalizeTitle(prefix):normalizeTitle(prefix)+' '+original;
    if(!out.includes(name))out.push(name);if(out.length===4)break;
  }
  return out;
}
function titleBinding(value,target,names){
  const full=normalizeTitle(value),actual=normalizeTitle(String(value).replace(/\s*\(\s*\d{4}\s*\)\s*$/,''));
  const name=names.find(n=>actual===n||actual.startsWith(n+' ')),suffix=name&&actual.startsWith(name+' ')?actual.slice(name.length+1):'';
  const release=suffix&&new RegExp(`^(?:${target.year}|1080p|720p|2160p|remastered|restored)\\b`).test(suffix)&&
    !/\b(trailer|commercial|review|opening|teaser|documentary)\b/.test(suffix);
  const titleYear=!!name&&(full===name+' '+target.year||full.startsWith(name+' '+target.year+' '));
  return {actual,name,suffix,release,titleYear,exact:!!name&&actual===name,localized:!!name&&name!==normalizeTitle(target.originalTitle)};
}

function archiveQuery(target, preferHd = false, titleYear = target.type === 'movie' || !preferHd) {
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
  let names=archiveNames(target),titleJob;
  async function localizedNames(){
    if(!titleJob)titleJob=Promise.resolve().then(()=>options.loadTitles?options.loadTitles():[]).catch(()=>[]);
    const titles=await titleJob;names=archiveNames(target,Array.isArray(titles)?titles:[]);return names;
  }
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
    if(bilingualHint(doc.title,target))return 1; // Lookup hint; metadata and exact file identity must still bind.
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
    const explicitYear = Number(String(meta.year || '').slice(0, 4));
    const datedYear = Number(String(meta.date || '').slice(0, 4));
    if (explicitYear && explicitYear !== target.year) return [];
    if (meta.tmdb_id != null && Number(meta.tmdb_id) !== target.tmdbId) return [];
    if (meta.imdb_id && target.imdbId) {
      const ids = String(meta.imdb_id).match(/tt\d+/g) || [];
      if (!ids.length || ids.some(id => id !== target.imdbId)) return [];
    }
    const fileNames=bilingualHint(rawTitle,target)?bilingualFileNames(data.files,target):[];
    const localNames=[...new Set([...names,...fileNames])].sort((a,b)=>b.length-a.length);
    let binding=titleBinding(rawTitle,target,localNames);
    if(!pinnedItem&&!binding.exact&&!binding.release&&!binding.titleYear&&bilingualHint(rawTitle,target)&&options.loadTitles)
      binding=titleBinding(rawTitle,target,[...await localizedNames(),...fileNames].sort((a,b)=>b.length-a.length));
    const fileIdentityNames=[...new Set([...names,...fileNames])];
    const actualTitle=binding.actual,expectedTitle=normalizeTitle(target.originalTitle),releaseSuffix=binding.suffix;
    const yearFromTitle = !explicitYear && datedYear !== target.year && binding.titleYear;
    const seriesImdbBound = target.type === 'tv' && target.imdbId && String(meta.imdb_id || '').trim() === target.imdbId;
    const seriesTitle = target.type === 'tv' && (actualTitle === expectedTitle || actualTitle.startsWith(expectedTitle+' ') && /^(?:season|sezon|s\d|complete|all seasons)\b/.test(releaseSuffix));
    if (!pinnedItem && yearFromTitle && !(target.runtimeMinutes > 0)) return [];
    if (!pinnedItem && yearFromTitle && datedYear > 0 && datedYear < target.year) return [];
    if (!pinnedItem && ((!binding.exact && !binding.release && !binding.titleYear && !seriesTitle) ||
      (!explicitYear && datedYear !== target.year && !yearFromTitle && !seriesImdbBound))) return [];
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
    const subtitles = files.filter(f => /\.(srt|vtt)$/i.test(f.name)).map(f => {
      const extra=normalizeTitle(f.name).replace(expectedTitle,'');
      const language=subtitleLanguage(f.language)||subtitleLanguage(extra.match(/\b(tr|tur|turkish|en|eng|english)\b/)?.[1]);
      return language ? { url:urlFor(f.name),language,releaseName:f.name,_scope:'release' } : null;
    }).filter(Boolean);
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
      if (!pinnedItem && (yearFromTitle||binding.localized) && !fileIdentityNames.some(name=>filenameIdentity(f.name.split('/').pop(),{...target,originalTitle:name}))) return false;
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
        ...(yearFromTitle||binding.localized ? { durationTolerance: 0.1 } : {}),
        requireDuration: pinnedItem || yearFromTitle || binding.localized || target.runtimeMinutes > 0 && !(Number(f.length) > 0),
        source: 'Internet Archive', identity: target, identityConfidence: meta.tmdb_id ? 100 : 90 }));
    if (candidates.length && options.onCandidates && !http.expired()) await options.onCandidates(candidates);
    return candidates;
  }
}
module.exports = { scanArchive, archiveQuery,archiveNames,bilingualHint,titleBinding,bilingualFileNames };
