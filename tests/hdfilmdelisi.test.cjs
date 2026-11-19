'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanHdFilmDelisi,filmMatches,pageIdentity,playerLinks,mediaLinks}=require('../src/providers/hdfilmdelisi.cjs');
const{base64Bytes}=require('../src/media/base64.cjs'),{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const{target,fixtureFetch}=require('./helpers.cjs');
const origin='https://hdfilmdelisi1.com',embed='https://pl.vixolity.com/ExamplePublic',file='https://ha.vixolity.com/vs/tt0133093';
const wrap=(code,key)=>{const shift=Buffer.from(Array.from(code,c=>(c.charCodeAt(0)+key)%256)),hex=Buffer.from(shift.toString('base64').split('').reverse().join(''),'latin1').toString('hex');return `})('${hex}',${key});`;};
// Legacy player: script text shifted directly.
function encodedPlayer(url=file){return wrap(`new Player({file:'${url}'});`,7);}
// 2026 player: the shifted text is base64 of the UTF-8 script holding AYAR.
function settingsPlayer(url=file,videoId='tt0133093'){const code=`var AYAR = ${JSON.stringify({kaynak:url,videoId,baslik:'Matrix Türkçe',tema:'denim'})};`;return wrap(Buffer.from(code,'utf8').toString('base64'),12);}
const push=data=>'<script>self.__next_f.push([1,'+JSON.stringify(data)+'])</script>';
const gate=(sources,access='public',auth=false)=>'6a:["$","$L74",null,'+JSON.stringify({accessLevel:access,requireAuthForWatch:auth,children:['$','$L75',null,{posterUrl:'https://img.test/p.webp',sources}]})+']';
const movieLd=(sameAs='https://www.imdb.com/title/tt0133093/',year=1999)=>'<script id="jsonld-movie" type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'Movie',name:'Matrix',alternateName:'The Matrix',datePublished:year,sameAs})+'</script>';
const master='#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="Türkçe",LANGUAGE="tr",URI="https://ha.vixolity.com/mm/tt0133093/main/index-a1.gif"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="English",LANGUAGE="en",URI="https://ha.vixolity.com/mm/tt0133093/main/index-a2.gif"\n#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="s",NAME="Türkçe",LANGUAGE="tr",URI="https://ha.vixolity.com/vtt/tt0133093/sub_tr.gif"\n#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1920x804,AUDIO="a",SUBTITLES="s"\nhttps://ha.vixolity.com/mm/tt0133093/main/index-v1-a1.gif\n';
const child='https://ha.vixolity.com/mm/tt0133093/main/index-v1-a1.gif';
function fixture(){const row={id:'68a9',slug:'matrix',baslik:'Matrix',orijinalBaslik:'The Matrix',yayinYili:1999,imdbPuani:8.7,sure:136};return{row,files:{
 [origin+'/api/search?q=The%20Matrix']:{json:{results:[{...row,slug:'matrix-2',yayinYili:2003},row],series:[],kisiler:[]}},
 [origin+'/film/matrix']:{body:movieLd()+push(gate([{key:'main',title:'Delicore(VIP)',url:embed}]))},
 [embed]:{body:'<meta name="referrer" content="no-referrer"><script>(function(a,b){'+settingsPlayer()+'</script>'},
 [file+'?format=.m3u8']:{body:master},
 [child]:{body:'#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6,\nseg0.ts\n#EXT-X-ENDLIST\n'}
 }};}
test('current public catalogue (hdfilmdelisi1.com) and settings player yield a real TR/EN HLS, excluded from native downloads',async()=>{
 const f=fixture(),calls=[],http=createHttp({fetchImpl:fixtureFetch(f.files,calls)});try{const rows=await scanHdFilmDelisi(http,{...target,runtimeMinutes:136});assert.equal(rows.length,1);assert.equal(rows[0].url,file+'?format=.m3u8');assert.equal(rows[0].verifyFirstVariant,true);
 const v=await probe(http,rows[0],true,false,{detailedHls:false});assert.equal(v.container,'hls');assert.equal(v.downloadable,false);assert.deepEqual(v.audioLanguages,['tr','en']);assert.deepEqual(v.subtitleLanguages,['tr']);assert.deepEqual(v.resolutionOptions,[{width:1920,height:804}]);
 assert.equal(calls.filter(c=>c.url===child).length,1,'exactly one child playlist check');
 const nativeAllowed=u=>!u.endsWith('.m3u8')&&!u.includes('.m3u8?');assert.equal(nativeAllowed(rows[0].url),false);
 }finally{http.close();}
});
test('a master whose segment store answers 5xx or HTML is not listed; a slow store is kept',async()=>{
 for(const [entry,listed] of [[{status:502},false],[{body:'<!DOCTYPE html><title>502</title>'},false]]){
  const f=fixture();f.files[child]=entry;const http=createHttp({fetchImpl:fixtureFetch(f.files)});
  try{const rows=await scanHdFilmDelisi(http,{...target,runtimeMinutes:136});assert.equal(rows.length,1);assert.equal(!!await probe(http,rows[0],true,false,{detailedHls:false}),listed);}finally{http.close();}
 }
 const f=fixture(),slow=fixtureFetch(f.files);const http=createHttp({fetchImpl:(url,o)=>url===child?new Promise(()=>{}):slow(url,o)});
 try{const rows=await scanHdFilmDelisi(http,{...target,runtimeMinutes:136});const v=await probe(http,rows[0],true,false,{detailedHls:false});assert.equal(v?.container,'hls');}finally{http.close();}
});
test('old domain still answers search; its 301 to the new film page is followed',async()=>{
 const f=fixture(),files={...f.files};delete files[origin+'/api/search?q=The%20Matrix'];
 files['https://hdfilmdelisi.one/api/search?q=The%20Matrix']=f.files[origin+'/api/search?q=The%20Matrix'];
 files['https://hdfilmdelisi.one/film/matrix']={status:301,headers:{location:origin+'/film/matrix'}};
 const http=createHttp({fetchImpl:fixtureFetch(files)});
 try{const rows=await scanHdFilmDelisi(http,target);assert.equal(rows.length,1);assert.equal(rows[0].url,file+'?format=.m3u8');}finally{http.close();}
});
test('wrong year/title/slug, wrong page IMDb, private or sign-in gate and unrelated player/media URLs are rejected',async()=>{
 const {row}=fixture();assert.equal(filmMatches(row,target),true);
 for(const patch of[{yayinYili:2000},{orijinalBaslik:'The Matrix Reloaded'},{slug:'../x'},{imdbId:'tt0000001'},{accessLevel:'premium'}])assert.equal(filmMatches({...row,...patch},target),false);
 assert.equal(pageIdentity(movieLd(),target),true);
 for(const ld of[movieLd('https://www.imdb.com/title/tt01330930/'),movieLd('https://www.imdb.com/title/tt0000001/'),movieLd('https://evil.test/?https://www.imdb.com/title/tt0133093/'),movieLd(null),movieLd(undefined,2003)])assert.equal(pageIdentity(ld,target),false);
 const src=[{key:'main',url:embed}];
 assert.deepEqual(playerLinks(push(gate(src))),[embed]);
 assert.deepEqual(playerLinks(push(gate(src,'premium'))),[]);assert.deepEqual(playerLinks(push(gate(src,'public',true))),[]);
 assert.deepEqual(playerLinks(push('x:'+JSON.stringify({sources:src}))),[],'no explicit public gate → closed');
 assert.deepEqual(playerLinks(push(gate([{key:'main',url:'https://other.test/embed'}]))),[]);
 assert.deepEqual(mediaLinks(settingsPlayer(),target),[file+'?format=.m3u8']);
 assert.deepEqual(mediaLinks(settingsPlayer(file,'tt0000001'),target),[]);assert.deepEqual(mediaLinks(settingsPlayer('https://ha.vixolity.com/vs/tt0000001'),target),[]);
 assert.deepEqual(mediaLinks(settingsPlayer('https://other.test/vs/tt0133093'),target),[]);assert.deepEqual(mediaLinks(settingsPlayer(file+'?x=1'),target),[]);
 assert.deepEqual(mediaLinks(encodedPlayer(),target),[file+'?format=.m3u8'],'legacy player format still decodes');
 assert.deepEqual(mediaLinks(encodedPlayer('https://ha.vixolity.com/vs/tt0000001'),target),[]);assert.deepEqual(mediaLinks(encodedPlayer('https://other.test/vs/tt0133093'),target),[]);
 const f=fixture();f.files[origin+'/film/matrix'].body=movieLd('https://www.imdb.com/title/tt0000001/')+push(gate(src));
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f.files,calls)});try{assert.deepEqual(await scanHdFilmDelisi(http,target),[]);assert.ok(!calls.some(c=>c.url===embed),'player is not opened for a page of another title');}finally{http.close();}
});
test('SEO mp4 placeholder and remote JavaScript are never used as downloadable media',async()=>{
 const f=fixture();f.files[origin+'/film/matrix'].body=movieLd()+'<video src="https://source.test/fake.mp4"></video>';
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f.files,calls)});try{assert.deepEqual(await scanHdFilmDelisi(http,target),[]);assert.ok(!calls.some(c=>c.url.includes('fake.mp4')));}finally{http.close();}
});
test('binary base64 preserves every byte without native string/atob truncation',()=>{
 const bytes=Buffer.from(Array.from({length:256},(_,i)=>i));assert.deepEqual(Buffer.from(base64Bytes(bytes.toString('base64'))),bytes);assert.equal(base64Bytes('%%'),null);
});
