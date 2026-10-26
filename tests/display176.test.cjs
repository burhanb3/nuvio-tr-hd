'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {languageSummary}=require('../src/media/languages.cjs'),{describeAudio}=require('../src/media/audio.cjs');
const {cardFields,qualityChoice,probableSize}=require('../src/media/presentation.cjs'),{formatResults}=require('../src/index.cjs');
const {releaseEntries,releasePlan}=require('../src/providers/hdhub.cjs');
const {target}=require('./helpers.cjs');
test('TR/EN first, HI last, unique languages and top five plus remainder for audio/subtitles',()=>{
 const languages=['hin','eng','fra','spa','tur','ger','ita','por','en-US'];
 assert.equal(languageSummary(languages),'TR/EN/FR/ES/DE +3');assert.equal(languageSummary(['hin','eng']),'EN/HI');
 assert.equal(languageSummary(['fr','en','es','hi','tr']),'TR/EN/FR/ES/HI');
 const fields=cardFields({audioLanguages:languages,subtitleLanguages:languages},{},[]);
 assert.equal(fields.language,'Ses: TR/EN/FR/ES/DE +3 · TR/EN/FR/ES/DE +3 altyazı');
});
test('filename/source/original language evidence is retained internally without question marks',()=>{
 assert.equal(describeAudio({},{claimedAudioLanguages:['hi','en']}).text,'EN/HI');
 assert.equal(describeAudio({},{identity:{originalLanguage:'en'}}).evidence,'original-language');
 assert.equal(describeAudio({audioLanguages:['hin']},{identity:{originalLanguage:'en'}}).text,'HI');
 assert.equal(describeAudio({},{filename:'Film.English.mp4'}).evidence,'filename');
});
test('p label accompanies real pixels including crops; filename never overwrites measured pixels',()=>{
 assert.equal(cardFields({dimensions:{width:1080,height:720}},{claimedQuality:'2160p'},[]).quality,'720p · 1080×720');
 assert.equal(cardFields({dimensions:{width:1920,height:800}},{},[]).quality,'1080p · 1920×800');
 assert.equal(cardFields({dimensions:{width:1920,height:240}},{},[]).quality,'240p · 1920×240');
 assert.equal(qualityChoice({},{filename:'Example.2160p.mkv'}).evidence,'source-or-filename');
});
test('size model uses selected high rendition/average, peak correction or geometry; byte size wins',()=>{
 const v={container:'hls',resolutionOptions:[{width:1280,height:720},{width:1920,height:1080}],renditions:[{dimensions:{width:1280,height:720},sizeEstimate:{minimum:1e9,maximum:1e9,basis:'average-bitrate'}},{dimensions:{width:1920,height:1080},sizeEstimate:{minimum:3e9,maximum:3e9,basis:'peak-bitrate'}}]};
 assert.equal(probableSize(v).bytes,2400000000);assert.equal(cardFields(v,{},[]).size,'2,40 GB');
 assert.equal(probableSize({...v,size:777}).bytes,777);
 assert.ok(probableSize({container:'hls',duration:600},{claimedQuality:'1080p'}).bytes>0);
 assert.equal(probableSize({live:true,duration:600},{claimedQuality:'1080p'}),null);
});
test('cards omit unsupported data instead of unknown/tentative text; real HLS stays online-only',()=>{
 for(const compactLabels of [true,false]){
 const p={candidate:{url:'https://media.test/example.m3u8',source:'Example',headers:{},filename:'Film.1080p.English.mkv'},video:{url:'https://media.test/example.m3u8',container:'hls',downloadable:false,duration:600},subtitles:[]};
 const [s]=formatResults([p],{compactLabels},target);assert.doesNotMatch(s.name+' '+s.title+' '+s.quality+' '+s.size+' '+s.language,/bilinmiyor|tahmin|[?~≤]|undefined/i);assert.match(s.name,/Online/);assert.match(s.title,/İndirilemez/);
 }
});
test('MB release hints sort correctly and high/large files enter the same bounded HDHub plan',()=>{
 const sections=[['480p', '540 MB'],['720p','1.20 GB'],['2160p','25 GiB']].map(([q,size],i)=>`<div class="download-item"><div class="file-title">The.Matrix.1999.${q}.mkv</div><span>${size}</span><a href="https://greenmotors.club/release${i}">Download HubCloud</a></div>`).join('');
 const entries=releaseEntries(sections,target);assert.equal(entries[0].size,0.54);
 const many=Array.from({length:20},(_,i)=>({url:'https://source.test/'+i,filename:'Film.1999.'+(i===19?'2160p':'480p')+'.mkv',size:i+1}));
 const planned=releasePlan(many);assert.equal(planned.length,12);assert.equal(planned[0].url,many[0].url);assert.ok(planned.slice(0,3).some(e=>e.filename.includes('2160p')));
});
