'use strict';
const { normalizeTitle, safeUrl, mapLimit } = require('../util.cjs');
const { decodeEntities } = require('./directory.cjs');
const { tagAttributes, sameName, syntheticFilename } = require('./page-data.cjs');
const ORIGIN = 'https://dizibak.net', PLAYER = 'https://player.dizibak.net';
const fields = 'id,slug,title,content,link,categories,date';
function episodeTitle(row,target,season,episode) {
  return normalizeTitle(decodeEntities(row?.title?.rendered || '')) === `${normalizeTitle(target.originalTitle)} ${season} sezon ${episode} bolum`;
}
function unpackPlayer(html) {
  // Decode a bounded string/dictionary data representation, never run eval.
  const m = html.match(/\}\('((?:\\.|[^'\\])*)',\s*(\d+),\s*(\d+),\s*'((?:\\.|[^'\\])*)'\.split\('\|'\)/);
  if (!m || m[1].length > 60000 || Number(m[2]) !== 10 || Number(m[3]) > 1500) return null;
  const literal = s => s.replace(/\\'/g,"'").replace(/\\\\/g,'\\');
  const words = literal(m[4]).split('|');
  return literal(m[1]).replace(/\b\d+\b/g,n => words[Number(n)] || n);
}
async function scanDiziBak(http,target) {
  if(target.type!=='tv' || target.isAnime || !/^\d{4}-\d{2}-\d{2}$/.test(target.firstAirDate || ''))return [];
  const slug=normalizeTitle(target.originalTitle).replace(/ /g,'-');
  const getPost=async(season,episode)=>{
    const rows=await http.json(`${ORIGIN}/wp-json/wp/v2/posts?slug=${slug}-${season}-sezon-${episode}-bolum&_fields=${fields}`);
    return Array.isArray(rows) ? rows.find(row=>episodeTitle(row,target,season,episode)&&row.content?.protected!==true) : null;
  };
  const first=await getPost(1,1);
  // This is agreement with the site's first-episode publication metadata,
  // not a generic rule that an upload year is the series' first-air year.
  if(!first || String(first.date).slice(0,10)!==target.firstAirDate || !Array.isArray(first.categories))return [];
  const requested=target.season===1&&target.episode===1 ? first : await getPost(target.season,target.episode);
  if(!requested || !Array.isArray(requested.categories))return [];
  const common=first.categories.filter(id=>requested.categories.includes(id)&&Number.isSafeInteger(id)&&id>0).slice(0,3);
  const categories=await mapLimit(common,2,id=>http.json(`${ORIGIN}/wp-json/wp/v2/categories/${id}`));
  if(!categories.some(c=>c?.parent===0&&sameName(c.name,target)))return [];
  const iframe=String(requested.content.rendered||'').match(/<iframe\b[^>]*>/i)?.[0];
  const url=safeUrl(tagAttributes(iframe||'').src);
  if(!url || new URL(url).origin!==PLAYER || !/^\/embed\/\d+\.mp4$/.test(new URL(url).pathname))return [];
  // embed/*.mp4 is an HTML player, not a downloadable movie.
  const page=await http.text(url,{headers:{Referer:ORIGIN+'/'}}),script=page&&unpackPlayer(page.text);
  const sources=script?.match(/\bsources\s*:\s*(\[[\s\S]*?\])/i)?.[1];
  let rows;try{rows=JSON.parse(sources);}catch{return [];}
  const seen=new Set();
  return rows.slice(0,5).map(entry=>{
    const address=safeUrl(typeof entry==='string'?entry:entry.file||entry.src);
    if(!address || seen.has(address) || !/\.(m3u8|mp4|mkv)(?:$|[?#])/i.test(address))return null;
    seen.add(address);
    return{url:address,source:'DiziBak',headers:{Referer:PLAYER+'/'},identity:target,identityConfidence:90,
      filename:syntheticFilename(target),filenameSynthetic:true,subtitles:[]};
  }).filter(Boolean);
}
module.exports={scanDiziBak,unpackPlayer,episodeTitle};
