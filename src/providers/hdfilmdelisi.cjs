'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {jsonLd,syntheticFilename}=require('./page-data.cjs');
const {base64Bytes}=require('../media/base64.cjs');
// The catalogue moved to hdfilmdelisi1.com; the old domain still answers the
// search API but 301s every film page there. Both are the same public site.
const ORIGINS=['https://hdfilmdelisi1.com','https://hdfilmdelisi.one'],PLAYER='https://pl.vixolity.com',MEDIA='https://ha.vixolity.com';
function filmMatches(row,target) {
  // 2026 search rows no longer carry imdbId/accessLevel. Identity is proven on
  // the film page (JSON-LD sameAs) and again by the player's videoId; a row
  // that still carries either field must agree with it.
  return !!row&&Number(row.yayinYili)===target.year&&normalizeTitle(row.orijinalBaslik)===normalizeTitle(target.originalTitle)&&
    /^[a-z0-9-]{1,180}$/.test(row.slug||'')&&(row.imdbId===undefined||row.imdbId===target.imdbId)&&(row.accessLevel===undefined||row.accessLevel==='public');
}
function pageIdentity(html,target) {
  const imdb=new RegExp('^https://(?:www\\.|m\\.)?imdb\\.com/title/'+target.imdbId+'/?$');
  return jsonLd(html).some(r=>r&&r['@type']==='Movie'&&Number(String(r.datePublished).slice(0,4))===target.year&&
    [].concat(r.sameAs||[]).some(value=>typeof value==='string'&&imdb.test(value)));
}
function playerLinks(html) {
  const links=[];let open=false;
  const add=value=>{const url=typeof value==='string'&&safeUrl(value);if(url&&new URL(url).origin===PLAYER&&!links.includes(url))links.push(url);};
  // Parse Next's JSON string data, never execute its scripts. The catalogue's
  // SEO contentUrl can be a non-video placeholder, so it is not a file source.
  for(const m of String(html).matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g))try{
    const data=JSON.parse(m[1]);
    // Fail closed: the watch gate must say public and no sign-in.
    if(/"requireAuthForWatch"\s*:\s*true/.test(data)||/"accessLevel"\s*:\s*"(?!public")[^"]*"\s*,\s*"requireAuthForWatch"/.test(data))return [];
    if(/"accessLevel"\s*:\s*"public"\s*,\s*"requireAuthForWatch"\s*:\s*false/.test(data))open=true;
    for(const list of data.matchAll(/"sources"\s*:\s*(\[[^\]]{1,6000}\])/g))try{
      const rows=JSON.parse(list[1]);for(const row of Array.isArray(rows)?rows:[])add(row&&row.url);
    }catch{}
    for(const value of data.matchAll(/"videoUrl"\s*:\s*"([^"\n]{1,2000})"/g))add(value[1]);
  }catch{}
  return open?links.slice(0,2):[];
}
function decodedPlayer(hex,key) {
  if(hex.length%2||key>255)return '';
  let base='';for(let i=0;i<hex.length;i+=2)base+=String.fromCharCode(parseInt(hex.slice(i,i+2),16));
  const bytes=base64Bytes(base.split('').reverse().join(''));if(!bytes)return '';
  let text=Array.from(bytes,b=>String.fromCharCode((b-key+256)%256)).join('');
  // Since 2026 the shifted text is one more base64 layer (then UTF-8). Only
  // the ASCII kaynak/videoId fields are read, so bytes map 1:1 to characters.
  if(/^[A-Za-z0-9+/=\s]{16,}$/.test(text)){const inner=base64Bytes(text.replace(/\s+/g,''));if(inner)text=Array.from(inner,b=>String.fromCharCode(b)).join('');}
  return text.replace(/\\x([a-f0-9]{2})/gi,(_,x)=>String.fromCharCode(parseInt(x,16)));
}
function mediaLinks(html,target) {
  const links=[];
  const add=value=>{
    const url=safeUrl(String(value).replace(/\\\//g,'/'));if(!url)return;const parsed=new URL(url);
    if(parsed.origin!==MEDIA||parsed.pathname!=='/vs/'+target.imdbId||parsed.search)return;
    // The same public endpoint accepts this format marker. Its exact
    // response is probed as HLS, and Nuvio's native downloader excludes it.
    const tagged=url+'?format=.m3u8';if(!links.includes(tagged))links.push(tagged);
  };
  // Public player data is hex/reverse/base64/byte-offset encoded with a key
  // carried on that page. Decode literals only; no eval/new Function/license.
  for(const m of String(html).matchAll(/\}\)\(\s*['"]([a-f0-9]{20,120000})['"]\s*,\s*(\d{1,3})\s*\)/gi)) {
    const decoded=decodedPlayer(m[1],Number(m[2]));
    for(const file of decoded.matchAll(/\bfile\s*:\s*['"]([^'"]{1,2000})['"]/g))add(file[1]);
    // Current settings object: {"kaynak":".../vs/<imdb>","videoId":"<imdb>"}.
    const videoId=decoded.match(/"videoId"\s*:\s*"([^"]{1,40})"/)?.[1];
    if(videoId===target.imdbId)for(const source of decoded.matchAll(/"kaynak"\s*:\s*"([^"]{1,2000})"/g))add(source[1]);
  }
  return links.slice(0,2);
}
async function scanHdFilmDelisi(http,target) {
  if(target.type!=='movie'||target.isAnime||!/^tt\d+$/.test(target.imdbId||''))return [];
  let data=null,origin=null;
  for(const base of ORIGINS){
    if(http.expired())return [];
    data=await http.json(base+'/api/search?q='+encodeURIComponent(target.originalTitle));
    if(Array.isArray(data?.results)){origin=base;break;}
  }
  const row=origin&&data.results.slice(0,40).find(r=>filmMatches(r,target));
  if(!row)return [];
  const page=await http.text(origin+'/film/'+row.slug,{maxChars:1000000});
  if(!page||!ORIGINS.includes(new URL(page.url).origin)||new URL(page.url).pathname!=='/film/'+row.slug)return [];
  if(!pageIdentity(page.text,target))return [];
  const out=[];
  for(const embed of playerLinks(page.text)) {
    if(http.expired())break;
    const player=await http.text(embed,{headers:{Referer:new URL(page.url).origin+'/'},maxChars:120000});
    if(!player)continue;
    for(const url of mediaLinks(player.text,target))out.push({url,headers:{Referer:PLAYER+'/'},source:'HDFilmDelisi',
      filename:syntheticFilename(target),filenameSynthetic:true,identity:target,identityConfidence:100,subtitles:[],
      // Its master generator answers while the segment store can be down
      // (seen 2026-11: master 200, every child 502); check one child.
      verifyFirstVariant:true});
  }
  return out;
}
module.exports={scanHdFilmDelisi,filmMatches,pageIdentity,playerLinks,mediaLinks};
