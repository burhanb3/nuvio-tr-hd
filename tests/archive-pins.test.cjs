'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {verifiedArchiveRecords,verifiedMetadataFile}=require('../src/providers/archive-verified.cjs');
const {scanArchive}=require('../src/providers/archive.cjs');const {createHttp}=require('../src/http.cjs');const{probe}=require('../src/media/probe.cjs');
const{fixtureFetch,box,moov}=require('./helpers.cjs');const {opensubtitlesHash}=require('../src/media/hash.cjs');
const fleabag={tmdbId:67070,imdbId:'tt5687612',originalTitle:'Fleabag',year:2016,type:'tv',season:1,episode:1,runtimeMinutes:26};
test('Archive içerik kanıtı yalnız kesin kanonik kimlik ve bölümde geçer',()=>{
 assert.equal(verifiedArchiveRecords(fleabag).length,1);
 for(const patch of[{tmdbId:1},{imdbId:'tt1'},{year:2017},{originalTitle:'Other Fleabag'},{season:3},{episode:2}])assert.deepEqual(verifiedArchiveRecords({...fleabag,...patch}),[]);
 const record=verifiedArchiveRecords(fleabag)[0],f=record.files[0];
 assert.ok(verifiedMetadataFile(record,{name:f.name,size:String(f.size),sha1:f.sha1}));
 for(const patch of[{size:f.size+1},{sha1:'0'.repeat(40)},{name:'Another.S01E01.mkv'}])assert.equal(verifiedMetadataFile(record,{name:f.name,size:f.size,sha1:f.sha1,...patch}),null);
});
test('Yeni bölüm pini başka sezon/bölümü kapsamaz; sabit yabancı altyazı bilgisi korunur',async()=>{
 const wanted={...fleabag,season:2},record=verifiedArchiveRecords(wanted)[0],file=record.files[0];
 const http=createHttp({fetchImpl:fixtureFetch({['https://archive.org/metadata/'+record.item]:{json:{metadata:{title:'Fleabag'},files:[{name:file.name,size:file.size,sha1:file.sha1}]}}})});
 try{const[c]=await scanArchive(http,wanted);assert.equal(c.burnedSubtitleLanguage,'es');assert.equal(c.expectedFile.hash,file.hash);
 assert.deepEqual(await scanArchive(http,{...wanted,episode:2}),[]);
 assert.deepEqual(await scanArchive(http,{...wanted,tmdbId:1396}),[]);
 }finally{http.close();}
});
test('Archive yıl/ID eksik bölümde pin şarttır; açık yanlış kimlik/yıl ve değişen metadata yine reddedilir',async()=>{
 const record=verifiedArchiveRecords(fleabag)[0],file=record.files[0],url='https://archive.org/metadata/'+record.item;
 const entry={metadata:{title:'Fleabag.S01E01'},files:[{name:file.name,size:file.size,sha1:file.sha1}]};
 const http=createHttp({fetchImpl:fixtureFetch({[url]:{json:entry}})});
 try{
  const[c]=await scanArchive(http,fleabag);assert.ok(c.expectedFile);assert.equal(c.requireDuration,true);assert.equal(c.releaseYearBasis,'content-sample-pinned-file');
  for(const patch of[{year:2004},{imdb_id:'tt9999999'},{tmdb_id:1},{is_dark:true}]){entry.metadata={title:'Fleabag.S01E01',...patch};assert.deepEqual(await scanArchive(http,fleabag),[]);}
  entry.metadata={title:'Fleabag.S01E01'};entry.files[0].sha1='0'.repeat(40);assert.deepEqual(await scanArchive(http,fleabag),[]);
  assert.deepEqual(await scanArchive(http,{...fleabag,episode:2}),[]);
 }finally{http.close();}
});
test('Pin kontrolü altyazı araması kapalıyken de gerçek hash/boyut/süre/piksel ister',async()=>{
 const clock=Buffer.alloc(24);clock.writeUInt32BE(1000,12);clock.writeUInt32BE(90000,16);
 const raw=Buffer.concat([box('ftyp',Buffer.from('isom0000isom')),box('moov',box('mvhd',clock),moov(640,360).subarray(8)),box('mdat',Buffer.alloc(180000))]);
 const expected={size:raw.length,hash:opensubtitlesHash(raw,raw,raw.length),width:640,height:360,duration:90},url='https://media.test/verified.mp4';
 const fixture={[url]:{body:raw,mime:'video/mp4'}},calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture,calls)}),candidate={url,headers:{},expectedFile:expected};
 try{
  assert.equal((await probe(http,candidate,false,false)).videoHash,expected.hash);assert.ok(calls.some(c=>c.headers?.Range?.includes(String(raw.length-65536))));
  for(const patch of[{size:raw.length+1},{hash:'0'.repeat(16)},{width:641},{duration:95}])assert.equal(await probe(http,{...candidate,expectedFile:{...expected,...patch}},false,false),null);
  const changed=Buffer.from(raw);changed[changed.length-10]=1;fixture[url].body=changed;assert.equal(await probe(http,candidate,false,false),null);
 }finally{http.close();}
});
