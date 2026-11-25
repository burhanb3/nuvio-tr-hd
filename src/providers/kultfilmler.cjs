'use strict';
const {safeUrl,normalizeTitle,mapLimit}=require('../util.cjs');
const {decodeEntities}=require('./directory.cjs');
const {sameName,syntheticFilename,tagAttributes,unpackPacked}=require('./page-data.cjs');
const {subtitleLanguage}=require('../subtitles.cjs');
// Film pages list FirePlayer embeds. The player names the IMDb id (plus a
// " dublaj" suffix for the Turkish dub) and returns a short-lived HLS link.
const ORIGIN='https://kultfilmler.net',PLAYER='https://vidpapi.xyz';
function titleParts(value){
  const title=decodeEntities(value||'').replace(/\s+/g,' ').trim();
  const parts=title.split(/\s+[–—-]\s+/).filter(Boolean),names=new Set([title]);
  // "Original – Türkçe": an original title may itself hold " - ".
  for(let i=1;i<=parts.length;i++)names.add(parts.slice(0,i).join(' - '));
  for(const part of parts)names.add(part);
  return{title,names:[...names]};
}
function searchCards(html,target){
  const out=[];
  for(const m of String(html||'').slice(0,400000).matchAll(/<a\b[^>]*\bclass=["']mcard["'][^>]*>([\s\S]{0,6000}?)<\/a>/gi)){
    const href=safeUrl(tagAttributes(m[0].match(/^<a\b[^>]*>/i)[0]).href,ORIGIN);
    if(!href||new URL(href).origin!==ORIGIN||!/^\/[a-z0-9-]{1,180}\/$/.test(new URL(href).pathname))continue;
    const heading=m[1].match(/<div class=["']mtx["']>\s*<h3>([\s\S]{1,400}?)<\/h3>/i)?.[1];
    const year=Number(m[1].match(/<span class=["']pyear["']>\s*(\d{4})\s*<\/span>/i)?.[1]);
    const card=titleParts(heading);
    if(year!==target.year||!card.names.some(name=>sameName(name,target))||out.some(c=>c.url===href))continue;
    out.push({url:href,title:card.title});if(out.length===3)break;
  }
  return out;
}
function pageMatches(html,card){
  const h1=html.match(/<h1\b[^>]*>([\s\S]{1,500}?)<\/h1>/i)?.[1];
  return!!h1&&normalizeTitle(decodeEntities(h1))===normalizeTitle(card.title);
}
function playerEntries(html){
  const raw=html.match(/<script\b[^>]*\bid=["']kf-srcdata["'][^>]*>([\s\S]{2,30000}?)<\/script>/i)?.[1];
  let rows;try{rows=JSON.parse(raw);}catch{return [];}
  const seen=new Set(),out=[];
  for(const row of Array.isArray(rows)?rows.slice(0,6):[]){
    if(typeof row?.html!=='string'||typeof row.langLabel!=='string')continue;
    const src=tagAttributes(row.html.match(/<iframe\b[^>]*>/i)?.[0]||'').src;
    const id=String(src||'').match(/^https:\/\/vidpapi\.xyz\/video\/([0-9a-f]{32})$/)?.[1];
    if(!id||seen.has(id))continue;
    seen.add(id);out.push({url:PLAYER+'/video/'+id,hash:id,dub:/dublaj/i.test(row.langLabel),label:row.langLabel});
    if(out.length===3)break;
  }
  return out;
}
function playerConfig(html,entry,target){
  const script=unpackPacked(html);
  const m=script&&script.match(/FirePlayer\("([0-9a-f]{32})",(\{[\s\S]{2,20000}\}),(?:false|true),source\)/);
  if(!m||m[1]!==entry.hash)return null;
  let config;try{config=JSON.parse(m[2]);}catch{return null;}
  const title=String(config?.title||'').trim().match(/^(tt\d{5,10})(?:\s+(dublaj))?$/i);
  // The player's IMDb id is the identity; the dub suffix must agree with the
  // page label, otherwise the row is ambiguous and is dropped.
  if(!title||!target.imdbId||title[1]!==target.imdbId||!!title[2]!==entry.dub)return null;
  return config;
}
function streamCandidate(video,config,entry,target){
  if(!video||video.hls!==true)return null;
  const url=safeUrl(video.securedLink);if(!url||new URL(url).origin!==PLAYER)return null;
  const id=new URL(url).pathname.match(/^\/cdn\/hls\/([0-9a-f]{32})\/master\.m3u8$/)?.[1];if(!id)return null;
  // The player page sends no Referer; hosts were verified to answer without one.
  const headers={};
  const subtitles=(Array.isArray(config.tracks)?config.tracks:[]).slice(0,8).map(t=>{
    const address=safeUrl(t?.file),language=subtitleLanguage(String(t?.label||'').trim());
    if(!address||!language||!['captions','subtitles'].includes(t.kind))return null;
    if(!new RegExp('^/cdn/down/'+id+'/Subtitle/[0-9a-f]{32}\\.(?:srt|vtt)$').test(new URL(address).pathname))return null;
    return{url:address,language,title:t.label,_scope:'paired',identity:target,headers,_subtitleProvider:'KultFilmler'};
  }).filter(Boolean);
  return{url,headers,subtitles,source:'KultFilmler',identity:target,identityConfidence:100,filename:syntheticFilename(target)+'.m3u8',filenameSynthetic:true,
    // One muxed variant without an audio group: the dub is the site's claim.
    claimedAudioLanguages:[entry.dub?'tr':target.originalLanguage].filter(Boolean)};
}
function parseVideo(text){
  if(typeof text!=='string'||text.length>20000)return null;
  try{const data=JSON.parse(text);return data&&typeof data==='object'&&!Array.isArray(data)?data:null;}catch{return null;}
}
async function scanKultFilmler(http,target){
  if(target.type!=='movie'||!target.imdbId)return [];
  // Non-English films are listed under their English title ("Parasite – Parazit").
  const queries=[...new Set([target.originalTitle,...(target.searchTitles||[])].filter(v=>typeof v==='string'&&v.trim()))].slice(0,2);
  let cards=[];
  for(const query of queries){
    if(http.expired())break;
    const search=await http.text(ORIGIN+'/?s='+encodeURIComponent(query),{maxChars:400000});
    if(search&&new URL(search.url).origin===ORIGIN&&(cards=searchCards(search.text,target)).length)break;
  }
  for(const card of cards){
    if(http.expired())break;
    const page=await http.text(card.url,{maxChars:400000});
    if(!page||page.url!==card.url||!pageMatches(page.text,card))continue;
    const rows=(await mapLimit(playerEntries(page.text),2,async entry=>{
      const player=await http.text(entry.url,{headers:{Referer:ORIGIN+'/'},maxChars:120000});
      const config=player&&player.url===entry.url?playerConfig(player.text,entry,target):null;
      if(!config||http.expired())return null;
      const answer=await http.text(PLAYER+'/player/index.php?data='+entry.hash+'&do=getVideo',{method:'POST',maxChars:20000,
        headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest',Referer:entry.url},
        body:'hash='+entry.hash+'&r='+encodeURIComponent(ORIGIN+'/')});
      return streamCandidate(parseVideo(answer?.text),config,entry,target);
    })).filter(Boolean);
    if(rows.length)return rows;
  }
  return [];
}
module.exports={scanKultFilmler,titleParts,searchCards,pageMatches,playerEntries,playerConfig,streamCandidate};
