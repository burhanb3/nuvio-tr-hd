import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getQuickJS } from 'quickjs-emscripten';
import helpers from './helpers.cjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {SERVICE_ORIGIN}=require('../src/hosted.cjs');

const { makeFixture, responseFor, identity, target, mkv } = helpers;
const bundle = await readFile(new URL('../providers/nuvio-tr-hd.js', import.meta.url), 'utf8');
const onlineBundle = await readFile(new URL('../providers/nuvio-tr-hd-online.js', import.meta.url), 'utf8');
const animeBundle = await readFile(new URL('../providers/nuvio-tr-hd-anime.js', import.meta.url), 'utf8');
const extraAnimeBundle = await readFile(new URL('../providers/nuvio-tr-hd-extra-anime.js', import.meta.url), 'utf8');
const fastOnlineBundle = await readFile(new URL('../providers/nuvio-tr-hd-fast-online.js', import.meta.url), 'utf8');

test('QuickJS: MoviesDrive ilk/sonraki sezonun bölümünü ve kendi süresini bulur, IMDb çelişkisini reddeder',async()=>{
 const origin='https://new4.moviesdrive.beer',archive='https://mdrive.lol/archive/123/',hub='https://hubcloud.ist/drive/Example2',terminal='https://gamerxyt.com/hubcloud.php?id=example',file='https://pixeldrain.dev/api/file/Example2',name='Example.Series.S01E02.1080p.mkv';
 const e=helpers.ebml,duration=Buffer.alloc(8);duration.writeDoubleBE(1800000);const body=Buffer.concat([e('1a45dfa3',e('4282',Buffer.from('matroska'))),e('18538067',Buffer.concat([e('1549a966',e('4489',duration)),e('1654ae6b',Buffer.concat([e('ae',Buffer.concat([e('83',[1]),e('e0',Buffer.concat([e('b0',[7,128]),e('ba',[4,56])]))])),e('ae',Buffer.concat([e('83',[2]),e('22b59c',Buffer.from('eng'))]))]))])),Buffer.alloc(1000000)]);
 const fixture={
 'https://api.themoviedb.org/3/tv/123456?api_key=test&append_to_response=external_ids':{json:{id:123456,original_name:'Example Series',name:'Example Series',first_air_date:'2020-01-01',external_ids:{imdb_id:'tt1234567'},episode_run_time:[30]}},
 [origin+'/search.php?q=Example%20Series&page=1']:{json:{hits:[{document:{post_title:'Example Series (Season 1) 2020',imdb_id:'tt1234567',permalink:'/example-series/'}}]}},
 [origin+'/example-series/']:{body:'<article class="post-content"><h1>Example Series (Season 1) 2020</h1><a href="https://www.imdb.com/title/tt1234567/">IMDb</a><h5>Example Series (Season 1) 1080p [500MB/E]</h5><h5><a href="'+archive+'">1080p Single Episode</a></h5></article>'},
 [archive]:{body:'<title>Example Series (Season 1) 1080p</title><h5>Ep02&ndash;1080p [500MB]</h5><h5><a href="'+hub+'">HubCloud</a></h5>'},[hub]:{body:'<title>'+name+'</title><script>var url="'+terminal+'";</script>'},[terminal]:{body:'<script>var pxl="https://pixeldrain.dev/u/Example2";</script>'},
 [file+'/info']:{json:{success:true,id:'Example2',name,size:body.length,mime_type:'video/matroska',can_download:true}},[file]:{body,mime:'video/matroska'}};
 const settings={autoSubtitles:false,useDownloadBridge:false,archiveEnabled:false,hdhubEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false};
 const rows=await runInQuickJs(fixture,{args:['123456','tv',1,2],settings,nativeTimers:true});assert.equal(rows.length,1);assert.equal(rows[0].quality,'1080p · 1920×1080');assert.match(rows[0].language,/Ses: EN/);
 fixture[origin+'/example-series/'].body=fixture[origin+'/example-series/'].body.replace('tt1234567','tt9999999');assert.deepEqual(await runInQuickJs(fixture,{args:['123456','tv',1,2],settings,nativeTimers:true}),[]);
 fixture[origin+'/example-series/'].body=fixture[origin+'/example-series/'].body.replace('tt9999999','tt1234567').replaceAll('Season 1','Season 3').replace('</article>','<strong>Released Year:</strong> 2024<br></article>');
 fixture[origin+'/search.php?q=Example%20Series&page=1'].json.hits[0].document.post_title='Example Series (Season 3) Dual Audio';
 fixture[archive].body=fixture[archive].body.replace('Season 1','Season 3');fixture[hub].body=fixture[hub].body.replace('S01E02','S03E02');fixture[file+'/info'].json.name=name.replace('S01E02','S03E02');
 fixture['https://api.themoviedb.org/3/tv/123456/season/3?api_key=test']={json:{season_number:3,air_date:'2024-02-01',episodes:[{show_id:123456,season_number:3,episode_number:2,runtime:72}]}};
 const p=body.indexOf(Buffer.from('4489','hex'));body.writeDoubleBE(4320000,p+3);
 assert.equal((await runInQuickJs(fixture,{args:['123456','tv',3,2],settings,nativeTimers:true})).length,1);
 fixture['https://api.themoviedb.org/3/tv/123456/season/3?api_key=test'].json.episodes[0].show_id=999999;
 assert.deepEqual(await runInQuickJs(fixture,{args:['123456','tv',3,2],settings,nativeTimers:true}),[]);
});

test('QuickJS: yıl alanı olmayan dublaj kaydı tam kimlik/dosya yılı ve gerçek ses/süreyle bulunur',async()=>{
 const{archiveQuery}=require('../src/providers/archive.cjs'),wanted={...helpers.target,runtimeMinutes:120},id='the.matrix.1999.1080p.tr.eng',name='The.Matrix.1999.1080p.TR.ENG.mkv',url='https://archive.org/download/'+id+'/'+name;
 const e=helpers.ebml,duration=Buffer.alloc(8);duration.writeDoubleBE(7200000);
 const body=Buffer.concat([e('1a45dfa3',e('4282',Buffer.from('matroska'))),e('18538067',Buffer.concat([e('1549a966',e('4489',duration)),e('1654ae6b',Buffer.concat([
 e('ae',Buffer.concat([e('83',[1]),e('e0',Buffer.concat([e('b0',[7,128]),e('ba',[4,56])]))])),e('ae',Buffer.concat([e('83',[2]),e('22b59c',Buffer.from('tur'))]))]))]))]);
 const fixture=makeFixture({extra:{
 ['https://api.themoviedb.org/3/movie/603?api_key=test&append_to_response=external_ids,release_dates']:{json:{...helpers.tmdb,runtime:120}},
 [archiveQuery(wanted,true)]:{json:{response:{docs:[{identifier:id,title:'The Matrix Türkçe Dublaj'}]}}},[archiveQuery(wanted)]:{json:{response:{docs:[]}}},
 ['https://archive.org/metadata/'+id]:{json:{metadata:{title:'The Matrix Türkçe Dublaj'},files:[{name,length:7200}]}},[url]:{body,mime:'video/matroska'}}});
 const calls=[],settings={autoSubtitles:false,useDownloadBridge:false,hdhubEnabled:false,moviesdriveEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false};
 const rows=await runInQuickJs(fixture,{settings,nativeTimers:true,fetchCalls:calls});assert.equal(rows.length,1);assert.equal(rows[0].quality,'1080p · 1920×1080');assert.match(rows[0].language,/Ses: TR/);assert.equal(calls.filter(u=>u.includes('advancedsearch.php')).length,2);
 fixture['https://archive.org/metadata/'+id].json.metadata.year=2000;assert.deepEqual(await runInQuickJs(fixture,{settings,nativeTimers:true}),[]);
});

test('QuickJS: Japonca özgün/aynı TMDB İngilizce adından anime4K bulunur; varsayılanMKV EN okunur, yalnızHI elenir',async()=>{
 const {archiveQuery}=require('../src/providers/archive.cjs'),jp='例の映画',meta={...helpers.tmdb,original_title:jp,title:'The Matrix',runtime:120},wanted={...helpers.target,originalTitle:jp,searchTitles:['The Matrix',jp],runtimeMinutes:120};
 const name='The.Matrix.1999.2160p.mkv',url='https://archive.org/download/alias-example/'+name,e=helpers.ebml,duration=Buffer.alloc(8);duration.writeDoubleBE(7200000);
 const video=e('ae',Buffer.concat([e('83',[1]),e('e0',Buffer.concat([e('b0',[15,0]),e('ba',[8,112])]))]));
 const body=language=>Buffer.concat([e('1a45dfa3',e('4282',Buffer.from('matroska'))),e('18538067',Buffer.concat([e('1549a966',e('4489',duration)),e('1654ae6b',Buffer.concat([video,e('ae',Buffer.concat([e('83',[2]),...(language?[e('22b59c',Buffer.from(language))]:[]),e('86',Buffer.from('A_AAC'))]))]))]))]);
 const fixture=makeFixture({extra:{
 ['https://api.themoviedb.org/3/movie/603?api_key=test&append_to_response=external_ids,release_dates']:{json:meta},
 [archiveQuery(wanted,true)]:{json:{response:{docs:[{identifier:'alias-example',title:'The Matrix (1999) 2160p'}]}}},[archiveQuery(wanted)]:{json:{response:{docs:[]}}},
 ['https://archive.org/metadata/alias-example']:{json:{metadata:{title:'The Matrix (1999) 2160p'},files:[{name,length:7200}]}},[url]:{body:body(),mime:'video/matroska'}
 }});
 const settings={autoSubtitles:false,useDownloadBridge:false,hdhubEnabled:false,moviesdriveEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false},calls=[];
 const rows=await runInQuickJs(fixture,{settings,nativeTimers:true,fetchCalls:calls});assert.equal(rows.length,1);assert.equal(rows[0].quality,'2160p · 3840×2160');assert.match(rows[0].language,/Ses: EN/);assert.equal(calls.filter(u=>u.includes('advancedsearch.php')).length,2);assert.ok(!calls.some(u=>u.includes('/translations?')));
 fixture[url].body=body('hin');assert.deepEqual(await runInQuickJs(fixture,{settings,nativeTimers:true}),[]);
});

test('QuickJS: HDHub Pixel bölümünde gerçek 4K/EN ve gömülü TR korunur; ad servisine ihtiyaç duyulmaz',async()=>{
 const name='Example.Series.S01E02.2160p.WEB-DL.mkv',pixel='https://pixeldrain.dev/u/Fixture1',file='https://pixeldrain.dev/api/file/Fixture1',hub='https://hubcloud.ist/drive/example',terminal='https://gamerxyt.com/hubcloud.php?id=example';
 const enc=s=>Buffer.from(s).toString('base64'),packed=enc(JSON.stringify({o:enc(hub)})).replace(/[A-Za-z]/g,c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<='m'?13:-13)));
 const e=helpers.ebml,duration=Buffer.alloc(8);duration.writeDoubleBE(1800000);
 const tracks=[e('ae',Buffer.concat([e('83',[1]),e('e0',Buffer.concat([e('b0',[15,0]),e('ba',[6,64])]))])),e('ae',Buffer.concat([e('83',[2]),e('22b59c',Buffer.from('en-US'))])),e('ae',Buffer.concat([e('83',[17]),e('22b59c',Buffer.from('tur')),e('86',Buffer.from('S_TEXT/UTF8'))]))];
 const body=Buffer.concat([e('1a45dfa3',e('4282',Buffer.from('matroska'))),e('18538067',Buffer.concat([e('1549a966',e('4489',duration)),e('1654ae6b',Buffer.concat(tracks))])),Buffer.alloc(1000000)]);
 const fixture={
  'https://api.themoviedb.org/3/tv/123456?api_key=test&append_to_response=external_ids':{json:{id:123456,original_name:'Example Series',first_air_date:'2020-01-01',original_language:'en',episode_run_time:[30],poster_path:'/Example.jpg'}},
  'https://4khdhub.one/?s=Example%20Series':{body:'<a href="/example-series-1/">Example Series 2020</a>'},
  'https://4khdhub.one/example-series-1/':{body:'<script type="application/ld+json">{"@type":"TVSeries","name":"Example Series","startDate":"2020","image":"https://image.tmdb.org/t/p/w500/Example.jpg"}</script><div class="episode-download-item"><div class="episode-file-title">'+name+'</div><span>1 GB</span><a href="https://greenmotors.club/example">Download HubCloud</a></div>'},
  'https://greenmotors.club/example':{body:`s('o','${enc(enc(packed))}')`},[hub]:{body:'<title>'+name+'</title><script>var url="'+terminal+'";</script>'},[terminal]:{body:'var pxl="'+pixel+'";'},
  [file+'/info']:{json:{success:true,id:'Fixture1',name,size:body.length,mime_type:'video/matroska',can_download:true,availability:'',abuse_type:''}},[file]:{body,mime:'video/matroska'}
 };
 const settings={autoSubtitles:false,subtitlePolicy:'require',useDownloadBridge:true,archiveEnabled:false,moviesdriveEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,diziyouEnabled:false,dizibakEnabled:false,filmmoduEnabled:false},calls=[];
 const rows=await runInQuickJs(fixture,{settings,args:['123456','tv',1,2],nativeTimers:true,fetchCalls:calls});assert.equal(rows.length,1);assert.equal(rows[0].type,'mkv');assert.equal(rows[0].url,file);assert.equal(rows[0].quality,'2160p · 3840×1600');assert.match(rows[0].language,/Ses: EN/);assert.match(rows[0].language,/TR/);assert.ok(!calls.some(c=>c.includes('/api/files')));
 assert.deepEqual(await runInQuickJs(fixture,{settings:{...settings,hdhubEnabled:false},args:['123456','tv',1,2]}),[]);
});

test('QuickJS: iki adlı Archive kaydı özgün dosya/yıl/süreyle gerçek 4K ve TR/EN ses verir',async()=>{
 const {archiveQuery}=require('../src/providers/archive.cjs'),meta={...helpers.tmdb,runtime:120},target={...helpers.target,runtimeMinutes:120};
 const filename='Yerel Başlık - The Matrix (1999) 1080p.mkv',url='https://archive.org/download/bilingual-example/'+encodeURIComponent(filename),heading='Yerel Başlık The Matrix (1999) 1080p';
 const duration=Buffer.alloc(8);duration.writeDoubleBE(7200000);
 const audio=language=>helpers.ebml('ae',Buffer.concat([helpers.ebml('83',[2]),helpers.ebml('22b59c',Buffer.from(language))]));
 const video=helpers.ebml('ae',Buffer.concat([helpers.ebml('83',[1]),helpers.ebml('e0',Buffer.concat([helpers.ebml('b0',[15,0]),helpers.ebml('ba',[6,64])]))]));
 const body=Buffer.concat([helpers.ebml('1a45dfa3',helpers.ebml('4282',Buffer.from('matroska'))),helpers.ebml('18538067',Buffer.concat([helpers.ebml('1549a966',helpers.ebml('4489',duration)),helpers.ebml('1654ae6b',Buffer.concat([video,audio('tur'),audio('eng')]))]))]);
 const fixture=makeFixture({extra:{
  ['https://api.themoviedb.org/3/movie/603?api_key=test&append_to_response=external_ids,release_dates']:{json:meta},
  [archiveQuery(target,true)]:{json:{response:{docs:[]}}},[archiveQuery(target)]:{json:{response:{docs:[{identifier:'bilingual-example',title:heading}]}}},
  ['https://archive.org/metadata/bilingual-example']:{json:{metadata:{title:heading},files:[{name:filename,length:7200}]}},[url]:{body,mime:'video/matroska'}
 }});
 const settings={autoSubtitles:false,useDownloadBridge:false,hdhubEnabled:false,moviesdriveEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false};
 const streams=await runInQuickJs(fixture,{settings});assert.equal(streams.length,1);assert.equal(streams[0].type,'mkv');assert.equal(streams[0].quality,'2160p · 3840×1600');assert.match(streams[0].language,/Ses: TR\/EN/);
 fixture['https://archive.org/metadata/bilingual-example'].json.metadata.tmdb_id=604;assert.deepEqual(await runInQuickJs(fixture,{settings}),[]);
});

test('QuickJS: uzantısız gerçek MKV/4K ve EN ses MPV yolunda korunur; kullanıcı kapatabilir',async()=>{
 const origin='https://new4.moviesdrive.beer',archive='https://mdrive.lol/archive/123/',hub='https://hubcloud.ist/drive/fixture1',terminal='https://gamerxyt.com/hubcloud.php?id=fixture',pixel='https://pixeldrain.dev/u/Fixture1',file='https://pixeldrain.dev/api/file/Fixture1';
 const name='[[ moviesdrives.com ]] The.Matrix.1999.2160p.English.mkv',duration=Buffer.alloc(8);duration.writeDoubleBE(7200000);
 const audio=helpers.ebml('ae',Buffer.concat([helpers.ebml('83',[2]),helpers.ebml('22b59c',Buffer.from('eng'))]));
 const video=helpers.ebml('ae',Buffer.concat([helpers.ebml('83',[1]),helpers.ebml('e0',Buffer.concat([helpers.ebml('b0',[15,0]),helpers.ebml('ba',[6,64])]))]));
 const body=Buffer.concat([helpers.ebml('1a45dfa3',helpers.ebml('4282',Buffer.from('matroska'))),helpers.ebml('18538067',Buffer.concat([helpers.ebml('1549a966',helpers.ebml('4489',duration)),helpers.ebml('1654ae6b',Buffer.concat([video,audio]))])),Buffer.alloc(1000000)]);
 const fixture=makeFixture({extra:{
  [origin+'/search.php?q=The%20Matrix&page=1']:{json:{hits:[{document:{post_title:'The Matrix (1999) English',permalink:'/the-matrix-1999/',imdb_id:'tt0133093'}}]}},
  [origin+'/the-matrix-1999/']:{body:'<article class="post-content"><h1>The Matrix (1999)</h1><h5>The Matrix (1999)&nbsp;English 2160p [1GB]</h5><h5><a href="'+archive+'">2160p [1GB]</a></h5></article>'},
  [archive]:{body:'<title>The Matrix (1999) English</title><a href="'+hub+'">Download</a>'},
  [hub]:{body:'<title>'+name+'</title><script>var url="'+terminal+'";</script>'},[terminal]:{body:'var pxl="'+pixel+'";'},
  [file+'/info']:{json:{success:true,id:'Fixture1',name,size:body.length,mime_type:'video/matroska',can_download:true,availability:'',abuse_type:''}},[file]:{body,mime:'video/matroska'}
 }});
 const settings={autoSubtitles:false,useDownloadBridge:false,hdhubEnabled:false,archiveEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false};
 const rows=await runInQuickJs(fixture,{settings,nativeTimers:true});assert.equal(rows.length,1);assert.equal(rows[0].url,file);assert.equal(rows[0].type,'mkv');assert.equal(rows[0].quality,'2160p · 3840×1600');assert.match(rows[0].name,/İndirilebilir · MoviesDrive/);assert.match(rows[0].language,/Ses: EN/);
 assert.deepEqual(await runInQuickJs(fixture,{settings:{...settings,moviesdriveEnabled:false}}),[]);
 assert.ok((await runInQuickJs({},{invokeSettings:true})).some(f=>f.key==='moviesdriveEnabled'));
 assert.ok(!(await runInQuickJs({},{code:fastOnlineBundle,invokeSettings:true})).some(f=>f.key==='moviesdriveEnabled'));
});

test('QuickJS: Purstream aynı kimliği online sunar, source kalite etiketini kullanmaz ve ana aramaya iş eklemez',async()=>{
 const api='https://api.purstream.club/api/v1',file='https://free.finepulfe.xyz/movies/603-example/master.m3u8',success=items=>({type:'success',data:{items}});
 const fixture=makeFixture({extra:{
  [api+'/search-bar/search/The%20Matrix']:{json:success({movies:{items:[{id:11,title:'The Matrix',type:'movie',release_date:'1999'}]}})},
  [api+'/media/11/sheet']:{json:success({id:11,tmdbId:603,type:'movie',published:true,releaseDate:'1999',title:'The Matrix',urls:[{url:file,name:'2160p MULTI'}]})},
  [file]:{body:'#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="English",LANGUAGE="en",URI="en.m3u8"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="French",LANGUAGE="fr",URI="fr.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=1800000,RESOLUTION=1280x720,AUDIO="a"\n720.m3u8\n'}
 }});
 const settings={autoSubtitles:false,useDownloadBridge:false,hdfilmdelisiEnabled:false,dizibalEnabled:false,archiveEnabled:false,hdhubEnabled:false,goojaraEnabled:false,hdrezkaEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false};
 const streams=await runInQuickJs(fixture,{code:fastOnlineBundle,settings});assert.equal(streams.length,1);assert.equal(streams[0].type,'hls');assert.equal(streams[0].url,file);assert.equal(streams[0].quality,'720p · 1280×720');assert.match(streams[0].title,/İndirilemez/);assert.match(streams[0].language,/Ses: EN\/FR/);
 assert.deepEqual(await runInQuickJs(fixture,{code:fastOnlineBundle,settings:{...settings,purstreamEnabled:false}}),[]);
 const calls=[];assert.deepEqual(await runInQuickJs(fixture,{settings,fetchCalls:calls}),[]);assert.ok(!calls.some(c=>c.includes('api.purstream.club')));
 assert.ok((await runInQuickJs({},{code:fastOnlineBundle,invokeSettings:true})).some(f=>f.key==='purstreamEnabled'));
 assert.ok(!(await runInQuickJs({},{invokeSettings:true})).some(f=>f.key==='purstreamEnabled'));
});

test('QuickJS: HDRezka public HTML-JSON yanıtı gerçek MP4 verir, ücretli kaliteyi ve yanlış IMDb başlığını atlar',async()=>{
 const root='https://rezka.ag',page=root+'/films/fiction/100-the-matrix-1999.html',file='https://stream.voidboost.one/full.mp4';
 const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(8160000,16);
 const body=Buffer.concat([helpers.box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),helpers.box('moov',helpers.box('mvhd',mvhd),helpers.moov(1280,720).subarray(8)),helpers.box('mdat',Buffer.alloc(32))]);
 const ajax={json:{success:true,premium_content:0,url:'[1080p]'+file+',[<span class="pjs-prem-quality">4K</span>]https://stream.voidboost.one/teaser.mp4'},mime:'text/html'};
 const base=makeFixture({extra:{
  [root+'/search/?do=search&subaction=search&q=The%20Matrix']:{body:'<div class="b-content__inline_item" data-id="100" data-url="'+page+'">1999</div>'},
  [page]:{body:'<meta property="og:url" content="'+page+'"><div class="b-post__origtitle">The Matrix</div><tr><td>Дата выхода</td><td>1999</td></tr><a href="https://www.imdb.com/title/tt0133093/">IMDb</a><li class="b-translator__item" data-id="100" data-translator_id="25" title="Оригинал (+субтитры)">Original</li>'},
  [file]:{body,mime:'video/mp4'}
 }}),fixture=new Proxy(base,{get:(t,k)=>typeof k==='string'&&k.startsWith(root+'/ajax/get_cdn_series/?')?ajax:t[k]});
 const settings={autoSubtitles:false,includeHls:false,archiveEnabled:false,goojaraEnabled:false,hdhubEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false,useDownloadBridge:false};
 const streams=await runInQuickJs(fixture,{settings});assert.equal(streams.length,1);assert.equal(streams[0].url,file);assert.equal(streams[0].quality,'720p · 1280×720');assert.match(streams[0].name,/İndirilebilir · HDRezka/);
 assert.deepEqual(await runInQuickJs(fixture,{settings:{...settings,hdrezkaEnabled:false}}),[]);
 base[page].body=base[page].body.replace('tt0133093','tt9999999');assert.deepEqual(await runInQuickJs(fixture,{settings}),[]);
});

test('QuickJS: Goojara anonymous session, public player form and real MP4 stay native compatible',async()=>{
 const root='https://ww1.goojara.to',wrapper='https://www.wootly.ch/?v=fixture',embed='https://web.wootly.ch/e/publicFixture',source='https://web.wootly.ch/source?id=fixture',file='https://cdn.test/movie.mp4';
 const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(8160000,16);
 const body=Buffer.concat([helpers.box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),helpers.box('moov',helpers.box('mvhd',mvhd),helpers.moov(1280,720).subarray(8)),helpers.box('mdat',Buffer.alloc(32))]);
 const fixture=makeFixture({extra:{
  [root+'/watch-movies']:{body:`_3chk('12345678','abcdef12345678');var x="x=abcdef0123&q=";`,headers:{'set-cookie':'aGooz=publicSessionFixture; Path=/; HttpOnly'}},
  [root+'/xmre.php']:{body:'<li><a href="/mAbcd1"><strong>The Matrix</strong> (1999)</a></li>'},
  [root+'/mAbcd1']:{body:'<div class="marl"><h1>The Matrix (1999)</h1></div><a data-ubv="tt0133093,0,0">IMDb</a><a href="'+root+'/go.php?url=publicFixture">Wootly HD</a>'},
  [root+'/go.php?url=publicFixture']:{status:302,headers:{location:wrapper}},
  [wrapper]:{body:'<title>The.Matrix.1999.720p.WEB-DL.mp4</title><iframe src="'+embed+'"></iframe>'},
  [embed]:{body:'<form id="jgb" action="" method="post"><input type="hidden" name="qdfx" value="1"></form>var vd="fixtureVideo",dd="player",tk="fixtureTicket";'},
  ['https://web.wootly.ch/grabm?t=fixtureTicket&id=fixtureVideo']:{body:source},[source]:{status:302,headers:{location:file}},[file]:{body,mime:'video/mp4'}
 }});
 const settings={autoSubtitles:false,includeHls:false,archiveEnabled:false,hdhubEnabled:false,waploadedEnabled:false,rarefilmmEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false,useDownloadBridge:false};
 const calls=[],streams=await runInQuickJs(fixture,{settings,fetchCalls:calls});assert.equal(streams.length,1,JSON.stringify(calls));assert.equal(streams[0].url,file);assert.equal(streams[0].type,'mp4');assert.equal(streams[0].quality,'720p · 1280×720');assert.match(streams[0].name,/İndirilebilir · Goojara/);
 assert.deepEqual(await runInQuickJs(fixture,{settings:{...settings,goojaraEnabled:false}}),[]);
});

test('QuickJS: ek film arşivi public metadata ile gerçek MP4/altyazı ve 4K pikseli korur',async()=>{
 const page='https://rarefilmm.com/2020/11/the-matrix-1999/',embed='https://ok.ru/videoembed/12345678',url='https://ok1-2.vkuser.net/?fixture=video';
 const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(5400000,16);
 const body=Buffer.concat([helpers.box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),helpers.box('moov',helpers.box('mvhd',mvhd),helpers.moov(3840,2160).subarray(8)),helpers.box('mdat',Buffer.alloc(32))]);
 const metadata={provider:'UPLOADED_ODKL',ownerMovieId:'12345678',movie:{id:'12345678',title:'The Matrix (1999)',duration:'5400',status:'OK',subtitleTracks:[{url:'https://media.test/tr.srt',language:'tr'},{url:'https://ok1-2.vkuser.net/?fixture=sub',language:'tr'}]},videos:[{name:'ultra',url}]};
 const encoded=JSON.stringify({flashvars:{metadata}}).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
 const fixture=makeFixture({extra:{
  ['https://rarefilmm.com/?s=The%20Matrix']:{body:`<h2><a href="${page}">The Matrix (1999)</a></h2>`},
  [page]:{body:`<h1>The Matrix (1999)</h1><article><iframe src="${embed}"></iframe><p>Subtitles: English (hard)</p></article>`},
  [embed]:{body:`<div data-movie-id="12345678" data-options="${encoded}"></div>`},[url]:{body,mime:'video/mp4'},
  ['https://ok1-2.vkuser.net/?fixture=sub']:{body:helpers.srt,mime:'text/plain'}
 }});
 const settings={autoSubtitles:false,archiveEnabled:false,hdhubEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,waploadedEnabled:false,filmmoduEnabled:false,useDownloadBridge:false};
 const calls=[],streams=await runInQuickJs(fixture,{settings,fetchCalls:calls});assert.equal(streams.length,1,JSON.stringify(calls));
 assert.equal(streams[0].url,url);assert.equal(streams[0].type,'mp4');assert.equal(streams[0].quality,'2160p · 3840×2160');assert.match(streams[0].name,/İndirilebilir · RareFilmm/);
 assert.equal(streams[0].subtitles.length,1);assert.equal(streams[0].subtitles[0].language,'tr');assert.match(streams[0].language,/EN görüntüde/);
 assert.deepEqual(await runInQuickJs(fixture,{settings:{...settings,rarefilmmEnabled:false}}),[]);
});

test('QuickJS: DiziBal public player keeps dubbed audio and 4K online while respecting its source toggle',async()=>{
 const root='https://dizibal.org',page=root+'/movie/the-matrix',player='https://play2.pilavyerplay.top';
 const fixture=makeFixture({extra:{
  [root+'/ara/oneri?q=The%20Matrix']:{json:{movies:[{type:'movie',title:'The Matrix',meta:'Film · 1999',url:page}]}},
  [page]:{body:`<link rel="canonical" href="${page}"><h1>The Matrix</h1><div data-pv="publicFixture"></div><script src="${player}/assets/js/core.js"></script>`},
  [player+'/assets/js/s.php?s=publicFixture']:{body:'<script>window.__PLAYER__ = '+JSON.stringify({title:'The Matrix 1999 2160p',stream:player+'/api/stream.php?s=fixture',audios:[{lang:'en'},{lang:'tr'}],subs:[]})+';</script>'},
  [player+'/api/stream.php?s=fixture&format=.m3u8']:{body:'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=16000000,RESOLUTION=3840x2160\n2160.m3u8\n'}
 }});
 const settings={autoSubtitles:false,useDownloadBridge:false,archiveEnabled:false,hdhubEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,waploadedEnabled:false,filmmoduEnabled:false,hdfilmdelisiEnabled:false};
 const streams=await runInQuickJs(fixture,{code:fastOnlineBundle,settings});assert.equal(streams.length,1);assert.equal(streams[0].quality,'2160p · 3840×2160');assert.match(streams[0].language,/Ses: TR\/EN/);assert.equal(streams[0].type,'hls');assert.match(streams[0].title,/İndirilemez/);
 assert.deepEqual(await runInQuickJs(fixture,{code:fastOnlineBundle,settings:{...settings,dizibalEnabled:false}}),[]);
 assert.deepEqual(await runInQuickJs(fixture,{settings}),[],'the main scraper must not duplicate DiziBal');
});

test('QuickJS: public Turkish dub source keeps TR/EN audio, real HLS and clean p/pixel cards',async()=>{
 const origin='https://hdfilmdelisi.one',embed='https://pl.vixolity.com/PublicExample',raw='https://ha.vixolity.com/vs/tt0133093';
 const shifted=Buffer.from(Array.from(`player({file:'${raw}'});`,c=>c.charCodeAt(0)+7)),hex=Buffer.from(shifted.toString('base64').split('').reverse().join('')).toString('hex');
 const fixture=makeFixture({extra:{
  [origin+'/api/search?q=The%20Matrix']:{json:{results:[{orijinalBaslik:'The Matrix',baslik:'Matrix',yayinYili:1999,imdbId:'tt0133093',slug:'matrix',accessLevel:'public'}]}},
  [origin+'/film/matrix']:{body:'<script type="application/ld+json">{"@type":"Movie","name":"Matrix","datePublished":1999}</script><script>self.__next_f.push([1,'+JSON.stringify('x:{"videoUrl":"'+embed+'","requireAuthForWatch":false}')+'])</script>'},
  [embed]:{body:`})('${hex}',7);`},
  [raw+'?format=.m3u8']:{body:'#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",LANGUAGE="tr",URI="tr.m3u8"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",LANGUAGE="en",URI="en.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x804,AUDIO="a"\nvideo.m3u8\n'}
 }});
 const settings={autoSubtitles:false,archiveEnabled:false,hdhubEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false,waploadedEnabled:false,useDownloadBridge:false};
 const streams=await runInQuickJs(fixture,{code:fastOnlineBundle,settings});assert.equal(streams.length,1);assert.equal(streams[0].type,'hls');assert.equal(streams[0].quality,'1080p · 1920×804');assert.match(streams[0].language,/Ses: TR\/EN/);
 assert.doesNotMatch(streams[0].title,/bilinmiyor|tahmin|[?~]/);assert.match(streams[0].title,/İndirilemez/);
 assert.deepEqual(await runInQuickJs(fixture,{code:fastOnlineBundle,settings:{...settings,hdfilmdelisiEnabled:false}}),[]);
 assert.deepEqual(await runInQuickJs(fixture,{settings}),[],'HDFilmDelisi must not be duplicated in the main scraper');
});

test('QuickJS: güncel film dosyası public ticket ile bulunur; gerçek MKV ve ad uzantısı korunur',async()=>{
 const token='a'.repeat(32),origin='https://films.waploaded.com',slug='the-matrix-1999-4321-mkv';
 const page='https://meetdownload.com/'+token+'/'+slug,raw='https://files.kissorgrab.com/public/'+slug,url=raw.replace(/-mkv$/,'.mkv');
 const duration=Buffer.alloc(8);duration.writeDoubleBE(60000);
 const body=Buffer.concat([helpers.ebml('1a45dfa3',helpers.ebml('4282',Buffer.from('matroska'))),helpers.ebml('18538067',Buffer.concat([
  helpers.ebml('1549a966',helpers.ebml('4489',duration)),helpers.mkv(1280,720).subarray(helpers.mkv(1280,720).indexOf(Buffer.from('1654ae6b','hex')))
 ]))]);
 const fixture=makeFixture({extra:{
  [origin+'/sitemap/movie']:{body:`<urlset><loc>${origin}/movie/123/the-matrix-1999</loc></urlset>`},
  [origin+'/movie/123/the-matrix-1999']:{body:`<h1>The Matrix (1999)</h1><a href="/dl/${token}/${slug}">Download Video</a>`},
  [origin+'/dl/'+token+'/'+slug]:{status:303,headers:{location:page}},
  [page]:{body:`<h1>The Matrix (1999)</h1><div data-md-dl="/api/v1/dl-link/${token}" data-md-t="fixture-ticket"></div>`},
  ['https://meetdownload.com/api/v1/dl-link/'+token]:{json:{ok:true,k:'fixture',d:Buffer.from(Array.from(raw,(c,i)=>c.charCodeAt(0)^'fixture'.charCodeAt(i%7))).toString('base64'),s:''}},
  [url]:{body,mime:'video/x-matroska'}
 }});
 const settings={autoSubtitles:false,archiveEnabled:false,hdhubEnabled:false,playImdbEnabled:false,vixsrcEnabled:false,filmmoduEnabled:false};
 const fetchCalls=[];const streams=await runInQuickJs(fixture,{settings,fetchCalls});assert.equal(streams.length,1,JSON.stringify(fetchCalls));assert.equal(streams[0].url,url);
 assert.equal(streams[0].type,'mkv');assert.equal(streams[0].quality,'720p · 1280×720');assert.match(streams[0].name,/Waploaded/);
 assert.deepEqual(await runInQuickJs(fixture,{settings:{...settings,waploadedEnabled:false}}),[]);
});

test('QuickJS AniMOM: generic title/year/episode lookup and large-moov metadata stay native compatible',async()=>{
 const root='https://animom.org/anime/example-anime',embed='https://www.yourupload.com/embed/Example1',url='https://vidcache.net:8161/example/video.mp4';
 const ftyp=helpers.box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary'));
 const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(1390661,16);
 const body=Buffer.concat([ftyp,helpers.box('mdat',Buffer.alloc(180000)),helpers.box('moov',helpers.box('mvhd',mvhd),helpers.moov(1280,720).subarray(8),helpers.box('free',Buffer.alloc(300000)))]);
 const fixture={
  'https://api.themoviedb.org/3/tv/123456?api_key=test&append_to_response=external_ids':{json:{id:123456,name:'Example Anime',original_name:'例のアニメ',first_air_date:'2020-01-01',original_language:'ja',genres:[{id:16}]}},
  'https://animom.org/search':{body:JSON.stringify({success:true,theme:`<li><a href="${root}">Example Anime</a><p>2020 - 例のアニメ</p></li>`}),mime:'text/html'},
  [root]:{body:`<h1><a href="${root}">Example Anime</a> (2020)</h1><script type="application/ld+json">{"name":"Example Anime","datePublished":"2020-01-01"}</script><a href="${root}-1-bolum">1</a>`},
  [root+'-1-bolum']:{body:`<h1><a href="${root}">Example Anime</a> 1. Bölüm</h1><button data-frame="${embed}">YourUpload</button>`},
  [embed]:{body:`<meta property="og:video" content="${url}"><script>file:'${url}'</script>`},[url]:{body,mime:'video/mp4'}
 };
 const result=await runInQuickJs(fixture,{code:extraAnimeBundle,args:['123456','tv',1,1],settings:{autoSubtitles:false}});
 assert.equal(result.length,1);assert.match(result[0].name,/AniMOM/);assert.equal(result[0].quality,'720p · 1280×720');
 fixture[root].body=fixture[root].body.replaceAll('2020','2021');
 assert.deepEqual(await runInQuickJs(fixture,{code:extraAnimeBundle,args:['123456','tv',1,1],settings:{autoSubtitles:false}}),[]);
 const fileFixture=makeFixture({files:{'https://media.test/movie.mp4':{body,mime:'video/mp4'}}});
 const streams=await runInQuickJs(fileFixture,{settings:{autoDiscover:false,autoSubtitles:false,catalogUrls:'https://library.test/catalog.json'}});
 assert.equal(streams[0].quality,'720p · 1280×720');assert.equal(streams[0].type,'mp4');
});
test('QuickJS Ek Anime ayarları kısmi kaynağı varsayılan açar; ana/anime kaynak ayarlarına karışmaz',async()=>{
 const layout=await runInQuickJs({},{code:extraAnimeBundle,invokeSettings:true});
 assert.equal(layout.find(f=>f.key==='animomEnabled')?.defaultValue,true);
 assert.equal(layout.find(f=>f.key==='seicodeEnabled')?.defaultValue,true);
 assert.ok(!layout.some(f=>['animecixEnabled','archiveEnabled','hdhubEnabled','useDownloadBridge'].includes(f.key)));
 const old=await runInQuickJs({},{code:animeBundle,invokeSettings:true});assert.ok(!old.some(f=>f.key==='animomEnabled'));
});
test('QuickJS Ek Anime: kısmi SeiCode bölümü varsayılan bulunur; eksik bölümde başka bölüm seçilmez',async()=>{
 const embed='https://www.mp4upload.com/embed-example12345.html',file='https://a4.mp4upload.com:183/example/video.mp4';
 const fixture={
  'https://api.themoviedb.org/3/tv/123456?api_key=test&append_to_response=external_ids':{json:{id:123456,name:'Example Anime',original_name:'例のアニメ',first_air_date:'2020-01-01',original_language:'ja',genres:[{id:16}]}},
  'https://next.seicode.net/anime/search?q=Example%20Anime':{json:[{slug:'example-anime',english:'Example Anime'}]},
  'https://next.seicode.net/anime/example-anime':{json:{slug:'example-anime',english:'Example Anime',type:'tv',tmdbID:123456,firstAirDate:'2020-01-01',seasons:[{season_number:1,episodes:[{episode_number:3,video_links:{MP4Upload:'https://www.mp4upload.com/example12345'}}]}]}},
  [embed]:{body:`<script>player.src({type:'video/mp4',src:'${file}'});</script>`},[file]:{body:helpers.mp4({width:1920,height:1080}),mime:'video/mp4'}
 };
 const settings={autoSubtitles:false,animomEnabled:false};
 const rows=await runInQuickJs(fixture,{code:extraAnimeBundle,args:['123456','tv',1,3],settings});assert.equal(rows.length,1);assert.match(rows[0].name,/SeiCode/);assert.equal(rows[0].quality,'1080p · 1920×1080');
 assert.deepEqual(await runInQuickJs(fixture,{code:extraAnimeBundle,args:['123456','tv',1,2],settings}),[]);
});

test('QuickJS bilingual subtitles retain tr/en and uniform card fields with real MP4 metadata',async()=>{
 const en='1\n00:00:01,000 --> 00:00:03,000\nFollow the white rabbit.\n';
 const fixture=makeFixture({items:[{...identity,streams:[{url:'https://media.test/movie.mp4',subtitles:[{url:'https://media.test/tr.srt',language:'tr'}]}]}],extra:{
  'https://opensubtitles.stremio.homes/en/ai-translated=false%7Cfrom=all%7Cauto-adjustment=false/subtitles/movie/tt0133093.json':{json:{subtitles:[{lang:'eng',title:'The Matrix 1999',url:'https://subs.test/en.srt'}]}},
  'https://subs.test/en.srt':{body:en,mime:'text/plain'}
 }});
 const streams=await runInQuickJs(fixture,{settings:{autoDiscover:false,catalogUrls:'https://library.test/catalog.json'}});
 assert.equal(streams.length,1);assert.deepEqual(streams[0].subtitles.map(s=>s.language),['tr','en']);
 assert.match(streams[0].language,/^TR\/EN altyazı$/);assert.match(streams[0].size,/GB$/);
});

test('QuickJS English-only subtitle never satisfies the require-Turkish filter',async()=>{
 const en='1\n00:00:01,000 --> 00:00:03,000\nFollow the white rabbit.\n';
 const fixture=makeFixture({items:[{...identity,streams:[{url:'https://media.test/movie.mp4',subtitles:[{url:'https://subs.test/en.srt',language:'en'}]}]}],extra:{'https://subs.test/en.srt':{body:en,mime:'text/plain'}}});
 const streams=await runInQuickJs(fixture,{settings:{autoDiscover:false,autoSubtitles:false,catalogUrls:'https://library.test/catalog.json',subtitlePolicy:'require'}});
 assert.deepEqual(streams,[]);
});

test('QuickJS HDHub public zincirini çözer; köprü adı ve gerçek MKV piksel/boyutu korunur', async () => {
  const file='https://bucket.r2.cloudflarestorage.com/object?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature='+'a'.repeat(64);
  const alias=SERVICE_ORIGIN+'/files/'+'b'.repeat(64)+'.mkv?source='+encodeURIComponent(file);
  const enc=s=>Buffer.from(s).toString('base64');
  const packed=enc(JSON.stringify({o:enc('https://hubcloud.example/file')})).replace(/[A-Za-z]/g,c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<='m'?13:-13)));
  const fixture=makeFixture({extra:{
    'https://4khdhub.one/?s=The%20Matrix':{body:'<a href="https://4khdhub.one/matrix/">The Matrix (1999)</a>'},
    'https://4khdhub.one/matrix/':{body:`<script>var defaultVideoId='603'</script><script type="application/ld+json">{"@type":"Movie","name":"The Matrix","datePublished":"1999-03-31"}</script><div class="download-item"><div class="file-title">The.Matrix.1999.WEB-DL.mkv</div><a href="https://greenmotors.club/example">Download HubCloud</a></div>`},
    'https://greenmotors.club/example':{body:`s('o','${enc(enc(packed))}')`},
    'https://hubcloud.example/file':{body:'var url="https://gamerxyt.com/hubcloud.php?token=example"'},
    'https://gamerxyt.com/hubcloud.php?token=example':{body:`<a href="${file.replaceAll('&','&amp;')}">FSL Server</a>`},
    [SERVICE_ORIGIN+'/api/files']:{json:{schema:1,target,files:[{url:file,downloadAlias:alias}]}},
    [file]:{body:mkv(1920,800),headStatus:403}
  }});
  const streams=await runInQuickJs(fixture,{settings:{autoSubtitles:false,archiveEnabled:false,playImdbEnabled:false,vixsrcEnabled:false}});
  assert.equal(streams.length,1);assert.equal(streams[0].url,alias);assert.equal(streams[0].quality,'1080p · 1920×800');
  assert.match(streams[0].name,/İndirilebilir/);assert.equal(streams[0].type,'mkv');assert.ok(streams[0].size);
});

async function runInQuickJs(fixture, { settings, args = ['603', 'movie'], invokeSettings = false, nativeTimers = false, code = bundle, fetchCalls } = {}) {
  const engine = await getQuickJS();
  const runtime = engine.newRuntime();
  runtime.setMemoryLimit(64 * 1024 * 1024);
  runtime.setMaxStackSize(1024 * 1024);
  const vm = runtime.newContext();
  const timers = new Map();
  let timerId = 0;
  const started = Date.now();
  runtime.setInterruptHandler(() => Date.now() - started > 5000);
  const setHost = (name, callback) => {
    const fn = vm.newFunction(name, callback);
    vm.setProp(vm.global, name, fn);
    fn.dispose();
  };
  const evalValue = code => {
    const result = vm.evalCode(code);
    if (result.error) { const error = vm.dump(result.error); result.error.dispose(); throw new Error(JSON.stringify(error)); }
    const out = vm.dump(result.value);
    if (result.value.alive) result.value.dispose();
    return out;
  };
  try {
    // Deliberately minimal Nuvio-shaped bridge: no Node require/Buffer/process,
    // no browser fetch streaming, no effective AbortSignal, read-only URL.
    setHost('__fixture_fetch', (url, options) => {
      const address=vm.getString(url);fetchCalls?.push(address);
      return vm.newString(JSON.stringify(responseFor(fixture, address, JSON.parse(vm.getString(options)))));
    });
    setHost('__fixture_parse_url', url => {
      const parsed = new URL(vm.getString(url));
      return vm.newString(JSON.stringify({ href: parsed.href, protocol: parsed.protocol, hostname: parsed.hostname, origin: parsed.origin, pathname: parsed.pathname, search: parsed.search, hash: parsed.hash, params: Object.fromEntries(parsed.searchParams) }));
    });
    setHost('__fixture_atob', value => vm.newString(Buffer.from(vm.getString(value),'base64').toString('latin1')));
    setHost('__set_timer', (callback, delay) => {
      const id = ++timerId;
      const fn = callback.dup();
      const timer = setTimeout(() => {
        const cancelled = timers.get(id)?.cancelled;
        timers.delete(id);
        const result = !cancelled && vm.callFunction(fn, vm.undefined);
        fn.dispose();
        if (result) { if (result.error) result.error.dispose(); else result.value.dispose(); }
      }, vm.getNumber(delay));
      timers.set(id, { timer, fn });
      return vm.newNumber(id);
    });
    setHost('__clear_timer', id => {
      const key = vm.getNumber(id), entry = timers.get(key);
      if (entry && nativeTimers) entry.cancelled = true;
      else if (entry) { clearTimeout(entry.timer); entry.fn.dispose(); timers.delete(key); }
    });
    evalValue(`
      globalThis.SCRAPER_SETTINGS = ${JSON.stringify(settings || { catalogUrls: 'https://library.test/catalog.json', autoDiscover: false, autoSubtitles: false, requireTurkishSubtitles: false })};
      globalThis.TMDB_API_KEY = 'test';
      globalThis.setTimeout = (fn, ms) => __set_timer(fn, ms);
      globalThis.clearTimeout = id => __clear_timer(id);
      globalThis.URL = function(url) { Object.assign(this, JSON.parse(__fixture_parse_url(url))); this.searchParams = {get: key => this.params[key] ?? null}; };
      // These read-only fields/base64 operations also exist in Nuvio's locked
      // JsBindings.kt. No Node or browser object is exposed to plugin code.
      globalThis.atob = value => __fixture_atob(value);
      globalThis.fetch = async function(url, options) {
        var result = JSON.parse(__fixture_fetch(url, JSON.stringify(options || {})));
        return { status: result.status, ok: result.status >= 200 && result.status < 300, url: result.url,
          headers: { get: name => result.headers[name.toLowerCase()] || null },
          text: () => Promise.resolve(decodeURIComponent(result.body.map(b => '%' + b.toString(16).padStart(2, '0')).join(''))),
          arrayBuffer: () => Promise.resolve(Uint8Array.from(result.body).buffer) };
      };
      var module = { exports: {} }; var exports = module.exports;
      (function() { ${code}\n })();
      globalThis.__done = false;
      Promise.resolve(${invokeSettings ? 'module.exports.onSettings()' : `module.exports.getStreams(...${JSON.stringify(args)})`})
        .then(value => { globalThis.__result = JSON.stringify(value); globalThis.__done = true; },
          error => { globalThis.__error = String(error); globalThis.__done = true; });
      void 0;
    `);
    for (let turns = 0; turns < 2500 && !evalValue('__done'); turns++) {
      const result = runtime.executePendingJobs();
      if (result.error) { const error = vm.dump(result.error); result.error.dispose(); throw new Error(JSON.stringify(error)); }
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    assert.equal(evalValue('__done'), true, 'QuickJS promise tamamlanmadı');
    assert.equal(evalValue('globalThis.__error'), undefined);
    // quickjs-kt v1.0.15 waits for native jobs even after __capture_result.
    // Model that drain explicitly; cleared native sleeps still have to finish.
    if (nativeTimers) {
      const drainStarted = Date.now();
      while (timers.size && Date.now() - drainStarted < 1000) await new Promise(resolve => setTimeout(resolve, 2));
      assert.equal(timers.size, 0, 'İptal edilmiş uzun native timer evaluate dönüşünü geciktiriyor');
    }
    return JSON.parse(evalValue('__result'));
  } finally {
    for (const { timer, fn } of timers.values()) { clearTimeout(timer); fn.dispose(); }
    timers.clear();
    vm.dispose();
    runtime.dispose();
  }
}

test('derlenmiş gerçek sağlayıcı QuickJS üzerinde MP4/MKV ve Türkçe altyazı döndürür', async () => {
  const fixture = makeFixture({ items: [{ ...identity, streams: [
    { url: 'https://media.test/movie.mp4', subtitles: [{ url: 'https://media.test/tr.srt', language: 'tr' }] },
    { url: 'https://media.test/movie.mkv' }, { url: 'https://media.test/broken.mp4' }
  ] }] });
  const streams = await runInQuickJs(fixture);
  assert.equal(streams.length, 2);
  const subtitled=streams.find(stream=>stream.type==='mp4');
  assert.equal(subtitled.quality, '1080p · 1920×1080');
  assert.match(subtitled.subtitles[0].name, /^Türkçe · SRT/);
  assert.equal(subtitled.subtitles[0].language, 'tr');
  assert.equal(streams[0].type, 'mkv');
});
test('derlenmiş ayar formu KMP onSettings sözleşmesine uyar', async () => {
  const layout = await runInQuickJs({}, { invokeSettings: true });
  assert.ok(Array.isArray(layout));
  assert.ok(layout.some(field => field.type === 'toggle' && field.key === 'includeHls'));
  assert.ok(layout.every(field => ['header', 'info', 'text', 'toggle', 'select'].includes(field.type)));
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.ok(layout.some(field=>field.type==='info' && field.label.includes(`Tanı · ${pkg.version} · TMDB anahtarı: var`)));
});

test('QuickJS anime paketi: doğru kanonik bölüm, gerçek 720p MP4 ve eşlenmiş TR',async()=>{
 const id='a'.repeat(24),identity={tmdbId:13916,type:'tv',originalTitle:'DEATH NOTE',year:2006,season:1,episode:1};
 const fixture={
  'https://api.themoviedb.org/3/tv/13916?api_key=test&append_to_response=external_ids':{json:{id:13916,name:'Death Note',original_name:'DEATH NOTE',first_air_date:'2006-10-04',genres:[{id:16}],original_language:'ja'}},
  'https://animecix.tv/secure/search/Death-Note?type=&limit=20':{json:{results:[{id:7585,tmdb_id:13916,original_title:'DEATH NOTE',year:2006,is_series:true}]}},
  'https://animecix.tv/secure/episode-videos?titleId=7585&episode=1&season=1':{json:[{title_id:7585,season_num:1,episode_num:1,category:'full',url:'https://tau-video.xyz/embed/'+id,captions:[{url:'https://subs.test/tr.srt',language:'tr'}]}]},
  ['https://tau-video.xyz/api/video/'+id]:{json:{_id:id,title_id:7585,season_number:1,episode_number:1,urls:[{label:'1080p',url:'https://media.test/anime.mp4'}]}},
  'https://media.test/anime.mp4':{body:helpers.mp4({width:1280,height:720})},
  'https://subs.test/tr.srt':{body:helpers.srt,mime:'text/plain'}
 };
 const streams=await runInQuickJs(fixture,{code:animeBundle,args:['13916','tv',1,1],settings:{autoSubtitles:false}});
 assert.equal(streams.length,1);assert.equal(streams[0].quality,'720p · 1280×720');assert.equal(streams[0].subtitles[0].language,'tr');
 const ordinary=makeFixture();assert.deepEqual(await runInQuickJs(ordinary,{code:animeBundle,settings:{}}),[]);
});

test('QuickJS SonAnime: Japonca özgün adın kanonik İngilizce karşılığı, tam bölüm ve gerçek MP4',async()=>{
 const row={anime_id:20,tmdb_id:13916,anime_name:'Death Note',anime_year:2006,anime_type:'anime',anime_link:'death-note'};
 const fixture={
  'https://api.themoviedb.org/3/tv/13916?api_key=test&append_to_response=external_ids':{json:{id:13916,name:'Death Note',original_name:'デスノート',first_air_date:'2006-10-04',genres:[{id:16}],original_language:'ja'}},
  'https://api.sonanime.com/api/anime/search?q=Death%20Note':{json:[row]},
  'https://api.sonanime.com/api/anime/link/death-note':{json:{...row,episodes:[{anime_id:20,anime_season:1,episode_number:1,episode_link_480:'https://video.konununuzmani.com/video/fixture'}]}},
  'https://video.konununuzmani.com/video/fixture':{body:helpers.mp4({width:852,height:480})}
 };
 const streams=await runInQuickJs(fixture,{code:animeBundle,args:['13916','tv',1,1],settings:{autoSubtitles:false}});
 assert.equal(streams.length,1);assert.match(streams[0].name,/SonAnime/);assert.equal(streams[0].quality,'480p · 852×480');assert.equal(streams[0].type,'mp4');
});

test('QuickJS DiziYou: yeni kaynaktan online HLS + eşlenmiş TR, yanlış üç kalite tek Auto',async()=>{
 const ld=data=>'<script type="application/ld+json">'+JSON.stringify(data)+'</script>';
 const fixture={
  'https://api.themoviedb.org/3/tv/67070?api_key=test&append_to_response=external_ids':{json:{id:67070,original_name:'Fleabag',first_air_date:'2016-07-21',original_language:'en'}},
  'https://www.diziyou.one/fleabag/':{body:ld({'@type':'TVSeries',name:'Fleabag',startDate:'2016'})+'<a href="/fleabag-1-sezon-1-bolum/">1</a>'},
  'https://www.diziyou.one/fleabag-1-sezon-1-bolum/':{body:ld({'@type':'TVEpisode',partOfSeries:{name:'Fleabag'},partOfSeason:{seasonNumber:1},episodeNumber:1})+'<iframe id="diziyouPlayer" src="/player/12.html"></iframe>'},
  'https://www.diziyou.one/player/12.html':{body:'<video id="diziyou"><source src="https://stream.test/master.m3u8"><track srclang="tr" src="https://subs.test/tr.vtt"></video>'},
  'https://stream.test/master.m3u8':{body:'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480\nsame.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\nsame.m3u8\n'},
  'https://subs.test/tr.vtt':{body:helpers.vtt}
 };
 const streams=await runInQuickJs(fixture,{args:['67070','tv',1,1],settings:{autoSubtitles:false}});
 assert.equal(streams.length,1);assert.match(streams[0].name,/DiziYou/);assert.equal(streams[0].subtitles[0].language,'tr');assert.equal(streams[0].type,'hls');assert.match(streams[0].language,/Ses: EN/);
 assert.doesNotMatch(streams[0].quality,/1080|720|480/);
});

test('QuickJS: yıl içermeyen doğru dizi bölümü ve AltyazıDB Türkçe SRT birlikte döner',async()=>{
 const tv={id:67070,original_name:'Fleabag',first_air_date:'2016-07-21',external_ids:{imdb_id:'tt5687612'},episode_run_time:[26]};
 const fixture={
  'https://api.themoviedb.org/3/tv/67070?api_key=test&append_to_response=external_ids':{json:tv},
  'https://streamdata.vaplayer.ru/api.php?tmdb=67070&type=tv&season=1&episode=1':{json:{status_code:200,data:{imdb_id:'tt5687612',file_name:'Fleabag.S01E01.1080p.WEB-DL',stream_urls:['https://media.test/episode.mp4']}}},
  'https://media.test/episode.mp4':{body:helpers.mp4()},
  'https://altyazidb.online/subtitles/series/tt5687612%3A1%3A1.json':{json:{subtitles:[{lang:'tur',title:'S01E01 WEB-DL',url:'https://subs.test/tr.srt'}]}},
  'https://subs.test/tr.srt':{body:'1\n00:00:00,000 --> 00:25:00,000\nÖrnek\n',mime:'application/x-subrip'}
 };
 const streams=await runInQuickJs(fixture,{args:['67070','tv',1,1],settings:{vixsrcEnabled:false,hdhubEnabled:false}});
 assert.equal(streams.length,1);assert.equal(streams[0].subtitles[0].language,'tr');assert.match(streams[0].subtitles[0].name,/AltyazıDB/);
});

test('QuickJS: eski ana sağlayıcı tek başına dosyayı ve online HLS alternatifini birlikte getirir',async()=>{
 const fixture=makeFixture({items:[{...identity,streams:[{url:'https://media.test/movie.mkv'}]}],extra:{
  'https://streamdata.vaplayer.ru/api.php?tmdb=603&type=movie':{json:{status_code:200,data:{imdb_id:'tt0133093',file_name:'The.Matrix.1999.WEB-DL.mkv',stream_urls:['https://media.test/online.m3u8']}}},
  'https://media.test/online.m3u8':{body:'#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nsegment.ts\n#EXT-X-ENDLIST\n'}
 }});
 const streams=await runInQuickJs(fixture,{settings:{catalogUrls:'https://library.test/catalog.json',autoSubtitles:false,vixsrcEnabled:false,hdhubEnabled:false,archiveEnabled:false}});
 assert.equal(streams.length,2);assert.ok(streams.some(s=>s.type==='mkv'&&s.name.includes('İndirilebilir')));assert.ok(streams.some(s=>s.type==='hls'&&s.name.includes('Online')));
});

test('QuickJS: ana sağlayıcı grup önekli Shameless bölümünü kaybetmez',async()=>{
 const fixture={
  'https://api.themoviedb.org/3/tv/34307?api_key=test&append_to_response=external_ids':{json:{id:34307,original_name:'Shameless',first_air_date:'2011-01-09',external_ids:{imdb_id:'tt1586680'}}},
  'https://streamdata.vaplayer.ru/api.php?tmdb=34307&type=tv&season=1&episode=1':{json:{status_code:200,data:{imdb_id:'tt1586680',file_name:'Shameless.US.S01.1080p.BluRay.X264-UNTOUCHABLES/untouchables-shameless.us.s01e01.1080p.mkv',stream_urls:['https://media.test/show.m3u8']}}},
  'https://media.test/show.m3u8':{body:'#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nsegment.ts\n#EXT-X-ENDLIST\n'}
 };
 const streams=await runInQuickJs(fixture,{args:['34307','tv',1,1],settings:{autoSubtitles:false,vixsrcEnabled:false,hdhubEnabled:false}});
 assert.equal(streams.length,1);assert.equal(streams[0].type,'hls');
});

test('QuickJS: clearTimeout native beklemeyi iptal etmese de hızlı çağrı uzun bütçeyi beklemez', async () => {
  const start = Date.now();
  const streams = await runInQuickJs(makeFixture(), { nativeTimers: true });
  assert.equal(streams.length, 1);
  assert.ok(Date.now() - start < 1000);
});
test('QuickJS bozuk JSON ve ağ hatalarında çökmez', async () => {
  const fixture = makeFixture({ extra: { 'https://library.test/catalog.json': { body: '{bad' } } });
  assert.deepEqual(await runInQuickJs(fixture), []);
});

test('QuickJS otomatik dizin taraması, BigInt dosya hash’i ve Türkçe eşleme çalışır', async () => {
  const filename = 'The.Matrix.1999.1080p.BluRay.x264-TEST.mp4';
  const directory = 'https://a.111477.xyz/movies/The%20Matrix%20(1999)/';
  const { mp4, srt } = helpers;
  const fixture = makeFixture({ extra: {
    [directory]: { body: `<a href="${filename}">${filename}</a><a href="${filename}.tr.srt">${filename}.tr.srt</a>`, mime: 'text/html' },
    [directory + filename]: { body: mp4({ tail: true }), mime: 'video/mp4' },
    [directory + filename + '.tr.srt']: { body: srt, mime: 'text/plain' }
  } });
  const streams = await runInQuickJs(fixture, { settings: { directoryEnabled: true, hostedDiscovery: false, archiveEnabled: false, playImdbEnabled: false } });
  assert.equal(streams.length, 1);
  assert.equal(streams[0].quality, '1080p · 1920×1080');
  assert.equal(streams[0].subtitles[0].language, 'tr');
});
