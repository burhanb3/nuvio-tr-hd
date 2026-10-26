'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {createHttp}=require('../src/http.cjs');const {createProvider,formatResults}=require('../src/index.cjs');
const {loadSubtitles,subtitleLanguage,selectSubtitles}=require('../src/subtitles.cjs');
const {scoreSubtitle,ENGLISH_SUBTITLE_SERVICES}=require('../src/subtitle-discovery.cjs');
const {inspectHls}=require('../src/media/hls.cjs');
const {target,identity,fixtureFetch,makeFixture,srt}=require('./helpers.cjs');
const english='1\n00:00:01,000 --> 00:00:03,000\nFollow the white rabbit.\n';
test('TR/EN aliases normalize; both languages keep the same identity/year/cut/episode rules',()=>{
 for(const language of['en','eng','en-US','en_GB','English'])assert.equal(subtitleLanguage(language),'en');
 for(const language of['tr','tur','Türkçe','tr-TR'])assert.equal(subtitleLanguage(language),'tr');
 assert.equal(subtitleLanguage('es'),null);
 const filename='The.Matrix.1999.1080p.BluRay.GROUP.mp4';
 for(const language of['tr','en']){
  const sub={language,releaseName:filename.replace('.mp4','.srt'),_scope:'title',_identityBound:true};
  assert.equal(scoreSubtitle(sub,{filename},{},target,true).score,95);
  assert.equal(scoreSubtitle({...sub,imdbId:'tt9999999'},{filename},{},target,true),null);
  assert.equal(scoreSubtitle({...sub,releaseName:sub.releaseName.replace('1999','2003')},{filename},{},target,true),null);
  assert.equal(scoreSubtitle({...sub,releaseName:sub.releaseName.replace('1080p','EXTENDED.1080p')},{filename},{},target,true),null);
  assert.equal(scoreSubtitle({...sub,ai_translated:true},{filename},{},target,true),null);
 }
});
test('An English canonical TMDB title matches a Japanese original only in an identity-bound lookup',()=>{
 const anime={tmdbId:1429,imdbId:'tt2560140',type:'tv',originalTitle:'進撃の巨人',searchTitles:['Attack on Titan','進撃の巨人'],year:2013,season:1,episode:1};
 const filename='進撃の巨人.2013.S01E01.1080p.WEB-DL.GROUP.mkv',sub={language:'en',releaseName:'Attack.on.Titan.2013.S01E01.1080p.WEB-DL.GROUP.eng.srt',_scope:'title',_identityBound:true};
 assert.equal(scoreSubtitle(sub,{filename},{},anime,true).score,95);
 assert.equal(scoreSubtitle({...sub,_identityBound:false},{filename},{},anime,true),null);
 assert.equal(scoreSubtitle({...sub,tmdbId:999},{filename},{},anime,true),null);
 assert.equal(scoreSubtitle({...sub,releaseName:sub.releaseName.replace('E01','E02')},{filename},{},anime,true),null);
});
test('Four TR plus four EN alternatives survive; English cannot consume the Turkish quota',async()=>{
 const fixture={},subtitles=[];
 for(const language of['en','tr'])for(let i=0;i<8;i++){
  const url=`https://subs.test/${language}${i}.srt`;
  fixture[url]={body:language==='en'?english+'English '+i:srt+'Türkçe '+i,mime:'text/plain'};
  subtitles.push({url,language,_match:{score:90},releaseName:'Release '+i});
 }
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const rows=await loadSubtitles(http,{subtitles},target,false,{keepScore:true});
  assert.deepEqual(rows.map(s=>s.language),['tr','tr','tr','tr','en','en','en','en']);
  assert.ok(rows.filter(s=>s.language==='en').every(s=>s.name.startsWith('İngilizce')));
 }finally{http.close();}
 const duplicate=selectSubtitles([{url:'https://subs.test/en',language:'en',_contentKey:'same',_score:100},{url:'https://subs.test/tr',language:'tr',_contentKey:'same',_score:90}]);
 assert.equal(duplicate.length,1);assert.equal(duplicate[0].language,'tr');
});
test('The same subtitle URL with different explicit language headers retains both real bodies',async()=>{
 const url='https://subs.test/track',http=createHttp({fetchImpl:async(u,o)=>fixtureFetch({[url]:{body:o.headers['Accept-Language']==='en'?english:srt,mime:'text/plain'}})(u,o)});
 try{const rows=await loadSubtitles(http,{subtitles:[{url,language:'en',headers:{'Accept-Language':'en'}},{url,language:'tr',headers:{'Accept-Language':'tr'}}]},target,false);
  assert.deepEqual(rows.map(s=>s.language),['tr','en']);assert.deepEqual(rows.map(s=>s.headers['Accept-Language']),['tr','en']);
 }finally{http.close();}
});
test('Paired TR is preserved while automatic English is discovered; native result languages remain tr/en',async()=>{
 const fixture=makeFixture({items:[{...identity,streams:[{url:'https://media.test/movie.mp4',subtitles:[{url:'https://media.test/tr.srt',language:'tr'}]}]}],extra:{
  [ENGLISH_SUBTITLE_SERVICES[0]+'/subtitles/movie/tt0133093.json']:{json:{subtitles:[{lang:'eng',title:'The Matrix 1999',url:'https://subs.test/en.srt'}]}},
  'https://subs.test/en.srt':{body:english,mime:'text/plain'}
 }});
 const calls=[],p=createProvider({tmdbKey:'test',settings:{autoDiscover:false,catalogUrls:'https://library.test/catalog.json'},fetchImpl:fixtureFetch(fixture,calls)});
 const rows=await p.getStreams(603,'movie');assert.equal(rows.length,1);
 assert.deepEqual(rows[0].subtitles.map(s=>s.language),['tr','en']);assert.match(rows[0].language,/TR\/EN altyazı/);
 assert.ok(!calls.some(c=>Object.keys(c).includes('nativeGroup')));
});
test('English-only is shown as EN + TR altyazı yok, but never satisfies require-Turkish mode',async()=>{
 const fixture=makeFixture({items:[{...identity,streams:[{url:'https://media.test/movie.mp4',subtitles:[{url:'https://subs.test/en.srt',language:'eng'}]}]}],extra:{'https://subs.test/en.srt':{body:english,mime:'text/plain'}}});
 const settings={autoDiscover:false,autoSubtitles:false,catalogUrls:'https://library.test/catalog.json'};
 const normal=await createProvider({tmdbKey:'test',settings,fetchImpl:fixtureFetch(fixture)}).getStreams(603,'movie');
 assert.equal(normal.length,1);assert.match(normal[0].language,/EN altyazı · TR altyazı yok/);assert.equal(normal[0].subtitles[0].language,'en');
 const required=await createProvider({tmdbKey:'test',settings:{...settings,subtitlePolicy:'require'},fetchImpl:fixtureFetch(fixture)}).getStreams(603,'movie');
 assert.deepEqual(required,[]);
});
test('All cards have quality, size, audio and subtitle placeholders; decimal GB and codes use one layout',()=>{
 const pair=(id,patch={})=>({candidate:{url:`https://media.test/${id}.mp4`,source:'Kaynak',headers:{},subtitles:[]},video:{url:`https://media.test/${id}.mp4`,container:'mp4',downloadable:true,...patch},subtitles:[]});
 const known=pair('known',{size:1800000000,dimensions:{width:1920,height:1080},audioLanguages:['eng','tur']});known.subtitles=[{url:'https://subs.test/tr',language:'tr',_score:90},{url:'https://subs.test/en',language:'en',_score:95}];
 const rows=formatResults([known,pair('unknown')],{},target);
 assert.equal(rows[0].size,'1,80 GB');assert.equal(rows[0].language,'Ses: EN/TR · TR/EN altyazı');
 assert.equal(rows[1].quality,'Kalite bilinmiyor');assert.equal(rows[1].size,'Boyut bilinmiyor');assert.equal(rows[1].language,'Ses: bilinmiyor · TR altyazı yok');
 assert.ok(rows.every(s=>['quality','size','language'].every(k=>typeof s[k]==='string'&&s[k].length)));
 const online=pair('hls',{container:'hls',downloadable:false,sizeEstimate:{minimum:1800000000,maximum:1800000000,basis:'average-bitrate'}});
 assert.equal(formatResults([online],{},target)[0].size,'~1,80 GB');
});
test('Only the selected HLS subtitle group contributes TR/EN; unused groups do not label the stream',async()=>{
 const text='#EXTM3U\n#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="en",LANGUAGE="eng",URI="en.m3u8"\n#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="tr",LANGUAGE="tur",URI="tr.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720,SUBTITLES="en"\n720.m3u8\n';
 const http=createHttp({fetchImpl:fixtureFetch({})});
 try{const video=await inspectHls(http,text,'https://stream.test/master.m3u8',{headers:{}},{detailed:false});
  assert.deepEqual(video.subtitleLanguages,['en']);assert.deepEqual(video.renditions[0].subtitleLanguages,['en']);
  const row=formatResults([{candidate:{url:video.url,headers:{},embeddedTurkish:true},video,subtitles:[]}],{},target)[0];
  assert.match(row.language,/EN altyazı · TR altyazı yok/);
 }finally{http.close();}
});
test('Stalled English bodies use at most one raw fetch and cannot occupy all four Turkish/shared slots',async()=>{
 let release;const gate=new Promise(r=>release=r),started={en:0,tr:0};let active=0,max=0;
 const http=createHttp({deadline:Date.now()+160,fetchImpl:async url=>{
  const language=url.includes('/en')?'en':'tr';started[language]++;active++;max=Math.max(max,active);await gate;active--;
  return{ok:false,status:404,headers:{get:()=>null}};
 }});
 try{await Promise.all(['en','en','en','en','tr','tr','tr'].map((language,i)=>loadSubtitles(http,{subtitles:[{url:`https://subs.test/${language}${i}.srt`,language}]},target,false)));
  assert.equal(started.en,1);assert.ok(started.tr>=1);assert.ok(max<=4);
 }finally{http.close();release();}
});
test('A slow English body cannot erase a completed TR pair at the require-Turkish deadline',async()=>{
 let release;const gate=new Promise(r=>release=r);
 const fixture=makeFixture({items:[{...identity,streams:[{url:'https://media.test/movie.mp4',subtitles:[{url:'https://media.test/tr.srt',language:'tr'}]}]}],extra:{
  [ENGLISH_SUBTITLE_SERVICES[0]+'/subtitles/movie/tt0133093.json']:{json:{subtitles:[{lang:'eng',title:'The Matrix 1999',url:'https://subs.test/en.srt'}]}},
  'https://subs.test/en.srt':{body:english,mime:'text/plain'}
 }}),fetcher=fixtureFetch(fixture);
 const p=createProvider({tmdbKey:'test',budgetMs:350,settings:{autoDiscover:false,catalogUrls:'https://library.test/catalog.json',subtitlePolicy:'require'},fetchImpl:async(u,o)=>{if(u==='https://subs.test/en.srt')await gate;return fetcher(u,o);}});
 try{const rows=await p.getStreams(603,'movie');assert.equal(rows.length,1);assert.equal(rows[0].subtitles[0].language,'tr');}
 finally{release();}
});
