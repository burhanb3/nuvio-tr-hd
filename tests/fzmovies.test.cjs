'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanFzMovies,searchCards,pageUrl,optionKeys,downloadKey,mirrors,fileMatches}=require('../src/providers/fzmovies.cjs');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {fixtureFetch,box,moov,ebml}=require('./helpers.cjs');
const root='https://fzmovies.live',session='PHPSESSID=fixtureSession01';
const h=c=>c.repeat(32);
const target={tmdbId:27205,type:'movie',originalTitle:'Inception',searchTitles:['Inception'],year:2010,imdbId:'tt1375666',runtimeMinutes:148};
const search=root+'/csearch.php?searchname=Inception&searchby=Name&category=All&vsearch=';
const movie=root+'/movie-Inception--hmp4.htm';
const opt480='3-36192-'+h('a'),opt720='5-27328-'+h('b'),key480='3-36192-'+h('c'),key720='5-27328-'+h('d');
const choose=o=>root+'/download1.php?downloadoptionskey='+o,download=k=>root+'/download.php?downloadkey='+k;
const res='/res/'+h('1')+'/'+h('2')+'/';
const file480='Inception_(2010)_BluRay_480p_(fzmovies.net)_'+h('3')+'.mp4',file720='Inception_(2010)_BluRay_720p_(fzmovies.net)_'+h('4')+'.mkv';
const at=(host,name)=>'https://'+host+res+name+'?fromwebsite';
function mp4Media(seconds=8880){const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(seconds*1000,16);return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',box('mvhd',mvhd),moov(852,356).subarray(8)),box('mdat',Buffer.alloc(32))]);}
function mkvMedia(seconds=8880){
 const ms=Buffer.alloc(8);ms.writeDoubleBE(seconds*1000);
 const size=n=>Buffer.from([n>>8,n&255]);
 const track=ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',size(1280)),ebml('ba',size(534))]))]));
 return Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([ebml('1549a966',ebml('4489',ms)),ebml('1654ae6b',track)]))]);
}
const card=(name,href,year=2010)=>"<a id='img' href='"+href+"'><img src='/x.jpg'></a></td><td><a id='t' href='"+href+"'><small><b>"+name+'</b></small></a> <small>('+year+')</small> <small>(BluRay)</small><br>';
const option=(o,label)=>"<a id='downloadoptionslink2' onclick=\"window.location.href=&quot;download1.php?downloadoptionskey="+o+"&pt=fixture&quot;; return false;\" itemprop='url' href='download1.php?downloadoptionskey="+o+"'>"+label+'</a>';
const input=url=>"<input type='text' name='download1' value='"+url+"' size='35px' readonly>";
const dlink=(name,host)=>"<a href='dlink.php?id=res/"+h('1')+'/'+h('2')+'/'+name+'?fromwebsite&sn='+host+"&altsn='>Download</a>";
function fixture(){return{
 [search]:{body:"<input id='searchname' type='text' name='searchname' value=''>"+card('Inception: The Cobol Job','movie-Inception The Cobol Job--hmp4.htm')+card('Inception','movie--Dubbed--Inception [Hindi]--hmp4.htm')+card('Inception','movie-Inception--hmp4.htm')},
 [movie]:{body:"<a href='https://www.imdb.com/title/tt1375666/'>IMDb</a>"+option(opt480,'Inception BluRay 480p.mp4')+option(opt720,'Inception BluRay 720p.mkv'),headers:{'set-cookie':session+'; path=/'}},
 [choose(opt480)]:{body:"<a id='downloadlink' href='download.php?downloadkey="+key480+"'>Download</a>"},
 [choose(opt720)]:{body:"<a id='downloadlink' onclick=\"window.location.href=&quot;download.php?downloadkey="+key720+"&pt=fixture&quot;\" href='download.php?downloadkey="+key720+"'>Download</a>"},
 [download(key480)]:{body:"<input id='searchname' type='text' name='searchname' value=''>"+input(at('srv1.files.test',file480))+input(at('srv2.files.test',file480))+input(at('srv3.files.test',file480))+dlink(file480,'srv1.files.test')},
 [download(key720)]:{body:input(at('srv1.files.test',file720))+input(at('srv2.files.test',file720))},
 [root+'/expired']:{body:'<title>Download key expired</title>'},
 [at('srv1.files.test',file480)]:{throw:true},[at('srv2.files.test',file480)]:{body:mp4Media(),mime:'video/mp4'},
 [at('srv1.files.test',file720)]:{body:mkvMedia(),mime:'video/x-matroska'}
};}
// Download keys only work with the session the film page issued.
function fetcher(f,calls=[]){const base=fixtureFetch(f,calls);return async(url,o={})=>/\/download1?\.php\?/.test(url)&&o.headers?.Cookie!==session?base(root+'/expired',o):base(url,o);}
async function scan(f,t=target,calls=[]){const http=createHttp({fetchImpl:fetcher(f,calls)});try{return await scanFzMovies(http,t);}finally{http.close();}}

test('FzMovies: IMDb bağlı film sayfası ve oturum çereziyle küçük MP4 ve 720p MKV adayı üretir; çerez dosyaya gitmez',async()=>{
 const calls=[],http=createHttp({fetchImpl:fetcher(fixture(),calls)});
 try{
  const rows=await scanFzMovies(http,target);
  assert.deepEqual(rows.map(r=>({url:r.url,alt:r.alternateUrls,file:r.filename,source:r.source,headers:r.headers})),[
   {url:at('srv1.files.test',file480),alt:[at('srv2.files.test',file480),at('srv3.files.test',file480)],file:file480,source:'FzMovies',headers:{}},
   {url:at('srv1.files.test',file720),alt:[at('srv2.files.test',file720)],file:file720,source:'FzMovies',headers:{}}]);
  for(const r of rows){assert.equal(r.requireDuration,true);assert.equal(r.durationTolerance,0.1);assert.equal(r.requireVideoDimensions,true);}
  // Only the two download pages see the session; the dubbed page is never opened.
  for(const u of [choose(opt480),choose(opt720),download(key480),download(key720)])assert.equal(calls.find(c=>c.url===u).headers.Cookie,session);
  assert.ok(calls.filter(c=>!/\/download1?\.php\?/.test(c.url)).every(c=>!Object.keys(c.headers||{}).some(k=>/cookie|authorization/i.test(k))));
  assert.ok(!calls.some(c=>/Dubbed|Cobol|dlink\.php/.test(decodeURIComponent(c.url))));
  // The first server fails at the transport level; its sibling answers.
  const v480=await probe(http,rows[0]);
  assert.equal(v480.url,at('srv2.files.test',file480));assert.equal(v480.container,'mp4');assert.deepEqual(v480.dimensions,{width:852,height:356});
  const v720=await probe(http,rows[1]);
  assert.equal(v720.url,at('srv1.files.test',file720));assert.equal(v720.container,'mkv');assert.deepEqual(v720.dimensions,{width:1280,height:534});
  assert.equal(v720.downloadable,true);
 }finally{http.close();}
});
test('FzMovies: ilk iki sunucu başarısızsa üçüncü aynı dosya sunucusu denenir; diğer kaynaklar tek yedekte kalır',async()=>{
 const urls=['srv1','srv2','srv3'].map(s=>at(s+'.files.test',file480));
 const candidate={url:urls[0],alternateUrls:urls.slice(1),filename:file480,source:'FzMovies',headers:{},subtitles:[],identity:target,requireDuration:true,durationTolerance:0.1,requireVideoDimensions:true};
 for(const [source,expected] of [['FzMovies',urls[2]],['FzTvSeries',null]]){
  const http=createHttp({fetchImpl:fixtureFetch({[urls[0]]:{throw:true},[urls[1]]:{throw:true},[urls[2]]:{body:mp4Media(),mime:'video/mp4'}})});
  try{assert.equal((await probe(http,{...candidate,source}))?.url??null,expected);}finally{http.close();}
 }
 // A 403 answer ends the attempt instead of trying more servers.
 const calls=[],http=createHttp({fetchImpl:fixtureFetch({[urls[0]]:{status:403},[urls[1]]:{body:mp4Media(),mime:'video/mp4'}},calls)});
 try{assert.equal(await probe(http,candidate),null);assert.ok(!calls.some(c=>c.url===urls[1]));}finally{http.close();}
});
test('FzMovies: yanlış/çoklu IMDb, eksik çerez, yanlış anahtar ve yanlış dosya adı sonuç üretmez',async()=>{
 let f=fixture();f[movie].body=f[movie].body.replace('tt1375666','tt0000001');assert.deepEqual(await scan(f),[]);
 f=fixture();f[movie].body+="<a href='https://www.imdb.com/title/tt0000001/'>Other</a>";assert.deepEqual(await scan(f),[]);
 f=fixture();delete f[movie].headers;assert.deepEqual(await scan(f),[]);
 // A download key from another option is not followed.
 f=fixture();f[choose(opt480)].body="<a href='download.php?downloadkey="+key720+"'>x</a>";f[choose(opt720)].body='';assert.deepEqual(await scan(f),[]);
 f=fixture();f[download(key720)].body='';f[download(key480)].body=input(at('srv1.files.test','Inception_(2010)_Hindi_Dubbed_480p_'+h('3')+'.mp4'));assert.deepEqual(await scan(f),[]);
 f=fixture();f[download(key720)].body='';f[download(key480)].body=input(at('srv1.files.test','Inception_The_Cobol_Job_(2010)_480p.mp4'));assert.deepEqual(await scan(f),[]);
 f=fixture();f[download(key720)].body='';f[download(key480)].body=input(at('srv1.files.test','Inception_(2011)_BluRay_480p.mp4'));assert.deepEqual(await scan(f),[]);
});
test('FzMovies: dizi, eksik IMDb ve eşleşmeyen arama ağ isteği yapmadan ya da boş döner',async()=>{
 for(const other of [{...target,type:'tv',season:1,episode:1},{...target,imdbId:undefined}]){
  const calls=[];assert.deepEqual(await scan(fixture(),other,calls),[]);assert.equal(calls.length,0);
 }
 const calls=[];assert.deepEqual(await scan(fixture(),{...target,originalTitle:'Interstellar',searchTitles:[]},calls),[]);
 assert.deepEqual(calls.map(c=>c.url),[root+'/csearch.php?searchname=Interstellar&searchby=Name&category=All&vsearch=']);
 // Same IMDb page but the file names another year: no candidate.
 assert.deepEqual(await scan(fixture(),{...target,year:1999,releaseYears:[]}),[]);
});
test('FzMovies: arama kartı, dublaj sayfası ve sayfa adresi kesin eşleşir',()=>{
 assert.deepEqual(searchCards(card('The Crow 1994','movie-The Crow 1994--hmp4.htm',1994),{...target,originalTitle:'The Crow',searchTitles:[],year:1994}).map(r=>r.href),[root+'/movie-The%20Crow%201994--hmp4.htm']);
 // Same name, other year: kept after the exact-year card, max three pages.
 assert.deepEqual(searchCards(card('The Eye','movie-The Eye 2--hmp4.htm',2002)+card('The Eye','movie-The Eye--hmp4.htm',2008),{...target,originalTitle:'The Eye',searchTitles:[],year:2008}).map(r=>r.href),[root+'/movie-The%20Eye--hmp4.htm',root+'/movie-The%20Eye%202--hmp4.htm']);
 assert.deepEqual(searchCards(card('The Eyes of My Mother','movie-The Eyes of My Mother--hmp4.htm',2016),{...target,originalTitle:'The Eye',searchTitles:[],year:2008}),[]);
 assert.equal(pageUrl('movie--Dubbed--Inception [Hindi]--hmp4.htm'),null);
 for(const bad of ['movie-../x--hmp4.htm','movie-a/b--hmp4.htm','movie-x--hmp4.htm?x=1','https://other.test/movie-x--hmp4.htm'])assert.equal(pageUrl(bad),null);
 assert.equal(pageUrl('movie-Star Wars%3A Episode IV--hmp4.htm'),root+'/movie-Star%20Wars%3A%20Episode%20IV--hmp4.htm');
 assert.deepEqual(optionKeys(option(opt480,'a')+option(opt480,'a')+option(opt720,'b')),[opt480,opt720]);
 assert.equal(downloadKey("download.php?downloadkey="+key480+"x",opt480),null);
 assert.equal(downloadKey("download.php?downloadkey="+key480,opt480),key480);
 assert.equal(fileMatches('Spider-Man_Into_the_Spider-Verse_(2018)_BluRay_720p.mkv','Spider-Man: Into the Spider-Verse',{...target,originalTitle:'Spider-Man: Into the Spider-Verse',year:2018}),true);
 assert.equal(fileMatches('Inception_(2010)_Sample.mp4','Inception',target),false);
});
test('FzMovies: ayna listesi yalnız aynı yol ve aynı dosya sunucusu alanından https medya adresi kabul eder',()=>{
 assert.deepEqual(mirrors(['srv1','srv2','srv3','srv4'].map(s=>input(at(s+'.files.test',file480))).join('')),['srv1','srv2','srv3'].map(s=>at(s+'.files.test',file480)));
 assert.deepEqual(mirrors(input(at('srv1.files.test',file480))+input(at('srv2.other.test',file480))),[at('srv1.files.test',file480)]);
 assert.deepEqual(mirrors(input(at('srv1.files.test',file480))+input(at('srv2.files.test',file720))),[at('srv1.files.test',file480)]);
 // Raw spaces in a listed name are sent as %20 (seen on "BluRay v2" files).
 const spaced='The_Dark_Knight_(2008)_BluRay v2_720p_(fzmovies.net)_'+h('5')+'.mkv';
 assert.deepEqual(mirrors(input(at('srv1.files.test',spaced))),[at('srv1.files.test',spaced.replace(' ','%20'))]);
 assert.equal(fileMatches(decodeURIComponent(spaced.replace(' ','%20')),'The Dark Knight',{...target,originalTitle:'The Dark Knight',year:2008}),true);
 assert.deepEqual(mirrors(input(at('srv1.files.test',file480).replace('srv1','srv1\t'))),[]);
 for(const bad of ['https://srv1.files.test/res/x/y/a.mp4?fromwebsite','https://srv1.files.test'+res+'a.m3u8?fromwebsite','https://srv1.files.test'+res+'a.mp4?token=1',
  'http://srv1.files.test'+res+'a.mp4','https://www.fzmovies.live'+res+'a.mp4','https://localhost'+res+'a.mp4','https://u@srv1.files.test'+res+'a.mp4'])assert.deepEqual(mirrors(input(bad)),[]);
});
