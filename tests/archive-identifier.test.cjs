'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{archiveQuery,scanArchive}=require('../src/providers/archive.cjs'),{probe}=require('../src/media/probe.cjs'),{createHttp}=require('../src/http.cjs');
const{fixtureFetch,ebml}=require('./helpers.cjs');
const target={type:'movie',tmdbId:123456,originalTitle:'Example Feature',year:2020,imdbId:'tt1234567',runtimeMinutes:120};
function fixture({id='example.feature.2020.1080p.tr.eng',title='Example Feature Türkçe Dublaj',meta={},name='Example.Feature.2020.1080p.TR.ENG.mkv',duration=7200000}={}){
 const time=Buffer.alloc(8);time.writeDoubleBE(duration);
 const media=Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([ebml('1549a966',ebml('4489',time)),ebml('1654ae6b',Buffer.concat([
  ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',[7,128]),ebml('ba',[4,56])]))])),
  ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from('tur'))])),ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from('eng'))]))]))]))]);
 return{[archiveQuery(target,true)]:{json:{response:{docs:[{identifier:id,title}]}}},[archiveQuery(target)]:{json:{response:{docs:[]}}},
  ['https://archive.org/metadata/'+id]:{json:{metadata:{title,...meta},files:[{name,length:7200}]}},
  ['https://archive.org/download/'+id+'/'+encodeURIComponent(name)]:{body:media,mime:'video/matroska'}};
}
test('Archive: yıl alanı olmayan dublaj başlığı, kanonik kimlik ve dosya yılıyla doğrulanır; gerçek TR/EN okunur',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{const rows=await scanArchive(http,target);assert.equal(rows.length,1);assert.equal(rows[0].releaseYearBasis,'exact-identifier-and-filename');assert.equal(rows[0].requireDuration,true);assert.equal(rows[0].durationTolerance,0.1);const v=await probe(http,rows[0]);assert.deepEqual(v.audioLanguages,['tur','eng']);assert.deepEqual(v.dimensions,{width:1920,height:1080});assert.equal(calls.filter(c=>c.url.includes('advancedsearch')).length,2);}finally{http.close();}
});
test('Archive: kimlik öneki araması tam ad/yılla sınırlıdır, pahalı baştan joker ve ek sorgu yoktur',()=>{
 const q=decodeURIComponent(archiveQuery(target,true));assert.ok(q.includes('identifier:example.feature.2020*'));assert.ok(q.includes('identifier:example-feature-2020*'));assert.ok(!q.includes('identifier:*'));
 assert.ok(q.includes('AND (title:(1080p'));assert.ok(q.includes(')) OR (identifier:')); // AND branch grouped before OR: Archive otherwise changes its meaning.
 assert.ok(!decodeURIComponent(archiveQuery({...target,type:'tv'},true)).includes('identifier:'));
});
test('Archive: kimlikten yıl çıkarma yanlış başlığı, kimliği, yılı, ses dosyasını veya koleksiyonu kabul etmez',async()=>{
 const rejected=[{id:'example.feature.2021.1080p.tr.eng'},{id:'example.feature.2020.2021.1080p'},{name:'Other.Feature.2020.mkv'},{name:'Example.Feature.2020.2021.mkv'},
  {title:'Example Feature Türkçe Dublaj Collection'},{title:'Other Feature Türkçe Dublaj'},{meta:{year:2021}},{meta:{date:'2019-01-01'}},{meta:{imdb_id:'tt9999999'}},{meta:{tmdb_id:999999}},
  {name:'Example.Feature.2020.mp3'},{title:'Example Feature Interview Türkçe Dublaj'}];
 for(const change of rejected){const http=createHttp({fetchImpl:fixtureFetch(fixture(change))});try{assert.deepEqual(await scanArchive(http,target),[],JSON.stringify(change));}finally{http.close();}}
});
test('Archive: metadata uzunluk iddiasına rağmen kısa gerçek video elenir; yıl dayanağı için kanonik süre gerekir',async()=>{
 const http=createHttp({fetchImpl:fixtureFetch(fixture({duration:60000}))});try{const[c]=await scanArchive(http,target);assert.ok(c);assert.equal(await probe(http,c),null);assert.deepEqual(await scanArchive(http,{...target,runtimeMinutes:null}),[]);}finally{http.close();}
});
