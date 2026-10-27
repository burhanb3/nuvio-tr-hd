'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanPurstream,searchRows,sheetIdentity,mediaUrl}=require('../src/providers/purstream.cjs');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {resolveTranslatedTitles}=require('../src/matching.cjs');
const {fixtureFetch}=require('./helpers.cjs');
const root='https://api.purstream.club/api/v1',url='https://free.finepulfe.xyz/movies/603-example/master.m3u8';
const target={tmdbId:603,type:'movie',originalTitle:'The Matrix',year:1999,searchTitles:['The Matrix'],runtimeMinutes:136,originalLanguage:'en'};
const success=items=>({type:'success',data:{items}});
function fixture(){return{
 [root+'/search-bar/search/The%20Matrix']:{json:success({movies:{items:[]}})},
 [root+'/search-bar/search/Matrix']:{json:success({movies:{items:[{id:11,type:'movie',release_date:'1999-03-31 00:00:00',title:'Matrix'}]}})},
 [root+'/media/11/sheet']:{json:success({id:11,tmdbId:603,type:'movie',releaseDate:'1999',published:true,title:'Matrix',urls:[{url,name:'1440p MULTI'}]})},
 [url]:{mime:'application/vnd.apple.mpegurl',body:'#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="English",LANGUAGE="en",URI="en.m3u8"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="French",LANGUAGE="fr",URI="fr.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=1800000,RESOLUTION=1280x720,AUDIO="a"\n720.m3u8\n'}
};}
test('Purstream: aynı TMDB/yıl ve resmi çeviri; 1440p etiketi yerine gerçek 720p, HLS online kalır',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{
  let titles=0;const rows=await scanPurstream(http,target,{loadTitles:async()=>{titles++;return['Matrix'];}});
  assert.equal(rows.length,1);assert.equal(titles,1);assert.equal(rows[0].identityConfidence,100);assert.equal(rows[0].claimedQuality,undefined);assert.equal(rows[0].claimedAudioLanguages,undefined);
  const video=await probe(http,rows[0],true,false,{detailedHls:false});assert.equal(video.container,'hls');assert.equal(video.downloadable,false);
  assert.deepEqual(video.resolutionOptions,[{width:1280,height:720}]);assert.deepEqual(new Set(video.audioLanguages),new Set(['en','fr']));
  assert.ok(!calls.some(c=>Object.keys(c.headers||{}).some(k=>/cookie|authorization/i.test(k))));
 }finally{http.close();}
});
test('Purstream: ilk sonucu seçmez; başka kimlik/yıl/tür, yayımlanmamış kayıt ve resmi olmayan başlık elenir',async()=>{
 for(const patch of [{tmdbId:604},{type:'tv'},{releaseDate:'2000'},{published:false},{id:12}]){
  const f=fixture();Object.assign(f[root+'/media/11/sheet'].json.data.items,patch);let lookups=0;
  const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanPurstream(http,target,{loadTitles:async()=>{lookups++;return['Matrix'];}}),[]);assert.equal(lookups,0);}finally{http.close();}
 }
 const http=createHttp({fetchImpl:fixtureFetch(fixture())});try{assert.deepEqual(await scanPurstream(http,target),[]);}finally{http.close();}
 assert.deepEqual(searchRows(success({movies:{items:[{id:11,type:'tv',release_date:'1999'}]}}),target),[]);
 assert.equal(sheetIdentity(success({id:11,tmdbId:603,type:'movie',published:true,releaseDate:'upload 1999',title:'The Matrix'}),11,target),null);
});
test('Purstream: dizide sheet içindeki karışık bölümler kullanılmaz; istenen S/E yanıtı ve URL birlikte doğrulanır',async()=>{
 const tv={...target,tmdbId:67070,type:'tv',originalTitle:'Fleabag',searchTitles:['Fleabag'],year:2016,season:2,episode:1};
 const episodeUrl='https://free.finepulfe.xyz/tv/67070-example/S02/E01/master.m3u8',endpoint=root+'/stream/21/episode?season=2&episode=1';
 const f={
  [root+'/search-bar/search/Fleabag']:{json:success({movies:{items:[{id:21,type:'tv',release_date:'2016',title:'Fleabag'}]}})},
  [root+'/media/21/sheet']:{json:success({id:21,tmdbId:67070,type:'tv',releaseDate:'2016 - 2019',published:true,title:'Fleabag',urls:[{url:'https://free.finepulfe.xyz/tv/67070-example/S01/E01/master.m3u8'}]})},
  [endpoint]:{json:success({season:2,episode:1,sources:[{format:'m3u8',stream_url:episodeUrl}]})}
 };
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});try{
  assert.deepEqual((await scanPurstream(http,tv)).map(c=>c.url),[episodeUrl]);assert.ok(calls.some(c=>c.url===endpoint));
  f[endpoint].json.data.items.season=1;assert.deepEqual(await scanPurstream(http,tv),[]);
  f[endpoint].json.data.items.season=2;f[endpoint].json.data.items.sources[0].stream_url=episodeUrl.replace('/S02/','/S01/');assert.deepEqual(await scanPurstream(http,tv),[]);
 }finally{http.close();}
});
test('Purstream: premium/dış host, farklı TMDB yolu ve MP4 dönüşümü kabul edilmez; bozuk JSON aramayı düşürmez',async()=>{
 assert.equal(mediaUrl(url,target),url);
 for(const u of [url.replace('free.','premium.'),url.replace('/603-','/604-'),url.replace('master.m3u8','movie.mp4'),url+'?url=https://other.test/',url.replace('free.finepulfe.xyz','other.test')])assert.equal(mediaUrl(u,target),null);
 const f=fixture();f[root+'/search-bar/search/Matrix']={body:'<html>Service unavailable</html>',mime:'text/html'};
 const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanPurstream(http,target),[]);}finally{http.close();}
});
test('TMDB çeviri dili: mevcut TR/EN varsayılanı korunur; yalnız aynı kimlikten isteğe bağlı FR eklenir',async()=>{
 const endpoint='https://api.themoviedb.org/3/movie/603/translations?api_key=test',data={id:603,translations:[{iso_639_1:'fr',data:{title:'Matrix'}},{iso_639_1:'tr',data:{title:'Matrix TR'}},{iso_639_1:'en',data:{title:'The Matrix'}}]};
 const http=createHttp({fetchImpl:fixtureFetch({[endpoint]:{json:data}})});try{
  assert.deepEqual(await resolveTranslatedTitles(http,target,'test'),['Matrix TR','The Matrix']);
  assert.deepEqual(await resolveTranslatedTitles(http,target,'test',['fr','en']),['Matrix','The Matrix']);
  data.id=604;assert.deepEqual(await resolveTranslatedTitles(http,target,'test',['fr']),[]);
 }finally{http.close();}
});
