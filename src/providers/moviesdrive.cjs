'use strict';
const {safeUrl,normalizeTitle,mapLimit}=require('../util.cjs');
const {anchors,decodeEntities,filenameIdentity}=require('./directory.cjs');
const {canonicalNames}=require('./page-data.cjs');
const {matchesEpisode}=require('../matching.cjs');
const {pixelPage,publicFile}=require('./pixeldrain.cjs');
const ORIGIN='https://new5.moviesdrive.beer',ARCHIVE='https://mdrive.lol';
function catalogueOrigin(value){
  const url=safeUrl(value);if(!url)return null;
  const u=new URL(url);
  return u.protocol==='https:'&&/^new[1-9]\d{0,2}\.moviesdrive\.beer$/.test(u.hostname)&&!u.port?u.origin:null;
}
function matchesQuery(search,query){
  const entries=String(search||'').replace(/^\?/,'').split('&').map(s=>s.split('='));
  const values=key=>entries.filter(p=>p[0]===key).map(p=>p.slice(1).join('='));
  const q=values('q'),page=values('page');
  try{return q.length===1&&page.length===1&&decodeURIComponent(q[0].replace(/\+/g,' '))===query&&page[0]==='1';}catch{return false;}
}
async function searchCatalogue(http,origin,query){
  // A publisher domain migration can drop q/page from Location. Read the
  // final URL before using the JSON; an unfiltered latest-posts response is
  // not a search result. Follow only an advertised same-publisher migration,
  // with at most one reissue and within the existing source deadline.
  const suffix='/search.php?q='+encodeURIComponent(query)+'&page=1';
  for(let attempt=0;attempt<2&&!http.expired();attempt++){
    const response=await http.text(origin+suffix,{headers:{Accept:'application/json'}});
    if(!response)return null;
    const next=catalogueOrigin(response.url),u=new URL(response.url);
    if(!next||u.pathname!=='/search.php')return null;
    if(next!==origin){
      origin=next;
      if(!matchesQuery(u.search,query))continue;
    }else if(!matchesQuery(u.search,query))return null;
    try{return{data:JSON.parse(response.text),origin};}catch{return null;}
  }
  return null;
}
function text(value){return decodeEntities(String(value||'').replace(/&nbsp;/gi,' ')).replace(/\u00a0/g,' ');}
function titleMatches(value,target){
  const match=text(value).match(/^(?:Download\s+)?(.+?)\s*\((\d{4})\)(?=\s|$)/i);
  return !!match&&Number(match[2])===target.year&&canonicalNames(target).includes(normalizeTitle(match[1]));
}
function titleLookupHint(value,target,imdbBound=false){
  const m=text(value).match(/^(?:Download\s+)?(.+?)\s*\((\d{4})\)(?=\s|$)/i);
  return target.type==='movie'&&!!m&&Number(m[2])===target.year&&(imdbBound||canonicalNames(target).some(name=>(' '+normalizeTitle(m[1])+' ').includes(' '+name+' ')));
}
function cleanFilename(value){return decodeEntities(value).replace(/^(?:\[\[?\s*(?:www\.)?moviesdrives?\.[a-z]+\s*\]\]?\s*[-._ ]*)+/i,'').trim();}
function seriesTitleMatches(value,target,requireYear=true){
  // Later seasons need their own canonical season year and episode runtime.
  // The series' original year stays intact in the identity.
  if(target.type!=='tv'||target.season!==1&&!Number.isInteger(target.seasonReleaseYear))return false;
  const m=text(value).match(/^(?:Download\s+)?(.+?)\s*\(Season\s+(\d{1,2})\)\s*(?:(\d{4})\b)?/i);
  return !!m&&Number(m[2])===target.season&&canonicalNames(target).includes(normalizeTitle(m[1]))&&
    (!m[3]||[target.year,target.seasonReleaseYear].includes(Number(m[3])))&&(!requireYear||target.season>1||Number(m[3])===target.year);
}
function fileMatches(value,target){
  const name=cleanFilename(value);
  return /\.(mkv|mp4)$/i.test(name)&&canonicalNames(target).some(title=>filenameIdentity(name,{...target,originalTitle:title},target.type!=='tv'))&&
    (target.type!=='tv'||canonicalNames(target).some(title=>normalizeTitle(name).startsWith(title+' ')&&/^(?:(?:19|20)\d{2} )?(?:s\d{1,3} ?e\d{1,3}|\d{1,2}x\d{1,3})\b/.test(normalizeTitle(name).slice(title.length+1))))&&
    (target.type!=='tv'||matchesEpisode(name,target)&&!(normalizeTitle(name).match(/\b(?:19|20)\d{2}\b/g)||[]).some(y=>![target.year,target.seasonReleaseYear].includes(Number(y))))&&
    !/\b(sample|trailer|hdcam|camrip|hdtc|hdts|telesync)\b/i.test(normalizeTitle(name).slice(normalizeTitle(target.originalTitle).length));
}
function searchPages(data,target){
  if(!Array.isArray(data?.hits))return [];
  return data.hits.slice(0,30).map(h=>h?.document).filter(d=>d&&(target.type==='tv'?seriesTitleMatches(d.post_title,target)&&!!target.imdbId&&d.imdb_id===target.imdbId:titleMatches(d.post_title,target)&&(!d.imdb_id||d.imdb_id===target.imdbId))&&
    typeof d.permalink==='string'&&/^\/[a-z0-9-]+\/$/.test(d.permalink)).slice(0,2);
}
function releaseEntries(html,target){
  const heading=String(html).match(/<h1\b[^>]*>([\s\S]{0,2500}?)<\/h1>/i)?.[1];
  if(!heading||!(target.type==='tv'?seriesTitleMatches(heading,target):titleMatches(heading,target)))return [];
  const article=String(html).match(/<article\b[^>]*class=["'][^"']*\bpost-content\b[^"']*["'][^>]*>([\s\S]{0,400000}?)<\/article>/i)?.[1];
  if(!article)return [];
  const ids=anchors(article,1000).map(a=>a.href.match(/^https?:\/\/(?:www\.)?imdb\.com\/title\/(tt\d+)(?:$|[/?#])/i)?.[1]).filter(Boolean);
  if(target.imdbId&&ids.some(id=>id!==target.imdbId))return [];
  if(target.type==='tv'&&(!target.imdbId||!ids.includes(target.imdbId)))return [];
  if(target.type==='tv'&&target.season>1){
    const years=[...text(article.replace(/<[^>]+>/g,' ')).matchAll(/\bReleased Year:\s*((?:19|20)\d{2})\b/gi)].map(m=>Number(m[1]));
    if(!years.length||years.some(year=>year!==target.seasonReleaseYear))return [];
  }
  let release=null;const rows=[];
  for(const m of article.matchAll(/<h[45]\b[^>]*>([\s\S]{0,5000}?)<\/h[45]>/gi)){
    const label=text(m[1]);
    if(target.type==='tv'?seriesTitleMatches(label,target,false):titleMatches(label,target)){release=label;continue;}
    const link=anchors(m[1]).find(a=>{const u=safeUrl(a.href);return u&&new URL(u).origin===ARCHIVE&&/^\/archive\/[1-9]\d{0,9}\/$/.test(new URL(u).pathname);});
    if(!link){release=null;continue;}
    if(!release)continue;
    if(target.type==='tv'&&!/\bSingle Episode\b/i.test(link.text)){release=null;continue;}
    const url=safeUrl(link.href),size=(target.type==='tv'?release:label).match(/\[\s*([\d.,]+)\s*(GB|MB)(?:\/E)?\s*\]/i),quality=Number(release.match(/\b(2160|1440|1080|720|480|360)p\b/i)?.[1])||0;
    if(!rows.some(r=>r.url===url))rows.push({url,quality,size:size?Number(size[1].replace(',','.'))*(size[2].toUpperCase()==='GB'?1e9:1e6):Infinity});
    release=null;
  }
  const small=rows.slice().sort((a,b)=>a.size-b.size),high=rows.slice().sort((a,b)=>b.quality-a.quality||a.size-b.size),full=rows.filter(r=>r.quality===1080).sort((a,b)=>a.size-b.size);
  const secondHigh=high.find(r=>r.url!==high[0]?.url&&r.quality>=2160);
  const plan=target.type==='tv'?[full[0],high[0],small.find(r=>r.quality===720)||small[0],secondHigh||small[0]]:[small[0],full[0],high[0],small[1]];
  return [...new Map(plan.filter(Boolean).map(r=>[r.url,r])).values()].slice(0,4);
}
function pixelFile(data,page,hubName,target){
  const file=publicFile(data,page,hubName,target,{source:'MoviesDrive / Pixeldrain',matchesName:fileMatches,normalizeName:value=>normalizeTitle(cleanFilename(value))});
  return file?{...file,identityConfidence:90}:null;
}
async function resolveRelease(http,entry,target,options={}){
  const page=await http.text(entry.url);if(!page||page.url!==entry.url)return null;
  const title=page.text.match(/<title\b[^>]*>([\s\S]{0,1500}?)<\/title>/i)?.[1]||'';
  if(target.type==='movie'&&!titleMatches(title,target)&&options.loadTarget&&titleLookupHint(title,target,true))target=await options.loadTarget();
  if(!(target.type==='tv'?seriesTitleMatches(title,target,false):titleMatches(title,target)))return null;
  const hub=target.type==='tv'?episodeHub(page.text,target):anchors(page.text,400).map(a=>safeUrl(a.href)).find(isHub);
  if(!hub)return null;const wrapper=await http.text(hub),name=wrapper?.text.match(/<title\b[^>]*>([\s\S]{0,1500}?)<\/title>/i)?.[1];
  if(!name)return null;
  if(target.type==='movie'&&!fileMatches(name,target)&&options.loadTarget&&/\.(mp4|mkv)$/i.test(name)&&(' '+normalizeTitle(name)+' ').includes(' '+target.year+' '))target=await options.loadTarget();
  if(!fileMatches(name,target))return null;
  const terminal=safeUrl(wrapper.text.match(/\bvar\s+url\s*=\s*["']([^"']{1,4000})["']/)?.[1]);
  if(!terminal||new URL(terminal).origin!=='https://gamerxyt.com'||new URL(terminal).pathname!=='/hubcloud.php')return null;
  const result=await http.text(terminal),pixel=result&&pixelPage(result.text);if(!pixel)return null;
  const data=await http.json(new URL(pixel).origin+'/api/file/'+new URL(pixel).pathname.split('/').pop()+'/info');
  return pixelFile(data,pixel,name,target);
}
function isHub(url){return !!url&&/^https:\/\/hubcloud\.[a-z.]+\/drive\/[A-Za-z0-9_-]+$/.test(url);}
function episodeHub(html,target){
  let wanted=false;
  for(const m of String(html).matchAll(/<h5\b[^>]*>([\s\S]{0,6000}?)<\/h5>/gi)){
    const label=text(m[1]),episode=label.match(/^Ep0*([1-9]\d{0,2})\s*(?:&ndash;|&mdash;|[-–—])\s*(?:480|720|1080|2160)p\b/i);
    if(episode){wanted=Number(episode[1])===target.episode;continue;}
    const links=anchors(m[1]).map(a=>safeUrl(a.href)).filter(isHub);
    if(wanted&&links.length)return links[0];
    if(!links.length)wanted=false;
  }
  return null;
}
async function scanMoviesDrive(http,target,options={}){
  if(target.type!=='movie'&&(target.type!=='tv'||!target.imdbId))return [];
  if(target.type==='tv'&&target.season>1){
    const season=await options.loadSeason?.();
    if(!Number.isInteger(season?.seasonReleaseYear)||season.seasonReleaseYear<target.year||!Number.isInteger(season.runtimeMinutes)||season.runtimeMinutes<=0)return [];
    target={...target,seasonReleaseYear:season.seasonReleaseYear,runtimeMinutes:season.runtimeMinutes};
  }
  let titleJob;
  const loadTarget=async()=>{
    if(!titleJob)titleJob=Promise.resolve().then(()=>options.loadTitles?.()).then(titles=>{
      if(Array.isArray(titles))target={...target,searchTitles:[...new Set([...(target.searchTitles||[]),...titles.filter(t=>typeof t==='string'&&t.trim()&&t.length<=200).slice(0,30)])]};
      return target;
    }).catch(()=>target);
    return titleJob;
  };
  let origin=ORIGIN;
  const queries=[target.originalTitle,...(target.searchTitles||[])];if(/^the\s+/i.test(target.originalTitle))queries.splice(1,0,target.originalTitle.replace(/^the\s+/i,''));
  for(const query of [...new Set(queries)].slice(0,2)){
   if(http.expired())break;
   const result=await searchCatalogue(http,origin,query);if(!result)continue;
   const search=result.data;origin=result.origin;
   if(target.type==='movie'&&options.loadTitles&&!searchPages(search,target).length&&Array.isArray(search?.hits)&&search.hits.slice(0,30).some(h=>h?.document&&(!h.document.imdb_id||h.document.imdb_id===target.imdbId)&&titleLookupHint(h.document.post_title,target,!!target.imdbId&&h.document.imdb_id===target.imdbId)))await loadTarget();
   for(const row of searchPages(search,target)){
    if(http.expired())break;
    const page=await http.text(origin+row.permalink);if(!page||new URL(page.url).origin!==origin)continue;
    const entries=releaseEntries(page.text,target);if(!entries.length)continue;
    const found=[],seen=new Set();
    await mapLimit(entries,2,async entry=>{if(http.expired())return;const file=await resolveRelease(http,entry,target,{loadTarget:target.type==='movie'&&options.loadTitles?loadTarget:null});if(file&&!seen.has(file.url)){seen.add(file.url);found.push(file);if(options.onCandidates)await options.onCandidates([file]);}});
    return found;
   }
  }
  return [];
}
module.exports={scanMoviesDrive,titleMatches,seriesTitleMatches,cleanFilename,fileMatches,searchPages,releaseEntries,episodeHub,pixelPage,pixelFile};
