'use strict';
const {safeUrl,normalizeTitle,mapLimit}=require('../util.cjs');
const {anchors,decodeEntities,filenameIdentity}=require('./directory.cjs');
const {canonicalNames}=require('./page-data.cjs');
const ORIGIN='https://new4.moviesdrive.beer',ARCHIVE='https://mdrive.lol';
function text(value){return decodeEntities(String(value||'').replace(/&nbsp;/gi,' ')).replace(/\u00a0/g,' ');}
function titleMatches(value,target){
  const match=text(value).match(/^(?:Download\s+)?(.+?)\s*\((\d{4})\)(?=\s|$)/i);
  return !!match&&Number(match[2])===target.year&&canonicalNames(target).includes(normalizeTitle(match[1]));
}
function cleanFilename(value){return decodeEntities(value).replace(/^(?:\[\[?\s*(?:www\.)?moviesdrives?\.[a-z]+\s*\]\]?\s*[-._ ]*)+/i,'').trim();}
function fileMatches(value,target){
  const name=cleanFilename(value);
  return /\.(mkv|mp4)$/i.test(name)&&canonicalNames(target).some(title=>filenameIdentity(name,{...target,originalTitle:title}))&&
    !/\b(sample|trailer|hdcam|camrip|hdtc|hdts|telesync)\b/i.test(normalizeTitle(name).slice(normalizeTitle(target.originalTitle).length));
}
function searchPages(data,target){
  if(!Array.isArray(data?.hits))return [];
  return data.hits.slice(0,30).map(h=>h?.document).filter(d=>d&&titleMatches(d.post_title,target)&&
    (!d.imdb_id||d.imdb_id===target.imdbId)&&typeof d.permalink==='string'&&/^\/[a-z0-9-]+\/$/.test(d.permalink)).slice(0,2);
}
function releaseEntries(html,target){
  const heading=String(html).match(/<h1\b[^>]*>([\s\S]{0,2500}?)<\/h1>/i)?.[1];
  if(!heading||!titleMatches(heading,target))return [];
  const article=String(html).match(/<article\b[^>]*class=["'][^"']*\bpost-content\b[^"']*["'][^>]*>([\s\S]{0,400000}?)<\/article>/i)?.[1];
  if(!article)return [];
  const ids=anchors(article,1000).map(a=>a.href.match(/^https?:\/\/(?:www\.)?imdb\.com\/title\/(tt\d+)(?:$|[/?#])/i)?.[1]).filter(Boolean);
  if(target.imdbId&&ids.some(id=>id!==target.imdbId))return [];
  let release=null;const rows=[];
  for(const m of article.matchAll(/<h[45]\b[^>]*>([\s\S]{0,5000}?)<\/h[45]>/gi)){
    const label=text(m[1]);
    if(titleMatches(label,target)){release=label;continue;}
    const link=anchors(m[1]).find(a=>{const u=safeUrl(a.href);return u&&new URL(u).origin===ARCHIVE&&/^\/archive\/[1-9]\d{0,9}\/$/.test(new URL(u).pathname);});
    if(!link){release=null;continue;}
    if(!release)continue;
    const url=safeUrl(link.href),size=label.match(/\[\s*([\d.,]+)\s*(GB|MB)\s*\]/i),quality=Number(release.match(/\b(2160|1440|1080|720|480|360)p\b/i)?.[1])||0;
    if(!rows.some(r=>r.url===url))rows.push({url,quality,size:size?Number(size[1].replace(',','.'))*(size[2].toUpperCase()==='GB'?1e9:1e6):Infinity});
    release=null;
  }
  const small=rows.slice().sort((a,b)=>a.size-b.size),high=rows.slice().sort((a,b)=>b.quality-a.quality||a.size-b.size),full=rows.filter(r=>r.quality===1080).sort((a,b)=>a.size-b.size);
  return [...new Map([small[0],full[0],high[0],small[1]].filter(Boolean).map(r=>[r.url,r])).values()].slice(0,4);
}
function pixelPage(html){
  const literal=String(html).match(/\bvar\s+pxl\s*=\s*["']([^"']{1,300})["']/)?.[1];
  const links=literal?[literal]:anchors(String(html)).filter(a=>/Pixel(?:drain|Server)/i.test(a.text)).map(a=>a.href);
  return links.map(s=>safeUrl(s)).find(url=>url&&/^https:\/\/pixeldrain\.(?:com|dev|net)\/u\/[A-Za-z0-9]{8,12}$/.test(url))||null;
}
function pixelFile(data,page,hubName,target){
  const u=new URL(page),id=u.pathname.split('/').pop();
  const container=/^video\/(?:x-)?matroska$/.test(data?.mime_type||'')?'mkv':data?.mime_type==='video/mp4'?'mp4':null;
  if(!data||data.success!==true||data.id!==id||data.can_download!==true||data.availability||data.abuse_type||
    !Number.isSafeInteger(data.size)||data.size<1000000||!container||!fileMatches(data.name,target)||
    normalizeTitle(cleanFilename(data.name))!==normalizeTitle(cleanFilename(hubName)))return null;
  return {url:u.origin+'/api/file/'+id,filename:data.name,headers:{},subtitles:[],source:'MoviesDrive / Pixeldrain',
    identity:target,identityConfidence:90,expectedSize:data.size,expectedContainer:container,allowExtensionlessMkv:container==='mkv',
    requireAudioAny:[...new Set(['tr','en',...(/^[a-z]{2}$/.test(target.originalLanguage||'')&&target.originalLanguage!=='hi'?[target.originalLanguage]:[])])],
    requireVideoDimensions:true,requireDuration:true,durationTolerance:0.1};
}
async function resolveRelease(http,entry,target){
  const page=await http.text(entry.url);if(!page||page.url!==entry.url||!titleMatches(page.text.match(/<title\b[^>]*>([\s\S]{0,1500}?)<\/title>/i)?.[1]||'',target))return null;
  const hub=anchors(page.text,400).map(a=>safeUrl(a.href)).find(url=>url&&/^https:\/\/hubcloud\.[a-z.]+\/drive\/[A-Za-z0-9_-]+$/.test(url));
  if(!hub)return null;const wrapper=await http.text(hub),name=wrapper?.text.match(/<title\b[^>]*>([\s\S]{0,1500}?)<\/title>/i)?.[1];
  if(!name||!fileMatches(name,target))return null;
  const terminal=safeUrl(wrapper.text.match(/\bvar\s+url\s*=\s*["']([^"']{1,4000})["']/)?.[1]);
  if(!terminal||new URL(terminal).origin!=='https://gamerxyt.com'||new URL(terminal).pathname!=='/hubcloud.php')return null;
  const result=await http.text(terminal),pixel=result&&pixelPage(result.text);if(!pixel)return null;
  const data=await http.json(new URL(pixel).origin+'/api/file/'+new URL(pixel).pathname.split('/').pop()+'/info');
  return pixelFile(data,pixel,name,target);
}
async function scanMoviesDrive(http,target,options={}){
  if(target.type!=='movie')return [];
  const queries=[target.originalTitle,...(target.searchTitles||[])];if(/^the\s+/i.test(target.originalTitle))queries.splice(1,0,target.originalTitle.replace(/^the\s+/i,''));
  for(const query of [...new Set(queries)].slice(0,2)){
   if(http.expired())break;
   const search=await http.json(ORIGIN+'/search.php?q='+encodeURIComponent(query)+'&page=1');
   for(const row of searchPages(search,target)){
    if(http.expired())break;
    const page=await http.text(ORIGIN+row.permalink);if(!page||new URL(page.url).origin!==ORIGIN)continue;
    const entries=releaseEntries(page.text,target);if(!entries.length)continue;
    const found=[],seen=new Set();
    await mapLimit(entries,2,async entry=>{if(http.expired())return;const file=await resolveRelease(http,entry,target);if(file&&!seen.has(file.url)){seen.add(file.url);found.push(file);if(options.onCandidates)await options.onCandidates([file]);}});
    return found;
   }
  }
  return [];
}
module.exports={scanMoviesDrive,titleMatches,cleanFilename,fileMatches,searchPages,releaseEntries,pixelPage,pixelFile};
