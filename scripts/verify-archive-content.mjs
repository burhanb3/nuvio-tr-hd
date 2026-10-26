import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,isAbsolute} from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fingerprintFrames,compareSequences,compareSamples} from './content-fingerprint.mjs';
const require=createRequire(import.meta.url),{createHttp}=require('../src/http.cjs');
const {scanPlayImdb}=require('../src/providers/playimdb.cjs'),{probe}=require('../src/media/probe.cjs');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const at=arg.indexOf('=');return [arg.slice(2,at),arg.slice(at+1)];}));
const {titles}=JSON.parse(await readFile(new URL('../validation/titles.json',import.meta.url),'utf8'));
const entry=titles.find(t=>t.key===args.title);
if(!entry||!args.item||!args.file||!args.ffmpeg)throw new Error('Required: --title=validation-key --item=archive-item --file=exact-file --ffmpeg=absolute-executable-path');
if(!/^[\w.-]+$/.test(args.item)||args.file.split('/').some(p=>!p||p==='..'||p==='.')||args.file.includes('\\'))throw new Error('Invalid Archive item/file');
if(!isAbsolute(args.ffmpeg))throw new Error('FFmpeg path must be absolute');
const crop=Number(args.crop||.6);if(![.4,.6].includes(crop))throw new Error('Crop must be 0.4 or 0.6');
const referenceFps=Number(args['reference-fps']||25);if(![2,8,25].includes(referenceFps))throw new Error('Reference FPS must be 2, 8 or 25');
const starts=(args.samples||'180,900').split(',').map(Number);
if(starts.length<2||starts.length>3||starts.some(n=>!Number.isInteger(n)||n<60)||new Set(starts).size!==starts.length)throw new Error('Provide two or three independent sample times >=60');
const output=args.output||'.cache/content-'+entry.key+'.json';
if(!/^\.cache\/[\w.-]+\.json$/.test(output))throw new Error('Report must be a JSON file directly inside .cache');
const m=entry.tmdb,type=m.original_name?'tv':'movie';
const target={tmdbId:m.id,originalTitle:m.original_title||m.original_name,year:Number((m.release_date||m.first_air_date).slice(0,4)),type,
 imdbId:m.imdb_id||m.external_ids?.imdb_id,runtimeMinutes:m.runtime||m.episode_run_time?.[0],...(type==='tv'?{season:entry.season,episode:entry.episode}:{})};
const http=createHttp({deadline:Date.now()+30000});let archive,reference;
try{
 const meta=await http.json('https://archive.org/metadata/'+args.item);
 if(!meta?.metadata||meta.metadata.is_dark||meta.metadata.access_restricted==='true')throw new Error('Archive item unavailable/restricted');
 const file=meta.files?.find(f=>f.name===args.file&&f.private!=='true');
 if(!file||!/^\/(?:\d+)\/items\/[\w.-]+$/.test(meta.dir)||!meta.dir.endsWith('/items/'+args.item)||!/^[a-z]{2}\d{4,8}\.(?:us|eu|ca)\.archive\.org$/.test(meta.d1))throw new Error('Official Archive file/replica metadata unavailable');
 const url='https://'+meta.d1+meta.dir+'/'+args.file.split('/').map(encodeURIComponent).join('/');
 const video=await probe(http,{url,headers:{},getOnly:true,requireDuration:true,source:'Internet Archive'},false,true);
 if(!video?.videoHash||!video.dimensions||!video.duration)throw new Error('Measured file hash/pixels/duration required');
 if(starts.some(n=>n+20>video.duration))throw new Error('Sample is outside the actual file duration');
 archive={url,video,file,meta};
 for(const candidate of await scanPlayImdb(http,target)){
  const video=await probe(http,candidate,true,false,{detailedHls:false});
  if(video?.container==='hls'){
   const rendition=video.renditions?.slice().sort((a,b)=>a.dimensions.width-b.dimensions.width)[0];
   reference={candidate,url:rendition?.url||video.url};break;
  }
 }
 if(!reference)throw new Error('Independent canonical reference unavailable');
}finally{http.close();}
const jobId=randomUUID(),work=resolve('.cache','content-job-'+jobId);await mkdir(work,{recursive:true});
async function extract(url,headers,start,duration,name,fps=2){
 const file=resolve(work,name+'.gray');
 const header=Object.entries(headers||{}).map(([k,v])=>k+': '+v+'\r\n').join('');
 const command=['-hide_banner','-loglevel','error','-nostdin','-rw_timeout','10000000','-protocol_whitelist','http,https,tcp,tls,crypto',
 ...(header?['-headers',header]:[]),'-ss',String(start),'-i',url,'-an','-sn','-t',String(duration),'-vf',`fps=${fps},scale=iw*sar:ih,setsar=1,crop=iw*${crop}:iw*${crop}*9/16,scale=9:8:flags=area,format=gray`,
 '-threads','2','-filter_threads','1','-f','rawvideo','-y',file];
 await new Promise((accept,reject)=>{
  const child=spawn(args.ffmpeg,command,{windowsHide:true,stdio:['ignore','ignore','pipe']});let errors='';
  child.stderr.on('data',chunk=>{errors=(errors+chunk).slice(-8000);});
  const timer=setTimeout(()=>child.kill(),90000);
  child.once('error',error=>{clearTimeout(timer);reject(error);});
  child.once('close',async code=>{clearTimeout(timer);if(code===0)return accept();
   // FFmpeg errors may contain expiring media URLs. Keep them in ignored local
   // research files, never in the console or committed evidence.
   try{await writeFile(resolve(work,name+'-stderr.txt'),errors);}catch{}
   reject(new Error('FFmpeg extraction failed ('+name+', status '+code+'); local stderr retained'));
  });
 });
 return fingerprintFrames(await readFile(file));
}
const samples=[];
for(const start of starts){
 const a=await extract(archive.url,{},start,20,'archive-'+start);
 const b=await extract(reference.url,reference.candidate.headers,start-60,140,'reference-'+start,referenceFps);
 const sample={startSeconds:start,referenceWindowStartSeconds:start-60,referenceWindowDurationSeconds:140,frames:a.frames.length,
  archiveFrameBytesSha256:a.sha256,referenceFrameBytesSha256:b.sha256,comparison:compareSequences(a.frames,b.frames,{fps:2,referenceFps})};
 samples.push(sample);console.log(JSON.stringify({sample:start,matched:sample.comparison.matched,best:sample.comparison.alignments[0]}));
}
const result=compareSamples(samples),video=archive.video;
const proof={checkedAt:new Date().toISOString(),jobId,temporaryFilesIsolatedByRun:true,target,canonicalReferenceProvider:reference.candidate.source,
 archiveItem:args.item,archiveFile:args.file,bytes:video.size,opensubtitlesHash:video.videoHash,dimensions:video.dimensions,duration:video.duration,audioLanguages:video.audioLanguages||[],
 archiveMetadataSha1:archive.file.sha1,archiveOriginal:archive.file.original||null,archiveMetadataYear:archive.meta.metadata.year||null,archiveMetadataDate:archive.meta.metadata.date||null,
 cropWidthFraction:crop,cropAspect:'16:9 by display width after square-pixel normalization; avoids letterbox height mismatches',archiveSampleFps:2,referenceSampleFps:referenceFps,samples,contentSamplesMatch:result.matched,estimatedReferenceRate:result.estimatedReferenceRate||null,
 method:'Independent moving center-cropped sequential dHash samples from a canonical TMDB/IMDb/episode-bound HLS; dark/static samples rejected. Content identification evidence only; not full-film verification or subtitle sync.',
 fullPlayback:'not-run',fullDownload:'not-run',subtitleSync:'not-run',deviceTest:'not-run',hashScope:'OpenSubtitles noncryptographic edge hash measured; metadata SHA-1 not computed from a full local download'};
await writeFile(output,JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify({report:output,contentSamplesMatch:proof.contentSamplesMatch}));
if(!proof.contentSamplesMatch)process.exitCode=1;
