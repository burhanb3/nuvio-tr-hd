'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {decodeEntities}=require('./directory.cjs');
const {matchesEpisode}=require('../matching.cjs');
const ORIGIN='https://tvseries.in';

// The site drops apostrophes from show names ("Greys Anatomy").
const key=value=>normalizeTitle(decodeEntities(String(value||'')).replace(/['’`]/g,''));
function names(target){return [...new Set([target.originalTitle,...(target.searchTitles||[])].map(key).filter(Boolean))];}
function searchCards(html,target){
  const text=String(html),start=text.indexOf("<main class='site-content'>");
  if(start<0)return [];
  const wanted=names(target),rows=[];
  for(const card of text.slice(start).split("<article class='series-card'").slice(1,60)){
    const m=card.match(/class=['"]series-card-title['"]>\s*<a\b[^>]*\bhref=['"](https:\/\/tvseries\.in\/subfolder-[^'"?#<>]{1,200}\.htm)['"][^>]*>([^<]{1,200})<\/a>/i);
    if(!m)continue;
    const name=key(m[2]),exact=wanted.includes(name);
    // "Shameless" lists "Shameless US" and "Shameless UK"; the IMDb link on
    // the show page decides between them.
    if(exact||wanted.some(w=>name.startsWith(w+' ')))rows.push({href:m[1],name:decodeEntities(m[2]).trim(),exact});
  }
  return [...rows.filter(r=>r.exact),...rows.filter(r=>!r.exact)].slice(0,3);
}
function imdbIds(html){return [...new Set([...String(html).matchAll(/imdb\.com\/title\/(tt\d{5,10})/g)].map(m=>m[1]))];}
function slugOf(href,kind){
  const m=String(href).match(kind==='show'?/\/subfolder-([^/?#]+)\.htm$/:/\/files-([^/?#]+)--\d{1,9}\.htm$/);
  try{return m?decodeURIComponent(m[1]).toLowerCase():null;}catch{return null;}
}
function seasonLink(html,showHref,target){
  const slug=slugOf(showHref,'show'),found=new Set();
  for(const m of String(html).matchAll(/<a\b[^>]*class=['"]season-pill['"][^>]*>/gi)){
    const tag=m[0],href=tag.match(/\bhref=['"](https:\/\/tvseries\.in\/files-[^'"?#<>]{1,200}--\d{1,9}\.htm)['"]/i)?.[1];
    const season=Number(tag.match(/\btitle=['"]Season\s+(\d{1,3})['"]/i)?.[1]);
    if(href&&season===target.season&&slugOf(href,'files')===slug)found.add(href);
  }
  return found.size===1?[...found][0]:null;
}
function episodeFile(html,target){
  const badge='S'+String(target.season).padStart(2,'0')+'E'+String(target.episode).padStart(2,'0');
  const cards=String(html).split("<div class='ep-card'>").slice(1,400).filter(card=>card.includes("class='ep-card-badge'>"+badge+'<'));
  if(cards.length!==1)return null;
  const ids=[...new Set([...cards[0].matchAll(/href=['"]https:\/\/tvseries\.in\/episode\.php\?fileid=(\d{1,10})&(?:amp;)?ftype=2['"]/g)].map(m=>m[1]))];
  return ids.length===1?ids[0]:null;
}
function downloadPage(html,fileid){
  const m=String(html).match(/https:\/\/tvseries\.in\/downloadmp4\.php\?fileid=(\d{1,10})&(?:amp;)?dkey=([a-f0-9]{32})\b/);
  return m&&m[1]===fileid?ORIGIN+'/downloadmp4.php?fileid='+fileid+'&dkey='+m[2]:null;
}
// Download links name a public file server and a path on it. Build the file
// address directly instead of visiting the interstitial filelink.php page.
function mirrors(html,fileid){
  const rows=[];
  for(const m of String(html).matchAll(/href=['"](filelink\.php\?[^'"<>]{1,700})['"]/g)){
    const query=decodeEntities(m[1]).slice('filelink.php?'.length),params={};
    for(const part of query.split('&')){
      const i=part.indexOf('=');if(i<1)continue;
      try{params[part.slice(0,i)]=decodeURIComponent(part.slice(i+1).replace(/\+/g,' '));}catch{}
    }
    const host=String(params.sn||'').toLowerCase(),path=String(params.id||'');
    if(params.ep!==fileid||!/^(?:[a-z0-9-]{1,63}\.){2,4}[a-z]{2,24}$/.test(host)||host.endsWith('tvseries.in'))continue;
    if(!/^\/[A-Za-z0-9_./%-]{1,600}\.mp4$/i.test(path)||/(^|\/)\.\.?(\/|$)/.test(path))continue;
    const url=safeUrl('https://'+host+path);
    if(url&&!rows.includes(url))rows.push(url);
  }
  if(!rows.length)return [];
  // Keep only mirrors of the same file on the same file-server domain.
  const first=new URL(rows[0]),parent=h=>h.split('.').slice(1).join('.');
  return rows.filter(url=>{const u=new URL(url);return u.pathname===first.pathname&&parent(u.hostname)===parent(first.hostname);}).slice(0,2);
}
function fileMatches(name,showName,target){
  const file=key(name),prefixes=[...new Set([key(showName),...names(target)].filter(Boolean))];
  return prefixes.some(p=>file.startsWith(p+' '))&&matchesEpisode(name,target)&&!/\b(sample|trailer)\b/i.test(name);
}
async function scanFzTvSeries(http,target){
  if(target.type!=='tv'||!target.imdbId||target.isAnime||!target.season||!target.episode)return [];
  const page=async(url,options={})=>{
    const r=await http.request(url,options);
    if(!r||new URL(r.url).origin!==ORIGIN)return null;
    const text=await r.response.text();
    return text&&text.length<=600000&&!text.endsWith('...[truncated]')?{text,url:r.url,response:r.response}:null;
  };
  let show=null,showPage=null;
  const queries=[...new Set([target.originalTitle,...(target.searchTitles||[])].map(v=>decodeEntities(String(v||'')).replace(/['’`]/g,'').trim()).filter(Boolean))].slice(0,2);
  for(const query of queries){
    const search=await page(ORIGIN+'/search.php?search='+encodeURIComponent(query)+'&beginsearch=Search&vsearch=&by=series');
    for(const row of search?searchCards(search.text,target):[]){
      if(http.expired())return [];
      const detail=await page(row.href);
      const ids=detail?imdbIds(detail.text):[];
      if(ids.length===1&&ids[0]===target.imdbId){show=row;showPage=detail;break;}
    }
    if(show||http.expired())break;
  }
  if(!show)return [];
  const seasonUrl=seasonLink(showPage.text,show.href,target);
  const season=seasonUrl&&await page(seasonUrl);
  if(!season)return [];
  const seasonIds=imdbIds(season.text);
  if(seasonIds.length>1||(seasonIds.length===1&&seasonIds[0]!==target.imdbId))return [];
  const fileid=episodeFile(season.text,target);
  if(!fileid)return [];
  const episodeUrl=ORIGIN+'/episode.php?fileid='+fileid+'&ftype=2';
  const episode=await page(episodeUrl,{headers:{Referer:season.url}});
  const downloadUrl=episode&&downloadPage(episode.text,fileid);
  // The download key is bound to the anonymous session this page issued.
  const session=episode&&(episode.response.headers.get('set-cookie')||'').match(/(?:^|[,;]\s*)(PHPSESSID=[A-Za-z0-9,-]{8,128})(?:[;,]|$)/)?.[1];
  if(!downloadUrl||!session||http.expired())return [];
  const download=await page(downloadUrl,{headers:{Referer:episodeUrl,Cookie:session}});
  const urls=download?mirrors(download.text,fileid):[];
  if(!urls.length)return [];
  let filename;
  try{filename=decodeURIComponent(new URL(urls[0]).pathname.split('/').pop());}catch{return [];}
  if(!fileMatches(filename,show.name,target))return [];
  return [{url:urls[0],alternateUrls:urls.slice(1),filename,source:'FzTvSeries',headers:{},subtitles:[],
    identity:target,identityConfidence:90,requireDuration:true,durationTolerance:0.1,requireVideoDimensions:true}];
}
module.exports={scanFzTvSeries,searchCards,seasonLink,episodeFile,downloadPage,mirrors,fileMatches};
