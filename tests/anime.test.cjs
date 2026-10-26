'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createProvider}=require('../src/index.cjs');
const {createHttp}=require('../src/http.cjs');
const {matchesAnime,scanAnimecix}=require('../src/providers/animecix.cjs');
const {fixtureFetch,mp4,srt}=require('./helpers.cjs');
const target={tmdbId:13916,type:'tv',originalTitle:'DEATH NOTE',year:2006,season:1,episode:1,imdbId:'tt0877057',isAnime:true,searchTitles:['Death Note','DEATH NOTE']};
const embed='a'.repeat(24),sourceId=7585;
const record={id:sourceId,tmdb_id:13916,imdb_id:target.imdbId,original_title:'DEATH NOTE',year:2006,is_series:true};
const source={title_id:sourceId,season_num:1,episode_num:1,approved:true,category:'full',language:'tr',url:`https://tau-video.xyz/embed/${embed}`};
const video={_id:embed,title_id:sourceId,season_number:1,episode_number:1,urls:[{label:'2160p',size:999999999,url:'https://media.test/anime.mp4'}]};
function fixture(){return{
 'https://api.themoviedb.org/3/tv/13916?api_key=test&append_to_response=external_ids':{json:{id:13916,name:'Death Note',original_name:'DEATH NOTE',first_air_date:'2006-10-04',original_language:'ja',genres:[{id:16}],external_ids:{imdb_id:target.imdbId}}},
 'https://animecix.tv/secure/search/Death-Note?type=&limit=20':{json:{results:[record]}},
 'https://animecix.tv/secure/episode-videos?titleId=7585&episode=1&season=1':{json:[source]},
 [`https://tau-video.xyz/api/video/${embed}`]:{json:video},
 'https://media.test/anime.mp4':{body:mp4({width:1280,height:720}),mime:'video/mp4'},
 'https://altyazidb.online/subtitles/series/tt0877057%3A1%3A1.json':{json:{subtitles:[{lang:'tr',title:'S01E01 WEB-DL',url:'https://subs.test/anime.srt'}]}},
 'https://subs.test/anime.srt':{body:srt,mime:'text/plain'}
};}
test('anime: TMDB/özgün başlık/yıl birlikte şart; film-dizi ve farklı anime karışmaz',()=>{
 assert.equal(matchesAnime(record,target),true);
 for(const patch of [{tmdb_id:13917},{year:2017},{imdb_id:'tt9999999'},{original_title:'DEATH NOTE Movie'},{is_series:false}])
  assert.equal(matchesAnime({...record,...patch},target),false);
});
test('anime: gerçek MP4 boyut/pikseli API etiketini geçersiz kılar; mevcut TR SRT taşınır',async()=>{
 const calls=[],p=createProvider({lane:'anime',tmdbKey:'test',fetchImpl:fixtureFetch(fixture(),calls)});
 const streams=await p.getStreams(13916,'tv',1,1);
 assert.equal(streams.length,1);assert.equal(streams[0].quality,'720p · 1280×720');assert.equal(streams[0].type,'mp4');
 assert.notEqual(streams[0].size,'999999999');assert.equal(streams[0].subtitles[0].language,'tr');
 assert.ok(!calls.some(c=>/4khdhub|vaplayer|archive.org|vixsrc/.test(c.url)));
});
test('anime: yanlış bölüm/sezon/başlık bağı ve bozuk embed reddedilir; mutlak bölüm tahmini yok',async()=>{
 for(const patch of [{episode_number:2},{season_number:2},{title_id:999},{_id:'b'.repeat(24)}]){
  const data=fixture();data[`https://tau-video.xyz/api/video/${embed}`]={json:{...video,...patch}};
  const http=createHttp({fetchImpl:fixtureFetch(data)});
  try{assert.deepEqual(await scanAnimecix(http,target),[]);}finally{http.close();}
 }
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});
 try{assert.deepEqual(await scanAnimecix(http,{...target,isAnime:false}),[]);assert.equal(calls.length,0);}finally{http.close();}
});
