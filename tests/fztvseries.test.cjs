'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanFzTvSeries,searchCards,seasonLink,episodeFile,mirrors,fileMatches}=require('../src/providers/fztvseries.cjs');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {fixtureFetch,box,moov}=require('./helpers.cjs');
const root='https://tvseries.in',dkey='0123456789abcdef0123456789abcdef',session='PHPSESSID=fixtureSession01';
const target={tmdbId:48866,type:'tv',originalTitle:'The 100',searchTitles:['The 100'],year:2014,imdbId:'tt2661044',season:1,episode:1,runtimeMinutes:43};
const search=root+'/search.php?search=The%20100&beginsearch=Search&vsearch=&by=series';
const show=root+'/subfolder-The%20100.htm',season=root+'/files-The%20100--3725.htm';
const episode=root+'/episode.php?fileid=52481&ftype=2',download=root+'/downloadmp4.php?fileid=52481&dkey='+dkey;
const path='/rlink_t/fixture/The_100_-_S01E01_-_Pilot_fixture.mp4',first='https://srv1.files.test'+path,second='https://srv2.files.test'+path;
function media(seconds=2580){const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(seconds*1000,16);return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',box('mvhd',mvhd),moov(640,360).subarray(8)),box('mdat',Buffer.alloc(32))]);}
const card=(name,href)=>"<article class='series-card' itemscope><a class='series-card-poster' href='"+href+"'></a><div class='series-card-body'><h3 class='series-card-title'><a href='"+href+"' itemprop='name'>"+name+'</a></h3></div></article>';
const pill=(n,href)=>"<a class='season-pill' itemprop='url' href='"+href+"' title='Season "+n+"'><span itemprop='name'>Season "+n+'</span></a>';
const epCard=(badge,id)=>"<div class='ep-card'><div class='ep-card-title'><span class='ep-card-badge'>"+badge+"</span>Name</div><div class='ep-card-formats'><a class='ep-card-fmt' href='"+root+'/episode.php?fileid='+id+"&ftype=2'>High MP4</a><a class='ep-card-fmt' href='"+root+'/episode.php?fileid='+id+"&ftype=3'>WEBM</a></div></div>";
const link=(host,p=path,ep='52481')=>"<a href='filelink.php?sn="+host+'&id='+p+'&ep='+ep+"'>Download</a>";
function fixture(){return{
 [search]:{body:"<aside><a href='"+root+"/subfolder-NCIS.htm'>NCIS</a></aside><main class='site-content'>"+card('The 100 Code',root+'/subfolder-The%20100%20Code.htm')+card('The 100',show)+'</main>'},
 [root+'/subfolder-The%20100%20Code.htm']:{body:"<a href='https://www.imdb.com/title/tt9999999/'>IMDb</a>"},
 [show]:{body:"<a href='https://www.imdb.com/title/tt2661044/'>IMDb</a><div class='season-pill-grid'>"+pill(1,season)+pill(2,root+'/files-The%20100--3726.htm')+'</div>'},
 [season]:{body:"<a href='https://www.imdb.com/title/tt2661044/'>IMDb</a>"+epCard('S01E01',52481)+epCard('S01E02',52482)},
 [episode]:{body:"<a id='dlink2' onclick='window.location.href=\""+root+'/downloadmp4.php?fileid=52481&amp;dkey='+dkey+"\"; return false;'>Download MP4</a>",headers:{'set-cookie':session+'; path=/; secure; HttpOnly'}},
 [download]:{body:'<title>The 100 - S01E01 - Pilot</title>'+link('srv1.files.test')+link('srv2.files.test')},
 [root+'/expired']:{body:'<title>Download key expired</title>'},
 [first]:{throw:true},[second]:{body:media(),mime:'video/mp4'}
};}
// The download key only works with the session the episode page issued.
function fetcher(f,calls=[]){const base=fixtureFetch(f,calls);return async(url,o={})=>url.startsWith(root+'/downloadmp4.php')&&o.headers?.Cookie!==session?base(root+'/expired',o):base(url,o);}
async function scan(f,t=target,calls=[]){const http=createHttp({fetchImpl:fetcher(f,calls)});try{return await scanFzTvSeries(http,t);}finally{http.close();}}

test('FzTvSeries: IMDb bağlı dizi, tam bölüm ve oturum çereziyle iki aynalı tek aday üretir; çerez dosyaya gitmez',async()=>{
 const calls=[],http=createHttp({fetchImpl:fetcher(fixture(),calls)});
 try{
  const rows=await scanFzTvSeries(http,target);
  assert.equal(rows.length,1);
  assert.deepEqual({url:rows[0].url,alt:rows[0].alternateUrls,headers:rows[0].headers,source:rows[0].source,file:rows[0].filename},
   {url:first,alt:[second],headers:{},source:'FzTvSeries',file:'The_100_-_S01E01_-_Pilot_fixture.mp4'});
  assert.equal(rows[0].requireDuration,true);assert.equal(rows[0].durationTolerance,0.1);assert.equal(rows[0].requireVideoDimensions,true);
  assert.equal(calls.find(c=>c.url===download).headers.Cookie,session);
  assert.ok(calls.filter(c=>c.url!==download).every(c=>!Object.keys(c.headers||{}).some(k=>/cookie|authorization/i.test(k))));
  // First mirror fails at the transport level; the sibling server answers.
  const video=await probe(http,rows[0]);
  assert.equal(video.url,second);assert.equal(video.downloadable,true);assert.deepEqual(video.dimensions,{width:640,height:360});
  assert.ok(!calls.some(c=>c.url.includes('filelink.php')));
 }finally{http.close();}
});
test('FzTvSeries: yanlış/çoklu IMDb, eksik çerez ve yanlış dosya adı sonuç üretmez',async()=>{
 let f=fixture();f[show].body=f[show].body.replace('tt2661044','tt0000001');assert.deepEqual(await scan(f),[]);
 f=fixture();f[show].body+="<a href='https://www.imdb.com/title/tt0000001/'>Other</a>";assert.deepEqual(await scan(f),[]);
 f=fixture();f[season].body=f[season].body.replace('tt2661044','tt0000001');assert.deepEqual(await scan(f),[]);
 f=fixture();delete f[episode].headers;assert.deepEqual(await scan(f),[]);
 f=fixture();f[download].body=link('srv1.files.test','/rlink_t/fixture/The_100_-_S01E02_-_Earth_Skills.mp4');assert.deepEqual(await scan(f),[]);
 f=fixture();f[download].body=link('srv1.files.test','/rlink_t/fixture/Another_Show_-_S01E01.mp4');assert.deepEqual(await scan(f),[]);
});
test('FzTvSeries: eksik bölüm, sezon ve dizi/anime dışı istek ağ isteği yapmadan ya da boş döner',async()=>{
 assert.deepEqual(await scan(fixture(),{...target,episode:3}),[]);
 assert.deepEqual(await scan(fixture(),{...target,season:5}),[]);
 for(const other of [{...target,type:'movie'},{...target,isAnime:true},{...target,imdbId:undefined}]){
  const calls=[];assert.deepEqual(await scan(fixture(),other,calls),[]);assert.equal(calls.length,0);
 }
});
test('FzTvSeries: arama kartı, sezon bağlantısı ve bölüm kartı kesin eşleşir',()=>{
 const html="<main class='site-content'>"+card('Shameless UK',root+'/subfolder-Shameless%20UK.htm')+card('Shameless US',root+'/subfolder-Shameless%20US.htm')+card('Shamelessly',root+'/subfolder-Shamelessly.htm')+'</main>';
 assert.deepEqual(searchCards(html,{...target,originalTitle:'Shameless',searchTitles:['Shameless']}).map(r=>r.name),['Shameless UK','Shameless US']);
 assert.deepEqual(searchCards(card('The 100',show),target),[]);
 assert.equal(searchCards("<main class='site-content'>"+card('Greys Anatomy',root+'/subfolder-Greys%20Anatomy.htm')+'</main>',{...target,originalTitle:"Grey's Anatomy",searchTitles:[]})[0].name,'Greys Anatomy');
 // Compact season grids show only the number; the title attribute names the season.
 assert.equal(seasonLink("<a class='season-pill' itemprop='url' href='"+root+"/files-NCIS--92.htm' title='Season 3'><span>3</span></a>",root+'/subfolder-NCIS.htm',{season:3}),root+'/files-NCIS--92.htm');
 assert.equal(seasonLink(pill(1,root+'/files-Other--1.htm'),show,target),null);
 assert.equal(seasonLink(pill(1,season)+pill(1,root+'/files-The%20100--9999.htm'),show,target),null);
 assert.equal(episodeFile(epCard('S01E01',1)+epCard('S01E01',2),target),null);
 assert.equal(episodeFile(epCard('S01E10',7),target),null);
 assert.equal(fileMatches('Shameless_Us_-_S02E01_-_Summertime.mp4','Shameless US',{...target,originalTitle:'Shameless',season:2}),true);
 assert.equal(fileMatches('The_100_-_S01E01E02.mp4','The 100',target),false);
});
test('FzTvSeries: ayna listesi yalnız aynı yol ve aynı dosya sunucusu alanından https adres kabul eder',()=>{
 assert.deepEqual(mirrors(link('srv1.files.test')+link('srv2.files.test'),'52481'),[first,second]);
 assert.deepEqual(mirrors(link('srv1.files.test')+link('srv2.other.test'),'52481'),[first]);
 assert.deepEqual(mirrors(link('srv1.files.test')+link('srv2.files.test','/rlink_t/other/The_100_-_S01E01.mp4'),'52481'),[first]);
 assert.deepEqual(mirrors(link('srv1.files.test',path,'99'),'52481'),[]);
 for(const bad of ['/../secret.mp4','/a/file.mkv','/a/file.mp4?x=1','relative.mp4'])assert.deepEqual(mirrors(link('srv1.files.test',bad),'52481'),[]);
 for(const host of ['tvseries.in','www.tvseries.in','user@srv1.files.test','localhost'])assert.deepEqual(mirrors(link(host),'52481'),[]);
});
test('FzTvSeries: aynalar başarısızsa ya da yedek başka alandaysa probe null döner',async()=>{
 const candidate={url:first,alternateUrls:[second],filename:'x.mp4',source:'FzTvSeries',headers:{},subtitles:[],identity:target,requireDuration:true,durationTolerance:0.1,requireVideoDimensions:true};
 for(const [f,c,expected] of [[{[first]:{throw:true},[second]:{throw:true}},candidate,0],
  [{[first]:{throw:true},['https://srv2.other.test'+path]:{body:media(),mime:'video/mp4'}},{...candidate,alternateUrls:['https://srv2.other.test'+path]},0],
  [{[first]:{throw:true},[second]:{body:media(),mime:'video/mp4'}},{...candidate,source:'Goojara'},null]]){
   const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});
   try{assert.equal(await probe(http,c),null);if(expected===0)assert.ok(!calls.some(x=>x.url.includes('other.test')));}finally{http.close();}
 }
});
