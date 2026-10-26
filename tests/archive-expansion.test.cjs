'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {scanArchive,archiveQuery}=require('../src/providers/archive.cjs');const{createHttp}=require('../src/http.cjs');const{probe}=require('../src/media/probe.cjs');
const{target,fixtureFetch,box,moov,mp4}=require('./helpers.cjs');
function body(seconds){const clock=Buffer.alloc(24);clock.writeUInt32BE(1000,12);clock.writeUInt32BE(seconds*1000,16);return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('mdat',Buffer.alloc(180000)),box('moov',box('mvhd',clock),moov(1280,720).subarray(8))]);}
test('Archive küçük türevleri HD asıllarla birlikte seçer; süre metadatası eksik dosya gerçek video süresine bağlıdır',async()=>{
 const wanted={...target,runtimeMinutes:136},id='matrix-fixture',files=[...Array(8)].map((_,i)=>({name:`The.Matrix.1999.${i}.mp4`,height:2160-i*200,size:String(8000000000/(i+1))}));
 const fixture={
  [archiveQuery(wanted)]:{json:{response:{docs:[{identifier:id,title:'The Matrix'}]}}},
  ['https://archive.org/metadata/'+id]:{json:{metadata:{title:'The Matrix',year:1999,imdb_id:target.imdbId},files}}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const candidates=await scanArchive(http,wanted);assert.ok(candidates.some(c=>c.filename.endsWith('.7.mp4')));assert.ok(candidates.some(c=>c.filename.endsWith('.0.mp4')));assert.ok(candidates.every(c=>c.requireDuration));
  const candidate=candidates[0];fixture[candidate.url]={body:body(136*60),mime:'video/mp4'};
  const video=await probe(http,candidate);assert.equal(video.duration,136*60);assert.deepEqual(video.dimensions,{width:1280,height:720});
  fixture[candidate.url]={body:body(145),mime:'video/mp4'};assert.equal(await probe(http,candidate),null);
  fixture[candidate.url]={body:mp4(),mime:'video/mp4'};assert.equal(await probe(http,candidate),null);
 }finally{http.close();}
});
test('Archive IMDb önek benzerliği ve boş/bozuk kimlik eşleşme sayılmaz',async()=>{
 for(const imdb_id of ['tt01330930','not-an-imdb-id']){
  const fixture={
   [archiveQuery(target)]:{json:{response:{docs:[{identifier:'wrong'}]}}},
   'https://archive.org/metadata/wrong':{json:{metadata:{title:'The Matrix',year:1999,imdb_id},files:[{name:'video.mp4'}]}}
  };const http=createHttp({fetchImpl:fixtureFetch(fixture)});try{assert.deepEqual(await scanArchive(http,target),[]);}finally{http.close();}
 }
});
test('MP4 sonunda yalnız ses track varsa tam video diye kabul edilmez',async()=>{
 const url='https://media.test/audio.mp4',http=createHttp({fetchImpl:fixtureFetch({[url]:{body:mp4({tail:true,audio:true})}})});
 try{assert.equal(await probe(http,{url,headers:{}}),null);}finally{http.close();}
});
