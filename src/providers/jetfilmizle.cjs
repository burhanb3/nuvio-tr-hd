'use strict';
const {safeUrl,normalizeTitle,mapLimit}=require('../util.cjs');
const {decodeEntities}=require('./directory.cjs');
const {syntheticFilename}=require('./page-data.cjs');
const ORIGIN='https://jetfilmizle.app';
const PLAYER='https://videopark.top';
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
// Measured 25 Nov (this PC): the "Gold" button of the Turkish-dub tab opens
// the site's own Drive-backed player. Its plain or per-quality worker URL
// answered 206 MP4 for validation films; Vip/Apollo are HLS only.
const QUALITIES=[2160,1440,1080,720,480,360,240];

const key=value=>normalizeTitle(decodeEntities(String(value||'')).replace(/['’`]/g,''));
function cards(html){
  const rows=[];
  for(const part of String(html).split(/<div class="[^"]*\bfilm-card\b[^"]*"/).slice(1,61)){
    const href=part.match(/<a\b[^>]*\bhref="https:\/\/jetfilmizle\.app\/film\/([a-z0-9][a-z0-9-]{0,150})"/)?.[1];
    const title=part.match(/<h3 class="fc-title">([^<]{1,200})<\/h3>/)?.[1];
    const year=Number(part.match(/<span class="fc-year">\s*(\d{4})\s*<\/span>/)?.[1]);
    const original=part.match(/<span class="fc-orig">([^<]{1,200})<\/span>/)?.[1];
    if(href&&title&&year&&!rows.some(r=>r.slug===href))rows.push({slug:href,title:key(title),original:key(original),year});
  }
  return rows;
}
// The card only chooses which page to open; the page's single IMDb id binds.
function matchingCards(rows,names,target){
  const years=[...new Set([target.year,...(target.releaseYears||[])])];
  const near=row=>years.some(y=>Math.abs(row.year-y)<=1);
  const named=row=>names.includes(row.original)||names.includes(row.title);
  return [...rows.filter(r=>named(r)&&years.includes(r.year)),...rows.filter(r=>named(r)&&!years.includes(r.year)&&near(r))].slice(0,2);
}
function imdbIds(html){return [...new Set([...String(html).matchAll(/imdb\.com\/title\/(tt\d{5,10})/g)].map(m=>m[1]))];}
// Gold buttons of one player tab in page order: "dublaj" is the Turkish-dub
// tab, "altyazili" the site's "Türkçe Altyazılı Orijinal Ses" tab. A tab may
// list two Gold buttons for the same file; the second is only a retry.
function goldIndexes(html,type='dublaj'){
  const rows=[];
  for(const m of String(html).matchAll(/data-source-index="(\d{1,2})" data-player-type="([a-z]{1,20})">\s*([^<]{0,40}?)\s*<\/button>/g))
    if(m[2]===type&&m[3]==='Gold'&&!rows.includes(m[1]))rows.push(m[1]);
  return rows.slice(0,2);
}
function goldIndex(html,type='dublaj'){return goldIndexes(html,type)[0]??null;}
// Subtitled-tab ids carry a language suffix ("<digits>-en", 26 Nov); dub ids
// are digits only.
const GO_FRAME={
  dublaj:/<iframe\b[^>]*\bsrc=['"]((?:https:)?\/\/videopark\.top\/go\/\?id=\d{1,12})['"]/,
  altyazili:/<iframe\b[^>]*\bsrc=['"]((?:https:)?\/\/videopark\.top\/go\/\?id=\d{1,12}(?:-[a-z]{2})?)['"]/
};
function goPlayer(html,type='dublaj'){
  const src=GO_FRAME[type]&&String(html).match(GO_FRAME[type])?.[1];
  return src?safeUrl(src.startsWith('//')?'https:'+src:src):null;
}
// The player names its own delivery worker. Accept only that exact shape.
function workerVideo(html){
  const base=String(html).match(/\bWORKER_BASE\s*=\s*"([^"]{1,200})"/)?.[1]?.replace(/\\\//g,'/');
  const id=String(html).match(/\bVIDEO_ID\s*=\s*(\d{1,10})\s*;/)?.[1];
  if(!base||!id||!/^https:\/\/[a-z0-9][a-z0-9-]{0,62}\.[a-z0-9][a-z0-9-]{0,62}\.workers\.dev$/.test(base))return null;
  return {base,id};
}
function variantUrls(video,info){
  if(!info||Number(info.id)!==Number(video.id))return [];
  const listed=Array.isArray(info.qualities)?info.qualities:[];
  if(listed.length>6||listed.some(q=>!QUALITIES.includes(q)))return [];
  const root=video.base+'/v/'+video.id;
  if(!listed.length)return [root];
  // Prioritize both lower variants (which reliably answer 206 on multi-quality
  // items) and higher ones within the bounded 4-variant check budget.
  const low=listed.slice().sort((a,b)=>a-b),high=listed.slice().sort((a,b)=>b-a);
  const picked=[...new Set([low[0],high[0],low[1],high[1],...low].filter(q=>QUALITIES.includes(q)))].slice(0,4);
  return picked.map(q=>root+'?q='+q);
}
// Some variants ignore Range and stream the whole file with 200 (1080/720
// and the plain URL of multi-quality items, 25 Nov). Nuvio buffers fetch
// bodies, so only a HEAD that already answers 206 may reach the GET probe.
async function rangeTotal(http,url){
  for(let attempt=0;attempt<2&&!http.expired();attempt++){
    const r=await http.request(url,{method:'HEAD',headers:{Range:'bytes=0-15'},timeoutMs:4000,nativeGroup:'media-probe'});
    if(r){
      const range=(r.response.headers.get('content-range')||'').match(/^bytes 0-15\/(\d{5,14})$/i);
      return r.response.status===206&&range?Number(range[1]):null;
    }
    if(http.failureFor?.(url)?.status!==503)return null;
  }
  return null;
}
async function scanJetFilmizle(http,target,options={}){
  if(target.type!=='movie'||target.isAnime||!/^tt\d{5,10}$/.test(target.imdbId||''))return [];
  const page=async(url,value={})=>{
    const r=await http.text(url,{maxChars:600000,...value,headers:{'User-Agent':UA,...(value.headers||{})}});
    return r&&new URL(r.url).origin===new URL(url).origin?r:null;
  };
  let names=[...new Set([target.originalTitle,...(target.searchTitles||[])].map(key).filter(Boolean))],localized=null;
  const queries=[...new Set((target.searchTitles||[target.originalTitle]).map(v=>decodeEntities(String(v||'')).trim()).filter(Boolean))].slice(0,1);
  let bound=null,searched=false;
  const tryCards=async rows=>{
    for(const row of matchingCards(rows,names,target)){
      if(http.expired())return;
      const film=await page(ORIGIN+'/film/'+row.slug,{headers:{Referer:ORIGIN+'/'}});
      const ids=film?imdbIds(film.text):[];
      if(ids.length===1&&ids[0]===target.imdbId){bound=film;return;}
    }
  };
  for(let round=0;round<2&&!bound&&!http.expired();round++){
    if(round===1){
      if(!searched)break;
      // Turkish card titles: names from the same TMDB record, loaded once.
      localized=options.loadTitles?await Promise.resolve().then(options.loadTitles).catch(()=>[]):[];
      const extra=(Array.isArray(localized)?localized:[]).map(v=>decodeEntities(String(v||'')).trim()).filter(v=>v&&v.length<=200);
      if(!extra.length)break;
      names=[...new Set([...names,...extra.map(key)])];
      queries.splice(0,queries.length,...extra.filter(v=>!queries.includes(v)).slice(0,1));
      if(!queries.length)break;
    }
    for(const query of queries){
      const search=await page(ORIGIN+'/arama?q='+encodeURIComponent(query),{headers:{Referer:ORIGIN+'/'}});
      if(search){searched=true;await tryCards(cards(search.text));}
      if(bound||http.expired())break;
    }
  }
  if(!bound)return [];
  const filmId=bound.text.match(/name="film_id" value="(\d{1,10})"/)?.[1];
  if(!filmId||http.expired())return [];
  const gold=async(type,index)=>{
    const frame=await page(ORIGIN+'/jetplayer',{method:'POST',headers:{Origin:ORIGIN,Referer:bound.url,'X-Requested-With':'XMLHttpRequest','Content-Type':'application/x-www-form-urlencoded'},
      body:'film_id='+filmId+'&source_index='+index+'&player_type='+type,maxChars:20000});
    const player=frame?goPlayer(frame.text,type):null;
    if(!player||new URL(player).origin!==PLAYER||http.expired())return [];
    const playerPage=await page(player,{headers:{Referer:ORIGIN+'/'},maxChars:100000});
    const video=playerPage?workerVideo(playerPage.text):null;
    if(!video||http.expired())return [];
    const urls=variantUrls(video,await http.json(video.base+'/v/'+video.id+'/info',{timeoutMs:4000}));
    if(!urls.length||http.expired())return [];
    const checked=await mapLimit(urls,3,async url=>({url,total:await rangeTotal(http,url)}));
    return checked.filter(row=>row.total);
  };
  const tab=async type=>{
    for(const index of goldIndexes(bound.text,type)){
      if(http.expired())break;
      const rows=await gold(type,index);
      if(rows.length)return rows;
    }
    return [];
  };
  const row=(type,{url,total})=>({url,headers:{},filename:syntheticFilename(target)+'.mp4',filenameSynthetic:true,subtitles:[],source:'JetFilmizle',
    // The tab is the publisher's audio claim. The probe reads the audio trak's
    // own language; only that is shown as measured.
    ...(type==='dublaj'?{claimedAudioLanguages:['tr']}:{
      // No subtitle track in the player or file listing: "Türkçe Altyazılı" is
      // the site's label (likely burned in, not verified), like DiziBox.
      claimedAudioLanguages:[target.originalLanguage].filter(Boolean),burnedSubtitleLanguage:'tr',burnedSubtitleBasis:'site-label'}),
    readAudioTracks:true,expectedSize:total,
    identity:target,identityConfidence:90,requireDuration:true,durationTolerance:0.1,requireVideoDimensions:true});
  const tabs=options.subtitledOriginal===false?['dublaj']:['dublaj','altyazili'];
  const [dub,subtitled=[]]=await Promise.all(tabs.map(type=>tab(type)));
  // The same worker file under both tabs would carry two conflicting claims;
  // keep only the dub row (its audio is still measured by the probe).
  const dubUrls=new Set(dub.map(r=>r.url));
  return [...dub.map(r=>row('dublaj',r)),...subtitled.filter(r=>!dubUrls.has(r.url)).map(r=>row('altyazili',r))];
}
module.exports={scanJetFilmizle,cards,matchingCards,imdbIds,goldIndex,goldIndexes,goPlayer,workerVideo,variantUrls,rangeTotal,ORIGIN,PLAYER};
