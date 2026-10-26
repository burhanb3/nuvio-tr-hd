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

test('Archive eksik yıl alanını kesin başlık+yıl ve dosya adı+yıl ile tamamlar; gerçek süre şarttır',async()=>{
 const wanted={...target,runtimeMinutes:136},id='matrix-title-year';
 const fixture={
  [archiveQuery(wanted,false,true)]:{json:{response:{docs:[{identifier:id,title:'The Matrix (1999) 1080p'}]}}},
  ['https://archive.org/metadata/'+id]:{json:{metadata:{title:'The Matrix (1999) 1080p',date:'2026-01-01'},files:[{name:'The.Matrix.1999.1080p.mp4',length:8160}]}}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{
  const [candidate]=await scanArchive(http,wanted);assert.ok(candidate);assert.equal(candidate.requireDuration,true);
  assert.equal(candidate.releaseYearBasis,'exact-title-and-filename');
  fixture[candidate.url]={body:body(8160),mime:'video/mp4'};assert.ok(await probe(http,candidate));
  fixture[candidate.url]={body:body(7105),mime:'video/mp4'};assert.equal(await probe(http,candidate),null,'uzunluğu belirgin kısa sürüm eksik yıl için kanıt olamaz');
  fixture[candidate.url]={body:body(120),mime:'video/mp4'};assert.equal(await probe(http,candidate),null);
  fixture['https://archive.org/metadata/'+id].json.metadata.date='1984-01-01';assert.deepEqual(await scanArchive(http,wanted),[]);
  fixture['https://archive.org/metadata/'+id].json.metadata.date='2026-01-01';
  fixture['https://archive.org/metadata/'+id].json.metadata.year=2003;assert.deepEqual(await scanArchive(http,wanted),[]);
  delete fixture['https://archive.org/metadata/'+id].json.metadata.year;
  fixture['https://archive.org/metadata/'+id].json.files[0].name='The.Matrix.2003.mp4';assert.deepEqual(await scanArchive(http,wanted),[]);
 }finally{http.close();}
});

test('Archive yakın başlıklı yorumlar kesin başlık/yıl kaydının metadata kotasını tüketmez',async()=>{
 const wanted={...target,runtimeMinutes:136},exact={identifier:'actual-film',title:'The Matrix (1999) 1080p'};
 const fixtures={
  [archiveQuery(wanted,true)]:{json:{response:{docs:Array.from({length:10},(_,i)=>({identifier:'interview-'+i,title:'The Matrix - Cast Interview '+i}))}}},
  [archiveQuery(wanted,false,true)]:{json:{response:{docs:[exact]}}},
  'https://archive.org/metadata/actual-film':{json:{metadata:{title:exact.title},files:[{name:'The.Matrix.1999.1080p.mp4',length:8160}]}}
 };
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixtures,calls)});
 try{assert.equal((await scanArchive(http,wanted)).length,1);assert.equal(calls.filter(c=>c.url.includes('/metadata/interview-')).length,0);}finally{http.close();}
});

test('Archive resmi dosya sunucusunu seçer; ağ hatasında aynı dosyanın diğer resmi kopyasını dener, 403 zorlanmaz',async()=>{
 const id='matrix-replica',wanted={...target,runtimeMinutes:136},filename='The.Matrix.1999.mp4',dir='/0/items/'+id;
 const first='https://ia600001.us.archive.org'+dir+'/'+filename,second='https://ia800001.us.archive.org'+dir+'/'+filename;
 const fixture={
  [archiveQuery(wanted)]:{json:{response:{docs:[{identifier:id,title:'The Matrix'}]}}},
  ['https://archive.org/metadata/'+id]:{json:{d1:'ia600001.us.archive.org',d2:'ia800001.us.archive.org',dir,
   metadata:{title:'The Matrix',year:1999},files:[{name:filename,length:8160}]}},
  [first]:{throw:true},[second]:{body:body(8160),mime:'video/mp4'}
 };
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture,calls)});
 try{const[candidate]=await scanArchive(http,wanted);assert.equal(candidate.url,first);assert.deepEqual(candidate.alternateUrls,[second]);
  assert.equal((await probe(http,candidate)).url,second);assert.ok(calls.every(c=>c.method!=='HEAD'));
 }finally{http.close();}
 fixture[first]={status:403};calls.length=0;
 const denied=createHttp({fetchImpl:fixtureFetch(fixture,calls)});
 try{const[candidate]=await scanArchive(denied,wanted);assert.equal(await probe(denied,candidate),null);assert.ok(!calls.some(c=>c.url===second));}finally{denied.close();}
});

test('Archive hazır dosya adayını yavaş başka metadata bitmeden doğrulamaya iletir',{timeout:2000},async()=>{
 const wanted={...target,runtimeMinutes:136},fast='fast-item',slow='slow-item';let release;const gate=new Promise(r=>release=r);
 const fixture={
  [archiveQuery(wanted)]:{json:{response:{docs:[{identifier:fast,title:'The Matrix'},{identifier:slow,title:'The Matrix'}]}}},
  ['https://archive.org/metadata/'+fast]:{json:{metadata:{title:'The Matrix',year:1999},files:[{name:'The.Matrix.1999.mp4',length:8160}]}},
 };
 const fetcher=fixtureFetch(fixture);const http=createHttp({fetchImpl:async(u,o)=>{if(u.endsWith('/'+slow))await gate;return fetcher(u,o);}});
 let notified,finished=false;const first=new Promise(r=>notified=r);
 const scan=scanArchive(http,wanted,{onCandidates:async rows=>{assert.equal(rows.length,1);notified();}}).then(r=>{finished=true;return r;});
 try{await first;assert.equal(finished,false);}finally{release();await scan;http.close();}
});
