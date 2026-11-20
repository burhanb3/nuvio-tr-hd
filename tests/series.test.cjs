'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createProvider}=require('../src/index.cjs');
const {createHttp}=require('../src/http.cjs');
const {scanPlayImdb,PLAY_API}=require('../src/providers/playimdb.cjs');
const {scanVixDirect}=require('../src/providers/vixsrc.cjs');
const {pageMatches,releaseEntries,seriesPagePoster,scanHdHub,HDHUB_ORIGIN}=require('../src/providers/hdhub.cjs');
const {matchesEpisode,resolvePosterPaths}=require('../src/matching.cjs');
const {scoreSubtitle}=require('../src/subtitle-discovery.cjs');
const {fixtureFetch,mp4}=require('./helpers.cjs');
const target={tmdbId:67070,type:'tv',originalTitle:'Fleabag',year:2016,season:1,episode:1,imdbId:'tt5687612',posterPath:'/Poster.jpg',runtimeMinutes:26};
const api=PLAY_API+'?tmdb=67070&type=tv&season=1&episode=1';
test('IMDb ile kimliği bağlı yıl içermeyen dizi dosyası kabul edilir; yanlış bölüm/kimlik edilmez',async()=>{
 const fixture={[api]:{json:{status_code:200,data:{imdb_id:target.imdbId,file_name:'Fleabag.S01E01.1080p.BluRay.x264',stream_urls:['https://media.test/episode.mp4']}}}};
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{
  assert.equal((await scanPlayImdb(http,target)).length,1);
  fixture[api].json.data.file_name='Fleabag.S01E02.1080p.BluRay';assert.deepEqual(await scanPlayImdb(http,target),[]);
  fixture[api].json.data.file_name='Fleabag.S01E01.1080p';fixture[api].json.data.imdb_id='tt9999999';assert.deepEqual(await scanPlayImdb(http,target),[]);
  assert.equal(matchesEpisode('Fleabag.1x01.WEB.mkv',target),true);
  assert.equal(matchesEpisode('Fleabag.S01E01-E02.mkv',target),false);
 }finally{http.close();}
});

test('Shameless: release grubu önekli bölüm doğru IMDb ve kanonik seri klasörüyle kabul edilir',async()=>{
 const wanted={...target,tmdbId:34307,originalTitle:'Shameless',year:2011,imdbId:'tt1586680'};
 const url=PLAY_API+'?tmdb=34307&type=tv&season=1&episode=1';
 const data={imdb_id:wanted.imdbId,file_name:'Shameless.US.S01.1080p.BluRay.X264-UNTOUCHABLES/untouchables-shameless.us.s01e01.1080p.mkv',stream_urls:['https://media.test/episode.m3u8']};
 const fixture={[url]:{json:{status_code:200,data}}},http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{assert.equal((await scanPlayImdb(http,wanted)).length,1);
  data.file_name='Shameless.US.S01/untouchables-other.show.s01e01.mkv';assert.deepEqual(await scanPlayImdb(http,wanted),[]);
  data.file_name='Other.Show.S01/untouchables-shameless.us.s01e01.mkv';assert.deepEqual(await scanPlayImdb(http,wanted),[]);
  data.file_name='Shameless.US.S01/untouchables-shameless.us.s01e02.mkv';assert.deepEqual(await scanPlayImdb(http,wanted),[]);
  data.file_name='Shameless.US.S01/untouchables-shameless.us.s01e01.sample.mkv';assert.deepEqual(await scanPlayImdb(http,wanted),[]);
 }finally{http.close();}
});

test('Dizi adındaki Trailer/Sample sözcükleri bölümün fragman olduğu anlamına gelmez',async()=>{
 const fixture={[api]:{json:{status_code:200,data:{imdb_id:target.imdbId,file_name:'Trailer.Park.Boys.S01E01.WEB.mkv',stream_urls:['https://media.test/episode.m3u8']}}}};
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{assert.equal((await scanPlayImdb(http,{...target,originalTitle:'Trailer Park Boys'})).length,1);}finally{http.close();}
});
test('VixSrc film yerine tam dizi/bölüm yolunu sorgular; farklı başlık reddedilir',async()=>{
 const calls=[],expires=String(Math.floor(Date.now()/1000)+3600),base='https://vixsrc.to';
 const fixture={
  [base+'/api/tv/67070/1/1']:{json:{src:'/embed/7?t=RmxlYWJhZw%3D%3D'}},
  [base+'/embed/7?t=RmxlYWJhZw%3D%3D']:{body:`window.masterPlaylist = {\nparams: {'token':'public','expires':'${expires}'},\nurl: '${base}/playlist/7',\n}`},
  [base+`/playlist/7?token=public&expires=${expires}&h=1`]:{body:'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720\nhttps://cdn.test/720.m3u8'}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture,calls)});
 try{assert.equal((await scanVixDirect(http,target)).length,1);assert.ok(calls.some(c=>c.url.includes('/api/tv/67070/1/1')));
  assert.deepEqual(await scanVixDirect(http,{...target,originalTitle:'Wrong Show'}),[]);
 }finally{http.close();}
});
test('HDHub dizi kimliği TMDB posteri, özgün ad/yıl ve tam bölümle bağlanır; paketler elenir',()=>{
 const head='<script type="application/ld+json">{"@type":"TVSeries","name":"Fleabag","startDate":"2016","image":"https://image.tmdb.org/t/p/w500/Poster.jpg"}</script>';
 const entry=(file)=>`<div class="episode-download-item"><div class="episode-file-title">${file}</div><span>1.5 GB</span><a href="https://greenmotors.club/example">Download HubCloud</a></div>`;
 const html=head+entry('Fleabag.S01E01.1080p.WEB-DL.mkv')+entry('Fleabag.S01E02.mkv')+entry('Fleabag.S01E01.zip');
 assert.equal(pageMatches(html,target),true);assert.equal(pageMatches(html,{...target,posterPath:'/Wrong.jpg'}),false);
 assert.equal(pageMatches(html,{...target,year:2019}),false);
 assert.equal(releaseEntries(html,target).length,1);
});
test('HDHub dizi sayfası aynı TMDB kaydının ana olmayan posteriyle bağlanır; başka poster/ad/yıl bağlanmaz',async()=>{
 const show={...target,tmdbId:48866,originalTitle:'The 100',year:2014,imdbId:'tt2661044',season:3,episode:5,seasonCount:7,posterPath:'/Primary.jpg',runtimeMinutes:43};
 const head=image=>`<script type="application/ld+json">{"@type":"TVSeries","name":"The 100","startDate":"2014","image":"https://image.tmdb.org/t/p/w500${image}"}</script>`;
 const entry=file=>`<div class="episode-download-item"><div class="episode-file-title">${file}</div><span>300 MB</span><a href="https://greenmotors.club/ep">Download HubCloud</a></div>`;
 const html=head('/EnglishPoster.jpg')+entry('The.100.S03E05.720p.WEB-DL.mkv');
 assert.equal(pageMatches(html,show),false);
 assert.equal(pageMatches(html,show,['/Other.jpg','/EnglishPoster.jpg']),true);
 assert.equal(pageMatches(html,show,['/Other.jpg']),false);
 assert.equal(seriesPagePoster(html,show),'/EnglishPoster.jpg');
 assert.equal(seriesPagePoster(html.replace('"The 100"','"The 1000"'),show),null);
 assert.equal(seriesPagePoster(html.replace('"2014"','"2015"'),show),null);
 assert.equal(seriesPagePoster(html.replace('image.tmdb.org','images.example.test'),show),null);
 // Lazy loading: only an exact type/title/year page asks TMDB for the poster list.
 const search={[HDHUB_ORIGIN+'/?s=The%20100']:{body:`<a href="${HDHUB_ORIGIN}/the-100-series-1/">The 100 (2014) Complete Series</a>`}};
 for(const [page,expected,loads] of [[html,1,1],[html.replace('"The 100"','"The 1000"'),0,0],[head('/Primary.jpg')+entry('The.100.S03E05.720p.WEB-DL.mkv'),1,0]]){
  let loaded=0;const requests=[],fixture={...search,[HDHUB_ORIGIN+'/the-100-series-1/']:{body:page}};
  const http=createHttp({fetchImpl:fixtureFetch(fixture,requests)});
  try{
   await scanHdHub(http,show,{loadPosters:async()=>{loaded++;return ['/EnglishPoster.jpg'];},onCandidates:async()=>{}});
   assert.equal(loaded,loads);
   // The release chain itself is not in this fixture; only a bound page reaches it.
   assert.equal(requests.filter(c=>c.url==='https://greenmotors.club/ep').length,expected);
  }finally{http.close();}
 }
});
test('TMDB poster listesi dizinin tüm dillerini ve istenen/son sezonu okur; başka kimlik ve bozuk yol elenir',async()=>{
 const show={tmdbId:48866,type:'tv',season:3,seasonCount:7};
 const base='https://api.themoviedb.org/3/tv/48866';
 const fixture={[base+'/images?api_key=k']:{json:{id:48866,posters:[{file_path:'/En.jpg',iso_639_1:'en'},{file_path:'/Ru.jpg',iso_639_1:'ru'},{file_path:'../bad.jpg'},{file_path:7}]}},
  [base+'/season/3/images?api_key=k']:{json:{id:1111,posters:[{file_path:'/S3.jpg'}]}},
  [base+'/season/7/images?api_key=k']:{json:{id:2222,posters:[{file_path:'/S7.png'}]}}};
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture,calls)});
 try{
  assert.deepEqual((await resolvePosterPaths(http,show,'k')).sort(),['/En.jpg','/Ru.jpg','/S3.jpg','/S7.png']);
  // No language parameter: a language filter would hide other-language posters.
  assert.ok(calls.every(c=>!/[?&]language=/.test(c.url)));
  fixture[base+'/images?api_key=k'].json.id=999;
  assert.deepEqual((await resolvePosterPaths(http,show,'k')).sort(),['/S3.jpg','/S7.png']);
  assert.deepEqual(await resolvePosterPaths(http,{...show,type:'movie'},'k'),[]);
  assert.deepEqual(await resolvePosterPaths(http,show,''),[]);
 }finally{http.close();}
});
test('AltyazıDB yıl içermeyen sürüm notu tam sürüm iddiasına dönüşmez; Türkçe bölüm dosyası döner',async()=>{
 const fixture={
  'https://api.themoviedb.org/3/tv/67070?api_key=test&append_to_response=external_ids':{json:{id:67070,original_name:'Fleabag',first_air_date:'2016-07-21',external_ids:{imdb_id:target.imdbId},episode_run_time:[26]}},
  [api]:{json:{status_code:200,data:{imdb_id:target.imdbId,file_name:'Fleabag.S01E01.1080p.WEB-DL',stream_urls:['https://media.test/episode.mp4']}}},
  'https://media.test/episode.mp4':{body:mp4()},
  'https://altyazidb.online/subtitles/series/tt5687612%3A1%3A1.json':{json:{subtitles:[{lang:'tur',title:'S01E01 • AMZN WEB-DL',url:'https://subs.test/tr.srt'}]}},
  'https://subs.test/tr.srt':{body:'1\n00:00:00,000 --> 00:25:00,000\nÖrnek\n',mime:'application/x-subrip'}
 };
 const p=createProvider({tmdbKey:'test',settings:{vixsrcEnabled:false,hdhubEnabled:false},fetchImpl:fixtureFetch(fixture)});
 const streams=await p.getStreams(67070,'series',1,1);
 assert.equal(streams.length,1);assert.equal(streams[0].subtitles.length,1);assert.match(streams[0].subtitles[0].name,/AltyazıDB/);
 assert.doesNotMatch(streams[0].subtitles[0].name,/Tam sürüm/);
 const candidate={filename:'Fleabag.S01E01.WEB.mkv',url:'https://media.test/episode.mkv'};
 assert.equal(scoreSubtitle({lang:'tr',title:'Fleabag.S01E02.WEB',_scope:'title',_identityBound:true},candidate,{},target,true),null);
});
