'use strict';
const {safeUrl}=require('../util.cjs');
const {anchors,decodeEntities,filenameIdentity}=require('./directory.cjs');
const {tagAttributes,sameName}=require('./page-data.cjs');
const {matchesEpisode}=require('../matching.cjs');
const ORIGIN='https://ww1.goojara.to',WRAPPER='https://www.wootly.ch',PLAYER='https://web.wootly.ch';

function titleAndYear(value,target){
  const match=decodeEntities(value).match(/^(.+?)\s*\((\d{4})\)\s*$/);
  return !!match&&Number(match[2])===target.year&&sameName(match[1],target);
}
function searchRows(html,target){
  const kind=target.type==='movie'?'m':'t';
  return anchors(String(html),80).filter(a=>new RegExp('^/'+kind+'[A-Za-z0-9]{4,12}$').test(a.href)&&titleAndYear(a.text,target)).slice(0,2);
}
function parentMatches(html,target){
  const heading=String(html).match(/class=["']marl["']>\s*<h1\b[^>]*>([\s\S]{0,500}?)<\/h1>/i)?.[1];
  if(!heading||!titleAndYear(heading,target))return false;
  const id=String(html).match(/\bdata-ubv=["'](tt\d+)(?:,\d+,\d+)?["']/)?.[1];
  return target.type==='movie'?!!target.imdbId&&id===target.imdbId:!id||!target.imdbId||id===target.imdbId;
}
function seasonEpisode(html,target){
  for(const block of String(html).split('<div class="seho">').slice(1,100)){
    const number=Number(block.match(/class=["']sea["']>\s*(\d+)/)?.[1]);
    const season=Number(block.match(/\bSeason\s+(\d+)\b/i)?.[1]);
    if(number!==target.episode||season!==target.season)continue;
    return anchors(block.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'').find(a=>/^\/e[A-Za-z0-9]{4,12}$/.test(a.href))?.href||null;
  }
  return null;
}
function episodeMatches(html,parentPath,target){
  const heading=decodeEntities(String(html).match(/class=["']marl["']>\s*<h1\b[^>]*>([\s\S]{0,800}?)<\/h1>/i)?.[1]||'');
  const match=heading.match(/^(.+?)\s+S(\d+),\s*E(\d+)\s*-/);
  if(!match||!sameName(match[1],target)||Number(match[2])!==target.season||Number(match[3])!==target.episode)return false;
  return anchors(String(html).match(/<div\b[^>]*id=["']wai["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]||'')
    .some(a=>{const url=safeUrl(a.href,ORIGIN);return url&&new URL(url).origin===ORIGIN&&new URL(url).pathname===parentPath&&new URL(url).searchParams.get('s')===String(target.season);});
}
function releaseMatches(name,target){
  return [target.originalTitle,...(target.searchTitles||[])].some(title=>filenameIdentity(name,{...target,originalTitle:title},target.type==='movie'))&&
    (target.type!=='tv'||matchesEpisode(name,target));
}
function publicPlayerData(html){
  const text=String(html),id=text.match(/\bvar\s+vd=["']([A-Za-z0-9_-]{1,100})["']/)?.[1],token=text.match(/\btk=["']([A-Za-z0-9_-]{1,200})["']/)?.[1];
  return id&&token?{id,token}:null;
}
async function scanGoojara(http,target){
  if(!['movie','tv'].includes(target.type))return [];
  // The public site issues an anonymous session and a per-page nonce. Keep
  // them inside this search; never use user cookies or run a remote script.
  let session='',nonceCookie='';
  async function page(url,body,referer=ORIGIN+'/watch-movies',toPlayer=false){
    const address=safeUrl(url,ORIGIN);if(!address||new URL(address).origin!==ORIGIN||http.expired())return null;
    const cookie=[session,nonceCookie].filter(Boolean).join('; ');
    const r=await http.request(address,{headers:{Referer:referer,...(cookie?{Cookie:cookie}:{}),
      ...(body?{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'}:{})},
      ...(body?{method:'POST',body}:{}),...(toPlayer?{publicCookieRedirectOrigin:WRAPPER}:{})});
    if(!r||![ORIGIN,...(toPlayer?[WRAPPER]:[])].includes(new URL(r.url).origin))return null;
    const text=await r.response.text();if(!text||text.length>200000||text.endsWith('...[truncated]'))return null;
    if(new URL(r.url).origin===ORIGIN){
      const value=(r.response.headers.get('set-cookie')||'').match(/(?:^|,\s*)((?:aGooz|aession|PHPSESSID)=[A-Za-z0-9_-]{1,160})(?:[;,]|$)/i)?.[1];
      if(value)session=value;
      const nonce=text.match(/_3chk\('([a-f0-9]{6,32})','([a-f0-9]{8,100})'\)/);
      if(nonce)nonceCookie=nonce[1]+'='+nonce[2];
    }
    return{text,url:r.url};
  }
  const home=await page('/watch-movies'),searchKey=home?.text.match(/"x=([a-f0-9]{6,64})&q="/)?.[1];
  if(!searchKey||!session||!nonceCookie)return [];
  let parent,parentPath;
  for(const name of [...new Set([target.originalTitle,...(target.searchTitles||[])])].slice(0,2)){
    const search=await page('/xmre.php','x='+encodeURIComponent(searchKey)+'&q='+encodeURIComponent(name));
    for(const row of search?searchRows(search.text,target):[]){
      const detail=await page(row.href);
      if(detail&&parentMatches(detail.text,target)){parent=detail;parentPath=row.href;break;}
      if(http.expired())break;
    }
    if(parent||http.expired())break;
  }
  if(!parent||http.expired())return [];
  let detail=parent;
  if(target.type==='tv'){
    const showId=parent.text.match(/\bid=["']seon["']\s+data-id=["'](\d{1,12})["']/)?.[1];
    if(!showId||!new RegExp('data-season=["\']'+target.season+'["\']').test(parent.text))return [];
    const list=await page('/xmre.php','s='+target.season+'&t='+showId,parent.url),path=list&&seasonEpisode(list.text,target);
    detail=path&&await page(path);
    if(!detail||!episodeMatches(detail.text,parentPath,target))return [];
  }
  const link=anchors(detail.text,500).find(a=>/^Wootly(?:\s|$)/i.test(a.text)&&a.href.startsWith(ORIGIN+'/go.php?url='));
  if(!link)return [];
  const wrapper=await page(link.href,undefined,detail.url,true);
  const filename=wrapper&&decodeEntities(wrapper.text.match(/<title\b[^>]*>([\s\S]{0,600}?)<\/title>/i)?.[1]||'');
  if(!filename||!releaseMatches(filename,target))return [];
  const iframe=wrapper.text.match(/<iframe\b[^>]*>/i),embed=iframe&&safeUrl(tagAttributes(iframe[0]).src);
  if(!embed||new URL(embed).origin!==PLAYER||!/^\/e\/[A-Za-z0-9_/-]+$/.test(new URL(embed).pathname))return [];
  let player=await http.text(embed,{headers:{Referer:wrapper.url}});
  if(!player||/cf-turnstile|g-recaptcha|h-captcha/.test(player.text))return [];
  if(/<form\b[^>]*id=["']jgb["'][^>]*>\s*<input\b[^>]*name=["']qdfx["'][^>]*value=["']1["']/.test(player.text))
    player=await http.text(embed,{method:'POST',headers:{Referer:embed,'Content-Type':'application/x-www-form-urlencoded'},body:'qdfx=1'});
  const data=player&&publicPlayerData(player.text);if(!data||http.expired())return [];
  const grab=await http.text(PLAYER+'/grabm?t='+encodeURIComponent(data.token)+'&id='+encodeURIComponent(data.id),{headers:{Referer:embed}});
  const url=grab&&safeUrl(grab.text.trim());
  if(!url||new URL(url).origin!==PLAYER||new URL(url).pathname!=='/source')return [];
  return[{url,source:'Goojara',headers:{Referer:PLAYER+'/'},identity:target,identityConfidence:target.type==='movie'?100:90,
    filename,requireDuration:true,durationTolerance:0.1,subtitles:[],
    ...(/\b(?:hcsubs?|hardsub(?:bed|s)?|hardcodedsubs?)\b/i.test(filename)?{burnedSubtitleLanguage:'und',burnedSubtitleBasis:'release-name'}:{})}];
}
module.exports={scanGoojara,titleAndYear,searchRows,parentMatches,seasonEpisode,episodeMatches,releaseMatches,publicPlayerData};
