'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanGoojara,parentMatches,searchRows,seasonEpisode,episodeMatches,releaseMatches,publicPlayerData}=require('../src/providers/goojara.cjs');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {fixtureFetch,box,moov}=require('./helpers.cjs');
const {cardFields}=require('../src/media/presentation.cjs');
const root='https://ww1.goojara.to',wrapper='https://www.wootly.ch/?v=fixture',embed='https://web.wootly.ch/e/publicFixture',source='https://web.wootly.ch/source?id=fixture',file='https://cdn.test/movie.mp4';
const target={tmdbId:603,type:'movie',originalTitle:'The Matrix',searchTitles:['The Matrix'],year:1999,imdbId:'tt0133093',runtimeMinutes:136};
const nonce="_3chk('12345678','abcdef12345678');",home='<script>'+nonce+'var x="x=abcdef0123&q=";</script>';
const parent='<div class="marl"><h1>The Matrix (1999)</h1></div><a data-ubv="tt0133093,0,0">IMDb</a><a href="'+root+'/go.php?url=publicFixture">Wootly HD</a>';
const form='<form id="jgb" action="" method="post"><input type="hidden" name="qdfx" value="1"></form>';
const ready='var vd="fixtureVideo",dd="player",tk="fixtureTicket";';
function media(seconds=8160){const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(seconds*1000,16);return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',box('mvhd',mvhd),moov(1280,720).subarray(8)),box('mdat',Buffer.alloc(32))]);}
function fixture(){return{
 [root+'/watch-movies']:{body:home,headers:{'set-cookie':'aGooz=publicSessionFixture; Path=/; HttpOnly'}},
 [root+'/xmre.php']:{body:'<li><a href="/mAbcd1"><strong>The Matrix</strong> (1999)</a></li>'},
 [root+'/mAbcd1']:{body:nonce+parent},
 [root+'/go.php?url=publicFixture']:{status:302,headers:{location:wrapper}},
 [wrapper]:{body:'<title>The.Matrix.1999.720p.WEB-DL.mp4</title><iframe src="'+embed+'"></iframe>'},
 [embed]:{body:form+ready},['https://web.wootly.ch/grabm?t=fixtureTicket&id=fixtureVideo']:{body:source},
 [source]:{status:302,headers:{location:file}},[file]:{body:media(),mime:'video/mp4'}
};}
test('Goojara: public oturum ve aramadan gerçek dosyaya gider; çerez başka kökene veya videoya aktarılmaz',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});
 try{const rows=await scanGoojara(http,target);assert.equal(rows.length,1);assert.equal(rows[0].source,'Goojara');assert.equal(rows[0].filename,'The.Matrix.1999.720p.WEB-DL.mp4');
  const video=await probe(http,rows[0]);assert.equal(video.downloadable,true);assert.deepEqual(video.dimensions,{width:1280,height:720});
  assert.match(calls.find(c=>c.url===root+'/xmre.php').headers.Cookie,/aGooz=publicSessionFixture/);
  assert.match(calls.find(c=>c.url.startsWith(root+'/go.php')).headers.Cookie,/12345678=abcdef12345678/);
  assert.ok(calls.filter(c=>!c.url.startsWith(root+'/')).every(c=>!Object.keys(c.headers||{}).some(k=>/cookie|authorization/i.test(k))));
  assert.ok(calls.some(c=>c.url===embed&&c.method==='POST'&&c.body==='qdfx=1'));
  assert.ok(calls.every(c=>!('publicCookieRedirectOrigin'in c)));
 }finally{http.close();}
});
test('Goojara: yıl, devam filmi ve IMDb çelişkisi kabul edilmez; yanlış yıla film fallback yoktur',()=>{
 assert.equal(parentMatches(parent,target),true);assert.equal(parentMatches(parent.replace('tt0133093','tt9999999'),target),false);
 assert.equal(parentMatches(parent.replace('(1999)','(2000)'),target),false);
 assert.deepEqual(searchRows('<a href="/mAbcd1">The Matrix Reloaded (1999)</a>',target),[]);
 assert.equal(releaseMatches('The.Matrix.2000.720p.mp4',target),false);assert.equal(releaseMatches('Another.Movie.1999.mp4',target),false);
 const tv={...target,type:'tv',originalTitle:'Shameless',searchTitles:['Shameless'],year:2011};
 assert.deepEqual(searchRows('<a href="/tAbcd1">Shameless (US) (2010)</a>',tv),[]);
});
test('Goojara: doğru sezon ve bölüm hem listede hem bölüm başlığında/ana dizi bağında doğrulanır',()=>{
 const tv={...target,type:'tv',originalTitle:'Fleabag',searchTitles:['Fleabag'],year:2016,season:1,episode:1};
 const html='<div class="seho"><span class="sea">01</span><span>Season 2</span><h1><a href="/eWrong1">Wrong</a></h1></div><div class="seho"><span class="sea">01</span><span>Season 1</span><h1><a href="/eRight1">Right</a></h1></div>';
 assert.equal(seasonEpisode(html,tv),'/eRight1');assert.equal(seasonEpisode(html,{...tv,episode:3}),null);
 const page='<div id="wai"><a href="'+root+'/tAbcd1?s=1">Fleabag S1</a></div><div class="marl"><h1>Fleabag S1, E1 - Episode 1</h1></div>';
 assert.equal(episodeMatches(page,'/tAbcd1',tv),true);assert.equal(episodeMatches(page.replace('S1, E1','S2, E1'),'/tAbcd1',tv),false);
 assert.equal(episodeMatches(page,'/tOther1',tv),false);assert.equal(episodeMatches(page.replace('?s=1','?s=2'),'/tAbcd1',tv),false);
 assert.equal(releaseMatches('Fleabag.S01E01.720p.WEB-DL.mp4',tv),true);assert.equal(releaseMatches('Fleabag.S02E01.720p.mp4',tv),false);
});
test('Goojara: challenge, dış iframe ve bozuk indirme yanıtı sonuç üretmez',async()=>{
 for(const [url,replacement]of[[embed,{body:'<div class="cf-turnstile"></div>'+ready}],
  [wrapper,{body:'<title>The.Matrix.1999.mp4</title><iframe src="https://ad.test/video.mp4"></iframe>'}],
  ['https://web.wootly.ch/grabm?t=fixtureTicket&id=fixtureVideo',{body:'<html>not a file</html>'}]]){
   const f=fixture();f[url]=replacement;const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanGoojara(http,target),[]);}finally{http.close();}
 }
 assert.equal(publicPlayerData('eval("something")'),null);
});
test('Goojara: TV dosyası varsayılan son sezonun başka bölümüne sessizce geçmez',async()=>{
 const tv={...target,type:'tv',originalTitle:'Fleabag',searchTitles:['Fleabag'],year:2016,season:1,episode:1},calls=[],f=fixture();
 f[root+'/xmre.php']={body:'<li><a href="/tAbcd1"><strong>Fleabag</strong> (2016)</a></li>'};
 f[root+'/tAbcd1']={body:'<div class="marl"><h1>Fleabag (2016)</h1></div><div id="seon" data-id="123"></div><button data-season="2">2</button>'};
 const http=createHttp({fetchImpl:fixtureFetch(f,calls)});try{assert.deepEqual(await scanGoojara(http,tv),[]);assert.ok(!calls.some(c=>c.url.includes('go.php')));}finally{http.close();}
});

test('Goojara: dizinin seçilmiş sezon listesi ve tam bölüm zinciri gerçek MP4 ile tamamlanır',async()=>{
 const tv={...target,type:'tv',originalTitle:'Fleabag',searchTitles:['Fleabag'],year:2016,season:1,episode:1,runtimeMinutes:26},calls=[],f=fixture();
 f[root+'/xmre.php']={body:'<li><a href="/tAbcd1"><strong>Fleabag</strong> (2016)</a></li>'};
 f[root+'/tAbcd1']={body:nonce+'<div class="marl"><h1>Fleabag (2016)</h1></div><div id="seon" data-id="123"></div><button data-season="2" disabled>2</button><button data-season="1">1</button>'};
 f[root+'/fixture-season']={body:'<div class="seho"><span class="sea">01</span><span>Season 1</span><h1><a href="/eAbcd1">Episode 1</a></h1></div>'};
 f[root+'/eAbcd1']={body:'<div id="wai"><a href="'+root+'/tAbcd1?s=1">Fleabag S1</a></div><div class="marl"><h1>Fleabag S1, E1 - Episode 1</h1></div>'+parent.slice(parent.indexOf('<a href='))};
 f[wrapper]={body:'<title>Fleabag.S01E01.720p.WEB-DL.mp4</title><iframe src="'+embed+'"></iframe>'};f[file]={body:media(1560),mime:'video/mp4'};
 const fetcher=fixtureFetch(f),http=createHttp({fetchImpl:async(url,options)=>{calls.push({url,...options});const season=url===root+'/xmre.php'&&options.body==='s=1&t=123';const response=await fetcher(season?root+'/fixture-season':url,options);return{...response,url};}});
 try{const rows=await scanGoojara(http,tv);assert.equal(rows.length,1);assert.equal((await probe(http,rows[0])).downloadable,true);assert.ok(calls.some(c=>c.body==='s=1&t=123'));
  f[root+'/eAbcd1'].body=f[root+'/eAbcd1'].body.replace('S1, E1','S2, E1');assert.deepEqual(await scanGoojara(http,tv),[]);
 }finally{http.close();}
});

test('Goojara: HCSubs sürüm işareti gizlenmez, bilinmeyen sabit altyazıya dil uydurulmaz',async()=>{
 const f=fixture();f[wrapper].body=f[wrapper].body.replace('WEB-DL.mp4','WEB-DL.HCSubs.mp4');const http=createHttp({fetchImpl:fixtureFetch(f)});
 try{const [candidate]=await scanGoojara(http,target);assert.equal(candidate.burnedSubtitleLanguage,'und');assert.equal(candidate.burnedSubtitleBasis,'release-name');
  const video=await probe(http,candidate);assert.match(cardFields(video,candidate,[]).language,/Sabit altyazı/);assert.doesNotMatch(cardFields(video,candidate,[]).language,/EN görüntüde|TR görüntüde/);
 }finally{http.close();}
});
