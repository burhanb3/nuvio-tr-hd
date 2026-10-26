'use strict';
const{test}=require('node:test');const assert=require('node:assert/strict');
const{createProvider}=require('../src/index.cjs');const{makeFixture,fixtureFetch,target,ebml,mkv}=require('./helpers.cjs');
const{inspectContainer}=require('../src/media/containers.cjs');
test('bağımsız hızlı tarama, yavaş dosya taraması açıkken tamamlanır ve kaynak işlerini tekrarlamaz',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);let filesDone=false;
 const candidate={url:'https://media.test/movie.mp4',headers:{},subtitles:[],identity:target,source:'Fixture'};
 const settings={autoDiscover:false,catalogUrls:'https://library.test/catalog.json',autoSubtitles:false};
 const calls=[];
 const slow=createProvider({lane:'files',settings,tmdbKey:'test',fetchImpl:fixtureFetch(makeFixture(),calls),sourceFactories:[{name:'Slow',run:async()=>{await gate;return[candidate];}}]});
 const fast=createProvider({lane:'online',settings,tmdbKey:'test',fetchImpl:fixtureFetch(makeFixture(),calls),sourceFactories:[{name:'Fast',run:async()=>[candidate]}]});
 const pending=slow.getStreams(603,'movie').then(streams=>{filesDone=true;return streams;});
 try{assert.equal((await fast.getStreams(603,'movie')).length,1);assert.equal(filesDone,false);}finally{release();await pending;}
 assert.equal(calls.filter(c=>c.url==='https://library.test/catalog.json').length,1);
});
function subtitledMkv(lang='tur',codec='S_TEXT/UTF8'){
 const raw=mkv();const header=raw.subarray(0,raw.indexOf(Buffer.from('18538067','hex')));
 const track=ebml('ae',Buffer.concat([ebml('83',[17]),ebml('22b59c',Buffer.from(lang)),ebml('86',Buffer.from(codec))]));
 const video=ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',[5,0]),ebml('ba',[2,208])]))]));
 return Buffer.concat([header,ebml('18538067',ebml('1654ae6b',Buffer.concat([video,track])))]);
}
test('MKV içinde gerçek TR altyazı izi okunur; yabancı/bilinmeyen codec TR sayılmaz',()=>{
 const info=inspectContainer(subtitledMkv());assert.equal(info.embeddedTurkish,true);assert.deepEqual(info.subtitleTracks,[{language:'tr',codec:'S_TEXT/UTF8'}]);
 assert.equal(inspectContainer(subtitledMkv('eng')).embeddedTurkish,undefined);
 assert.equal(inspectContainer(subtitledMkv('tur','UNKNOWN')).embeddedTurkish,undefined);
});
test('MKV gömülü TR, harici dosya olmasa da sıkı TR filtresinde korunur ve indirmeyle aynı dosyadadır',async()=>{
 const data=makeFixture({items:[{...target,streams:[{url:'https://media.test/movie.mkv'}]}],extra:{'https://media.test/movie.mkv':{body:subtitledMkv()}}});
 const p=createProvider({tmdbKey:'test',settings:{autoDiscover:false,catalogUrls:'https://library.test/catalog.json',autoSubtitles:false,subtitlePolicy:'require'},fetchImpl:fixtureFetch(data)});
 const streams=await p.getStreams(603,'movie');assert.equal(streams.length,1);assert.equal(streams[0].language,'Ses: bilinmiyor · TR altyazı');assert.match(streams[0].name,/İndirilebilir/);assert.deepEqual(streams[0].subtitles,[]);
});
