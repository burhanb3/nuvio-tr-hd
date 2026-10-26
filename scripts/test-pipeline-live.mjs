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
 fleabag:{id:67070,original_name:'Fleabag',first_air_date:'2016-07-21',external_ids:{imdb_id:'tt5687612'},episode_run_time:[26],poster_path:'/27vEYsRKa3eAniwmoccOoluEXQ1.jpg'},
 shameless:{id:34307,original_name:'Shameless',first_air_date:'2011-01-09',external_ids:{imdb_id:'tt1586680'},episode_run_time:[57]},
 'death-note':{id:13916,name:'Death Note',original_name:'DEATH NOTE',first_air_date:'2006-10-04',external_ids:{imdb_id:'tt0877057'},episode_run_time:[23],original_language:'ja',genres:[{id:16}]},
 aot:{id:1429,name:'Attack on Titan',original_name:'進撃の巨人',first_air_date:'2013-04-07',external_ids:{imdb_id:'tt2560140'},episode_run_time:[24],original_language:'ja',genres:[{id:16}]}
};
const selection=process.argv.find(arg=>arg.startsWith('--film='))?.slice(7)||'night';
const reference=references[selection];
if(!reference)throw new Error('--film=night, dune, spider-man, got, fleabag, death-note veya aot kullanın');
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
const selectedLane=process.argv.find(arg=>arg.startsWith('--lane='))?.slice(7);
const start=Date.now(), lanes=selectedLane?[selectedLane]:['main','anime'];
const completed=await Promise.all(lanes.map(async lane=>{
 const provider=createProvider({lane,tmdbKey:'fixed-reference-metadata',fetchImpl:transport,budgetMs:lane==='main'?24000:lane==='online'?16000:lane==='anime'?20000:28000});
 const streams=await provider.getStreams(reference.id,mediaType,mediaType==='tv'?season:undefined,mediaType==='tv'?episode:undefined);
 const elapsedMs=Date.now()-start;console.log(JSON.stringify({completedLane:lane,elapsedMs,results:streams.length}));
 return{lane,elapsedMs,diagnostic:provider.getReport(),streams:streams.map(s=>({name:s.name,quality:s.quality,type:s.type,size:s.size,language:s.language,subtitles:s.subtitles.map(t=>({name:t.name,language:t.language}))}))};
}));
const report={checkedAt:new Date().toISOString(),version:pkg.version,film:selection,metadata:'fixed known TMDB reference; upstream source/subtitle requests are live',elapsedMs:Date.now()-start,firstResultsMs:Math.min(...completed.filter(l=>l.streams.length).map(l=>l.elapsedMs)),bytesRead,settings:'Combined main24s + anime20s; all resolutions; prefer TR; balanced; HLS; up to20 per scraper; public bridge enabled; legacy diagnostic online/files lanes optional',lanes:completed,streams:completed.flatMap(l=>l.streams),deviceTest:'not-run'};
await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});
const filename=selection==='night'?'pipeline-live-report.json':`pipeline-${selection}-report.json`;
await writeFile(new URL('../.cache/'+filename,import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.streams.length)process.exitCode=1;
