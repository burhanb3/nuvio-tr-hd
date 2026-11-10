'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanAnizone,searchRows,episodeCandidate}=require('../src/providers/anizone.cjs');
const{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs'),{fixtureFetch}=require('./helpers.cjs');
const root='https://anizone.to',slug='example1',url='https://fixture.vid-cdn.xyz/11111111-1111-4111-8111-111111111111/master.m3u8';
const target={tmdbId:123456,type:'tv',originalTitle:'Example Anime',searchTitles:['Example Anime'],year:2020,season:1,episode:2,isAnime:true,runtimeMinutes:24};
const quote=data=>JSON.stringify(data).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\u0022');
const row={slug,url:root+'/anime/'+slug,main_title:'Example Anime',title_list:{en:'Example Anime'},type:'TV Series',is_unsafe:false,start_year:2020,episode_count:12};
function fixture(){const snapshot=JSON.stringify({data:{anime_slug:slug,episode_slug:'2'}}).replace(/"/g,'&quot;');return{
 [root+'/anime?search=Example%20Anime']:{body:"<div x-data=\"{items:JSON.parse('"+quote([row])+"')}\"></div>"},
 [root+'/anime/'+slug+'/2']:{body:'<div wire:snapshot="'+snapshot+'" x-data="{anmTitles:JSON.parse(\''+quote(row.title_list)+'\')}"></div><div x-data="vidstackPlayer(JSON.parse(\''+quote({src:url,subtitles:[{language:'en',format:'ass',file:url.replace('master.m3u8','captions.ass')}]})+'\'))"></div>'},
 [url]:{body:'#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="Japanese",LANGUAGE="ja",URI="ja.m3u8"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="English",LANGUAGE="en",URI="en.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=640x360,AUDIO="a"\n360.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2300000,RESOLUTION=1280x720,AUDIO="a"\n720.m3u8\n',mime:'application/vnd.apple.mpegurl'}
 };}
test('Anizone: tam ad/yıl, sezon 1 ve sayfanın bölüm kimliği; gerçek çok sesli HLS online kalır',async()=>{
 const calls=[],h=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{
  const rows=await scanAnizone(h,target);assert.equal(rows.length,1);assert.deepEqual(rows[0].subtitles,[]);assert.equal(rows[0].claimedQuality,undefined);
  const video=await probe(h,rows[0],true,false,{detailedHls:false});assert.equal(video.downloadable,false);assert.deepEqual(video.audioLanguages,['ja','en']);assert.deepEqual(video.resolutionOptions,[{width:640,height:360},{width:1280,height:720}]);
  assert.ok(!calls.some(c=>/\.ass$|\/fonts\/|mapping|jikan/.test(c.url)));
 }finally{h.close();}
});
test('Anizone: benzer başlık/yıl/tür, belirsiz çift sonuç ve yanlış bölüm düşürülür',async()=>{
 const f=fixture(),search=f[root+'/anime?search=Example%20Anime'].body,page=f[root+'/anime/'+slug+'/2'].body;
 for(const patch of[{main_title:'Other Anime',title_list:{}},{start_year:2021},{type:'Movie'},{is_unsafe:true},{url:'https://other.test/anime/'+slug}])assert.deepEqual(searchRows("items:JSON.parse('"+quote([{...row,...patch}])+"')",target),[]);
 assert.equal(episodeCandidate(page.replace('&quot;episode_slug&quot;:&quot;2&quot;','&quot;episode_slug&quot;:&quot;3&quot;'),row,target),null);
 f[root+'/anime?search=Example%20Anime'].body=search.replace(quote([row]),quote([row,row]));
 const h=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanAnizone(h,target),[]);}finally{h.close();}
});
test('Anizone: sonraki sezonda mutlak bölüm tahmini veya normal dizide anime araması yok',async()=>{
 const calls=[],h=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{
  assert.deepEqual(await scanAnizone(h,{...target,season:2}),[]);assert.deepEqual(await scanAnizone(h,{...target,isAnime:false}),[]);assert.equal(calls.length,0);
 }finally{h.close();}
});
