'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('../util.cjs');
const { anchors,decodeEntities,filenameIdentity } = require('./directory.cjs');
const { decodeUtf8 } = require('../subtitles.cjs');
const { matchesEpisode } = require('../matching.cjs');
const {pixelPage,publicFile}=require('./pixeldrain.cjs');
const HDHUB_ORIGIN = 'https://4khdhub.one';

function decode64(value) {
  if (typeof value !== 'string' || value.length > 30000) return null;
  try { return decodeUtf8(Uint8Array.from(atob(value), c => c.charCodeAt(0))); } catch { return null; }
}
function shortlinkTarget(html) {
  // Public URL encoding used by this shortener, not script execution. Read
  // only its data literal; no cookies, challenge solving, or remote eval.
  const value = html.match(/s\('o','([A-Za-z0-9+/=]+)'/)?.[1];
  try {
    const inner = decode64(decode64(value));
    if (!inner) return null;
    const rotated = inner.replace(/[A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13)));
    const data = JSON.parse(decode64(rotated));
    const url = safeUrl(decode64(data.o));
    return url && /^hubcloud\.[a-z.]+$/i.test(new URL(url).hostname) ? url : null;
  } catch { return null; }
}
function pageMatches(html, target) {
  const id = html.match(/\bdefaultVideoId\s*=\s*['"](\d+)['"]/)?.[1];
  if (target.type === 'movie' && Number(id) !== target.tmdbId) return false;
  for (const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(block[1]);
      const type = target.type === 'tv' ? 'TVSeries' : 'Movie';
      const year = Number(String(target.type === 'tv' ? data.startDate : data.datePublished).slice(0, 4));
      // The series page exposes no numeric TMDB ID. Bind its exact title/year
      // AND TMDB poster path from canonical metadata, not an arbitrary first hit.
      const bound = target.type === 'movie' || (target.posterPath && typeof data.image === 'string' &&
        new URL(data.image).hostname === 'image.tmdb.org' && new URL(data.image).pathname.endsWith(target.posterPath));
      // Some movie pages append a collection label to the original title.
      // Strip only this explicit label; the exact TMDB ID, year and release
      // filenames still have to match. Never accept fuzzy/substring titles.
      const pageTitle = normalizeTitle(data.name).replace(/ marvel phase [1-6]$/, '');
      const years = target.type === 'movie' && Number(id) === target.tmdbId ? [target.year, ...(target.releaseYears || [])] : [target.year];
      if (data['@type'] === type && bound && pageTitle === normalizeTitle(target.originalTitle) && years.includes(year)) return true;
    } catch {}
  }
  return false;
}
function releaseEntries(html, target) {
  const out = [];
  const sections = target.type === 'tv' ? html.split(/<div\s+class="episode-download-item\b/).slice(1, 650) :
    html.split(/<div\s+class="download-item\b/).slice(1, 121);
  for (const section of sections) {
    const filename = section.match(/<div\s+class="(?:episode-)?file-title">\s*([^<]+)</)?.[1]?.trim();
    if (!filename || /\.(zip|rar|7z|exe|torrent)$/i.test(filename)) continue;
    const normalized = normalizeTitle(filename);
    const title = normalizeTitle(target.originalTitle);
    if (!normalized.startsWith(title + ' ')) continue;
    const acceptedYears = target.type === 'movie' ? [target.year, ...(target.releaseYears || [])] : [target.year];
    if (target.type === 'tv' ? !matchesEpisode(filename, target) : !acceptedYears.some(year => normalized.includes(' ' + year + ' '))) continue;
    const years = normalized.match(/\b(?:19|20)\d{2}\b/g);
    if (years?.some(y => !acceptedYears.includes(Number(y)))) continue;
    const link = anchors(section).find(a => /Download HubCloud/i.test(a.text));
    const url = safeUrl(link?.href, HDHUB_ORIGIN + '/');
    if (!url || !/^greenmotors\.(?:club|cc)$/i.test(new URL(url).hostname)) continue;
    const sizeHint = section.match(/>\s*([\d.,]+)\s*(Gi?B|Mi?B)\s*</i);
    const amount = Number(sizeHint?.[1]?.replace(',','.'));
    const units={gb:1,gib:1.073741824,mb:0.001,mib:0.001048576};
    const size = amount>0 ? amount * units[sizeHint[2].toLowerCase()] : Infinity;
    // Size/codec text orders which candidates to inspect. It is never used as
    // a verified resolution or byte count in the returned stream.
    out.push({ filename, url, size, av1: /\bAV1\b/i.test(filename) });
  }
  return out.sort((a, b) => a.size - b.size);
}
function releasePlan(entries,maximum=12) {
  const hint=e=>Number(e.filename.match(/\b(4320|2160|1440|1080|720|576|480|360)p\b/i)?.[1])||(/\b4k\b/i.test(e.filename)?2160:0);
  const small=entries.slice().sort((a,b)=>a.size-b.size),high=entries.slice().sort((a,b)=>hint(b)-hint(a)||a.size-b.size);
  const large=entries.filter(e=>Number.isFinite(e.size)).slice().sort((a,b)=>b.size-a.size),out=[],seen=new Set();
  // Keep the same bounded release budget, but reserve early opportunities
  // for high-quality/large releases instead of only the cheapest twelve.
  for(let i=0;out.length<maximum&&i<entries.length;i++)for(const e of [small[i],high[i],i<2?large[i]:null]) {
    if(e&&!seen.has(e.url)){seen.add(e.url);out.push(e);if(out.length===maximum)break;}
  }
  return out;
}
function pixelFilename(value,target){
  if(typeof value!=='string'||!/\.(mp4|mkv)$/i.test(value))return false;
  const name=normalizeTitle(value),title=normalizeTitle(target.originalTitle),suffix=name.startsWith(title+' ')?name.slice(title.length+1):null;
  if(!suffix||/\b(sample|trailer|fanedit|workprint|hdcam|camrip|hdtc|hdts|telesync)\b/.test(suffix))return false;
  const years=target.type==='movie'?[target.year,...(target.releaseYears||[])]:[target.year];
  if((suffix.match(/\b(?:19|20)\d{2}\b/g)||[]).some(y=>!years.includes(Number(y))))return false;
  return target.type==='tv'?matchesEpisode(value,target):years.some(year=>filenameIdentity(value,{...target,year}));
}
async function resolveRelease(http, entry, target, allowExtensionless,onCandidates) {
  const redirect = await http.text(entry.url);
  const hub = redirect && shortlinkTarget(redirect.text);
  if (!hub || http.expired()) return [];
  const page = await http.text(hub);
  const hubName = page?.text.match(/<title>\s*([^<]+)<\/title>/i)?.[1]?.trim();
  const extension = hubName?.match(/\.(mkv|mp4)$/i)?.[1]?.toLowerCase();
  // A display title without .mkv is still a release. A host-provided suffix is
  // only a naming hint; the file bridge/probe must validate the actual format.
  const filename = /\.(mkv|mp4)$/i.test(entry.filename) ? entry.filename : extension ? entry.filename + '.' + extension : entry.filename;
  const terminal = page && safeUrl(page.text.match(/\bvar\s+url\s*=\s*['"]([^'"]+)['"]/)?.[1]);
  if (!terminal || new URL(terminal).hostname !== 'gamerxyt.com' || new URL(terminal).pathname !== '/hubcloud.php') return [];
  const result = await http.text(terminal);
  if (!result) return [];
  const direct=anchors(result.text).filter(a => /FSL(?:v2)? Server|Download File\s*\[/i.test(a.text)).slice(0, 3).map(a => {
    // Some public terminal anchors contain literal filename spaces. Encode
    // only those spaces; do not double-encode existing signed URL escapes.
    const url = safeUrl(a.href.replace(/ /g, '%20'), result.url);
    if (!url) return null;
    const hostname = new URL(url).hostname;
    const r2 = hostname.endsWith('.r2.cloudflarestorage.com');
    const publicFile = hostname.endsWith('.workers.dev') && /\.(mkv|mp4)(?:$|[?#])/i.test(url);
    if (!r2 && !publicFile) return null;
    // Raw R2 object keys often lack .mkv. A published bridge must supply the
    // filename-preserving alias; direct fallback cannot promise native naming.
    if (!allowExtensionless && !/\.(?:mkv|mp4)(?:$|[?#])/i.test(url) && !/\.mp4$/i.test(filename)) return null;
    return { url, filename, headers: { Referer: 'https://gamerxyt.com/' }, subtitles: [],
      ...(publicFile ? { getOnly: true } : {}),
      subtitleBase: result.url, source: '4KHDHub / HubCloud', identity: target, identityConfidence: 95 };
  }).filter(Boolean);
  // This is a separately published file host. Never route it through the R2
  // naming service, and never wait for a slow legacy mirror before checking it.
  const pixel=pixelPage(result.text),extra=[];
  const pixelWork=(async()=>{
    if(!pixel||http.expired()||!hubName||!pixelFilename(decodeEntities(hubName),target)||
      normalizeTitle(decodeEntities(hubName))!==normalizeTitle(entry.filename))return;
    const u=new URL(pixel),data=await http.json(u.origin+'/api/file/'+u.pathname.split('/').pop()+'/info');
    const file=publicFile(data,pixel,decodeEntities(hubName),target,{source:'4KHDHub / Pixeldrain',matchesName:pixelFilename});
    if(file){extra.push(file);if(onCandidates)await onCandidates([file]);}
  })();
  await Promise.all([pixelWork,direct.length&&onCandidates?onCandidates(direct):Promise.resolve()]);
  return [...direct,...extra];
}
async function scanHdHub(http, target, options = {}) {
  const search = await http.text(HDHUB_ORIGIN + '/?s=' + encodeURIComponent(target.originalTitle));
  if (!search) return [];
  const years = target.type === 'movie' ? [target.year, ...(target.releaseYears || [])] : [target.year];
  const expected = normalizeTitle(target.originalTitle);
  const result = anchors(search.text).find(a => years.some(year => {
    const title = normalizeTitle(a.text).replace(/ marvel phase [1-6] /, ' ');
    return target.type === 'tv' ? (' ' + title + ' ').includes(' ' + expected + ' ' + year + ' ') : title.endsWith(expected + ' ' + year);
  }));
  const pageUrl = result && safeUrl(result.href, search.url);
  if (!pageUrl || new URL(pageUrl).origin !== HDHUB_ORIGIN) return [];
  const page = await http.text(pageUrl, { maxChars: target.type === 'tv' ? 1000000 : 700000 });
  if (!page || !pageMatches(page.text, target)) return [];
  const entries = releasePlan(releaseEntries(page.text, target));
  const resolved = [];
  // A terminal URL is not yet a working file. Feed each release to the probe
  // pipeline as soon as it resolves; dead small mirrors must not consume the
  // entire quota or make every other release wait for one batch to finish.
  const maximum = 12;
  for (let offset = 0; offset < Math.min(maximum, entries.length) && !http.expired(); offset += 2) {
    if (offset > 0 && !options.onCandidates && resolved.length >= 3) break;
    await mapLimit(entries.slice(offset, offset + 2), 2, async entry => {
      const found = await resolveRelease(http, entry, target, options.allowExtensionless === true,options.onCandidates);
      resolved.push(...found);
    });
  }
  return options.onCandidates ? resolved : resolved.slice(0, 6);
}
module.exports = { scanHdHub, shortlinkTarget, pageMatches, releaseEntries, releasePlan,pixelFilename, HDHUB_ORIGIN };
