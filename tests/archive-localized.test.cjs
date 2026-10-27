'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanArchive,archiveQuery,archiveNames,titleBinding}=require('../src/providers/archive.cjs');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {fixtureFetch,ebml}=require('./helpers.cjs');
const target={tmdbId:123456,type:'movie',originalTitle:'Example Movie',searchTitles:['Example Movie'],year:2020,imdbId:'tt1234567',runtimeMinutes:120};
const title='Örnek Film Example Movie ( 2020) 1080p BluRay TR EN Türkçe Dublaj',filename='Örnek.Film.Example.Movie.2020.1080p.BluRay.TR.EN.mkv',url='https://archive.org/download/localized-example/'+encodeURIComponent(filename);
function media(seconds=7200){const size=n=>[n>>8,n&255],duration=Buffer.alloc(8);duration.writeDoubleBE(seconds*1000);
 const video=ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',size(3840)),ebml('ba',size(1600))]))]));
 const audio=language=>ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from(language))]));
 return Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([ebml('1549a966',ebml('4489',duration)),ebml('1654ae6b',Buffer.concat([video,audio('tur'),audio('eng')]))]))]);
}
function fixture(){return{
 [archiveQuery(target,true)]:{json:{response:{docs:[]}}},[archiveQuery(target)]:{json:{response:{docs:[{identifier:'localized-example',title}]}}},
 ['https://archive.org/metadata/localized-example']:{json:{metadata:{title},files:[{name:filename,length:'7200',size:'1000000000'}]}},
 [url]:{body:media(),mime:'video/matroska'}
};}
test('Archive: resmi çeviri + özgün başlık + yıl ve dosya yılı birleşir; gerçek TR/EN ve 4K kaybolmaz',async()=>{
 const f=fixture(),http=createHttp({fetchImpl:fixtureFetch(f)});let calls=0;
 try{assert.deepEqual(await scanArchive(http,target),[]);const rows=await scanArchive(http,target,{loadTitles:async()=>{calls++;return['Örnek Film'];}});
  assert.equal(calls,1);assert.equal(rows.length,1);assert.equal(rows[0].requireDuration,true);assert.equal(rows[0].durationTolerance,0.1);
  const v=await probe(http,rows[0]);assert.deepEqual(v.dimensions,{width:3840,height:1600});assert.equal(v.downloadable,true);assert.equal(v.container,'mkv');assert.deepEqual(v.audioLanguages,['tur','eng']);
 }finally{http.close();}
});
test('Archive: bilinmeyen yerel önek veya yanlış resmi çeviri aynı özgün ad geçse de kabul edilmez',async()=>{
 const http=createHttp({fetchImpl:fixtureFetch(fixture())});try{
  assert.deepEqual(await scanArchive(http,target,{loadTitles:async()=>['Başka Film']}),[]);
  assert.equal(titleBinding('Başka Film Example Movie 2020',target,archiveNames(target,['Örnek Film'])).titleYear,false);
  assert.deepEqual(archiveNames({...target,type:'tv'},['Örnek Film']),['example movie']);
 }finally{http.close();}
});
test('Archive: çelişen açık yıl/IMDb/TMDB elenir; doğrulama için bu kayıtlara çeviri isteği açılmaz',async()=>{
 for(const patch of [{year:'2021'},{imdb_id:'tt9999999'},{tmdb_id:999999}]){
  const f=fixture();Object.assign(f['https://archive.org/metadata/localized-example'].json.metadata,patch);let calls=0;
  const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanArchive(http,target,{loadTitles:async()=>{calls++;return['Örnek Film'];}}),[]);assert.equal(calls,0);}finally{http.close();}
 }
});
test('Archive: karışık koleksiyondan yanlış dosya/yıl alınmaz; eşzamanlı metadata tek resmi çeviri isteğini paylaşır',async()=>{
 const f=fixture(),meta=f['https://archive.org/metadata/localized-example'].json;
 meta.files.push({name:'Other Movie (2020) 1080p.mkv',length:'7200'},{name:filename.replace('2020','2021'),length:'7200'});
 f[archiveQuery(target)].json.response.docs.push({identifier:'localized-second',title});f['https://archive.org/metadata/localized-second']={json:meta};
 let calls=0;const http=createHttp({fetchImpl:fixtureFetch(f)});try{const rows=await scanArchive(http,target,{loadTitles:async()=>{calls++;await Promise.resolve();return['Örnek Film'];}});assert.equal(calls,1);assert.equal(rows.length,2);assert.ok(rows.every(r=>r.filename===filename));}finally{http.close();}
});
test('Archive: açık yerel ad – özgün ad (yıl) dosyası kendi başlık/süre bağıyla çalışır; önek resmi çeviri sayılmaz',async()=>{
 const f=fixture(),meta=f['https://archive.org/metadata/localized-example'].json;
 meta.files[0].name='Farklı Yerel Ad - Example Movie (2020) 1080p.mkv';meta.metadata.title='Farklı Yerel Ad Example Movie (2020) 1080p';
 let lookups=0;const http=createHttp({fetchImpl:fixtureFetch(f)});try{
  const rows=await scanArchive(http,target,{loadTitles:async()=>{lookups++;return[];}});assert.equal(rows.length,1);assert.equal(lookups,0);assert.equal(rows[0].requireDuration,true);
  meta.files[0].name='Example Movie - Farklı Yerel Ad (2020) 1080p.mkv';meta.metadata.title='Example Movie Farklı Yerel Ad (2020) 1080p';f[archiveQuery(target)].json.response.docs[0].title=meta.metadata.title;
  assert.equal((await scanArchive(http,target)).length,1);
  meta.files[0].name=meta.files[0].name.replace('Example Movie','Other Movie');assert.deepEqual(await scanArchive(http,target),[]);
 }finally{http.close();}
});

test('Archive: ayrı yıl alanı olmayan HD kayıt aramada kaybolmaz; dosya süresi metadata süresinin yerine doğrulanır',async()=>{
 const query=decodeURIComponent(archiveQuery(target,true));assert.ok(query.includes('(year:2020 OR title:2020)'));
 const f=fixture();f[archiveQuery(target,true)].json.response.docs=f[archiveQuery(target)].json.response.docs;f[archiveQuery(target)].json.response.docs=[];
 f[url].body=media(300);const http=createHttp({fetchImpl:fixtureFetch(f)});try{
  const rows=await scanArchive(http,target,{loadTitles:async()=>['Örnek Film']});assert.equal(rows.length,1);
  assert.equal(await probe(http,rows[0]),null);
 }finally{http.close();}
});

test('Archive: alternatif başlık biçimi fan edit, workprint veya koleksiyon kabulüne dönüşmez',async()=>{
 const {bilingualFileNames}=require('../src/providers/archive.cjs');
 for(const label of ['Fan Edit','Workprint','Collection','Documentary'])assert.deepEqual(bilingualFileNames([{name:`Example Movie - ${label} (2020) 1080p.mkv`}],target),[]);
});
