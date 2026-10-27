'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {tagAttributes,canonicalNames,syntheticFilename}=require('./page-data.cjs');
const {decodeEntities,filenameIdentity}=require('./directory.cjs');
const {subtitleLanguage}=require('../subtitles.cjs');
const {languageCode}=require('../media/languages.cjs');
const ORIGIN='https://dizibal.org';
function matchRow(row,target,names) {
  const url=safeUrl(row?.url);
  return url&&new URL(url).origin===ORIGIN&&
    (target.type==='movie'?row.type==='movie'&&/^\/movie\/[a-z0-9-]+$/.test(new URL(url).pathname):row.type==='series'&&/^\/(?:series|anime)\/[a-z0-9-]+$/.test(new URL(url).pathname))&&
    Number(String(row.meta||'').match(/\b(?:19|20)\d{2}\b/)?.[0])===target.year&&names.includes(normalizeTitle(row.title));
}
function pageMatches(html,url,row,target) {
  const canonical=[...String(html).matchAll(/<link\b[^>]*>/gi)].map(m=>tagAttributes(m[0])).find(a=>a.rel==='canonical');
  const heading=decodeEntities(String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
  const expected=row.title+(target.type==='tv'?` ${target.season}. Sezon ${target.episode}. Bölüm`:'');
  return safeUrl(canonical?.href)===url&&normalizeTitle(heading.replace(/[—–]/g,' '))===normalizeTitle(expected);
}
function playerAddress(html) {
  if(/data-player-type=["']none["']/i.test(html))return null;
  const slug=String(html).match(/data-pv=["']([A-Za-z0-9_-]{8,160})["']/)?.[1];
  const origin=String(html).match(/<script\b[^>]*src=["'](https:\/\/[^/"']+)\/(?:assets\/js\/core|e\/c)\.js(?:[?"'])/i)?.[1];
  if(!slug||!origin||!/^(?:play\d{1,2}\.)?pilavyerplay\.top$/.test(new URL(origin).hostname))return null;
  return origin+'/assets/js/s.php?s='+encodeURIComponent(slug);
}
function playerConfig(html,row,target,origin='https://pilavyerplay.top') {
  const literal=String(html).match(/window\.__PLAYER__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/)?.[1];
  let config;try{config=JSON.parse(literal);}catch{return null;}
  const expected=row.title+(target.type==='tv'?` ${target.season}. Sezon ${target.episode}. Bölüm`:'');
  if(config.accessCode||!(normalizeTitle(config.title)===normalizeTitle(expected)||target.type==='movie'&&filenameIdentity(config.title,target)))return null;
  const url=safeUrl(config.stream);
  if(!url||new URL(url).origin!==origin||new URL(url).pathname!=='/api/stream.php')return null;
  return {...config,stream:url};
}
async function scanDiziBal(http,target,options={}) {
  let names=canonicalNames(target),queries=(target.searchTitles||[target.originalTitle]).slice(0,2),row;
  const visited=new Set();
  for(let round=0;round<2&&!row&&!http.expired();round++) {
    for(const query of queries) {
      if(visited.has(query)||http.expired())continue;visited.add(query);
      const data=await http.json(ORIGIN+'/ara/oneri?q='+encodeURIComponent(query));
      row=(target.type==='movie'?data?.movies:data?.series)?.find(r=>matchRow(r,target,names));
      if(row)break;
    }
    if(!row&&round===0&&options.loadTitles) {
      queries=await options.loadTitles();names=[...new Set([...names,...queries.map(normalizeTitle)])];
    }
  }
  if(!row)return [];
  const url=row.url+(target.type==='tv'?`/season/${target.season}/episode/${target.episode}`:'');
  const page=await http.text(url);
  if(!page||page.url!==url||!pageMatches(page.text,url,row,target))return [];
  const embed=playerAddress(page.text);if(!embed)return [];
  const player=await http.text(embed,{headers:{Referer:ORIGIN+'/'},maxChars:60000});
  const origin=new URL(embed).origin,config=player&&playerConfig(player.text,row,target,origin);if(!config)return [];
  const headers={Referer:origin+'/',Origin:origin};
  const subtitles=(Array.isArray(config.subs)?config.subs:[]).slice(0,16).map(s=>{
    const language=subtitleLanguage(s.lang),url=safeUrl(s.src,origin+'/');
    return language&&url?{url,language,headers,identity:target,_scope:'paired'}:null;
  }).filter(Boolean);
  const release=target.type==='movie'&&filenameIdentity(config.title,target);
  return [{url:config.stream+(config.stream.includes('?')?'&':'?')+'format=.m3u8',headers,subtitles,
    source:'DiziBal',identity:target,identityConfidence:90,filename:release?config.title:syntheticFilename(target),filenameSynthetic:!release,
    claimedAudioLanguages:(Array.isArray(config.audios)?config.audios:[]).map(a=>languageCode(a.lang)||languageCode(a.label)).filter(Boolean)}];
}
module.exports={scanDiziBal,matchRow,pageMatches,playerAddress,playerConfig};
