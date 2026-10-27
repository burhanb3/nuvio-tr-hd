import { createRequire } from 'node:module';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { summarizeCoverage } from './coverage-model.mjs';
const require=createRequire(import.meta.url),{createProvider}=require('../src/index.cjs');
const config=JSON.parse(await readFile(new URL('../validation/titles.json',import.meta.url),'utf8'));
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const requested=process.argv.find(a=>a.startsWith('--titles='))?.slice(9).split(',');
const titles=config.titles.filter(t=>!requested||requested.includes(t.key));
if(!titles.length||requested?.some(k=>!config.titles.some(t=>t.key===k)))throw new Error('Unknown validation title');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)||'.cache/coverage-live.json';
if(!/^\.cache\/[a-zA-Z0-9._-]+\.json$/.test(output))throw new Error('Only .cache report paths are supported');
const report={checkedAt:new Date().toISOString(),version:pkg.version,metadata:config.metadataMode,acceptance:config.acceptance,
  transport:'Node limited1MiB, actual source and subtitle HTTP; native iPhone transport not tested',physicalDevice:'not-run',fullPlayback:'not-run',fullDownload:'not-run',cases:[]};
await mkdir('.cache',{recursive:true});
for(const entry of titles){
 const reference=entry.tmdb,type=reference.original_name?'tv':'movie';let bytesRead=0;
 const transport=async(url,options={})=>{
  if(url.startsWith(`https://api.themoviedb.org/3/${type}/${reference.id}?`))return{ok:true,status:200,url,headers:{get:n=>n==='content-type'?'application/json':null},text:async()=>JSON.stringify(reference)};
  if(url.startsWith(`https://api.themoviedb.org/3/${type}/${reference.id}/translations?`))return{ok:true,status:200,url,headers:{get:n=>n==='content-type'?'application/json':null},text:async()=>JSON.stringify({id:reference.id,translations:(entry.translations||[]).map(r=>({iso_639_1:r.language,data:{[type==='tv'?'name':'title']:r.title}}))})};
  const response=await fetch(url,{...options,signal:AbortSignal.any([options.signal,AbortSignal.timeout(10000)].filter(Boolean))});
  const reader=response.body?.getReader(),chunks=[];let size=0;
  if(reader)try{while(true){const{done,value}=await reader.read();if(done)break;if(size+value.length>1048576){await reader.cancel();break;}chunks.push(Buffer.from(value));size+=value.length;}}finally{reader.releaseLock();}
  bytesRead+=size;const body=Buffer.concat(chunks);
  return{ok:response.ok,status:response.status,url:response.url,headers:response.headers,text:async()=>body.toString('utf8'),arrayBuffer:async()=>Uint8Array.from(body).buffer};
 };
 const started=Date.now(),providers=[createProvider({lane:'main',tmdbKey:'fixed-reference',fetchImpl:transport}),createProvider({lane:'fastOnline',budgetMs:8000,tmdbKey:'fixed-reference',fetchImpl:transport})];
 if(reference.original_language==='ja')providers.push(createProvider({lane:'anime',budgetMs:20000,tmdbKey:'fixed-reference',fetchImpl:transport}));
 await Promise.all(providers.map(p=>p.getStreams(reference.id,type,entry.season,entry.episode)));
 const result={key:entry.key,tmdbId:reference.id,title:reference.original_title||reference.original_name,type,
  ...(type==='tv'?{season:entry.season,episode:entry.episode}:{}),control:!!entry.control,
  elapsedMs:Date.now()-started,bytesRead,diagnostics:providers.map(p=>p.getReport()),...summarizeCoverage(providers.flatMap(p=>p.getPairs()),config.acceptance,type)};
 report.cases.push(result);await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({title:entry.key,ms:result.elapsedMs,files:result.estimatedDistinctFiles,smallWithTr:result.smallWithTr,qualities:result.downloadQualities,gaps:result.gaps}));
}
report.finishedAt=new Date().toISOString();report.allSourceCriteriaMet=report.cases.every(c=>c.sourceCoverageCriteriaMet);
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({report:output,cases:report.cases.length,allSourceCriteriaMet:report.allSourceCriteriaMet,deviceTest:'not-run'}));
if(process.argv.includes('--require-all')&&!report.allSourceCriteriaMet)process.exitCode=1;
