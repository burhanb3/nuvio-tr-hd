'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanFilmEkseni,pageMatches,playerEntries,playerCandidate}=require('../src/providers/filmekseni.cjs');
const{quotedJson}=require('../src/providers/page-data.cjs'),{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const{loadSubtitles}=require('../src/subtitles.cjs'),{fixtureFetch,vtt}=require('./helpers.cjs');
const root='https://filmekseni.vip',player='https://eksenload.top',id='a'.repeat(20),url='https://media.test/hls/'+id+'/session/aistream-legacy-master.m3u8';
const target={tmdbId:123456,type:'movie',originalTitle:'Example Movie',searchTitles:['Example Movie'],year:2020,imdbId:'tt1234567',runtimeMinutes:120};
const quote=data=>JSON.stringify(data).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\u0022');
const row={title:'Örnek Film',slug:'example-movie',releaseYear:'2020',contentableType:'App\\Models\\Movie'};
function fixture(){
 const template=Buffer.from('<iframe data-src="//eksenload.top/eplayer/{url}"></iframe>').toString('base64');
 const page='<h1>Örnek Film</h1><p>Example Movie</p><a href="'+root+'/yil/2020/">2020</a><a href="https://www.imdb.com/title/tt1234567">IMDb</a><div x-data="videoPlayerData(JSON.parse(\''+quote({dual:[{service_slug:'vip',link:id,template}]})+'\'))"></div>';
 const config={file:url,type:'hls',tracks:[{file:url.replace('aistream-legacy-master.m3u8','sub_tur.vtt'),label:'Türkçe'},{file:url.replace('aistream-legacy-master.m3u8','sub_eng.vtt'),label:'İngilizce'}]};
 return{
  [root+'/api/search?q=Example%20Movie']:{json:{data:[row]}},[root+'/example-movie/']:{body:page},
  [player+'/eplayer/'+id]:{body:'<title>ExampleMovie-2020DUAL-tt1234567</title><script>jwplayer().setup(JSON.parse(\''+quote(config)+'\'));</script>'},
  [url]:{body:'#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="Türkçe",LANGUAGE="tur",URI="tr.m3u8"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="English",LANGUAGE="eng",URI="en.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480,AUDIO="a"\n480.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1920x1080,AUDIO="a"\n1080.m3u8\n',mime:'application/vnd.apple.mpegurl'},
  [config.tracks[0].file]:{body:vtt,mime:'text/vtt'},[config.tracks[1].file]:{body:'WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nEnglish fixture.\n',mime:'text/vtt'}
 };
}
test('Veri zarfı: Türkçe/Unicode, ters çizgi ve tırnak güvenle çözülür; bozuk kaçış/ifade çalıştırılmaz',()=>{
 const data={title:"Şığİç öü ' ad",file:'https://media.test/a',nested:'\\unicode'};assert.deepEqual(quotedJson(quote(data)),data);
 for(const input of['{\\u00xz}',String.raw`{\u0022x\u0022:1});globalThis.__bad=1;`,String.raw`\x41`,String.raw`\0`,null,'x'.repeat(260001)])assert.equal(quotedJson(input),null);
 assert.equal(globalThis.__bad,undefined);
});
test('FilmEkseni: özgün ad/yıl/IMDb + oynatıcı kimliği; gerçek 480/1080 HLS, TR/EN ses ve VTT',async()=>{
 const calls=[],f=fixture(),http=createHttp({fetchImpl:fixtureFetch(f,calls)});try{
  const rows=await scanFilmEkseni(http,target);assert.equal(rows.length,1);assert.equal(rows[0].claimedQuality,undefined);assert.equal(rows[0].claimedAudioLanguages,undefined);
  const video=await probe(http,rows[0],true,false,{detailedHls:false});assert.equal(video.downloadable,false);assert.equal(video.container,'hls');assert.deepEqual(video.resolutionOptions,[{width:854,height:480},{width:1920,height:1080}]);assert.deepEqual(video.audioLanguages,['tur','eng']);
  const subtitles=await loadSubtitles(http,rows[0],target,false);assert.deepEqual(subtitles.map(s=>s.language),['tr','en']);
  assert.ok(calls.every(c=>!Object.keys(c.headers||{}).some(k=>/authorization|cookie/i.test(k))));assert.ok(!calls.some(c=>/jwpcdn|heartbeat|\/view$/.test(c.url)));
 }finally{http.close();}
});
test('FilmEkseni: başka film/yıl/IMDb ve kaynak türü ilk sonuç diye seçilmez',async()=>{
 for(const mode of['year','type','name','imdb']){
  const f=fixture();if(mode==='year')f[root+'/api/search?q=Example%20Movie'].json.data=[{...row,releaseYear:'2021'}];
  if(mode==='type')f[root+'/api/search?q=Example%20Movie'].json.data=[{...row,contentableType:'App\\Models\\Series'}];
  if(mode==='name')f[root+'/example-movie/'].body=f[root+'/example-movie/'].body.replace('<p>Example Movie</p>','<p>Other Movie</p>');
  if(mode==='imdb')f[root+'/example-movie/'].body=f[root+'/example-movie/'].body.replace('tt1234567','tt9999999');
  const calls=[],h=createHttp({fetchImpl:fixtureFetch(f,calls)});try{assert.deepEqual(await scanFilmEkseni(h,target),[]);assert.ok(!calls.some(c=>c.url.startsWith(player)));}finally{h.close();}
 }
 assert.equal(pageMatches('<h1>Örnek Film</h1><p>Example Movie</p>',row,target),false);
});
test('FilmEkseni: sabit kalite/ses, trailer, dış iframe ve başka dosyanın altyazısı kabul edilmez',async()=>{
 const f=fixture(),page=f[root+'/example-movie/'].body,entry=playerEntries(page)[0];assert.equal(entry.id,id);
 const before=Buffer.from('<iframe data-src="//eksenload.top/eplayer/{url}"></iframe>').toString('base64'),after=Buffer.from('<iframe src="//other.test/eplayer/{url}"></iframe>').toString('base64');
 assert.deepEqual(playerEntries(page.replace(before,after)),[]);
 const body=f[player+'/eplayer/'+id].body;
 assert.equal(playerCandidate(body.replace('tt1234567','tt9999999'),entry,target),null);
 assert.equal(playerCandidate(body.replace('2020DUAL','2021DUAL'),entry,target),null);
 assert.equal(playerCandidate(body.replaceAll('/hls/'+id+'/','/hls/'+('b'.repeat(20))+'/'),entry,target),null);
 assert.equal(playerCandidate(body.replace('aistream-legacy-master.m3u8','trailer.mp4'),entry,target),null);
 const calls=[],h=createHttp({fetchImpl:fixtureFetch(f,calls)});try{assert.deepEqual(await scanFilmEkseni(h,{...target,type:'tv'}),[]);assert.equal(calls.length,0);}finally{h.close();}
});
