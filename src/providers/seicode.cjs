'use strict';
const {safeUrl,mapLimit}=require('../util.cjs');
const {sameName,syntheticFilename}=require('./page-data.cjs');
const {decodeEntities}=require('./directory.cjs');
const API='https://next.seicode.net',ORIGIN='https://seicode.net/';
function matchesSeiCode(detail,target){
  return detail && detail.type==='tv' && Number(detail.tmdbID)===target.tmdbId &&
    Number(String(detail.firstAirDate||'').slice(0,4))===target.year &&
    (!target.firstAirDate || String(detail.firstAirDate).slice(0,10)===target.firstAirDate) &&
    [detail.english,detail.original,detail.japanese,...(Array.isArray(detail.alternativeTitles)?detail.alternativeTitles.slice(0,40).map(n=>typeof n==='string'?n:n?.title):[])]
      .some(n=>sameName(n,target));
}
function mp4UploadEmbed(value){
  const url=safeUrl(value);if(!url)return null;
  const parsed=new URL(url);if(!/^(?:www\.)?mp4upload\.com$/i.test(parsed.hostname))return null;
  const id=parsed.pathname.match(/^\/(?:embed-)?([a-z0-9]{8,32})(?:\.html)?\/?$/i)?.[1];
  return id?'https://www.mp4upload.com/embed-'+id+'.html':null;
}
function mp4UploadVideo(html){
  // Only the actual Video.js source block; scripts and ad URLs are not run.
  const block=String(html).match(/\bplayer\.src\s*\(\s*\{([\s\S]{0,2000}?)\}\s*\)/)?.[1];
  if(!block||! /\btype\s*:\s*['"]video\/mp4['"]/.test(block))return null;
  const url=safeUrl(decodeEntities(block.match(/\bsrc\s*:\s*['"]([^'"]+)['"]/)?.[1]||''));
  return url && /^[a-z0-9-]+\.mp4upload\.com$/i.test(new URL(url).hostname) && /\.mp4(?:$|[?#])/i.test(url)?url:null;
}
async function scanSeiCode(http,target){
  if(!target.isAnime||target.type!=='tv')return [];
  let detail;
  for(const name of(target.searchTitles||[target.originalTitle]).slice(0,2)){
    const rows=await http.json(API+'/anime/search?q='+encodeURIComponent(name),{headers:{Referer:ORIGIN}});
    if(Array.isArray(rows))for(const row of rows.slice(0,12)){
      if(!/^[a-z0-9-]{1,180}$/i.test(row?.slug||'') || ![row.english,...(Array.isArray(row.alternativeTitles)?row.alternativeTitles.slice(0,40):[])].some(n=>sameName(typeof n==='string'?n:n?.title,target)))continue;
      const data=await http.json(API+'/anime/'+encodeURIComponent(row.slug),{headers:{Referer:ORIGIN}});
      if(data?.slug===row.slug&&matchesSeiCode(data,target)){detail=data;break;}
      if(http.expired())break;
    }
    if(detail||http.expired())break;
  }
  const season=detail?.seasons?.find(s=>Number(s.season_number)===target.season);
  const episode=season?.episodes?.find(e=>Number(e.episode_number)===target.episode);
  if(!episode||!episode.video_links||http.expired())return [];
  const embeds=[...new Set(Object.values(episode.video_links).slice(0,40).map(mp4UploadEmbed).filter(Boolean))].slice(0,2);
  return mapLimit(embeds,2,async embed=>{
    const page=await http.text(embed,{headers:{Referer:ORIGIN}}),url=page&&mp4UploadVideo(page.text);
    return url?{url,source:'SeiCode',identity:target,identityConfidence:100,headers:{Referer:'https://www.mp4upload.com/'},
      filename:syntheticFilename(target)+'.mp4',filenameSynthetic:true,subtitles:[]}:null;
  });
}
module.exports={scanSeiCode,matchesSeiCode,mp4UploadEmbed,mp4UploadVideo};
