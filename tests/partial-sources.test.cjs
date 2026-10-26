'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createProvider}=require('../src/index.cjs');
const {fixtureFetch,mp4,srt}=require('./helpers.cjs');
const meta={id:123456,name:'Example Anime',original_name:'Example Anime',first_air_date:'2020-01-01',original_language:'ja',genres:[{id:16}]};
const target={tmdbId:123456,originalTitle:'Example Anime',year:2020,type:'tv',season:1,episode:1};
const request='https://api.themoviedb.org/3/tv/123456?api_key=test&append_to_response=external_ids';
const candidate=url=>({url,source:'Fixture',headers:{},subtitles:[{url:'https://subs.test/tr.srt',language:'tr',identity:target,_scope:'paired'}],identity:target,filename:'Example.Anime.S01E01.mp4'});
const fixture={
 [request]:{json:meta},'https://media.test/a.mp4':{body:mp4(),mime:'video/mp4'},'https://media.test/b.mp4':{body:mp4({width:1280,height:720}),mime:'video/mp4'},'https://subs.test/tr.srt':{body:srt,mime:'text/plain'}
};
test('Kısmi kaynak boş/yavaş olsa da bağımsız anime taramasının geçerli MP4/TR sonucu tamamlanır', {timeout:2000},async()=>{
 let release,extraDone=false;
 const extra=createProvider({lane:'extraAnime',tmdbKey:'test',fetchImpl:fixtureFetch(fixture),settings:{animomEnabled:false},sourceFactories:[{name:'Slow',run:()=>new Promise(r=>{release=r;})}]});
 const extraJob=extra.getStreams(123456,'tv',1,1).then(rows=>{extraDone=true;return rows;});
 const regular=createProvider({lane:'anime',tmdbKey:'test',fetchImpl:fixtureFetch(fixture),settings:{animecixEnabled:false,sonanimeEnabled:false,autoSubtitles:false},sourceFactories:[{name:'Fast',run:async()=>[candidate('https://media.test/a.mp4')]}]});
 const rows=await regular.getStreams(123456,'tv',1,1);assert.equal(rows.length,1);assert.equal(rows[0].subtitles[0].language,'tr');assert.equal(extraDone,false);
 release([]);assert.deepEqual(await extraJob,[]);assert.equal(rows.length,1);
});
test('Ek Anime iki ayrı geçerli dosyayı korur, aynı anda tek dosya kontrol eder', {timeout:2000},async()=>{
 let active=0,maximum=0;const fetcher=fixtureFetch(fixture);
 const provider=createProvider({lane:'extraAnime',tmdbKey:'test',settings:{animomEnabled:false,autoSubtitles:false},sourceFactories:[{name:'Partial',run:async()=>[candidate('https://media.test/a.mp4'),candidate('https://media.test/b.mp4')]}],fetchImpl:async(u,o)=>{
 if(!u.startsWith('https://media.test/'))return fetcher(u,o);
 maximum=Math.max(maximum,++active);await new Promise(r=>setImmediate(r));try{return await fetcher(u,o);}finally{active--;}
 }});
 const rows=await provider.getStreams(123456,'tv',1,1);assert.equal(rows.length,2);assert.equal(maximum,1);assert.ok(rows.every(r=>r.subtitles[0].language==='tr'));
});
test('HLS kapalıyken DiziYou içindeki gerçek MP4 ve Türkçe altyazı yine bulunur; HLS/reklam indirme sayılmaz',async()=>{
 const tv={id:67070,original_name:'Fleabag',first_air_date:'2016-07-21'},origin='https://www.diziyou.one',ld=d=>`<script type="application/ld+json">${JSON.stringify(d)}</script>`,calls=[];
 const f={
  'https://api.themoviedb.org/3/tv/67070?api_key=test&append_to_response=external_ids':{json:tv},
  [origin+'/fleabag/']:{body:ld({'@type':'TVSeries',name:'Fleabag',startDate:'2016'})+'<a href="/fleabag-1-sezon-1-bolum/">1</a>'},
  [origin+'/fleabag-1-sezon-1-bolum/']:{body:ld({'@type':'TVEpisode',partOfSeries:{name:'Fleabag'},partOfSeason:{seasonNumber:1},episodeNumber:1})+'<iframe id="diziyouPlayer" src="/player/123.html"></iframe>'},
  [origin+'/player/123.html']:{body:'<video id="ad"><source src="https://ad.test/ad.mp4"></video><video id="diziyou"><source src="https://media.test/a.mp4"><source src="https://media.test/hls.m3u8"><track srclang="tr" src="https://subs.test/tr.srt"></video>'},
  'https://media.test/a.mp4':{body:mp4(),mime:'video/mp4'},'https://subs.test/tr.srt':{body:srt,mime:'text/plain'}
 };
 const provider=createProvider({lane:'main',tmdbKey:'test',fetchImpl:fixtureFetch(f,calls),settings:{includeHls:false,autoSubtitles:false,archiveEnabled:false,hdhubEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,dizibakEnabled:false}});
 const rows=await provider.getStreams(67070,'tv',1,1);assert.equal(rows.length,1);assert.equal(rows[0].type,'mp4');assert.equal(rows[0].subtitles[0].language,'tr');
 assert.ok(!calls.some(c=>/ad\.test|hls\.m3u8/.test(c.url)));
});
test('Boş/bozuk kısmi kaynak için altyazı servisine gereksiz istek açılmaz',async()=>{
 const calls=[],provider=createProvider({lane:'extraAnime',tmdbKey:'test',fetchImpl:fixtureFetch({[request]:{json:meta}},calls),settings:{animomEnabled:false},sourceFactories:[{name:'Missing',run:async()=>[candidate('https://media.test/missing.mp4')]}]});
 assert.deepEqual(await provider.getStreams(123456,'tv',1,1),[]);
 assert.ok(!calls.some(c=>/opensubtitles|altyazidb/.test(c.url)));
});
