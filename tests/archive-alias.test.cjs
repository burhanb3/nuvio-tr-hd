'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{archiveQuery,archiveSearchNames,scanArchive}=require('../src/providers/archive.cjs');
const{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs'),{fixtureFetch,ebml}=require('./helpers.cjs');
const target={type:'movie',tmdbId:123456,originalTitle:'例の映画',searchTitles:['Example Feature','例の映画'],year:2020,imdbId:'tt1234567',runtimeMinutes:120};
const filename='Example.Feature.2020.2160p.mkv',url='https://archive.org/download/alias-fixture/'+filename;
function media(language='jpn'){const duration=Buffer.alloc(8);duration.writeDoubleBE(7200000);return Buffer.concat([
 ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([
 ebml('1549a966',ebml('4489',duration)),ebml('1654ae6b',Buffer.concat([
 ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',[15,0]),ebml('ba',[8,112])]))])),
 ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from(language))]))]))]))]);}
function fixture(){return{
 [archiveQuery(target,true)]:{json:{response:{docs:[{identifier:'alias-fixture',title:'Example Feature (2020) 2160p'}]}}},[archiveQuery(target)]:{json:{response:{docs:[]}}},
 ['https://archive.org/metadata/alias-fixture']:{json:{metadata:{title:'Example Feature (2020) 2160p'},files:[{name:filename,length:7200}]}},[url]:{body:media(),mime:'video/matroska'}
 };}
test('Archive: Japonca özgün ve aynı TMDB İngilizce adı aynı iki sorguda aranır; gerçek anime4K dosyası bulunur',async()=>{
 const q=decodeURIComponent(archiveQuery(target,true));assert.ok(q.includes('(title:"例の映画" OR title:"Example Feature")'));
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{const rows=await scanArchive(http,target);assert.equal(rows.length,1);assert.equal(rows[0].requireDuration,true);assert.equal(rows[0].durationTolerance,0.1);assert.equal(rows[0].rejectHindiOnly,true);const v=await probe(http,rows[0]);assert.deepEqual(v.dimensions,{width:3840,height:2160});assert.deepEqual(v.audioLanguages,['jpn']);assert.equal(calls.filter(c=>c.url.includes('advancedsearch.php')).length,2);}finally{http.close();}
});
test('Archive: resmi alternatif ad yanlış film/yıl/IMDb/TMDB veya fragman kabulüne dönüşmez',async()=>{
 for(const change of['year','imdb','tmdb','file','trailer']){const f=fixture(),m=f['https://archive.org/metadata/alias-fixture'].json;
  if(change==='year')m.metadata.year=2021;if(change==='imdb')m.metadata.imdb_id='tt9999999';if(change==='tmdb')m.metadata.tmdb_id=99999;
  if(change==='file')m.files[0].name='Other.Feature.2020.mkv';if(change==='trailer')f[archiveQuery(target,true)].json.response.docs[0].title='Example Feature 2020 Trailer';
  const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanArchive(http,target),[],change);}finally{http.close();}
 }
});
test('Archive: aynı adlar gereksiz OR üretmez; TV asıl başlık/S-E bağı korunur',()=>{
 assert.deepEqual(archiveSearchNames({...target,originalTitle:'Example Feature',searchTitles:['Example Feature.','EXAMPLE FEATURE']}),['Example Feature']);
 assert.deepEqual(archiveSearchNames({...target,type:'tv'}),['例の映画']);assert.ok(!decodeURIComponent(archiveQuery({...target,type:'tv'},true)).includes('Example Feature'));
 const named={...target,searchTitles:['The Trailer']};assert.ok(!decodeURIComponent(archiveQuery(named)).includes('NOT title:(sample OR trailer'));
});
test('Archive: gerçek yalnız Hintçe ses elenir; Japonca/EN ve okunamayan ses topluca elenmez',async()=>{
 const f=fixture(),http=createHttp({fetchImpl:fixtureFetch(f)});try{const[c]=await scanArchive(http,target);f[url].body=media('hin');assert.equal(await probe(http,c),null);f[url].body=media('eng');assert.ok(await probe(http,c));f[url].body=media('und');assert.ok(await probe(http,c));}finally{http.close();}
});
test('Archive: resmi alias aramasında metadata özgün adı sunsa da gerçek süre şartı korunur',async()=>{
 const f=fixture(),m=f['https://archive.org/metadata/alias-fixture'].json;m.metadata={title:target.originalTitle,date:'2020-01-01'};
 const http=createHttp({fetchImpl:fixtureFetch(f)});try{const[c]=await scanArchive(http,target);assert.ok(c);assert.equal(c.requireDuration,true);assert.equal(c.durationTolerance,0.1);}finally{http.close();}
});
