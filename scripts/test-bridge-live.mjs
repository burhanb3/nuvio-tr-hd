import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {SERVICE_ORIGIN,registerDownloads}=require('../src/hosted.cjs');
const {inspectContainer}=require('../src/media/containers.cjs');
const {createHttp}=require('../src/http.cjs');
const {scanHdHub}=require('../src/providers/hdhub.cjs');
const targets=[
 {tmdbId:969681,type:'movie',originalTitle:'Spider-Man: Brand New Day',year:2026,imdbId:'tt22084616',runtimeMinutes:145},
 {tmdbId:438631,type:'movie',originalTitle:'Dune',year:2021,imdbId:'tt1160419',runtimeMinutes:155}
];
const reports=[];
for(const target of targets){
 const start=Date.now();
 const http=createHttp({deadline:Date.now()+25000});
 let candidates,registered;
 try{candidates=await scanHdHub(http,target,{allowExtensionless:true});registered=await registerDownloads(http,candidates,target);}finally{http.close();}
 const report={checkedAt:new Date().toISOString(),version:'1.4.0',target,elapsedMs:Date.now()-start,
  metadata:'fixed known TMDB reference; local source discovery and live public bridge registration',candidates:candidates.length,registered:registered.length,
  files:registered.map(c=>({source:c.source,filename:c.filename})),
  deviceTest:'not-run',fullPlayback:'not-run',fullDownload:'not-run'};
 const direct=registered.find(c=>c.downloadAlias);
 if(direct){
  const head=await fetch(direct.downloadAlias,{method:'HEAD',signal:AbortSignal.timeout(10000)});
  const range=await fetch(direct.downloadAlias,{headers:{...direct.headers,Range:'bytes=0-131071'},signal:AbortSignal.timeout(10000)});
  const reader=range.body.getReader(),chunks=[];let count=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;if(count+value.length>131072){await reader.cancel();throw Error('Range ignored; sample aborted');}chunks.push(value);count+=value.length;}}finally{reader.releaseLock();}
  const bytes=Buffer.concat(chunks),info=inspectContainer(bytes);
  report.downloadAliasCheck={headStatus:head.status,headSize:Number(head.headers.get('content-length')),headMime:head.headers.get('content-type'),rangeStatus:range.status,contentRange:range.headers.get('content-range'),bytesRead:bytes.length,container:info?.container,dimensions:info?.dimensions,redirected:range.redirected};
  if(head.status!==200||range.status!==206||info?.container!=='mkv'){console.error(JSON.stringify(report.downloadAliasCheck));throw Error('Alias validation failed');}
 }
 const again=createHttp({deadline:Date.now()+10000});
 try{report.repeatedRegistration={registered:(await registerDownloads(again,candidates,target)).length};}finally{again.close();}
 reports.push(report);console.log(JSON.stringify(report));
 if(target.tmdbId===969681&&!report.downloadAliasCheck)process.exitCode=1;
}
await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});
await writeFile(new URL('../.cache/bridge-live-report.json',import.meta.url),JSON.stringify(reports,null,2)+'\n');
