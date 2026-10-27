'use strict';
const {safeUrl,normalizeTitle}=require('../util.cjs');
const {anchors}=require('./directory.cjs');
function pixelPage(html){
  const literal=String(html).match(/\bvar\s+pxl\s*=\s*["']([^"']{1,300})["']/)?.[1];
  const links=literal?[literal]:anchors(String(html)).filter(a=>/Pixel(?:drain|Server)/i.test(a.text)).map(a=>a.href);
  return links.map(s=>safeUrl(s)).find(url=>url&&/^https:\/\/pixeldrain\.(?:com|dev|net)\/u\/[A-Za-z0-9]{8,12}$/.test(url))||null;
}
function publicFile(data,page,hubName,target,{matchesName,normalizeName=normalizeTitle,source}){
  if(typeof matchesName!=='function'||!/^https:\/\/pixeldrain\.(?:com|dev|net)\/u\/[A-Za-z0-9]{8,12}$/.test(page||''))return null;
  const u=new URL(page),id=u.pathname.split('/').pop();
  const container=/^video\/(?:x-)?matroska$/.test(data?.mime_type||'')?'mkv':data?.mime_type==='video/mp4'?'mp4':null;
  if(!data||data.success!==true||data.id!==id||data.can_download!==true||data.availability||data.abuse_type||
    !Number.isSafeInteger(data.size)||data.size<1000000||!container||!matchesName(data.name,target)||
    normalizeName(data.name)!==normalizeName(hubName))return null;
  return {url:u.origin+'/api/file/'+id,filename:data.name,headers:{},subtitles:[],source,
    identity:target,identityConfidence:95,expectedSize:data.size,expectedContainer:container,allowExtensionlessMkv:container==='mkv',
    requireAudioAny:[...new Set(['tr','en',...(/^[a-z]{2}$/.test(target.originalLanguage||'')&&target.originalLanguage!=='hi'?[target.originalLanguage]:[])])],
    requireVideoDimensions:true,requireDuration:true,durationTolerance:0.1};
}
module.exports={pixelPage,publicFile};
