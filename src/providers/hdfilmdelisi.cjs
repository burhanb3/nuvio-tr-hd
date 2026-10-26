'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {jsonLd,syntheticFilename}=require('./page-data.cjs');
const {base64Bytes}=require('../media/base64.cjs');
const ORIGIN='https://hdfilmdelisi.one',PLAYER='https://pl.vixolity.com',MEDIA='https://ha.vixolity.com';
function filmMatches(row,target) {
  return row&&row.accessLevel==='public'&&row.imdbId===target.imdbId&&Number(row.yayinYili)===target.year&&
    normalizeTitle(row.orijinalBaslik)===normalizeTitle(target.originalTitle)&&/^[a-z0-9-]{1,180}$/.test(row.slug||'');
}
function playerLinks(html) {
  const links=[];
  // Parse Next's JSON string data, never execute its scripts. The catalogue's
  // SEO contentUrl can be a non-video placeholder, so it is not a file source.
  for(const m of String(html).matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g))try{
    const data=JSON.parse(m[1]);
    if(/"requireAuthForWatch"\s*:\s*true/.test(data))return [];
    for(const value of data.matchAll(/"videoUrl"\s*:\s*"([^"\n]{1,2000})"/g)) {
      const url=safeUrl(value[1]);if(url&&new URL(url).origin===PLAYER&&!links.includes(url))links.push(url);
    }
  }catch{}
  return links.slice(0,2);
}
function mediaLinks(html,target) {
  const links=[];
  // Public player data is hex/reverse/base64/byte-offset encoded with a key
  // carried on that page. Decode literals only; no eval/new Function/license.
  for(const m of String(html).matchAll(/\}\)\(\s*['"]([a-f0-9]{20,40000})['"]\s*,\s*(\d{1,3})\s*\)/gi)) {
    if(m[1].length%2||Number(m[2])>255)continue;
    let base='';for(let i=0;i<m[1].length;i+=2)base+=String.fromCharCode(parseInt(m[1].slice(i,i+2),16));
    const bytes=base64Bytes(base.split('').reverse().join(''));if(!bytes)continue;
    const decoded=Array.from(bytes,b=>String.fromCharCode((b-Number(m[2])+256)%256)).join('').replace(/\\x([a-f0-9]{2})/gi,(_,x)=>String.fromCharCode(parseInt(x,16)));
    for(const file of decoded.matchAll(/\bfile\s*:\s*['"]([^'"]{1,2000})['"]/g)) {
      const url=safeUrl(file[1]);if(!url)continue;const parsed=new URL(url);
      if(parsed.origin!==MEDIA||parsed.pathname!=='/vs/'+target.imdbId||parsed.search)continue;
      // The same public endpoint accepts this format marker. Its exact
      // response is probed as HLS, and Nuvio's native downloader excludes it.
      const tagged=url+'?format=.m3u8';if(!links.includes(tagged))links.push(tagged);
    }
  }
  return links.slice(0,2);
}
async function scanHdFilmDelisi(http,target) {
  if(target.type!=='movie'||target.isAnime||!/^tt\d+$/.test(target.imdbId||''))return [];
  const data=await http.json(ORIGIN+'/api/search?q='+encodeURIComponent(target.originalTitle));
  const row=Array.isArray(data?.results)&&data.results.slice(0,40).find(r=>filmMatches(r,target));
  if(!row)return [];
  const page=await http.text(ORIGIN+'/film/'+row.slug,{maxChars:950000});
  if(!page||new URL(page.url).origin!==ORIGIN||new URL(page.url).pathname!=='/film/'+row.slug)return [];
  if(!jsonLd(page.text).some(r=>r['@type']==='Movie'&&normalizeTitle(r.name)===normalizeTitle(row.baslik)&&Number(String(r.datePublished).slice(0,4))===target.year))return [];
  const out=[];
  for(const embed of playerLinks(page.text)) {
    if(http.expired())break;
    const player=await http.text(embed,{headers:{Referer:page.url},maxChars:60000});
    if(!player)continue;
    for(const url of mediaLinks(player.text,target))out.push({url,headers:{Referer:PLAYER+'/'},source:'HDFilmDelisi',
      filename:syntheticFilename(target),filenameSynthetic:true,identity:target,identityConfidence:100,subtitles:[]});
  }
  return out;
}
module.exports={scanHdFilmDelisi,filmMatches,playerLinks,mediaLinks};
