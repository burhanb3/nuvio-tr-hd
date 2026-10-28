'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanArchive,archiveQuery}=require('../src/providers/archive.cjs'),{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs'),{fixtureFetch,ebml}=require('./helpers.cjs');
const target={type:'movie',tmdbId:123456,originalTitle:'Example Feature',year:2020,imdbId:'tt1234567',runtimeMinutes:120},local='Örnek Film';
function fixture({name='Örnek Film (2020).mkv',meta={},duration=7200000,second=false}={}){const t=Buffer.alloc(8);t.writeDoubleBE(duration);const body=Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([ebml('1549a966',ebml('4489',t)),ebml('1654ae6b',Buffer.concat([ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',[5,0]),ebml('ba',[2,208])]))])),ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from('tur'))]))]))]))]);
 const ids=second?['local-one','local-two']:['local-one'];const f={[archiveQuery(target,true)]:{json:{response:{docs:ids.map(identifier=>({identifier,title:'Example Feature (2020)'}))}}},[archiveQuery(target)]:{json:{response:{docs:[]}}}};
 for(const id of ids){f['https://archive.org/metadata/'+id]={json:{metadata:{title:'Example Feature (2020)',...meta},files:[{name,length:7200}]}};f['https://archive.org/download/'+id+'/'+encodeURIComponent(name)]={body,mime:'video/matroska'};}return f;
}
test('Archive: İngilizce kimlikli kaydın resmi Türkçe dosya adı aynı yıl ve gerçek süreyle bulunur',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture({second:true}),calls)});let loads=0;try{const rows=await scanArchive(http,target,{loadTitles:async()=>{loads++;return[local];}});assert.equal(rows.length,2);assert.equal(loads,1);assert.equal(calls.filter(c=>c.url.includes('advancedsearch')).length,2);assert.equal(rows[0].requireDuration,true);assert.equal(rows[0].durationTolerance,0.1);const v=await probe(http,rows[0]);assert.deepEqual(v.dimensions,{width:1280,height:720});assert.deepEqual(v.audioLanguages,['tur']);}finally{http.close();}
});
test('Archive: bilinmeyen yerel ad/yıl, yanlış IMDb/TMDB ve kısa gerçek video bu yolu kullanamaz',async()=>{
 for(const change of[{name:'Başka Film (2020).mkv'},{name:'Örnek Film (2021).mkv'},{meta:{year:2021}},{meta:{imdb_id:'tt9999999'}},{meta:{tmdb_id:99999}},{duration:60000}]){const http=createHttp({fetchImpl:fixtureFetch(fixture(change))});try{const rows=await scanArchive(http,target,{loadTitles:async()=>[local]});if(change.duration){assert.equal(rows.length,1);assert.equal(await probe(http,rows[0]),null);}else assert.deepEqual(rows,[],JSON.stringify(change));}finally{http.close();}}
});
test('Archive: zaten eşleşen dosyada yeni çeviri işi yok; çeviri hatası diğer eşleşmeyi bozmaz',async()=>{
 let loads=0;const http=createHttp({fetchImpl:fixtureFetch(fixture({name:'Example.Feature.2020.mkv'}))});try{assert.equal((await scanArchive(http,target,{loadTitles:async()=>{loads++;throw Error('offline');}})).length,1);assert.equal(loads,0);}finally{http.close();}
 const failed=createHttp({fetchImpl:fixtureFetch(fixture())});try{assert.deepEqual(await scanArchive(failed,target,{loadTitles:async()=>[]}),[]);}finally{failed.close();}
});
test('Archive: mevcut İngilizce dosya, aynı item içindeki resmi Türkçe alternatifini gizlemez',async()=>{
 const f=fixture();f['https://archive.org/metadata/local-one'].json.files.push({name:'Example.Feature.2020.mkv',length:7200});
 const http=createHttp({fetchImpl:fixtureFetch(f)});let loads=0;try{const rows=await scanArchive(http,target,{loadTitles:async()=>{loads++;return[local];}});assert.equal(rows.length,2);assert.equal(loads,1);}finally{http.close();}
});
