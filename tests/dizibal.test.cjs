'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanDiziBal,playerConfig}=require('../src/providers/dizibal.cjs'),{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {resolveTranslatedTitles}=require('../src/matching.cjs'),{fixtureFetch,target}=require('./helpers.cjs');
const origin='https://dizibal.org',player='https://play2.pilavyerplay.top',page=origin+'/series/example',url=page+'/season/2/episode/3',embed=player+'/assets/js/s.php?s=publicExampleId';
const tv={...target,type:'tv',originalTitle:'Example',year:2020,season:2,episode:3,searchTitles:['Example']};
test('movie player release names must contain the exact canonical title and release year',()=>{
 const page=title=>'<script>window.__PLAYER__ = '+JSON.stringify({title,stream:'https://pilavyerplay.top/api/stream.php?s=fixture'})+';</script>';
 assert.ok(playerConfig(page('The Matrix 1999 m1080p DUAL BluRay H264'),{title:'Matrix'},target));
 assert.equal(playerConfig(page('The Matrix 2003 m1080p DUAL BluRay H264'),{title:'Matrix'},target),null);
 assert.equal(playerConfig(page('Unrelated Film 1999 1080p'),{title:'Matrix'},target),null);
});
function fixture(){return {
 [origin+'/ara/oneri?q=Example']:{json:{series:[{type:'series',title:'Example',meta:'Dizi · 2020',url:page}]}},
 [url]:{body:`<link rel="canonical" href="${url}"><h1>Example — 2. Sezon 3. Bölüm</h1><div data-pv="publicExampleId"></div><script src="${player}/assets/js/core.js"></script>`},
 [embed]:{body:'<script>window.__PLAYER__ = '+JSON.stringify({title:'Example 2. Sezon 3. Bölüm',stream:player+'/api/stream.php?s=fixture-public-ticket',accessCode:'',audios:[{lang:'tr'},{lang:'en'}],subs:[{lang:'tr',src:'/subs/tr.vtt'},{lang:'en',src:'/subs/en.vtt'}]})+';</script>'},
 [player+'/api/stream.php?s=fixture-public-ticket&format=.m3u8']:{body:'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720.m3u8\n'}
};}
test('DiziBal resolves the exact episode, public player, language tracks and online-only HLS',async()=>{
 const http=createHttp({fetchImpl:fixtureFetch(fixture())});
 try{const rows=await scanDiziBal(http,tv);assert.equal(rows.length,1);assert.deepEqual(rows[0].claimedAudioLanguages,['tr','en']);assert.deepEqual(rows[0].subtitles.map(s=>s.language),['tr','en']);
 const video=await probe(http,rows[0],true,false,{detailedHls:false});assert.equal(video.container,'hls');assert.equal(video.downloadable,false);assert.deepEqual(video.resolutionOptions,[{width:1280,height:720}]);assert.ok(rows[0].url.endsWith('.m3u8'));}finally{http.close();}
});
test('DiziBal rejects wrong year, media type, season and canonical URL',async()=>{
 for(const mutate of [f=>{f[origin+'/ara/oneri?q=Example'].json.series[0].meta='Dizi · 2021';},f=>{f[origin+'/ara/oneri?q=Example'].json.series[0].type='movie';},f=>{f[url].body=f[url].body.replace('2. Sezon','1. Sezon');},f=>{f[url].body=f[url].body.replace('rel="canonical"','rel="other"');}]){
  const data=fixture();mutate(data);const http=createHttp({fetchImpl:fixtureFetch(data)});try{assert.deepEqual(await scanDiziBal(http,tv),[]);}finally{http.close();}
 }
});
test('DiziBal does not execute scripts, use gated players or follow unrelated player hosts',async()=>{
 for(const mutate of [f=>{f[url].body=f[url].body.replaceAll('play2.pilavyerplay.top','unrelated.test');},f=>{f[embed].body=f[embed].body.replace('"accessCode":""','"accessCode":"required"');},f=>{f[embed].body=f[embed].body.replace('2. Sezon 3. Bölüm','2. Sezon 4. Bölüm');},f=>{f[url].body+='<div data-player-type="none"></div>';}]){
  const data=fixture();mutate(data);const http=createHttp({fetchImpl:fixtureFetch(data)});try{assert.deepEqual(await scanDiziBal(http,tv),[]);}finally{http.close();}
 }
});
test('localized catalogue names require a canonical translation for the same numeric TMDB ID',async()=>{
 const data=fixture(),translate='https://api.themoviedb.org/3/tv/603/translations?api_key=test';
 data[origin+'/ara/oneri?q=Example'].json.series[0].title='Örnek';
 data[origin+'/ara/oneri?q='+encodeURIComponent('Örnek')]=data[origin+'/ara/oneri?q=Example'];
 data[url].body=data[url].body.replace('Example —','Örnek —');data[embed].body=data[embed].body.replace('Example 2.','Örnek 2.');
 data[translate]={json:{id:603,translations:[{iso_639_1:'tr',data:{name:'Örnek'}}]}};
 const http=createHttp({fetchImpl:fixtureFetch(data)});try{
  assert.equal((await scanDiziBal(http,tv,{loadTitles:()=>resolveTranslatedTitles(http,tv,'test')})).length,1);
  data[translate].json.id=604;assert.deepEqual(await resolveTranslatedTitles(http,tv,'test'),[]);
 }finally{http.close();}
});
