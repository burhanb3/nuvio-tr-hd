'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHttp } = require('../src/http.cjs');
const { fixtureFetch, target: film, mp4 } = require('./helpers.cjs');
const { scanSonAnime } = require('../src/providers/sonanime.cjs');
const { matchesAnime } = require('../src/providers/animecix.cjs');
const { scanDiziYou } = require('../src/providers/diziyou.cjs');
const { scanFilmModu } = require('../src/providers/filmmodu.cjs');
const { inspectHls } = require('../src/media/hls.cjs');
const { probe } = require('../src/media/probe.cjs');
const { scoreSubtitle } = require('../src/subtitle-discovery.cjs');
const { scanArchive, archiveQuery } = require('../src/providers/archive.cjs');
const { loadSubtitles } = require('../src/subtitles.cjs');
const { scanDiziBak, unpackPlayer } = require('../src/providers/dizibak.cjs');
const anime = { tmdbId:13916, type:'tv', originalTitle:'デスノート', searchTitles:['Death Note','デスノート'], year:2006, season:1, episode:1, isAnime:true };
const tv = { tmdbId:67070, type:'tv', originalTitle:'Fleabag', year:2016, season:1, episode:1, imdbId:'tt5687612', originalLanguage:'en' };
const ld = data => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
test('SonAnime: sırasız bölümlerden tam S/E seçilir, yanlış TMDB/yıl ve başka bölüm elenir; gerçek MP4 probu şart',async()=>{
 const row={anime_id:20,tmdb_id:13916,anime_name:'Death Note',anime_year:2006,anime_type:'anime',anime_link:'death-note'};
 const detail={...row,episodes:[{anime_id:20,anime_season:1,episode_number:2,episode_link_720:'https://video.konununuzmani.com/video/wrong'},
  {anime_id:20,anime_season:1,episode_number:1,episode_link_720:'https://video.konununuzmani.com/video/right'}]};
 const fixture={
  'https://api.sonanime.com/api/anime/search?q=Death%20Note':{json:[row]},
  'https://api.sonanime.com/api/anime/link/death-note':{json:detail},
  'https://video.konununuzmani.com/video/right':{body:mp4({width:852,height:480}),mime:'video/mp4'}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try { const rows=await scanSonAnime(http,anime);assert.equal(rows.length,1);assert.equal(rows[0].filenameSynthetic,true);
  const video=await probe(http,rows[0]);assert.equal(video.downloadable,true);assert.equal(video.dimensions.height,480);
  assert.deepEqual(await scanSonAnime(http,{...anime,year:2007}),[]);
  assert.deepEqual(await scanSonAnime(http,{...anime,season:2}),[]);
  assert.deepEqual(await scanSonAnime(http,{...anime,tmdbId:999}),[]);
 } finally {http.close();}
 assert.equal(matchesAnime({tmdb_id:13916,year:2006,is_series:true,name:'Death Note'},anime),true);
 assert.equal(matchesAnime({tmdb_id:13917,year:2006,is_series:true,name:'Death Note'},anime),false);
});
test('DiziYou: doğrulanmış dizi/bölümden yalnız gerçek video ve TR track alınır; reklam MP4 sayılmaz',async()=>{
 const fixture={
  'https://www.diziyou.one/fleabag/':{body:ld({'@type':'TVSeries',name:'Fleabag',startDate:'2016'})+'<a href="/fleabag-1-sezon-1-bolum/">1</a>'},
  'https://www.diziyou.one/fleabag-1-sezon-1-bolum/':{body:ld({'@type':'TVEpisode',partOfSeries:{name:'Fleabag'},partOfSeason:{seasonNumber:1},episodeNumber:1})+'<iframe id="diziyouPlayer" src="/player/123.html?next=abc"></iframe>'},
  'https://www.diziyou.one/player/123.html':{body:'<video id="ad"><source src="https://ad.test/ad.mp4"></video><video id="diziyou"><source src="https://stream.test/master.m3u8"><track srclang="tr" src="https://subs.test/tr.vtt"></video>'}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const rows=await scanDiziYou(http,tv);assert.equal(rows.length,1);assert.equal(rows[0].url,'https://stream.test/master.m3u8');
  assert.equal(rows[0].subtitles[0].language,'tr');assert.deepEqual(rows[0].claimedAudioLanguages,['en']);
  assert.deepEqual(await scanDiziYou(http,{...tv,year:2019}),[]);
  fixture['https://www.diziyou.one/fleabag-1-sezon-1-bolum/'].body=ld({'@type':'TVEpisode',partOfSeries:{name:'Fleabag'},partOfSeason:{seasonNumber:1},episodeNumber:2});
  assert.deepEqual(await scanDiziYou(http,tv),[]);
 }finally{http.close();}
});
test('FilmModu: özgün başlık/yıl ve kaynak altyazı IMDb çelişkisi denetlenir; HLS asla dosya olmaz',async()=>{
 const page='<h1 itemprop="name">The Matrix</h1><span itemprop="dateCreated">1999</span><script>var videoId = \'50\'; var videoType = \'en\';</script>';
 const sources={subtitle:'/uploads/subs/tt0133093/0.vtt',sources:[{src:'https://stream.test/720.m3u8',label:'1080p'}]};
 const fixture={
  'https://www.filmmodu.one/film-ara?term=The%20Matrix':{body:'<a href="/the-matrix-altyazili-film-izle">The Matrix</a>'},
  'https://www.filmmodu.one/the-matrix-altyazili-film-izle':{body:page},
  'https://www.filmmodu.one/get-source?movie_id=50&type=en':{json:sources},
  'https://stream.test/720.m3u8':{body:'#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nfile.ts\n#EXT-X-ENDLIST\n'}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const rows=await scanFilmModu(http,{...film,originalLanguage:'en'});assert.equal(rows.length,1);
  const video=await probe(http,rows[0],true,false,{detailedHls:false});assert.equal(video.downloadable,false);assert.equal(video.dimensions,null);
  sources.subtitle='/uploads/subs/tt9999999/0.vtt';assert.deepEqual(await scanFilmModu(http,film),[]);
  assert.deepEqual(await scanFilmModu(http,{...film,year:2003}),[]);
 }finally{http.close();}
});
test('Aynı HLS URL için çelişen üç çözünürlük tek Auto olur; yalnız kullanılan ses grubu gösterilir',async()=>{
 const master='#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="English",LANGUAGE="en"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="unused",NAME="Turkish",LANGUAGE="tr"\n'+[480,720,1080].map(n=>`#EXT-X-STREAM-INF:BANDWIDTH=${n*1000},RESOLUTION=${n*2}x${n},AUDIO="a"\nsame.m3u8`).join('\n');
 const http=createHttp({fetchImpl:fixtureFetch({})});
 try{const video=await inspectHls(http,master,'https://stream.test/master.m3u8',{headers:{},identity:film},{detailed:false});
  assert.equal(video.resolutionOptions.length,0);assert.equal(video.renditions.length,0);assert.equal(video.sizeEstimate,null);assert.deepEqual(video.audioLanguages,['en']);
 }finally{http.close();}
});
test('Yılsız tam TV release eşleşmesi güçlüdür; sentetik dosya adı ve yanlış bölüm bu kanıtı üretemez',()=>{
 const filename='Fleabag.S01E01.1080p.WEB-DL.GROUP.mkv',sub={language:'tr',releaseName:filename.replace('.mkv','.srt'),_scope:'title',_identityBound:true};
 assert.equal(scoreSubtitle(sub,{filename},{},tv,true).score,95);
 assert.notEqual(scoreSubtitle(sub,{filename,filenameSynthetic:true},{},tv,true)?.score,95);
 assert.equal(scoreSubtitle({...sub,releaseName:filename.replace('E01','E02')},{filename},{},tv,true),null);
});
test('Bozuk Türkçe kodlamalı mevcut altyazı yerine temiz alternatif korunur; remote dosya onarıldı denmez',async()=>{
 const cue=text=>`1\n00:00:01,000 --> 00:00:02,000\n${text}\n`;
 const http=createHttp({fetchImpl:fixtureFetch({'https://subs.test/bad.srt':{body:cue('ÅŸ Ä±')},'https://subs.test/good.srt':{body:cue('ş ı')}})});
 try{const rows=await loadSubtitles(http,{subtitles:[{url:'https://subs.test/bad.srt',language:'tr'},{url:'https://subs.test/good.srt',language:'tr'}]},film,false);
  assert.equal(rows.length,1);assert.equal(rows[0].url,'https://subs.test/good.srt');
 }finally{http.close();}
});
test('Archive genel dizi taraması: tam IMDb ve S/E, yanlış ada/yıla/bölüme veya kimliksiz yılsız kayda izin vermez',async()=>{
 const meta={title:'Fleabag Complete',imdb_id:tv.imdbId};
 const fixture={
  [archiveQuery(tv,true)]:{json:{response:{docs:[{identifier:'series-fixture',title:meta.title}]}}},
  'https://archive.org/metadata/series-fixture':{json:{metadata:meta,files:[{name:'Fleabag.S01E01.720p.mp4'},{name:'Fleabag.S01E02.720p.mp4'},{name:'Another.S01E01.mp4'}]}}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const rows=await scanArchive(http,tv);assert.equal(rows.length,1);assert.match(rows[0].filename,/S01E01/);
  meta.imdb_id='tt9999999';assert.deepEqual(await scanArchive(http,tv),[]);
  delete meta.imdb_id;assert.deepEqual(await scanArchive(http,tv),[]);
  meta.imdb_id=tv.imdbId;meta.year=2019;assert.deepEqual(await scanArchive(http,tv),[]);
 }finally{http.close();}
});
test('DiziBak: public ilk bölüm tarihi+kategori bağı gerekir; embed .mp4 HTML kalır, eval çalışmaz',async()=>{
 const first={id:2,date:'2016-07-21T01:00:00',categories:[12],title:{rendered:'Fleabag 1. Sezon 1. Bölüm'},content:{rendered:'<iframe src="https://player.dizibak.net/embed/123.mp4"></iframe>'}};
 const fixture={
  'https://dizibak.net/wp-json/wp/v2/posts?slug=fleabag-1-sezon-1-bolum&_fields=id,slug,title,content,link,categories,date':{json:[first]},
  'https://dizibak.net/wp-json/wp/v2/categories/12':{json:{parent:0,name:'Fleabag'}},
  'https://player.dizibak.net/embed/123.mp4':{body:"eval(function(p,a,c,k,e,d){}('0:{1:[2]}',10,3,'player|sources|\"https://stream.test/master.m3u8\"'.split('|'),0,{}));"}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const rows=await scanDiziBak(http,{...tv,firstAirDate:'2016-07-21'});assert.equal(rows.length,1);assert.equal(rows[0].url,'https://stream.test/master.m3u8');
  assert.deepEqual(await scanDiziBak(http,{...tv,firstAirDate:'2004-07-21'}),[]);
  first.title.rendered='Fleabag 1. Sezon 2. Bölüm';assert.deepEqual(await scanDiziBak(http,{...tv,firstAirDate:'2016-07-21'}),[]);
 }finally{http.close();}
 assert.equal(unpackPlayer("eval('fetch(secret)')"),null);assert.equal(unpackPlayer("}('0',36,1,'bad'.split('|')"),null);
});
test('Önerilen ses sırası özgün/TR/EN tercih eder; küçükten büyüğe tercihi ve farklı dilde seçenek korunur',()=>{
 const {rankStreams}=require('../src/ranking.cjs'),{formatResults}=require('../src/index.cjs');
 const pair=(id,language,size)=>({candidate:{url:'https://media.test/'+id+'.mp4',source:id,identity:{originalLanguage:'en'},headers:{},subtitles:[]},video:{url:'https://media.test/'+id+'.mp4',container:'mp4',downloadable:true,size,audioLanguages:[language]},subtitles:[]});
 const rows=[pair('hi','hin',100),pair('en','eng',200)];
 assert.equal(rankStreams(rows,20,{sortOrder:'recommended'})[0].candidate.source,'en');
 assert.equal(rankStreams(rows,20,{sortOrder:'size_asc'})[0].candidate.source,'hi');
 assert.equal(formatResults(rows,{},film)[0].language,'Ses: HI · TR altyazı yok');
 const a=pair('one','eng',200),b=pair('two','eng',200);a.video.videoHash=b.video.videoHash='0123456789abcdef';
 assert.equal(formatResults([a,b],{},film).length,1);
});
test('Aynı aramada kesin izin/404 hatasına tekrar istek gitmez; farklı başlık ve yeni arama etkilenmez',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch({'https://source.test/no':{status:403}},calls)});
 try{await http.json('https://source.test/no');await http.json('https://source.test/no');assert.equal(calls.length,1);
  await http.json('https://source.test/no',{headers:{Referer:'https://source.test/'}});assert.equal(calls.length,2);
 }finally{http.close();}
});
