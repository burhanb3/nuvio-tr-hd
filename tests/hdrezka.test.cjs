'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanHdRezka,pageIdentity,searchPages,translations,exactEpisode,fileVariants}=require('../src/providers/hdrezka.cjs');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {fixtureFetch,box,moov}=require('./helpers.cjs');
const root='https://rezka.ag',page=root+'/films/fiction/100-the-matrix-1999.html',tvPage=root+'/series/drama/200-fleabag-2016.html';
const target={tmdbId:603,type:'movie',originalTitle:'The Matrix',searchTitles:['The Matrix'],year:1999,imdbId:'tt0133093',runtimeMinutes:136,originalLanguage:'en'};
const translator='<li class="b-translator__item" data-id="100" data-translator_id="25" data-camrip="0" data-ads="0" data-director="0" title="Оригинал (+субтитры)">Original</li>';
function detail(url=page,t=target){return '<meta property="og:url" content="'+url+'"><div class="b-post__origtitle">'+t.originalTitle+'</div><tr><td>Дата выхода:</td><td>24 March '+t.year+'</td></tr><a href="/help/'+Buffer.from(encodeURIComponent('https://www.imdb.com/title/'+t.imdbId+'/')).toString('base64')+'/">IMDb</a>'+translator;}
const stream={success:true,premium_content:0,url:'[360p]https://stream.voidboost.one/low.mp4:hls:manifest.m3u8 or https://stream.voidboost.one/low.mp4,[1080p]https://stream.voidboost.one/high.mp4,[<span class="pjs-prem-quality">4K</span>]https://stream.voidboost.one/teaser.mp4'};
function media(seconds=8160,width=1920,height=800){const duration=Buffer.alloc(20);duration.writeUInt32BE(1000,12);duration.writeUInt32BE(seconds*1000,16);return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',box('mvhd',duration),moov(width,height).subarray(8)),box('mdat',Buffer.alloc(32))]);}
function fixture(t=target){return{
 [root+'/search/?do=search&subaction=search&q='+encodeURIComponent(t.originalTitle)]:{body:'<div class="b-content__inline_item" data-id="100" data-url="'+page+'"><span>'+t.year+'</span></div>'},
 [page]:{body:detail(page,t)},[root+'/ajax/fixture']:{json:stream},
 ['https://stream.voidboost.one/high.mp4']:{body:media(),mime:'video/mp4'},['https://stream.voidboost.one/low.mp4']:{body:media(),mime:'video/mp4'}
};}
function httpFor(f,calls=[],post){const fetcher=fixtureFetch(f);return createHttp({fetchImpl:async(url,options={})=>{calls.push({url,...options});const actual=url.startsWith(root+'/ajax/get_cdn_series/?')?root+'/ajax/fixture':url;if(actual!==url&&post){const r=await post(options);if(r)return r;}const response=await fetcher(actual,options);return{...response,url};}});}
test('HDRezka: IMDb/başlık/yıl bağı, ücretsiz MP4 ve gerçek piksel; premium ve HLS indirmeye dönüşmez',async()=>{
 const calls=[],http=httpFor(fixture(),calls);try{const rows=await scanHdRezka(http,target);assert.equal(rows.length,2);assert.ok(rows.every(r=>r.requireDuration&&r.claimedAudioLanguages[0]==='en'));
 const video=await probe(http,rows[0]);assert.equal(video.downloadable,true);assert.deepEqual(video.dimensions,{width:1920,height:800});assert.equal(video.duration,8160);
 assert.ok(calls.every(c=>!Object.keys(c.headers||{}).some(k=>/cookie|authorization/i.test(k))));assert.ok(calls.some(c=>c.body?.includes('translator_id=25')&&c.body.includes('action=get_movie')));
 assert.ok(rows.every(r=>!r.url.includes('teaser')&&!r.url.includes('m3u8')));
 }finally{http.close();}
});
test('HDRezka: yanlış IMDb, başlık, yıl, canonical ve korumalı sayfa reddedilir',async()=>{
 assert.equal(pageIdentity(detail(),page,target)?.id,'100');
 for(const text of [detail().replace('1999','2000'),detail().replace('og:url" content="'+page,'og:url" content="https://wrong.test/'),detail()+'<div class="b-player__restricted__block_message">restricted</div>'])assert.equal(pageIdentity(text,page,target),null);
 assert.equal(pageIdentity(detail(),page,{...target,imdbId:'tt9999999'}),null);
 const f=fixture();f[page].body=detail().replace('b-post__origtitle">The Matrix','b-post__origtitle">The Matrix Reloaded');const http=httpFor(f);try{assert.deepEqual(await scanHdRezka(http,target),[]);}finally{http.close();}
 assert.deepEqual(searchPages('<div class="b-content__inline_item" data-id=")" data-url="'+page+'">1999</div>',target),[]);
});
test('HDRezka: başlık alternatifi yalnız kimliği/yılı doğrulanmış kayda bağlı metadata ile kullanılır',async()=>{
 const f=fixture();f[page].body=detail().replace('b-post__origtitle">The Matrix','b-post__origtitle">Matrix Alias');let lookups=0;
 const http=httpFor(f);try{assert.deepEqual(await scanHdRezka(http,target),[]);const rows=await scanHdRezka(http,target,{loadTitles:async()=>{lookups++;return['Matrix Alias'];}});assert.equal(rows.length,2);assert.equal(lookups,1);
 assert.deepEqual(await scanHdRezka(http,{...target,imdbId:'tt9999999'},{loadTitles:async()=>{throw Error('must not load on wrong IMDb');}}),[]);
 }finally{http.close();}
});
test('HDRezka: kaynak RU dublajını TR saymaz; ücretli, camrip ve reklamlı çeviri seçmez',()=>{
 const extra='<li class="b-translator__item" data-translator_id="1" title="Дубляж">Dub</li><li class="b-translator__item b-prem_translator" data-translator_id="2" title="Turkish">TR</li><li class="b-translator__item" data-translator_id="3" data-camrip="1" title="Turkish">TR</li><a class="b-translator__item" data-id="100" data-translator_id="4" title="Türkçe">TR</a>';
 assert.deepEqual(translations(translator+extra,'100',target).map(r=>[r.id,r.language]),[['4','tr'],['25','en']]);
 assert.deepEqual(fileVariants({...stream,premium_content:1}),[]);assert.deepEqual(fileVariants({...stream,url:'#encoded-data'}),[]);
 assert.deepEqual(fileVariants({...stream,url:'[1080p]https://ad.test/movie.mp4'}),[]);
});
test('HDRezka: TV bölüm listesi aynı çeviride parent/sezon/bölüm doğrular, başka bölüme fallback yapmaz',async()=>{
 const tv={...target,tmdbId:67070,type:'tv',originalTitle:'Fleabag',searchTitles:['Fleabag'],year:2016,imdbId:'tt5687612',season:2,episode:1,runtimeMinutes:26},f=fixture(tv),calls=[];
 const search=root+'/search/?do=search&subaction=search&q=Fleabag';f[search].body='<div class="b-content__inline_item" data-id="200" data-url="'+tvPage+'">2016</div>';
 f[tvPage]={body:detail(tvPage,tv).replace('data-id="100"','data-id="200"')};f['https://stream.voidboost.one/high.mp4'].body=media(1560);
 let correct=true;const http=httpFor(f,calls,async options=>{if(!options.body.includes('action=get_episodes'))return;const body=JSON.stringify({success:true,episodes:'<ul><li class="b-simple_episode__item" data-id="200" data-season_id="'+(correct?2:1)+'" data-episode_id="1"></li></ul>'});return{ok:true,status:200,url:root+'/ajax/get_cdn_series/',headers:{get:()=> 'text/html'},text:async()=>body};});
 try{const rows=await scanHdRezka(http,tv);assert.equal(rows.length,2);assert.equal((await probe(http,rows[0])).duration,1560);assert.ok(calls.some(c=>c.body?.includes('season=2')&&c.body.includes('episode=1')));
 correct=false;calls.length=0;assert.deepEqual(await scanHdRezka(http,tv),[]);assert.ok(!calls.some(c=>c.body?.includes('action=get_stream')));
 assert.equal(exactEpisode('<li class="b-simple_episode__item" data-id="201" data-season_id="2" data-episode_id="1">','200',tv),false);
 }finally{http.close();}
});
test('HDRezka: kısa teaser tam film gibi kabul edilmez; bozuk stream yanıtı boş döner',async()=>{
 const f=fixture();f['https://stream.voidboost.one/high.mp4'].body=media(30);const http=httpFor(f);try{const rows=await scanHdRezka(http,target);assert.equal(await probe(http,rows[0]),null);f[root+'/ajax/fixture']={json:{success:false}};assert.deepEqual(await scanHdRezka(http,target),[]);}finally{http.close();}
});
test('HDRezka: ücretsiz düz 4K etiketi atlanmaz; 4K kararı dosyanın gerçek pikselinden gelir',async()=>{
 const f=fixture();f[root+'/ajax/fixture']={json:{success:true,premium_content:0,url:'[4K]https://stream.voidboost.one/high.mp4,[<span class="pjs-prem-quality">4K</span>]https://stream.voidboost.one/teaser.mp4'}};f['https://stream.voidboost.one/high.mp4'].body=media(8160,3840,1600);
 const http=httpFor(f);try{const rows=await scanHdRezka(http,target);assert.equal(rows.length,1);assert.equal(rows[0].claimedQuality,'2160p');assert.deepEqual((await probe(http,rows[0])).dimensions,{width:3840,height:1600});}finally{http.close();}
});
