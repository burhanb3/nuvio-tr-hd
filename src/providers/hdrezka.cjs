'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {anchors,decodeEntities}=require('./directory.cjs');
const {tagAttributes,canonicalNames,syntheticFilename}=require('./page-data.cjs');
const {subtitleLanguage}=require('../subtitles.cjs');
const ORIGIN='https://rezka.ag';
function searchPages(html,target){
  const kind=target.type==='tv'?'series':'films',seen=new Set(),rows=[];
  for(const block of String(html).split(/<div\b[^>]*class=["']b-content__inline_item["']/i).slice(1,81)){
    const attrs=tagAttributes('<div '+block.slice(0,block.indexOf('>')+1)),url=safeUrl(attrs['data-url']);
    if(!/^\d{1,9}$/.test(attrs['data-id']||'')||!url||new URL(url).origin!==ORIGIN||!new RegExp('^/'+kind+'/[a-z-]+/'+attrs['data-id']+'-[a-z0-9-]+\\.html$').test(new URL(url).pathname)||
      !new RegExp('\\b'+target.year+'\\b').test(decodeEntities(block.slice(0,3500)).replace(/<[^>]*>/g,' '))||seen.has(url))continue;
    seen.add(url);rows.push(url);if(rows.length===2)break;
  }
  return rows;
}
function pageIdentity(html,url,target){
  const text=String(html),canonical=[...text.matchAll(/<meta\b[^>]*>/gi)].map(m=>tagAttributes(m[0])).find(a=>a.property==='og:url')?.content;
  const kind=target.type==='tv'?'series':'films',id=new URL(url).pathname.match(new RegExp('^/'+kind+'/[a-z-]+/(\\d{1,9})-[a-z0-9-]+\\.html$'))?.[1];
  if(!id||canonical!==url||/b-player__restricted__block_message|cf-turnstile|g-recaptcha|anubis_challenge/i.test(text))return null;
  const original=decodeEntities(text.match(/class=["']b-post__origtitle["'][^>]*>([^<]{1,300})</)?.[1]||'');
  const release=[...text.matchAll(/<tr\b[^>]*>([\s\S]{0,2500}?)<\/tr>/gi)].find(m=>/Дата выхода/.test(m[1]));
  const year=Number(release?.[1].replace(/<[^>]*>/g,' ').match(/\b(?:19|20)\d{2}\b/)?.[0]);
  let imdb;
  for(const a of anchors(text,1000).filter(a=>a.text==='IMDb')){
    let address=a.href;const encoded=address.match(/^\/help\/([A-Za-z0-9+/=]{8,600})\/$/)?.[1];
    try{if(encoded)address=decodeURIComponent(atob(encoded));const u=new URL(address);if(['imdb.com','www.imdb.com'].includes(u.hostname)&&u.protocol==='https:')imdb=u.pathname.match(/^\/title\/(tt\d+)\/?$/)?.[1];}catch{}
  }
  return original&&year===target.year&&target.imdbId&&imdb===target.imdbId?{id,original,imdb,year}:null;
}
function translations(html,id,target){
  const rows=[];
  for(const m of String(html).matchAll(/<(li|a)\b([^>]*\bclass=["'][^"']*b-translator__item\b[^>]*)>([\s\S]{0,1000}?)<\/\1>/gi)){
    const a=tagAttributes('<'+m[1]+m[2]+'>'),code=a['data-translator_id'],label=decodeEntities(a.title||m[3]).replace(/<[^>]*>/g,' ').trim();
    if(!/^\d{1,6}$/.test(code||'')||a['data-id']&&a['data-id']!==id||/b-prem|premium/.test(a.class||'')||['data-camrip','data-ads','data-director'].some(k=>a[k]==='1'))continue;
    const tr=/Türkçe|Turkish|Турецкий/i.test(label),original=/^Оригинал(?:\s|$)/.test(label);
    if(!tr&&!original||rows.some(r=>r.id===code))continue;
    rows.push({id:code,language:tr?'tr':target.originalLanguage,original});
  }
  return rows.sort((a,b)=>(a.language==='tr'?0:1)-(b.language==='tr'?0:1)).slice(0,2);
}
function exactEpisode(html,id,target){
  return [...String(html).matchAll(/<li\b[^>]*>/gi)].map(m=>tagAttributes(m[0])).some(a=>
    /(?:^|\s)b-simple_episode__item(?:\s|$)/.test(a.class||'')&&a['data-id']===id&&Number(a['data-season_id'])===target.season&&Number(a['data-episode_id'])===target.episode);
}
function fileVariants(data){
  if(!data||data.success!==true||![undefined,null,0,false,'0'].includes(data.premium_content)||typeof data.url!=='string'||data.url.length>50000)return [];
  const out=[],seen=new Set();
  // Current public responses contain literal player URLs. Encoded scripts,
  // premium labels and HLS alternatives are deliberately not interpreted.
  for(const m of data.url.matchAll(/\[([^\]]{1,350})\]([^\[]+)/g)){
    if(!/^(?:(?:240|360|480|576|720|1080|1440|2160)p|[24]K)$/i.test(m[1]))continue;
    const label=/^4k$/i.test(m[1])?'2160p':/^2k$/i.test(m[1])?'1440p':m[1].toLowerCase();
    const url=m[2].split(' or ').map(v=>safeUrl(v.trim().replace(/,$/,''))).find(v=>v&&new URL(v).hostname==='stream.voidboost.one'&&new URL(v).pathname.endsWith('.mp4'));
    if(!url||seen.has(url))continue;seen.add(url);out.push({url,label});
  }
  const high=out.slice().sort((a,b)=>parseInt(b.label)-parseInt(a.label)),small=out.slice().sort((a,b)=>parseInt(a.label)-parseInt(b.label)),plan=[];
  for(const v of [high[0],small[0],high[1],small[1]])if(v&&!plan.some(p=>p.url===v.url))plan.push(v);
  return plan;
}
function pairedSubtitles(data,target,headers){
  const tracks=[];if(typeof data.subtitle!=='string'||data.subtitle.length>20000)return tracks;
  for(const m of data.subtitle.matchAll(/\[([^\]]{1,50})\](https:\/\/[^,\s]+)/g)){
    const language=subtitleLanguage(m[1]),url=safeUrl(m[2]);
    if(language&&url&&/\.(srt|vtt)(?:$|\?)/i.test(url))tracks.push({url,language,headers,identity:target,_scope:'paired'});
  }
  return tracks.slice(0,8);
}
async function scanHdRezka(http,target,options={}){
  if(!['movie','tv'].includes(target.type)||!target.imdbId)return [];
  let page,binding,extraNames;
  for(const title of [...new Set([target.originalTitle,...(target.searchTitles||[])])].slice(0,2)){
    const search=await http.text(ORIGIN+'/search/?do=search&subaction=search&q='+encodeURIComponent(title),{maxChars:200000});
    for(const url of search?searchPages(search.text,target):[]){
      const candidate=await http.text(url,{maxChars:300000}),identity=candidate&&pageIdentity(candidate.text,url,target);if(!identity)continue;
      if(!canonicalNames(target).includes(normalizeTitle(identity.original))&&options.loadTitles&&extraNames===undefined)extraNames=await options.loadTitles();
      const names=[...canonicalNames(target),...(extraNames||[]).map(normalizeTitle)];
      if(!names.includes(normalizeTitle(identity.original)))continue;
      page=candidate;binding=identity;break;
    }
    if(page||http.expired())break;
  }
  if(!page||http.expired())return [];
  const headers={Referer:ORIGIN+'/'},found=[];
  async function post(values){
    // The public endpoint labels its JSON as text/html. Parse only this
    // exact endpoint and a bounded complete JSON response, not HTML scripts.
    const r=await http.text(ORIGIN+'/ajax/get_cdn_series/?t='+Date.now(),{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'},body:Object.entries(values).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'),maxChars:300000});
    if(!r||new URL(r.url).origin!==ORIGIN||new URL(r.url).pathname!=='/ajax/get_cdn_series/')return null;
    try{return JSON.parse(r.text);}catch{return null;}
  }
  for(const version of translations(page.text,binding.id,target)){
    if(http.expired())break;
    const base={id:binding.id,translator_id:version.id};
    if(target.type==='tv'){
      const list=await post({...base,action:'get_episodes'});
      if(list?.success!==true||typeof list.episodes!=='string'||list.episodes.length>300000||!exactEpisode(list.episodes,binding.id,target))continue;
    }
    const data=await post({...base,...(target.type==='tv'?{season:target.season,episode:target.episode,action:'get_stream'}:{is_camrip:0,is_ads:0,is_director:0,action:'get_movie'})});
    const subtitles=pairedSubtitles(data||{},target,headers);
    for(const variant of fileVariants(data))found.push({url:variant.url,headers,source:'HDRezka',identity:target,identityConfidence:100,
      filename:syntheticFilename(target).replace(/\.mkv$/i,'.mp4'),filenameSynthetic:true,claimedQuality:variant.label,
      claimedAudioLanguages:version.language?[version.language]:[],requireDuration:true,durationTolerance:0.1,subtitles});
  }
  return found;
}
module.exports={scanHdRezka,searchPages,pageIdentity,translations,exactEpisode,fileVariants,pairedSubtitles};
