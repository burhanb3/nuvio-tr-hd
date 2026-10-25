import { createRequire } from 'node:module';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {createProvider}=require('../src/index.cjs');
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const references={
 night:{id:10331,original_title:'Night of the Living Dead',release_date:'1968-10-04',imdb_id:'tt0063350',runtime:96},
 dune:{id:438631,original_title:'Dune',release_date:'2021-09-15',imdb_id:'tt1160419',runtime:155},
 'spider-man':{id:969681,original_title:'Spider-Man: Brand New Day',release_date:'2026-07-31',imdb_id:'tt22084616',runtime:145},
 got:{id:1399,original_name:'Game of Thrones',first_air_date:'2011-04-17',external_ids:{imdb_id:'tt0944947'},episode_run_time:[60],poster_path:'/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg'},
 fleabag:{id:67070,original_name:'Fleabag',first_air_date:'2016-07-21',external_ids:{imdb_id:'tt5687612'},episode_run_time:[26],poster_path:'/27vEYsRKa3eAniwmoccOoluEXQ1.jpg'}
};
const selection=process.argv.find(arg=>arg.startsWith('--film='))?.slice(7)||'night';
const reference=references[selection];
if(!reference)throw new Error('--film=night, dune, spider-man, got veya fleabag kullanın');
const mediaType=reference.original_name?'tv':'movie';
const season=Number(process.argv.find(a=>a.startsWith('--season='))?.slice(9)||1);
const episode=Number(process.argv.find(a=>a.startsWith('--episode='))?.slice(10)||1);
let bytesRead=0;
async function transport(url,options={}){
 if(url.startsWith(`https://api.themoviedb.org/3/${mediaType}/${reference.id}?`))return{
  ok:true,status:200,url,headers:{get:name=>name==='content-type'?'application/json':null},
  text:async()=>JSON.stringify(reference)};
 const response=await fetch(url,{...options,signal:AbortSignal.any([options.signal,AbortSignal.timeout(10000)].filter(Boolean))});
 const reader=response.body?.getReader();const chunks=[];let size=0;
 if(reader)try{while(true){const{done,value}=await reader.read();if(done)break;if(size+value.length>1048576){await reader.cancel();break;}chunks.push(Buffer.from(value));size+=value.length;}}finally{reader.releaseLock();}
 bytesRead+=size;const b=Buffer.concat(chunks);
 return{ok:response.ok,status:response.status,url:response.url,headers:response.headers,text:async()=>b.toString('utf8'),arrayBuffer:async()=>Uint8Array.from(b).buffer};
}
const provider=createProvider({tmdbKey:'fixed-reference-metadata',fetchImpl:transport});
const start=Date.now();const streams=await provider.getStreams(reference.id,mediaType,mediaType==='tv'?season:undefined,mediaType==='tv'?episode:undefined);
const report={checkedAt:new Date().toISOString(),version:pkg.version,film:selection,metadata:'fixed known TMDB reference; upstream source/subtitle requests are live',elapsedMs:Date.now()-start,bytesRead,settings:'GitHub production defaults; 24s logical budget; all resolutions; prefer Turkish; balanced subtitle matching; HLS enabled; up to 20; public download bridge enabled',diagnostic:provider.getReport(),streams:streams.map(s=>({name:s.name,quality:s.quality,type:s.type,size:s.size,subtitles:s.subtitles.map(t=>({name:t.name,language:t.language}))})),deviceTest:'not-run'};
await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});
const filename=selection==='night'?'pipeline-live-report.json':`pipeline-${selection}-report.json`;
await writeFile(new URL('../.cache/'+filename,import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!streams.length)process.exitCode=1;
