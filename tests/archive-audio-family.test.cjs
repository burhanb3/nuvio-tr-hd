'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{createProvider}=require('../src/index.cjs'),{archiveQuery}=require('../src/providers/archive.cjs'),{probe}=require('../src/media/probe.cjs'),{createHttp}=require('../src/http.cjs');
const{fixtureFetch,ebml,mp4,box,moov}=require('./helpers.cjs');
const target={type:'movie',tmdbId:123456,originalTitle:'Example Feature',year:2020,imdbId:'tt1234567',runtimeMinutes:120};
const parent='Example.Feature.2020.mkv',child='Example.Feature.2020.mp4',root='https://archive.org/download/family-example/';
function media(language){const t=Buffer.alloc(8);t.writeDoubleBE(7200000);return Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([
 ebml('1549a966',ebml('4489',t)),ebml('1654ae6b',Buffer.concat([ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',[7,128]),ebml('ba',[4,56])]))])),ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from(language))]))]))]))]);}
function fixture(language){return{
 ['https://api.themoviedb.org/3/movie/123456?api_key=test&append_to_response=external_ids,release_dates']:{json:{id:123456,original_title:target.originalTitle,title:target.originalTitle,release_date:'2020-01-01',imdb_id:target.imdbId,runtime:120}},
 [archiveQuery(target,true)]:{json:{response:{docs:[]}}},[archiveQuery(target)]:{json:{response:{docs:[{identifier:'family-example',title:'Example Feature'}]}}},
 ['https://archive.org/metadata/family-example']:{json:{metadata:{title:'Example Feature',year:2020},files:[{name:parent,length:7200,height:1080,size:1e9},{name:child,original:parent,length:7200,height:720,size:5e8}]}},
 [root+parent]:{body:media(language),mime:'video/matroska'},[root+child]:{body:mp4(),mime:'video/mp4'}
 };}
const settings={autoSubtitles:false,useDownloadBridge:false,hdhubEnabled:false,moviesdriveEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false};
test('Archive: yalnızHI asıl dosya doğrulanınca daha önce hazır olan bilinmeyen sesli MP4 türevi de listelenmez',async()=>{
 const f=fixture('hin'),p=createProvider({tmdbKey:'test',settings,fetchImpl:fixtureFetch(f)}),rows=await p.getStreams(123456,'movie');assert.deepEqual(rows,[]);assert.deepEqual(p.getPairs(),[]);assert.equal(p.getReport().rejected.hindi_only_audio,1);
});
test('Archive: EN asıl dosyanın küçük türevi korunur; Hintçe için aynı dosya aynası tekrar harcanmaz',async()=>{
 const p=createProvider({tmdbKey:'test',settings,fetchImpl:fixtureFetch(fixture('eng'))});assert.equal((await p.getStreams(123456,'movie')).length,2);assert.equal(p.getPairs().length,2);
 const url='https://aa1234.us.archive.org/1/items/x/example.mkv',mirror='https://bb1234.us.archive.org/1/items/x/example.mkv',calls=[],http=createHttp({fetchImpl:fixtureFetch({[url]:{body:media('hin'),mime:'video/matroska'},[mirror]:{body:media('hin'),mime:'video/matroska'}},calls)});
 try{assert.equal(await probe(http,{url,alternateUrls:[mirror],source:'Internet Archive',headers:{},rejectHindiOnly:true}),null);assert.equal(calls.filter(c=>c.url===mirror).length,0);}finally{http.close();}
});
test('Archive: türevde gerçek EN ses varsa asıl dosyanın Hintçe olması bu videoyu elemez',async()=>{
 const f=fixture('hin'),mdhd=Buffer.alloc(24),hdlr=Buffer.alloc(24);mdhd.writeUInt16BE((5<<10)|(14<<5)|7,20);hdlr.write('soun',8,'ascii');
 f[root+child].body=Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',moov(1280,720).subarray(8),box('trak',box('mdia',box('mdhd',mdhd),box('hdlr',hdlr)))),box('mdat',Buffer.alloc(32))]);
 const p=createProvider({tmdbKey:'test',settings,fetchImpl:fixtureFetch(f)});assert.equal((await p.getStreams(123456,'movie')).length,1);assert.deepEqual(p.getPairs()[0].video.audioLanguages,['eng']);
});
