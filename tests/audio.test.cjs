const{test}=require('node:test');const assert=require('node:assert/strict');
const{inspectContainer}=require('../src/media/containers.cjs');const{describeAudio}=require('../src/media/audio.cjs');
const{box,moov,ebml}=require('./helpers.cjs');
test('MP4 ses dili mdhd alanından okunur; dosya adı bu ölçümü değiştirmez',()=>{
 const lang='fra',mdhd=Buffer.alloc(24),handler=Buffer.alloc(24);handler.write('soun',8,'ascii');
 mdhd.writeUInt16BE([...lang].reduce((value,c)=>(value<<5)|(c.charCodeAt(0)-96),0),20);
 const file=Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),
  box('moov',moov().subarray(8),box('trak',box('mdia',box('mdhd',mdhd),box('hdlr',handler)))),box('mdat',Buffer.alloc(32))]);
 const video=inspectContainer(file);assert.deepEqual(video.audioLanguages,['fra']);
 assert.equal(describeAudio(video,{filename:'Movie.English.mp4'}).text,'FR');
 assert.equal(describeAudio(video,{}).evidence,'container');
});
test('MKV yalnız ses track dili ses sayılır; TR altyazı track dili karıştırılmaz',()=>{
 const header=ebml('1a45dfa3',ebml('4282',Buffer.from('matroska')));
 const entry=(type,language)=>ebml('ae',Buffer.concat([ebml('83',[type]),ebml('22b59c',Buffer.from(language))]));
 const file=Buffer.concat([header,ebml('18538067',ebml('1654ae6b',Buffer.concat([entry(2,'hin'),entry(2,'eng'),entry(17,'tur')])))]);
 assert.deepEqual(inspectContainer(file).audioLanguages,['hin','eng']);
 assert.equal(describeAudio(inspectContainer(file),{}).text,'EN/HI');
});
test('dosya adı ses ipucu açıkça tahmindir; film başlığındaki French dil sayılmaz',()=>{
 assert.equal(describeAudio({},{filename:'Movie.FRENCH.2021.mp4'}).text,'FR');
 assert.equal(describeAudio({},{filename:'The.French.Connection.1971.mp4',identity:{originalTitle:'The French Connection'}}),null);
 assert.equal(describeAudio({audioLanguages:['und']},{filename:'Movie.2021.mp4'}),null);
});
