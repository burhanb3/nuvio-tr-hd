'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanRareFilmm,titleMatches,articleData,playerData,searchPages}=require('../src/providers/rarefilmm.cjs');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {fixtureFetch,box,moov,srt}=require('./helpers.cjs');
const {loadSubtitles}=require('../src/subtitles.cjs');
const {cardFields}=require('../src/media/presentation.cjs');
const target={tmdbId:123456,type:'movie',originalTitle:'Example Film',year:1990,imdbId:'tt1234567',runtimeMinutes:90,originalLanguage:'tr',searchTitles:['Example Film']};
const root='https://rarefilmm.com',page=root+'/2020/11/example-film-1990/',embed='https://ok.ru/videoembed/12345678';
const file=n=>'https://ok1-2.vkuser.net/?fixture='+n;
const article='<h1><span class="entry-title-primary">Example Film (1990)</span> <span>AKA Alternate Name</span></h1><article><iframe src="//ok.ru/videoembed/12345678"></iframe><p>Language: Turkish | Subtitles: English (hard)</p></article>';
const metadata={provider:'UPLOADED_ODKL',ownerMovieId:'12345678',movie:{id:'12345678',title:'[HD/1080p] Example Film (1990) ENG SUBS',duration:'5400',status:'OK',subtitleTracks:[{url:'//ok1-2.vkuser.net/?fixture=sub',language:'en'}]},videos:['lowest','low','sd','hd','full','ultra'].map(name=>({name,url:file(name)}))};
const player=m=>'<div data-movie-id="12345678" data-options="'+JSON.stringify({flashvars:{metadata:m}}).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"></div>';
function video(width,height){const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(5400000,16);return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',box('mvhd',mvhd),moov(width,height).subarray(8)),box('mdat',Buffer.alloc(32))]);}
function fixture(){return{
 [root+'/?s=Example%20Film']:{body:'<h2><a href="'+page+'">EXAMPLE FILM (1990) AKA ALTERNATE NAME</a></h2>'},
 [page]:{body:article},[embed]:{body:player(metadata)},
 [file('ultra')]:{body:video(3840,2160)},[file('lowest')]:{body:video(426,240)},[file('hd')]:{body:video(1280,720)},[file('sub')]:{body:srt,mime:'text/plain'}
};}
test('RareFilmm: genel arama doğru film/yıl/oynatıcı ile küçük ve yüksek dosyaları aynı bütçede korur',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});
 try{const candidates=await scanRareFilmm(http,target);assert.equal(candidates.length,3);assert.deepEqual(candidates.map(c=>c.url),[file('ultra'),file('lowest'),file('hd')]);
  const videos=[];for(const candidate of candidates)videos.push(await probe(http,candidate));
  assert.deepEqual(videos.map(v=>v.dimensions.height),[2160,240,720]);assert.ok(videos.every(v=>v.downloadable&&v.container==='mp4'));
  const subs=await loadSubtitles(http,candidates[0],target,false);assert.equal(subs.length,1);assert.equal(subs[0].language,'en');
  assert.match(cardFields(videos[0],candidates[0],subs).language,/EN görüntüde/);
  assert.ok(calls.length<15);
 }finally{http.close();}
});
test('RareFilmm: yıl/IMDb/oynatıcı kimliği veya başlık çelişkisi ve kısa örnek reddedilir',()=>{
 assert.equal(titleMatches('Example Film (1991)',target),false);assert.equal(titleMatches('Example Film 2 (1990)',target),false);
 assert.equal(articleData(article.replace('</article>','<a href="https://imdb.com/title/tt9999999/">IMDb</a></article>'),target),null);
 for(const change of[{ownerMovieId:'999'},{provider:'OTHER'},{movie:{...metadata.movie,id:'999'}},{movie:{...metadata.movie,title:'Other Film (1990)'}},{movie:{...metadata.movie,duration:'60'}},{movie:{...metadata.movie,isLive:true}},{movie:{...metadata.movie,isClip:true}},{movie:{...metadata.movie,status:'BLOCKED'}}])
  assert.equal(playerData(player({...metadata,...change}),embed,target),null);
});
test('RareFilmm: öneri, yorum, dış arama adresi ve reklam hostundan video alınmaz',()=>{
 assert.deepEqual(searchPages('<h2><a href="https://ad.test/2020/11/example-film-1990/">Example Film (1990)</a></h2>',target),[]);
 assert.equal(articleData('<h1>Example Film (1990)</h1><article>No player</article><iframe src="//ok.ru/videoembed/12345678"></iframe>',target),null);
 assert.equal(articleData(article.replace('//ok.ru/','//ok.ru.evil.test/'),target),null);
 assert.deepEqual(articleData(article.replace('Language: Turkish','Languages: Turkish, Kurdish, Dutch'),target).claimedAudioLanguages,['tr','ku','nl']);
 const data=playerData(player({...metadata,videos:[{name:'ultra',url:'https://ad.test/video.mp4'},{name:'hd',url:file('hd'),disallowed:true}]}),embed,target);
 assert.deepEqual(data.videos,[]);
 assert.equal(playerData(player({...metadata,movie:{...metadata.movie,subtitleTracks:[null,{language:'en',url:'https://ad.test/sub.srt'}]}}),embed,target).videos.length,3);
 assert.equal(playerData('<div data-movie-id="12345678" data-options="broken"></div>',embed,target),null);
});
test('RareFilmm: dizi/anime istekleri ek ağ işi açmaz; bozuk dosya geçerli kardeşini silmez',async()=>{
 const calls=[],f=fixture();f[file('ultra')]={body:'<html>gone</html>'};const http=createHttp({fetchImpl:fixtureFetch(f,calls)});
 try{assert.deepEqual(await scanRareFilmm(http,{...target,type:'tv'}),[]);assert.deepEqual(await scanRareFilmm(http,{...target,isAnime:true}),[]);assert.equal(calls.length,0);
  const candidates=await scanRareFilmm(http,target);assert.equal(await probe(http,candidates[0]),null);assert.ok((await probe(http,candidates[1])).downloadable);
 }finally{http.close();}
});
