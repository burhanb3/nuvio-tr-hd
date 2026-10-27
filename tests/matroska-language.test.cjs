'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),{ebml}=require('./helpers.cjs'),{inspectContainer}=require('../src/media/containers.cjs');
function sample({language,bcp47,type=2,truncate=false}={}){
 const track=ebml('ae',Buffer.concat([ebml('83',[type]),...(language!==undefined?[ebml('22b59c',Buffer.from(language))]:[]),...(bcp47!==undefined?[ebml('22b59d',Buffer.from(bcp47))]:[]),ebml('86',Buffer.from(type===17?'S_TEXT/UTF8':'A_AAC'))]));
 const body=Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',ebml('1654ae6b',track))]);return truncate?body.subarray(0,body.length-4):body;
}
test('Matroska: tam track içinde Language yoksa formatın eng varsayılanı ses ve altyazıya uygulanır',()=>{
 assert.deepEqual(inspectContainer(sample()).audioLanguages,['eng']);assert.deepEqual(inspectContainer(sample({type:17})).subtitleTracks,[{language:'en',codec:'S_TEXT/UTF8'}]);
});
test('Matroska: açık und/boş/bozuk dil veya kesilmiş track İngilizce varsayılmaz',()=>{
 for(const options of[{language:'und'},{language:''},{language:'invalid_language'},{truncate:true}])assert.equal(inspectContainer(sample(options)).audioLanguages,undefined);
});
test('Matroska: BCP47 eski dil alanından üstündür; açık bilinmeyen BCP47 için eski EN kullanılmaz',()=>{
 assert.deepEqual(inspectContainer(sample({language:'eng',bcp47:'tr-TR'})).audioLanguages,['tr-tr']);
 assert.equal(inspectContainer(sample({language:'eng',bcp47:'und'})).audioLanguages,undefined);
 assert.equal(inspectContainer(sample({language:'eng',bcp47:''})).audioLanguages,undefined);
});
