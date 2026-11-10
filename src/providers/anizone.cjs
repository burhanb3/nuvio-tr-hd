'use strict';
const {safeUrl}=require('../util.cjs');
const {decodeEntities}=require('./directory.cjs');
const {sameName,syntheticFilename,quotedJson}=require('./page-data.cjs');
const {subtitleLanguage}=require('../subtitles.cjs');
const ORIGIN='https://anizone.to';
function searchRows(html,target){
  const data=quotedJson(html.match(/\bitems:\s*JSON\.parse\('((?:\\.|[^'\\])*)'\)/)?.[1]);
  if(!Array.isArray(data))return [];
  return data.slice(0,48).filter(r=>r&&r.is_unsafe===false&&Number(r.start_year)===target.year&&
    r.type===(target.type==='movie'?'Movie':'TV Series')&&/^[a-z0-9]{6,12}$/.test(r.slug||'')&&
    r.url?.replace(/^http:/,'https:')===ORIGIN+'/anime/'+r.slug&&
    [r.main_title,...Object.values(r.title_list||{}).slice(0,80)].some(name=>sameName(name,target))&&
    Number(r.episode_count)>=(target.type==='tv'?target.episode:1));
}
function episodeCandidate(html,row,target){
  const episode=String(target.type==='tv'?target.episode:1),snapshots=[];
  for(const m of html.matchAll(/\bwire:snapshot="([^"]{1,10000})"/g))try{snapshots.push(JSON.parse(decodeEntities(m[1]))?.data);}catch{}
  const names=quotedJson(html.match(/\banmTitles:\s*JSON\.parse\('((?:\\.|[^'\\])*)'\)/)?.[1]);
  if(!names||!Object.values(names).some(name=>sameName(name,target))||!snapshots.some(s=>s?.anime_slug===row.slug&&s.episode_slug===episode))return null;
  const config=quotedJson(html.match(/vidstackPlayer\(JSON\.parse\('((?:\\.|[^'\\])*)'\)/)?.[1]),url=safeUrl(config?.src);
  if(!url||!/^https:\/\/[a-z0-9-]+\.vid-cdn\.xyz\/[a-f0-9-]{36}\/master\.m3u8$/.test(url))return null;
  const headers={Referer:ORIGIN+'/'};
  const subtitles=(Array.isArray(config.subtitles)?config.subtitles:[]).slice(0,12).map(t=>{
    const language=subtitleLanguage(t?.language),address=safeUrl(t?.file);
    if(!language||!address||!address.startsWith(url.slice(0,url.lastIndexOf('/')+1))||!/\.(srt|vtt)$/.test(new URL(address).pathname))return null;
    return{url:address,language,title:t.title,headers,_scope:'paired',identity:target,_subtitleProvider:'Anizone'};
  }).filter(Boolean);
  return{url,headers,subtitles,source:'Anizone',identity:target,identityConfidence:90,filename:syntheticFilename(target)+'.m3u8',filenameSynthetic:true};
}
async function scanAnizone(http,target){
  // The catalogue splits anime seasons into separate releases. Until a
  // canonical season mapping is available, never guess absolute episodes.
  if(!target.isAnime||target.type==='tv'&&target.season!==1)return [];
  for(const query of [...new Set([...(target.searchTitles||[]),target.originalTitle])].slice(0,2)){
    if(http.expired())break;
    const search=await http.text(ORIGIN+'/anime?search='+encodeURIComponent(query));if(!search)continue;
    const rows=searchRows(search.text,target);if(rows.length!==1)continue;
    const row=rows[0],url=ORIGIN+'/anime/'+row.slug+'/'+(target.type==='tv'?target.episode:1),page=await http.text(url);
    const candidate=page&&page.url===url&&episodeCandidate(page.text,row,target);
    if(candidate)return[candidate];
  }
  return [];
}
module.exports={scanAnizone,searchRows,episodeCandidate};
