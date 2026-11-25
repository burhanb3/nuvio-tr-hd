'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {decodeEntities}=require('./directory.cjs');
const ORIGIN='https://fzmovies.live';

const key=value=>normalizeTitle(decodeEntities(String(value||'')).replace(/['’`]/g,''));
function names(target){return [...new Set([target.originalTitle,...(target.searchTitles||[])].map(key).filter(Boolean))];}
function years(target){return [...new Set([target.year,...(target.releaseYears||[])].filter(Number.isInteger))];}
// Search hrefs are relative and may hold raw spaces. Only the original-film
// page shape is accepted; "movie--Dubbed--…" pages carry an IMDb id too.
function pageUrl(slug){
  let raw;try{raw=decodeURIComponent(decodeEntities(String(slug)));}catch{return null;}
  if(!/^movie-[^-/\\?#<>'"][^/\\?#<>'"]{0,200}--hmp4\.htm$/.test(raw))return null;
  return safeUrl(ORIGIN+'/'+encodeURIComponent(raw));
}
function searchCards(html,target){
  const wanted=names(target),ys=years(target),rows=[];
  for(const m of String(html).matchAll(/<a\b[^>]*\bhref='(movie-[^'<>]{1,200}--hmp4\.htm)'[^>]*>\s*<small>\s*<b>([^<]{1,200})<\/b>\s*<\/small>\s*<\/a>\s*<small>\((\d{4})\)<\/small>/gi)){
    const name=key(m[2]),year=Number(m[3]);
    // The site appends a year to some names ("The Crow 1994").
    if(!wanted.some(w=>name===w||ys.some(y=>name===w+' '+y)))continue;
    const href=pageUrl(m[1]);
    if(!href||rows.some(r=>r.href===href))continue;
    rows.push({href,name:decodeEntities(m[2]).trim(),yearMatch:ys.includes(year)});
  }
  return [...rows.filter(r=>r.yearMatch),...rows.filter(r=>!r.yearMatch)].slice(0,3);
}
function imdbIds(html){return [...new Set([...String(html).matchAll(/imdb\.com\/title\/(tt\d{5,10})/g)].map(m=>m[1]))];}
function optionKeys(html){
  return [...new Set([...String(html).matchAll(/\bdownload1\.php\?downloadoptionskey=(\d{1,3}-\d{1,10}-[a-f0-9]{32})(?![A-Za-z0-9])/g)].map(m=>m[1]))].slice(0,2);
}
// The download key keeps the option's numeric prefix ("3-36192-…").
function downloadKey(html,option){
  const prefix=option.split('-').slice(0,2).join('-')+'-';
  const found=[...new Set([...String(html).matchAll(/\bdownload\.php\?downloadkey=(\d{1,3}-\d{1,10}-[a-f0-9]{32})(?![A-Za-z0-9])/g)].map(m=>m[1]))];
  return found.length===1&&found[0].startsWith(prefix)?found[0]:null;
}
// The page lists one file on sibling servers of one domain, as read-only
// inputs. Use them directly instead of the dlink.php interstitial.
function mirrors(html){
  const rows=[];
  // Some names hold a raw space ("…_BluRay v2_720p_…"); send it as %20.
  for(const m of String(html).matchAll(/<input\b[^>]*\bvalue='(https:\/\/[^'<>\t\r\n]{1,800})'/g)){
    const url=safeUrl(decodeEntities(m[1]).replace(/ /g,'%20'));
    if(!url)continue;
    const u=new URL(url);
    if(!/^(?:[a-z0-9-]{1,63}\.){2,4}[a-z]{2,24}$/.test(u.hostname)||/(^|\.)fzmovies\./.test(u.hostname))continue;
    if(!/^\/res\/[a-f0-9]{32}\/[a-f0-9]{32}\/[A-Za-z0-9_.()%-]{1,300}\.(?:mp4|mkv)$/i.test(u.pathname)||!['','?fromwebsite'].includes(u.search))continue;
    if(!rows.includes(url))rows.push(url);
  }
  if(!rows.length)return [];
  const first=new URL(rows[0]),parent=h=>h.split('.').slice(1).join('.');
  // Three servers are listed; on 25 Nov the first one failed TLS for every film.
  return rows.filter(url=>{const u=new URL(url);return u.pathname===first.pathname&&u.search===first.search&&parent(u.hostname)===parent(first.hostname);}).slice(0,3);
}
function fileMatches(name,pageName,target){
  const file=key(String(name).replace(/\.(?:mp4|mkv)$/i,''));
  if(/\b(sample|trailer|hindi|tamil|telugu|dubbed|dual audio|hdcam|camrip|hdts|telesync)\b/.test(file))return false;
  // Files are named "<Title>_(<year>)_BluRay_…": the year must follow the
  // title directly, so "Inception_The_Cobol_Job_(2010)" does not pass.
  const prefixes=[...new Set([key(pageName),...names(target)].filter(Boolean))];
  return prefixes.some(p=>years(target).some(y=>(file+' ').startsWith(p+' '+y+' ')));
}
async function scanFzMovies(http,target){
  if(target.type!=='movie'||!target.imdbId)return [];
  const page=async(url,options={})=>{
    const r=await http.request(url,options);
    if(!r||new URL(r.url).origin!==ORIGIN)return null;
    const text=await r.response.text();
    return text&&text.length<=600000&&!text.endsWith('...[truncated]')?{text,url:r.url,response:r.response}:null;
  };
  let movie=null,moviePage=null;
  const queries=[...new Set([target.originalTitle,...(target.searchTitles||[])].map(v=>decodeEntities(String(v||'')).replace(/['’`:]/g,'').replace(/\s+/g,' ').trim()).filter(Boolean))].slice(0,2);
  for(const query of queries){
    const search=await page(ORIGIN+'/csearch.php?searchname='+encodeURIComponent(query)+'&searchby=Name&category=All&vsearch=');
    for(const row of search?searchCards(search.text,target):[]){
      if(http.expired())return [];
      const detail=await page(row.href);
      const ids=detail?imdbIds(detail.text):[];
      if(ids.length===1&&ids[0]===target.imdbId){movie=row;moviePage=detail;break;}
    }
    if(movie||http.expired())break;
  }
  if(!movie)return [];
  // Download keys are bound to the anonymous session the film page issued.
  const session=(moviePage.response.headers.get('set-cookie')||'').match(/(?:^|[,;]\s*)(PHPSESSID=[A-Za-z0-9,-]{8,128})(?:[;,]|$)/)?.[1];
  const options=optionKeys(moviePage.text);
  if(!session||!options.length)return [];
  const rows=await Promise.all(options.map(async option=>{
    const optionUrl=ORIGIN+'/download1.php?downloadoptionskey='+option;
    const chooser=await page(optionUrl,{headers:{Referer:moviePage.url,Cookie:session}});
    const dkey=chooser&&downloadKey(chooser.text,option);
    if(!dkey||http.expired())return null;
    const download=await page(ORIGIN+'/download.php?downloadkey='+dkey,{headers:{Referer:optionUrl,Cookie:session}});
    const urls=download?mirrors(download.text):[];
    if(!urls.length)return null;
    let filename;
    try{filename=decodeURIComponent(new URL(urls[0]).pathname.split('/').pop());}catch{return null;}
    if(!fileMatches(filename,movie.name,target))return null;
    return {url:urls[0],alternateUrls:urls.slice(1),filename,source:'FzMovies',headers:{},subtitles:[],
      identity:target,identityConfidence:90,requireDuration:true,durationTolerance:0.1,requireVideoDimensions:true};
  }));
  const seen=new Set();
  return rows.filter(row=>row&&!seen.has(new URL(row.url).pathname)&&seen.add(new URL(row.url).pathname));
}
module.exports={scanFzMovies,searchCards,pageUrl,optionKeys,downloadKey,mirrors,fileMatches,ORIGIN};
