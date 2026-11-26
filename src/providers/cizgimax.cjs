'use strict';
const {safeUrl}=require('../util.cjs');
const {decodeEntities}=require('./directory.cjs');
const {jsonLd,tagAttributes,sameName,syntheticFilename}=require('./page-data.cjs');
const {base64Bytes}=require('../media/base64.cjs');
const {decodeUtf8}=require('../subtitles.cjs');
// CizgiMax lists Turkish-dubbed cartoon episodes. Only its "Drive" server is
// read: /oynat/ redirects to a public Google Drive file, whose public download
// URL (with the confirm=t answer to Drive's "can't scan for viruses" notice
// for large files) returns the MP4 with Range 206, no cookie or key. Its other
// servers are not used (a challenge page on one CDN, 403/5xx on others, or a
// duplicate of the AnimeCix API).
// The site ignores Range on HTML: the search page is ~0.2 MB, a series page
// ~0.6 MB and an episode page ~0.8 MB. Larger pages exceed the text limit and
// the source returns nothing.
const ORIGIN='https://cizgimax.online',PAGE_CHARS=1000000;
const DRIVE_FILE=/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{20,100})\/preview$/;
function searchResults(html,target){
  const out=[];
  for(const m of String(html).matchAll(/<a\b([^>]{0,600}\bclass=["']film-name["'][^>]{0,600})>([^<]{1,300})<\/a>/gi)){
    const attr=tagAttributes('<a '+m[1]+'>');
    if(!/^\/diziler\/[a-z0-9-]{1,150}-izle\/$/.test(attr.href||''))continue;
    // Turkish name or the alternative (usually original) name must be exact.
    if(![m[2],attr['data-alt-title']||''].some(name=>name&&sameName(decodeEntities(name),target)))continue;
    const url=ORIGIN+attr.href;
    if(!out.includes(url))out.push(url);
    if(out.length>=2)break;
  }
  return out;
}
function seasonEpisodes(html,season){
  // Episode buttons: href "/<slug>-S-sezon-E-bolum-izle/" and the label E.
  // The title is either "<Name> : S.Sezon E.Bölüm" (then it must agree) or
  // the episode's own name.
  const text=String(html),start=text.indexOf('class="ep-num-btn"');
  if(start<0)return null;
  const end=text.lastIndexOf('class="ep-num-btn"');
  const area=text.slice(Math.max(0,start-400),end+1200),episodes=new Map();
  for(const m of area.matchAll(/<a href="(\/[a-z0-9-]{1,200}-(\d{1,3})-sezon-(\d{1,4})-bolum-izle\/)"\s+class="ep-num-btn"([^>]{0,400})>\s*<span class="ep-num-label">(\d{1,4})<\/span>/g)){
    const titled=m[4].match(/\btitle="[^"]{0,300}?:\s*(\d{1,3})\.Sezon\s+(\d{1,4})\.Bölüm"/);
    if(m[3]!==m[5]||titled&&(titled[1]!==m[2]||titled[2]!==m[3])||Number(m[2])!==season)continue;
    const number=Number(m[3]),url=ORIGIN+m[1];
    if(episodes.has(number)&&episodes.get(number)!==url)return null;
    episodes.set(number,url);
  }
  // Numbering must be exactly 1..n, otherwise it cannot be compared with TMDB.
  for(let i=1;i<=episodes.size;i++)if(!episodes.has(i))return null;
  return episodes.size?episodes:null;
}
function seriesData(html,url,target){
  const text=String(html);
  const ld=jsonLd(text.slice(0,40000)).find(row=>row&&row['@type']==='TVSeries');
  if(!ld||safeUrl(ld.url)!==url)return null;
  const names=[ld.name,ld.alternateName].filter(v=>typeof v==='string').map(decodeEntities);
  // datePublished is the first-air year (SpongeBob 1999).
  if(!names.some(name=>sameName(name,target))||!/^\d{4}$/.test(String(ld.datePublished||''))||Number(ld.datePublished)!==target.year)return null;
  const episodes=seasonEpisodes(text,target.season);
  return episodes&&episodes.has(target.episode)?{episodes,episodeUrl:episodes.get(target.episode)}:null;
}
function driveServers(html,seriesUrl,target){
  const text=String(html);
  const ld=jsonLd(text.slice(0,40000)).find(row=>row&&row['@type']==='TVEpisode');
  if(!ld||Number(ld.seasonNumber)!==target.season||Number(ld.episodeNumber)!==target.episode||safeUrl(ld.partOfSeries?.url)!==seriesUrl)return null;
  // The server list is base64 JSON (encoding only) passed to JSON.parse(atob()).
  // The name also appears in comments and player code; only the assignment counts.
  let raw=null;
  for(let at=text.indexOf('serversByLang'),n=0;at>=0&&n<60&&!raw;at=text.indexOf('serversByLang',at+13),n++)
    raw=text.slice(at,at+61000).match(/^serversByLang\s*=\s*JSON\.parse\(atob\("([A-Za-z0-9+/=\\]{4,60000})"\)\)/)?.[1]||null;
  const bytes=raw&&base64Bytes(raw.replace(/\\\//g,'/'),60000),decoded=bytes&&decodeUtf8(bytes);
  let lists;
  try{lists=decoded&&JSON.parse(decoded);}catch{return null;}
  if(!lists||!Array.isArray(lists.dub))return null;
  const seen=new Set();
  // Only the entry's own "dub" label counts; "Drive · 1.Part" halves are skipped.
  return lists.dub.slice(0,20).filter(s=>s&&s.type==='iframe'&&s.lang==='dub'&&typeof s.label==='string'&&/^Drive$/i.test(s.label.trim())&&
    typeof s.src==='string'&&/^\/oynat\/\?t=[A-Za-z0-9._-]{20,600}$/.test(s.src)&&!seen.has(s.src)&&seen.add(s.src)).slice(0,2).map(s=>ORIGIN+s.src);
}
function driveFile(page,target,requested){
  if(!page)return null;
  const head=String(page.text).slice(0,20000);
  // The preview page names its own file in og:url, and every file link on it
  // must be that one file. When the reported final URL carries an id it must
  // agree; if the transport reports the requested /oynat/ address instead,
  // the page's own id is used (redirect URL reporting not verified on device).
  const own=head.match(/<meta property="og:url" content="https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{20,100})\/preview(?:\?[^"]{0,60})?">/)?.[1];
  const final=String(page.url).match(DRIVE_FILE)?.[1];
  if(!own||final&&final!==own||!final&&page.url!==requested)return null;
  for(const m of String(page.text).slice(0,400000).matchAll(/\/file\/d\/([A-Za-z0-9_-]{20,100})/g))if(m[1]!==own)return null;
  const title=decodeEntities(head.match(/<title>([^<]{1,300})<\/title>/i)?.[1]||'').replace(/\s+-\s+Google Drive\s*$/i,'').trim();
  // Uploader names look like "S2 B3.mp4". A part, another container or an
  // explicit different season/episode is rejected.
  if(!/\.mp4$/i.test(title)||/\bpart\b|part\s*\d|\d\s*part\b|parça|kısım/i.test(title))return null;
  const numbers=title.match(/\bS(\d{1,3})\s*[ ._-]?\s*(?:B|E|Bölüm)\s*(\d{1,4})\b/i);
  if(numbers&&(Number(numbers[1])!==target.season||Number(numbers[2])!==target.episode))return null;
  return own;
}
async function scanCizgiMax(http,target,{loadSeason}={}){
  if(target.type!=='tv'||!Number.isInteger(target.season)||!Number.isInteger(target.episode)||target.season<1||target.episode<1||typeof loadSeason!=='function')return [];
  // TMDB's small season record loads while the site is searched.
  const seasonJob=Promise.resolve().then(loadSeason).catch(()=>null);
  let series=null,seriesUrl=null;
  const tried=new Set();
  // The site search is a plain substring search and its names usually drop
  // punctuation ("Scooby Doo Mystery Incorporated"), so that form is tried too.
  const plain=String(target.originalTitle||'').replace(/[^\p{L}\p{N}' ]+/gu,' ').replace(/\s+/g,' ').trim();
  for(const name of [...new Set([target.originalTitle,plain,...(target.searchTitles||[])].filter(Boolean))].slice(0,3)){
    if(http.expired())break;
    const search=await http.text(ORIGIN+'/ara/?q='+encodeURIComponent(name),{maxChars:PAGE_CHARS});
    for(const url of search?searchResults(search.text,target):[]){
      if(tried.has(url)||http.expired())continue;
      tried.add(url);
      const page=await http.text(url,{maxChars:PAGE_CHARS});
      if(page&&(series=seriesData(page.text,url,target))){seriesUrl=url;break;}
    }
    if(series)break;
  }
  if(!series||http.expired())return [];
  // The site's season must have exactly as many episodes as TMDB has aired:
  // cartoons are often numbered by segment on TMDB (SpongeBob S1 41 vs 20).
  // Checked before the ~0.8 MB episode page is read.
  const season=await seasonJob;
  if(!season||season.airedEpisodes!==series.episodes.size||http.expired())return [];
  const episode=await http.text(series.episodeUrl,{maxChars:PAGE_CHARS});
  const servers=episode&&driveServers(episode.text,seriesUrl,target)||[];
  const ids=[];
  for(const server of servers){
    if(http.expired())break;
    const id=driveFile(await http.text(server,{headers:{Referer:series.episodeUrl},maxChars:400000}),target,server);
    if(id&&!ids.includes(id))ids.push(id);
  }
  const identity={...target,runtimeMinutes:season.runtimeMinutes||target.runtimeMinutes||null};
  return ids.map(id=>({url:'https://drive.usercontent.google.com/download?id='+id+'&export=download&confirm=t',headers:{},subtitles:[],source:'CizgiMax',
    identity,identityConfidence:90,filename:syntheticFilename(target)+'.mp4',filenameSynthetic:true,
    expectedContainer:'mp4',requireDuration:true,requireVideoDimensions:true,
    // The site's dub list is the only audio evidence; the files carry no language tag.
    claimedAudioLanguages:['tr']}));
}
module.exports={scanCizgiMax,searchResults,seasonEpisodes,seriesData,driveServers,driveFile,ORIGIN};
