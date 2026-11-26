'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {decodeEntities}=require('./directory.cjs');
const {sameName,syntheticFilename}=require('./page-data.cjs');
const {decryptCryptoJsAes}=require('../media/cryptojs.cjs');
// Episode and series pages are ~1.8 MB: a long series index precedes the
// content. The site answers a suffix Range with 206; the heading, player
// alternatives, series link and year sit in the last ~150 KB.
const ORIGIN='https://www.dizibox.live',PLAYER='https://dbx.molystream.org',TAIL='bytes=-320000',TAIL_CHARS=400000;
// From a desktop probe, every hop answered 403/404 without a browser-like
// User-Agent (also to "libmpv"/"Lavf" strings). Nuvio's fetch bridge keeps a
// plugin-supplied User-Agent and iOS forwards stream headers to MPV
// (http-header-fields, only Range dropped), so the stream carries the same UA.
// Acceptance on a real device is not tested.
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
function slugs(target){
  // "Grey's Anatomy" -> greys-anatomy: the site drops apostrophes.
  return [...new Set([target.originalTitle,...(target.searchTitles||[])].filter(v=>typeof v==='string')
    .map(v=>normalizeTitle(v.replace(/['’`]/g,'')).replace(/ /g,'-'))
    .filter(s=>s.length<=120&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)))].slice(0,2);
}
function episodeHeading(html,target){
  const h1=String(html).match(/<h1\b[^>]*>([\s\S]{1,1500}?)<\/h1>/i)?.[1];
  if(!h1)return null;
  const name=decodeEntities(h1.match(/<span itemprop=["']name["']>([^<]{1,200})<\/span>/i)?.[1]||'');
  const episode=h1.match(/<span class=["']tv-title-episode["']>\s*(\d{1,3})\.Sezon\s+(\d{1,4})\.Bölüm\s*<\/span>/i);
  if(!name||!episode||!sameName(name,target)||Number(episode[1])!==target.season||Number(episode[2])!==target.episode)return null;
  // The flag beside the name is the site's language label for this episode.
  const flag=h1.match(/<img\b[^>]*\bsrc=["'][^"']*\/([a-z0-9_-]{1,40})\.png["'][^>]*\bclass=["']subtitle-flag\b/i)?.[1]||null;
  return{name,flag};
}
function seriesAddress(html){
  const href=String(html).match(/<a href=["'](https:\/\/www\.dizibox\.live\/diziler\/[a-z0-9-]{1,150}\/)["'] class=["']archive-title["']/i)?.[1];
  return href?safeUrl(href):null;
}
function seriesMatches(html,url,target){
  const m=String(html).match(/<h1\b[^>]*>\s*(?:<i\b[^>]*><\/i>\s*)?<a href=["']([^"']+)["'][^>]*>([^<]{1,200})<\/a>\s*<\/h1>\s*<div class=["']title-terms\b[\s\S]{0,1500}?\/yil\/(\d{4})\//i);
  // The series page's year tag is the first-air year (Shameless 2011 vs 2004).
  return!!m&&safeUrl(m[1])===url&&sameName(decodeEntities(m[2]),target)&&Number(m[3])===target.year;
}
function kingAddress(html){
  const at=String(html).indexOf('id="video-area"');if(at<0)return null;
  const src=decodeEntities(html.slice(at,at+4000).match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1]||'');
  return /^https:\/\/www\.dizibox\.live\/player\/king\/king\.php\?v=[0-9a-f]{32,256}$/.test(src)?src:null;
}
function alternativeAddress(html,current){
  // The default alternative is usually "DBX Pro" (King); otherwise follow its option once.
  for(const m of String(html).matchAll(/<option\b[^>]*\bvalue=["'](https:\/\/www\.dizibox\.live\/[a-z0-9-]{1,200}\/\d{1,2}\/)["'][^>]*>\s*DBX Pro\s*<\/option>/gi))
    if(m[1]!==current)return m[1];
  return null;
}
function embedAddress(html){
  const m=String(html).match(/<iframe\b[^>]*\bsrc=["'](https:\/\/dbx\.molystream\.org\/embed\/(\d{1,9}-[0-9a-f]{16,40}))["']/i);
  return m?{url:m[1],id:m[2]}:null;
}
function playerFile(html,embed){
  const m=String(html).slice(0,200000).match(/CryptoJS\.AES\.decrypt\(\s*"([A-Za-z0-9+/=\s]{24,180000})"\s*,\s*"([^"\\]{8,200})"\s*\)/);
  const plain=m&&decryptCryptoJsAes(m[1],m[2]);
  if(!plain||!/\btype\s*:\s*["']application\/vnd\.apple\.mpegurl["']/i.test(plain))return null;
  const file=plain.match(/\bfile\s*:\s*'([^'\s]{1,300})'/)?.[1];
  return file===PLAYER+'/embed/sheila/'+embed.id?file:null;
}
async function scanDiziBox(http,target){
  if(target.type!=='tv'||target.isAnime||!Number.isInteger(target.season)||!Number.isInteger(target.episode)||target.season<1||target.episode<1)return [];
  const tail=url=>http.text(url,{headers:{'User-Agent':UA,Range:TAIL},maxChars:TAIL_CHARS});
  let page=null,heading=null;
  for(const slug of slugs(target)){
    if(http.expired())break;
    // Unknown slugs redirect to the home page; the heading is the identity check.
    page=await tail(`${ORIGIN}/${slug}-${target.season}-sezon-${target.episode}-bolum-izle/`);
    if(page&&(heading=episodeHeading(page.text,target)))break;
  }
  const series=heading&&seriesAddress(page.text);
  if(!series)return [];
  // Only the King ("DBX Pro") player is read; a page with neither King nor a
  // DBX Pro option (e.g. only "Moly") costs no further request.
  const king=kingAddress(page.text),other=king?null:alternativeAddress(page.text,page.url);
  if(!king&&!other)return [];
  const verified=tail(series).then(p=>!!p&&seriesMatches(p.text,series,target));
  const stream=(async()=>{
    let address=king;
    if(!address){
      const alt=await tail(other);
      address=alt&&episodeHeading(alt.text,target)?kingAddress(alt.text):null;
    }
    if(!address||http.expired())return null;
    const kingPage=await http.text(address,{headers:{'User-Agent':UA,Referer:ORIGIN+'/'},maxChars:20000});
    const embed=kingPage&&embedAddress(kingPage.text);
    if(!embed||http.expired())return null;
    const player=await http.text(embed.url,{headers:{'User-Agent':UA,Referer:ORIGIN+'/'},maxChars:200000});
    return player?playerFile(player.text,embed):null;
  })();
  const [ok,file]=await Promise.all([verified,stream]);
  if(!ok||!file)return [];
  const subtitled=heading.flag==='altyazi';
  // Segments need the player origin as Referer. The URL marker keeps the
  // extensionless playlist on the HLS path (host verified to accept it).
  return [{url:file+'?format=.m3u8',headers:{Referer:PLAYER+'/','User-Agent':UA},subtitles:[],source:'DiziBox',identity:target,identityConfidence:90,
    filename:syntheticFilename(target)+'.m3u8',filenameSynthetic:true,
    // Stream has no subtitle track; "altyazi" is the site's label (likely burned in, not verified).
    ...(subtitled?{burnedSubtitleLanguage:'tr',burnedSubtitleBasis:'site-label',claimedAudioLanguages:[target.originalLanguage].filter(Boolean)}:{})}];
}
module.exports={scanDiziBox,slugs,episodeHeading,seriesAddress,seriesMatches,kingAddress,alternativeAddress,embedAddress,playerFile};
