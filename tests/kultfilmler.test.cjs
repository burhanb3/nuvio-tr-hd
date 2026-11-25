'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanKultFilmler,searchCards,playerEntries,playerConfig,streamCandidate,titleParts}=require('../src/providers/kultfilmler.cjs');
const{unpackPacked}=require('../src/providers/page-data.cjs'),{unpackPlayer}=require('../src/providers/dizibak.cjs');
const{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const{loadSubtitles}=require('../src/subtitles.cjs'),{fixtureFetch,srt}=require('./helpers.cjs');
// Placeholder hashes, CDN host and tokens only.
const root='https://kultfilmler.net',player='https://vidpapi.xyz';
const subHash='a'.repeat(32),dubHash='b'.repeat(32),video='c'.repeat(32),dubVideo='d'.repeat(32),track='e'.repeat(32);
const target={tmdbId:123456,type:'movie',originalTitle:'Example Movie',searchTitles:['Example Movie'],year:2020,imdbId:'tt1234567',originalLanguage:'en',runtimeMinutes:120};
function pack(source,base=62){
  // Test-only p,a,c,k,e,d encoder (dictionary substitution, the inverse of unpackPacked).
  const key=n=>{const t=n%base,d=t>35?String.fromCharCode(t+29):t.toString(36);return(n<base?'':key(Math.floor(n/base)))+d;};
  const words=[],index=new Map();
  const payload=source.replace(/\b\w+\b/g,w=>{if(!index.has(w)){index.set(w,words.length);words.push(w);}return key(index.get(w));});
  const quote=s=>s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return "eval(function(p,a,c,k,e,d){e=function(c){return c};return p}('"+quote(payload)+"',"+base+','+words.length+",'"+quote(words.join('|'))+"'.split('|'),0,{}))";
}
function playerPage(hash,config){
  const json=JSON.stringify(config).replace(/\//g,'\\/');
  return '<html><head><title>FirePlayer</title><meta name="referrer" content="no-referrer"></head><body><script>'+pack('function fireload(source=null){FirePlayer("'+hash+'",'+json+',false,source)}$(function(){fireload()});')+'</script></body></html>';
}
const card=(slug,title,year,lang='Dublaj/Altyazı')=>'<a class="mcard" href="'+root+'/'+slug+'/"><div class="poster"><img class="pimg" src="'+root+'/p.jpg" alt="'+title+'"><div class="pfoot"><span class="plang">'+lang+'</span><span class="pyear">'+year+'</span></div></div><div class="mbody"><div class="mtx"><h3>'+title+'</h3><p class="gen">Dram</p></div></div></a>';
const iframe=hash=>'<iframe src="'+player+'/video/'+hash+'" width="100%" height="360" frameborder="0" allowfullscreen></iframe>';
const srcData=rows=>'<script id="kf-srcdata" type="application/json">'+JSON.stringify(rows).replace(/</g,'\\u003C').replace(/>/g,'\\u003E')+'</script>';
const secured=id=>player+'/cdn/hls/'+id+'/master.m3u8?md5=token&expires=1';
const master='#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1792000,RESOLUTION=1920x800,NAME="800p",CODECS="avc1.4D401D,mp4a.40.2"\nhttps://cdn.test/cdn/hls/x/800p.m3u8\n';
function fixture(){
  const subUrl='https://cdn.test/cdn/down/'+video+'/Subtitle/'+track+'.srt';
  return{
    [root+'/?s=Example%20Movie']:{body:card('other-movie-izle','Other Movie – Başka Film',2020)+card('example-movie-izle','Example Movie – Örnek Film',2020),mime:'text/html'},
    [root+'/example-movie-izle/']:{body:'<h1 class="vtitle">Example Movie – Örnek Film</h1>'+srcData([{name:'KULT',langLabel:'Altyazılı',html:iframe(subHash)},{name:'KULT',langLabel:'Türkçe Dublaj',html:iframe(dubHash)}]),mime:'text/html'},
    [player+'/video/'+subHash]:{body:playerPage(subHash,{tracks:[{kind:'captions',file:subUrl,label:'Türkçe',default:true}],title:'tt1234567',jwPlayerKey:'placeholder'}),mime:'text/html'},
    [player+'/video/'+dubHash]:{body:playerPage(dubHash,{tracks:[],title:'tt1234567 dublaj'}),mime:'text/html'},
    [player+'/player/index.php?data='+subHash+'&do=getVideo']:{body:JSON.stringify({hls:true,videoSource:'https://cdn.test/master.txt',securedLink:secured(video),downloadLinks:[]}),mime:'text/html'},
    [player+'/player/index.php?data='+dubHash+'&do=getVideo']:{body:JSON.stringify({hls:true,videoSource:'https://cdn.test/master.txt',securedLink:secured(dubVideo),downloadLinks:[]}),mime:'text/html'},
    [secured(video)]:{body:master,mime:'application/vnd.apple.mpegurl'},[secured(dubVideo)]:{body:master,mime:'application/vnd.apple.mpegurl'},
    [subUrl]:{body:srt,mime:'text/plain'}
  };
}
test('Paketli oynatıcı: taban 62/10 sözlük çözümü; değerlendirme yok, sınır dışı ve bozuk betik reddedilir',()=>{
  const source='function x(){FirePlayer("'+subHash+'",{"title":"tt1234567","label":"T\\u00fcrk\\u00e7e \' q"},false,source)}'+' alpha beta gamma'.repeat(40);
  assert.equal(unpackPacked(pack(source)),source);assert.equal(unpackPacked(pack(source,10)),source);assert.equal(unpackPacked(pack(source,36)),source);
  assert.equal(unpackPacked(pack(source),{maxPayload:20}),null);assert.equal(unpackPacked(pack(source),{maxWords:3}),null);
  assert.equal(unpackPacked(pack(source).replace(",62,",",63,")),null);
  assert.equal(unpackPacked('<script>var a=1;</script>'),null);
  assert.equal(unpackPacked(pack('globalThis.__kultBad=1')),'globalThis.__kultBad=1');assert.equal(globalThis.__kultBad,undefined);
  // The DiziBak base-10 unpacker keeps its own behaviour.
  assert.equal(unpackPlayer(pack('var file="https://example.test/a.m3u8"',10)),'var file="https://example.test/a.m3u8"');
});
test('KultFilmler: kart ad/yıl + oynatıcı IMDb; altyazılı ve dublaj HLS, eşlenmiş TR SRT, indirme sayılmaz',async()=>{
  const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{
    const rows=await scanKultFilmler(http,target);assert.equal(rows.length,2);
    const[sub,dub]=rows;
    assert.equal(sub.source,'KultFilmler');assert.deepEqual(sub.claimedAudioLanguages,['en']);assert.deepEqual(dub.claimedAudioLanguages,['tr']);
    assert.equal(sub.claimedQuality,undefined);assert.equal(sub.filenameSynthetic,true);assert.deepEqual(sub.headers,{});
    assert.deepEqual(sub.subtitles.map(s=>[s.language,s._scope]),[['tr','paired']]);assert.deepEqual(dub.subtitles,[]);
    const probed=await probe(http,sub,true,false,{detailedHls:false});assert.equal(probed.downloadable,false);assert.equal(probed.container,'hls');
    const subtitles=await loadSubtitles(http,sub,target,false);assert.deepEqual(subtitles.map(s=>s.language),['tr']);
    const post=calls.filter(c=>c.method==='POST');assert.equal(post.length,2);
    assert.ok(post.every(c=>c.headers['X-Requested-With']==='XMLHttpRequest'&&/^hash=[0-9a-f]{32}&r=https%3A%2F%2Fkultfilmler\.net%2F$/.test(c.body)&&c.headers.Referer.startsWith(player+'/video/')));
    assert.ok(calls.every(c=>!Object.keys(c.headers||{}).some(k=>/authorization|cookie/i.test(k))));
    assert.ok(!calls.some(c=>/other-movie/.test(c.url)));
    assert.ok(calls.every(c=>['kultfilmler.net','vidpapi.xyz','cdn.test'].includes(new URL(c.url).hostname)));
  }finally{http.close();}
});
test('KultFilmler: başka yıl/ad/IMDb, dış iframe ve yanlış oynatıcı bağı kabul edilmez',async()=>{
  const run=async(f,t=target)=>{const calls=[],h=createHttp({fetchImpl:fixtureFetch(f,calls)});try{return{rows:await scanKultFilmler(h,t),calls};}finally{h.close();}};
  let f=fixture();f[root+'/?s=Example%20Movie'].body=f[root+'/?s=Example%20Movie'].body.replace('<span class="pyear">2020</span></div></div><div class="mbody"><div class="mtx"><h3>Example','<span class="pyear">2019</span></div></div><div class="mbody"><div class="mtx"><h3>Example');
  let r=await run(f);assert.deepEqual(r.rows,[]);assert.ok(!r.calls.some(c=>c.url.startsWith(player)));
  f=fixture();f[root+'/example-movie-izle/'].body=f[root+'/example-movie-izle/'].body.replace('<h1 class="vtitle">Example Movie','<h1 class="vtitle">Another Movie');
  r=await run(f);assert.deepEqual(r.rows,[]);assert.ok(!r.calls.some(c=>c.url.startsWith(player)));
  f=fixture();for(const hash of[subHash,dubHash])f[player+'/video/'+hash].body=f[player+'/video/'+hash].body.replace('tt1234567','tt9999999');
  r=await run(f);assert.deepEqual(r.rows,[]);assert.ok(!r.calls.some(c=>c.method==='POST'));
  // The page says "Altyazılı" but the player claims the dub: ambiguous, dropped.
  f=fixture();f[player+'/video/'+subHash].body=playerPage(subHash,{tracks:[],title:'tt1234567 dublaj'});
  r=await run(f);assert.equal(r.rows.length,1);assert.deepEqual(r.rows[0].claimedAudioLanguages,['tr']);
  const page=fixture()[root+'/example-movie-izle/'].body;
  assert.deepEqual(playerEntries(page.replace(player+'/video/'+subHash,'https://other.test/video/'+subHash)).map(e=>e.hash),[dubHash]);
  assert.deepEqual(playerEntries(page.replace('kf-srcdata','other-data')),[]);
  const entry=playerEntries(page)[0],config=playerConfig(fixture()[player+'/video/'+subHash].body,entry,target);assert.equal(config.title,'tt1234567');
  assert.equal(playerConfig(fixture()[player+'/video/'+subHash].body,{...entry,hash:'f'.repeat(32)},target),null);
  assert.equal(streamCandidate({hls:true,securedLink:'https://other.test/cdn/hls/'+video+'/master.m3u8'},config,entry,target),null);
  assert.equal(streamCandidate({hls:true,securedLink:player+'/cdn/hls/'+video+'/trailer.mp4'},config,entry,target),null);
  assert.equal(streamCandidate({hls:false,securedLink:secured(video)},config,entry,target),null);
  // A subtitle of another upload is not paired with this stream.
  assert.deepEqual(streamCandidate({hls:true,securedLink:secured(dubVideo)},config,entry,target).subtitles,[]);
  r=await run(fixture(),{...target,type:'tv',season:1,episode:1});assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,0);
  r=await run(fixture(),{...target,imdbId:null});assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,0);
});
test('KultFilmler: Latin olmayan özgün adda İngilizce adla da aranır; ad parçaları güvenle ayrılır',async()=>{
  const korean={...target,originalTitle:'예시 영화',searchTitles:['Example Movie','예시 영화'],originalLanguage:'ko'};
  const f=fixture(),calls=[],h=createHttp({fetchImpl:fixtureFetch(f,calls)});
  try{const rows=await scanKultFilmler(h,korean);assert.equal(rows.length,2);assert.deepEqual(rows[0].claimedAudioLanguages,['ko']);
    assert.deepEqual(calls.filter(c=>c.url.startsWith(root+'/?s=')).map(c=>c.url),[root+'/?s='+encodeURIComponent('예시 영화'),root+'/?s=Example%20Movie']);}finally{h.close();}
  assert.ok(titleParts('Mission: Impossible - Fallout – Görevimiz Tehlike').names.includes('Mission: Impossible - Fallout'));
  assert.deepEqual(searchCards(card('x-izle','Example Movie &#8211; Örnek',2020),target).map(c=>c.url),[root+'/x-izle/']);
  assert.deepEqual(searchCards(card('x-izle','Example Movie 2 – Örnek',2020),target),[]);
  assert.deepEqual(searchCards(card('x-izle','Example Movie – Örnek',2020).replace(root+'/x-izle/','https://other.test/x-izle/'),target),[]);
  assert.deepEqual(searchCards(card('x_izle','Example Movie – Örnek',2020),target),[]);
  assert.deepEqual(searchCards(card('../x','Example Movie – Örnek',2020),target),[]);
});
