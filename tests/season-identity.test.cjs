'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');const{resolveSeasonEpisode}=require('../src/matching.cjs'),{createHttp}=require('../src/http.cjs'),{fixtureFetch}=require('./helpers.cjs');
const target={type:'tv',tmdbId:123456,year:2020,season:3,episode:2},url='https://api.themoviedb.org/3/tv/123456/season/3?api_key=test';
const reference=()=>({season_number:3,air_date:'2024-02-01',episodes:[{show_id:123456,season_number:3,episode_number:2,runtime:72}]});
test('Sezon metadata: aynı TMDB show/season/episode ile sezon yılı ve bölüm süresi bağlanır',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch({[url]:{json:reference()}},calls)});try{assert.deepEqual(await resolveSeasonEpisode(http,target,'test'),{seasonReleaseYear:2024,runtimeMinutes:72});assert.equal(calls.length,1);assert.equal(target.year,2020);}finally{http.close();}
});
test('Sezon metadata: başka show/sezon/bölüm, eksik süre veya geçersiz yıl fallback ile tamamlanmaz',async()=>{
 for(const change of['show','season','episode','runtime','date','before','duplicate']){const data=reference();if(change==='show')data.episodes[0].show_id=999999;if(change==='season')data.season_number=2;if(change==='episode')data.episodes[0].episode_number=1;if(change==='runtime')data.episodes[0].runtime=null;if(change==='date')data.air_date='2024';if(change==='before')data.air_date='2019-01-01';if(change==='duplicate')data.episodes.push({...data.episodes[0]});
 const http=createHttp({fetchImpl:fixtureFetch({[url]:{json:data}})});try{assert.equal(await resolveSeasonEpisode(http,target,'test'),null,change);}finally{http.close();}}
});
test('Sezon metadata: film/eksik key/eksik bölüm için ağ işi açılmaz; 403 boş döner',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch({[url]:{status:403}},calls)});try{assert.equal(await resolveSeasonEpisode(http,{...target,type:'movie'},'test'),null);assert.equal(await resolveSeasonEpisode(http,target,''),null);assert.equal(await resolveSeasonEpisode(http,{...target,episode:null},'test'),null);assert.equal(calls.length,0);assert.equal(await resolveSeasonEpisode(http,target,'test'),null);}finally{http.close();}
});
