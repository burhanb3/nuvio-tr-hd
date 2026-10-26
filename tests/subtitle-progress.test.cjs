'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{createHttp}=require('../src/http.cjs'),{createProvider}=require('../src/index.cjs');
const{loadSubtitles}=require('../src/subtitles.cjs'),{createSubtitleDiscovery}=require('../src/subtitle-discovery.cjs');
const{target,fixtureFetch,makeFixture,srt,vtt}=require('./helpers.cjs');
test('Hızlı altyazı servis grubu yavaş JSON sonucunu beklemeden doğrulamaya geçer',async()=>{
 let release,ready,finished=false;const gate=new Promise(r=>release=r),first=new Promise(r=>ready=r);
 const http={expired:()=>false,json:async url=>{if(url.startsWith('https://slow.test')){await gate;return null;}return{subtitles:[{language:'tr',releaseName:'The.Matrix.1999.1080p',url:'https://subs.test/tr.srt'}]};}};
 const discovery=createSubtitleDiscovery(http,target,{subtitleUrls:'https://slow.test https://fast.test'});
 const work=discovery({url:'https://media.test/film.mp4',filename:'The.Matrix.1999.1080p.mp4'},{},{onBatch:rows=>{assert.equal(rows.length,1);ready();}}).then(rows=>{finished=true;return rows;});
 try{await first;assert.equal(finished,false);}finally{release();assert.equal((await work).length,1);}
});
test('Hızlı geçerli SRT aynı gruptaki takılan VTT gövdesinden önce korunur',async()=>{
 let release,ready,finished=false;const gate=new Promise(r=>release=r),first=new Promise(r=>ready=r);
 const fixture={'https://subs.test/fast.srt':{body:srt,mime:'text/plain'},'https://subs.test/slow.vtt':{body:vtt,mime:'text/vtt'}},fetcher=fixtureFetch(fixture);
 const http=createHttp({fetchImpl:async(url,options)=>{if(url.includes('slow.vtt'))await gate;return fetcher(url,options);}});
 const candidate={headers:{},subtitles:[{url:'https://subs.test/fast.srt',language:'tr'},{url:'https://subs.test/slow.vtt',language:'tr'}]};
 const work=loadSubtitles(http,candidate,target,false,{onTrack:track=>{if(track.url.includes('fast.srt'))ready();}}).then(rows=>{finished=true;return rows;});
 try{await first;assert.equal(finished,false);}finally{release();assert.equal((await work).length,2);http.close();}
});
test('Zorunlu TR modunda hızlı doğrulanan altyazı süre sonunda yavaş servis yüzünden kaybolmaz',async()=>{
 let release;const gate=new Promise(r=>release=r),fixture=makeFixture({extra:{
 'https://fast.test/subtitles/movie/tt0133093.json':{json:{subtitles:[{language:'tr',releaseName:'The.Matrix.1999.1080p.mp4',url:'https://subs.test/fast.srt'}]}},
 'https://subs.test/fast.srt':{body:srt,mime:'text/plain'}}}),fetcher=fixtureFetch(fixture);
 const provider=createProvider({tmdbKey:'test',budgetMs:500,settings:{playImdbEnabled:false,vixsrcEnabled:false,hdhubEnabled:false,archiveEnabled:false,useDownloadBridge:false,subtitlePolicy:'require',subtitleUrls:'https://slow.test https://fast.test'},
 fetchImpl:async(url,options)=>{if(url.startsWith('https://slow.test'))await gate;return fetcher(url,options);},
 sourceFactories:[{name:'Fixture',run:async()=>[{url:'https://media.test/movie.mp4',filename:'The.Matrix.1999.1080p.mp4',identity:target,headers:{},subtitles:[],source:'Fixture'}]}]});
 try{const results=await provider.getStreams(603,'movie');assert.equal(results.length,1);assert.equal(results[0].subtitles[0].language,'tr');assert.ok(results[0].subtitles.every(s=>!('_contentKey'in s)));}
 finally{release();}
});
test('Altyazı gövdelerinin normal yanıt yolunda arama genelinde dört istek sınırı vardır',async()=>{
 let active=0,maximum=0,release,ready;const gate=new Promise(r=>release=r),full=new Promise(r=>ready=r);
 const fixture=Object.fromEntries(Array.from({length:10},(_,i)=>['https://subs.test/'+i+'.srt',{body:srt,mime:'text/plain'}])),fetcher=fixtureFetch(fixture);
 const http=createHttp({fetchImpl:async(url,options)=>{active++;maximum=Math.max(active,maximum);if(active===4)ready();await gate;try{return await fetcher(url,options);}finally{active--;}}});
 const work=Promise.all(Array.from({length:10},(_,i)=>loadSubtitles(http,{headers:{},subtitles:[{url:'https://subs.test/'+i+'.srt',language:'tr'}]},target,false)));
 try{await full;assert.equal(active,4);assert.equal(maximum,4);}finally{release();await work;http.close();}assert.equal(maximum,4);
});
test('Native abort yok sayıldığında mantıksal timeout yeni altyazı istekleriyle sınırı aşmaz',async()=>{
 let active=0,maximum=0,started=0,release;const gate=new Promise(r=>release=r);
 const http=createHttp({deadline:Date.now()+120,fetchImpl:async()=>{started++;active++;maximum=Math.max(active,maximum);await gate;active--;return{ok:false,status:404,headers:{get:()=>null}};}});
 try{await Promise.all(Array.from({length:12},(_,i)=>http.request('https://subs.test/'+i+'.srt',{timeoutMs:25,nativeGroup:'subtitle-body'})));
 assert.equal(started,4);assert.equal(active,4);assert.equal(maximum,4);
 }finally{http.close();release();}
});
