'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {canonicalNames,syntheticFilename}=require('./page-data.cjs');
const API='https://api.purstream.club/api/v1';
function releaseYear(value,series=false){
  const text=String(value),range=series&&text.match(/^(\d{4})\s+-\s+(\d{4})$/);
  if(range)return Number(range[2])>=Number(range[1])?Number(range[1]):null;
  return /^\d{4}(?:-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?)?)?$/.test(text)?Number(text.slice(0,4)):null;
}
function searchRows(data,target){
  const rows=data?.type==='success'&&data.data?.items?.movies?.items;
  return Array.isArray(rows)?rows.filter(r=>Number.isSafeInteger(r?.id)&&r.id>0&&r.type===target.type&&
    releaseYear(r.release_date)===target.year).slice(0,3):[];
}
function sheetIdentity(data,id,target){
  const row=data?.type==='success'&&data.data?.items;
  return row&&row.id===id&&Number(row.tmdbId)===target.tmdbId&&row.type===target.type&&row.published===true&&
    releaseYear(row.releaseDate,target.type==='tv')===target.year&&
    typeof row.title==='string'&&row.title.length<=200?row:null;
}
function mediaUrl(value,target){
  const url=safeUrl(value);if(!url)return null;
  const u=new URL(url),id=String(target.tmdbId),number=n=>String(n).padStart(2,'0');
  const path=target.type==='movie'?'^/movies/'+id+'-[a-z0-9]{1,30}/master\\.m3u8$':
    '^/tv/'+id+'-[a-z0-9]{1,30}/S'+number(target.season)+'/E'+number(target.episode)+'/master\\.m3u8$';
  // Use only the catalogue's current public free player. No premium endpoint,
  // guessed MP4 conversion, arbitrary host or episode from the series sheet.
  return u.origin==='https://free.finepulfe.xyz'&&!u.search&&!u.hash&&new RegExp(path).test(u.pathname)?url:null;
}
async function scanPurstream(http,target,options={}){
  if(!['movie','tv'].includes(target.type))return [];
  const names=canonicalNames(target),queries=[target.originalTitle,...(target.searchTitles||[])];
  // Dropping a leading article is a search hint only. The selected sheet must
  // still match TMDB, type, year and an official title below.
  if(/^the\s+/i.test(target.originalTitle))queries.splice(1,0,target.originalTitle.replace(/^the\s+/i,''));
  const visited=new Set();let loaded=false;
  for(const query of [...new Set(queries)].slice(0,2)){
    if(http.expired())break;
    const search=await http.json(API+'/search-bar/search/'+encodeURIComponent(query));
    for(const row of searchRows(search,target)){
      if(visited.has(row.id)||http.expired())continue;visited.add(row.id);
      const data=await http.json(API+'/media/'+row.id+'/sheet'),sheet=sheetIdentity(data,row.id,target);
      if(!sheet)continue;
      if(!names.includes(normalizeTitle(sheet.title))&&!loaded&&options.loadTitles){
        loaded=true;names.push(...(await options.loadTitles()).map(normalizeTitle));
      }
      if(!names.includes(normalizeTitle(sheet.title)))continue;
      let links=sheet.urls;
      if(target.type==='tv'){
        const episode=await http.json(API+'/stream/'+row.id+'/episode?season='+target.season+'&episode='+target.episode),items=episode?.data?.items;
        if(episode?.type!=='success'||Number(items?.season)!==target.season||Number(items?.episode)!==target.episode||!Array.isArray(items.sources))return [];
        links=items.sources.filter(s=>s?.format==='m3u8').map(s=>({url:s.stream_url}));
      }
      if(!Array.isArray(links))return [];
      const urls=[...new Set(links.slice(0,12).map(l=>mediaUrl(l?.url,target)).filter(Boolean))].slice(0,3);
      return urls.map(url=>({url,source:'Purstream',headers:{Referer:'https://purstream.club/'},identity:target,identityConfidence:100,
        filename:syntheticFilename(target),filenameSynthetic:true,subtitles:[]}));
    }
  }
  return [];
}
module.exports={scanPurstream,searchRows,sheetIdentity,mediaUrl};
