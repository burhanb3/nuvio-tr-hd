'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {createHttp}=require('../src/http.cjs');const {probe}=require('../src/media/probe.cjs');const {registerDownloads}=require('../src/hosted.cjs');
const {fixtureFetch,mp4,mkv,target}=require('./helpers.cjs');
test('Dosya doğrulaması ayrı HEAD beklemeden gerçek Range GET ile yapılır; 403 zorlanmaz',async()=>{
 const calls=[],url='https://media.test/video.mp4';
 const http=createHttp({fetchImpl:async(u,o)=>{calls.push(o.method||'GET');if(o.method==='HEAD')throw Error('HEAD must not run');return fixtureFetch({[url]:{body:mp4(),mime:'video/mp4'}})(u,o);}});
 try{const video=await probe(http,{url,headers:{}});assert.equal(video.downloadable,true);assert.deepEqual(calls,['GET']);}
 finally{http.close();}
 const deniedCalls=[],denied=createHttp({fetchImpl:fixtureFetch({[url]:{status:403}},deniedCalls)});
 try{assert.equal(await probe(denied,{url,headers:{}}),null);assert.equal(deniedCalls.length,1);}
 finally{denied.close();}
});
test('Kaynağın MP4 dediği uzantısız dosya MKV köprüsünü beklemez; gerçek MKV/HTML/HLS MP4 yapılmaz',async()=>{
 const url='https://storage.test/object',candidate={url,filename:'The.Matrix.1999.mp4',headers:{},subtitles:[],identity:target};
 const untouched={json:()=>{throw Error('Optional bridge must not be called');}};
 assert.deepEqual(await registerDownloads(untouched,[candidate],target),[candidate]);
 for(const [body,mime,allowed]of[[mp4(),'video/mp4',true],[mkv(),'video/x-matroska',false],['<html>Error</html>','text/html',false],['#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nfile.ts\n','application/vnd.apple.mpegurl',false]]){
  const http=createHttp({fetchImpl:fixtureFetch({[url]:{body,mime}})});
  try{const video=await probe(http,candidate,true);assert.equal(!!video,allowed);if(video)assert.equal(video.container,'mp4');}
  finally{http.close();}
 }
});
test('Native abort yok sayıldığında bitmemiş dosya GET sayısı üçü geçmez, iç kota fetch seçeneklerine sızmaz',async()=>{
 let active=0,maximum=0,started=0,release;const gate=new Promise(r=>release=r);
 const http=createHttp({deadline:Date.now()+130,timeoutMs:25,fetchImpl:async(u,options)=>{
  assert.equal(options.nativeGroup,undefined);started++;active++;maximum=Math.max(maximum,active);await gate;active--;
  return{ok:false,status:404,headers:{get:()=>null}};
 }});
 try{await Promise.all(Array.from({length:12},(_,i)=>http.bytes('https://media.test/'+i+'.mp4',{})));
  assert.equal(started,3);assert.equal(active,3);assert.equal(maximum,3);
 }finally{http.close();release();}
});
