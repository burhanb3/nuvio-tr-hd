'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {scanMoviesDrive,titleMatches,fileMatches,searchPages,releaseEntries,pixelPage,pixelFile}=require('../src/providers/moviesdrive.cjs');
const {probe}=require('../src/media/probe.cjs'),{createHttp}=require('../src/http.cjs');
const {fixtureFetch,ebml,mp4}=require('./helpers.cjs');
const target={tmdbId:123456,type:'movie',originalTitle:'Example Movie',searchTitles:['Example Movie'],year:2020,imdbId:'tt1234567',runtimeMinutes:120};
const origin='https://new4.moviesdrive.beer',archive='https://mdrive.lol/archive/123/',hub='https://hubcloud.ist/drive/example1',terminal='https://gamerxyt.com/hubcloud.php?id=example',pixel='https://pixeldrain.dev/u/Example1',file='https://pixeldrain.dev/api/file/Example1';
const filename='[[ moviesdrives.com ]] Example.Movie.2020.2160p.English.mkv';
function media(width=3840,height=1600,language='eng'){
 const size=n=>[n>>8,n&255],duration=Buffer.alloc(8);duration.writeDoubleBE(7200000);
 const video=ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',size(width)),ebml('ba',size(height))]))]));
 const audio=ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from(language))]));
 return Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([ebml('1549a966',ebml('4489',duration)),ebml('1654ae6b',Buffer.concat([video,audio]))])),Buffer.alloc(1000000)]);
}
function fixture(){const body=media();return{
 [origin+'/search.php?q=Example%20Movie&page=1']:{json:{hits:[{document:{post_title:'Download Example Movie (2020) Dual Audio',permalink:'/example-movie-2020/',imdb_id:'tt1234567'}}]}},
 [origin+'/example-movie-2020/']:{body:'<article class="post-content"><h1>Example Movie (2020) Dual Audio</h1><h5><span>Example Movie (2020)</span>&nbsp;English 2160p [1GB]</h5><h5><a href="'+archive+'">2160p [1GB]</a></h5></article>'},
 [archive]:{body:'<title>Example Movie (2020) English 2160p</title><a href="'+hub+'">Download</a>'},
 [hub]:{body:'<title>'+filename+'</title><script>var url = "'+terminal+'";</script>'},
 [terminal]:{body:'<a href="https://pixeldrain.dev/u/negn6f">PixelServer</a><script>var pxl = "'+pixel+'";</script>'},
 [file+'/info']:{json:{success:true,id:'Example1',name:filename,size:body.length,mime_type:'video/matroska',can_download:true,availability:'',abuse_type:''}},
 [file]:{body,mime:'video/matroska'}
};}
test('MoviesDrive: genel başlık/yıl -> yayımlanmış dosya -> gerçek 4K MKV, EN ses ve MPV uzantı bilgisi',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{
  const streamed=[],rows=await scanMoviesDrive(http,target,{onCandidates:async candidates=>streamed.push(...candidates)});assert.equal(rows.length,1);assert.equal(streamed.length,1);
  const v=await probe(http,rows[0]);assert.equal(v.container,'mkv');assert.equal(v.downloadable,true);assert.deepEqual(v.dimensions,{width:3840,height:1600});assert.deepEqual(v.audioLanguages,['eng']);assert.equal(v.duration,7200);assert.equal(v.nativeStoredExtension,'mp4');assert.equal(v.containerSniffing,true);
  assert.ok(!calls.some(c=>/\/u\/negn6f|\/api\/files/.test(c.url)));assert.ok(calls.every(c=>!Object.keys(c.headers||{}).some(k=>/cookie|authorization/i.test(k))));
 }finally{http.close();}
});
test('MoviesDrive: kaynak kalite iddiası pikseli geçmez; HI-only, boyut/format çelişkisi ve kısa dosya elenir',async()=>{
 for(const change of ['low','hi','size','container','short','audioonly']){
  const f=fixture();if(change==='low')f[file].body=media(1280,534);if(change==='hi')f[file].body=media(1920,800,'hin');
  if(change==='audioonly')f[file].body=media(0,0);
  f[file+'/info'].json.size=f[file].body.length+(change==='size'?1:0);
  if(change==='container')f[file].body=Buffer.concat([mp4(),Buffer.alloc(1000000)]);
  if(change==='short'){f[file].body=media();const p=f[file].body.indexOf(Buffer.from('4489','hex'));f[file].body.writeDoubleBE(60000,p+3);}
  const http=createHttp({fetchImpl:fixtureFetch(f)});try{const rows=await scanMoviesDrive(http,target),v=await probe(http,rows[0]);if(change==='low')assert.deepEqual(v.dimensions,{width:1280,height:534});else assert.equal(v,null,change);}finally{http.close();}
 }
});
test('MoviesDrive: yanlış yıl, IMDb, film adı ve farklı dosya metadata kimliği kabul edilmez',()=>{
 assert.equal(titleMatches('Example Movie (2020)&nbsp;1080p',target),true);assert.equal(titleMatches('Example Movie Two (2020)',target),false);assert.equal(titleMatches('Example Movie (2021)',target),false);
 assert.equal(fileMatches(filename,target),true);assert.equal(fileMatches(filename.replace('Example.Movie.','Other.Movie.'),target),false);
 assert.deepEqual(searchPages({hits:[{document:{post_title:'Example Movie (2020)',permalink:'/example/',imdb_id:'tt9999999'}}]},target),[]);
 const data=fixture()[file+'/info'].json;
 assert.ok(pixelFile(data,pixel,filename,{...target,originalLanguage:'ja'}).requireAudioAny.includes('ja'));
 assert.ok(!pixelFile(data,pixel,filename,{...target,originalLanguage:'hi'}).requireAudioAny.includes('hi'));
 for(const patch of[{id:'Other123'},{name:filename.replace('2160p','720p')},{can_download:false},{availability:'file_rate_limited_captcha_required'},{abuse_type:'legal'},{mime_type:'application/zip'}])assert.equal(pixelFile({...data,...patch},pixel,filename,target),null);
 assert.equal(pixelPage('var pxl="https://other.test/u/Example1"'),null);assert.equal(pixelPage('<a href="https://pixeldrain.dev/u/negn6f">PixelServer</a>'),null);
});
test('MoviesDrive: yanlış release başlığı, ilgisiz/dış link ve hesap/challenge yanıtı dosya sonucu olmaz',async()=>{
 const f=fixture(),page=f[origin+'/example-movie-2020/'].body;
 assert.deepEqual(releaseEntries(page.replace('Example Movie (2020)</span>','Other Movie (2020)</span>'),target),[]);
 assert.deepEqual(releaseEntries(page.replace(archive,'https://other.test/archive/123/'),target),[]);
 f[file+'/info']={status:403};const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});try{assert.deepEqual(await scanMoviesDrive(http,target),[]);assert.ok(!calls.some(c=>c.url===file));}finally{http.close();}
});
test('MoviesDrive: film adaptörü dizi bölümüne yeni istek açmaz',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{assert.deepEqual(await scanMoviesDrive(http,{...target,type:'tv',season:1,episode:1}),[]);assert.equal(calls.length,0);}finally{http.close();}
});
test('Uzantısız MKV izni genel format kontrolünü gevşetmez; açık .mp4, eksik boyut ve HLS hâlâ elenir',async()=>{
 for(const [url,extra,body]of[[file,{expectedContainer:'mkv'},media()],[file+'.mp4',{expectedContainer:'mkv',expectedSize:media().length},media()],[file,{expectedContainer:'mkv',expectedSize:100},'#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\na.ts\n']]){
  const http=createHttp({fetchImpl:fixtureFetch({[url]:{body,mime:'video/mp4'}})});try{assert.equal(await probe(http,{url,headers:{},allowExtensionlessMkv:true,...extra},true),null);}finally{http.close();}
 }
});
