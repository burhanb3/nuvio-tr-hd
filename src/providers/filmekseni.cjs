'use strict';
const {safeUrl,normalizeTitle,mapLimit}=require('../util.cjs');
const {anchors,decodeEntities}=require('./directory.cjs');
const {sameName,syntheticFilename,quotedJson,tagAttributes}=require('./page-data.cjs');
const {base64Bytes}=require('../media/base64.cjs');
const {decodeUtf8,subtitleLanguage}=require('../subtitles.cjs');
const ORIGIN='https://filmekseni.vip',PLAYER='https://eksenload.top';
function searchRows(data,target){
  return Array.isArray(data?.data)?data.data.slice(0,24).filter(r=>r?.contentableType==='App\\Models\\Movie'&&
    String(r.releaseYear)===String(target.year)&&typeof r.title==='string'&&/^[a-z0-9-]{1,180}$/.test(r.slug||'')).slice(0,3):[];
}
function pageMatches(html,row,target){
  const start=html.search(/<h1\b/i);if(start<0||!target.imdbId)return false;
  const heading=html.slice(start,start+7000),h1=heading.match(/^<h1\b[^>]*>([\s\S]{0,500}?)<\/h1>/i)?.[1];
  const original=heading.match(/<\/h1>\s*<p\b[^>]*>([\s\S]{0,500}?)<\/p>/i)?.[1];
  const year=heading.match(/href=["']https:\/\/filmekseni\.vip\/yil\/(\d{4})\/["']/)?.[1];
  const ids=anchors(html,2000).map(a=>a.href.match(/^https:\/\/(?:www\.)?imdb\.com\/title\/(tt\d+)(?:$|[/?#])/i)?.[1]).filter(Boolean);
  return normalizeTitle(decodeEntities(h1||''))===normalizeTitle(row.title)&&sameName(decodeEntities(original||h1||''),target)&&
    Number(year)===target.year&&ids.length>0&&ids.every(id=>id===target.imdbId);
}
function playerEntries(html){
  const data=quotedJson(html.match(/videoPlayerData\(JSON\.parse\('((?:\\.|[^'\\])*)'\)/)?.[1]);
  if(!data||typeof data!=='object'||Array.isArray(data))return [];
  const seen=new Set(),out=[];
  for(const entries of Object.values(data).slice(0,4))for(const row of Array.isArray(entries)?entries.slice(0,5):[]){
    if(row?.service_slug!=='vip'||!/^[a-z0-9]{20}$/.test(row.link||''))continue;
    const bytes=base64Bytes(row.template),template=bytes&&decodeUtf8(bytes);if(!template)continue;
    const html=template.replace(/\{url\}/g,row.link).replace(/\{slug\}/g,'video');
    const url=safeUrl(tagAttributes(html.match(/<iframe\b[^>]*>/i)?.[0]||'')['data-src'],ORIGIN);
    if(!url||url!==PLAYER+'/eplayer/'+row.link||seen.has(url))continue;
    seen.add(url);out.push({url,id:row.link});if(out.length===2)return out;
  }
  return out;
}
function playerCandidate(html,entry,target){
  const title=decodeEntities(html.match(/<title\b[^>]*>([\s\S]{0,500}?)<\/title>/i)?.[1]||'');
  const ids=title.match(/tt\d+/g)||[],years=title.replace(/tt\d+/g,'').match(/(?:19|20)\d{2}/g)||[];
  if(!target.imdbId||!ids.length||ids.some(id=>id!==target.imdbId)||!years.length||years.some(y=>Number(y)!==target.year))return null;
  const config=quotedJson(html.match(/\.setup\(JSON\.parse\('((?:\\.|[^'\\])*)'\)/)?.[1]);
  const url=safeUrl(config?.file);if(!url||config.type!=='hls'||!new URL(url).pathname.startsWith('/hls/'+entry.id+'/')||!/\/aistream-legacy-master\.m3u8$/.test(new URL(url).pathname))return null;
  const headers={Referer:PLAYER+'/'};
  const subtitles=(Array.isArray(config.tracks)?config.tracks:[]).slice(0,12).map(t=>{
    const address=safeUrl(t?.file),language=subtitleLanguage(String(t?.label||'').split('·')[0].trim());
    if(!address||!language||!address.startsWith(url.slice(0,url.lastIndexOf('/')+1))||!/\.vtt$/.test(new URL(address).pathname))return null;
    return{url:address,language,title:t.label,_scope:'paired',identity:target,headers,_subtitleProvider:'FilmEkseni'};
  }).filter(Boolean).sort((a,b)=>Number(/Zorunlu/i.test(a.title))-Number(/Zorunlu/i.test(b.title)));
  return{url,headers,subtitles,source:'FilmEkseni',identity:target,identityConfidence:100,filename:syntheticFilename(target)+'.m3u8',filenameSynthetic:true};
}
async function scanFilmEkseni(http,target){
  if(target.type!=='movie'||!target.imdbId)return [];
  const search=await http.json(ORIGIN+'/api/search?q='+encodeURIComponent(target.originalTitle));
  for(const row of searchRows(search,target)){
    if(http.expired())break;
    const address=ORIGIN+'/'+row.slug+'/',page=await http.text(address);
    if(!page||page.url!==address||!pageMatches(page.text,row,target))continue;
    return(await mapLimit(playerEntries(page.text),2,async entry=>{
      const player=await http.text(entry.url,{headers:{Referer:address}});
      return player&&player.url===entry.url?playerCandidate(player.text,entry,target):null;
    })).filter(Boolean);
  }
  return [];
}
module.exports={scanFilmEkseni,searchRows,pageMatches,playerEntries,playerCandidate};
