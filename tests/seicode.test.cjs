'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {fixtureFetch,mp4}=require('./helpers.cjs');
const {scanSeiCode,matchesSeiCode,mp4UploadEmbed,mp4UploadVideo,tauVideoId,tauVideoCandidates}=require('../src/providers/seicode.cjs');
const target={tmdbId:123456,originalTitle:'例のアニメ',searchTitles:['Example Anime','例のアニメ'],type:'tv',isAnime:true,year:2020,firstAirDate:'2020-01-01',season:1,episode:3};
const detail={slug:'example-anime',type:'tv',tmdbID:123456,english:'Example Anime',firstAirDate:'2020-01-01',seasons:[{season_number:1,episodes:[{episode_number:2,video_links:{other:'https://example.test/embed'}},{episode_number:3,video_links:{MP4Upload:'https://www.mp4upload.com/example12345',ad:'https://ad.test/fake.mp4'}}]}]};
const embed='https://www.mp4upload.com/embed-example12345.html',file='https://a4.mp4upload.com:183/example/video.mp4';
const page=`<script>var ad={src:'https://ad.test/ad.mp4'};player.src({type:'video/mp4',src:'${file}'});</script>`;
function fixture(){return{
 'https://next.seicode.net/anime/search?q=Example%20Anime':{json:[{slug:'example-anime',english:'Example Anime'}]},
 'https://next.seicode.net/anime/example-anime':{json:detail},[embed]:{body:page},[file]:{body:mp4({width:1920,height:1080}),mime:'video/mp4'}
};}
test('SeiCode: tam TMDB/ad/yıl ve açık bölümden gerçek MP4Upload dosyası seçilir; reklam alınmaz',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});
 try{const rows=await scanSeiCode(http,target);assert.equal(rows.length,1);assert.equal(rows[0].source,'SeiCode');assert.equal(rows[0].filenameSynthetic,true);
 const video=await probe(http,rows[0]);assert.deepEqual(video.dimensions,{width:1920,height:1080});assert.equal(video.downloadable,true);
 assert.ok(!calls.some(c=>/ad\.test|example\.test/.test(c.url)));
 }finally{http.close();}
});
test('SeiCode: aynı isim yanlış TMDB/yıl/tarih kabul edilmez; başka sezon veya bölümden sessiz fallback yapılmaz',async()=>{
 for(const change of[{tmdbID:999},{firstAirDate:'2021-01-01'},{firstAirDate:'2020-06-01'},{english:'Another Anime'},{type:'movie'}])assert.equal(matchesSeiCode({...detail,...change},target),false);
 for(const change of[{season:2},{episode:1}]){const http=createHttp({fetchImpl:fixtureFetch(fixture())});try{assert.deepEqual(await scanSeiCode(http,{...target,...change}),[]);}finally{http.close();}}
});
test('SeiCode: kısmi/bozuk embed diğer geçerli aynayı silmez; olmayan dosyadan sonuç üretilmez',async()=>{
 const f=fixture(),d=structuredClone(detail);d.seasons[0].episodes[1].video_links.broken='https://www.mp4upload.com/another12345';f['https://next.seicode.net/anime/example-anime']={json:d};
 const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.equal((await scanSeiCode(http,target)).length,1);}finally{http.close();}
 f[embed]={body:'<html>File removed</html>'};const broken=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanSeiCode(broken,target),[]);}finally{broken.close();}
});
test('MP4Upload: sadece doğru player bloğu/HTTPS/medya hostu; HLS ve sahte domain MP4 yapılmaz',()=>{
 assert.equal(mp4UploadEmbed('https://mp4upload.com/example12345'),embed);
 assert.equal(mp4UploadEmbed('https://mp4upload.com.evil.test/example12345'),null);
 assert.equal(mp4UploadVideo(page),file);
 assert.equal(mp4UploadVideo(page.replace("type:'video/mp4'","type:'application/x-mpegURL'")),null);
 assert.equal(mp4UploadVideo(page.replace(file,'https://a4.mp4upload.com.evil.test/video.mp4')),null);
 assert.equal(mp4UploadVideo(page.replace(file,file.replace('https:','http:'))),null);
});
test('SeiCode tau-video: yalnız aynı embed ve tam sezon/bölüm bildiren oynatıcının gerçek MP4 dosyaları; başka numara eşlenmez',async()=>{
 // Current catalogue shape: tau-video players (values may carry leading spaces), no MP4Upload.
 const id='0123456789abcdef01234567',api='https://tau-video.xyz/api/video/'+id,files=['https://cdn-a.test/file/tau-video/480.mp4','https://cdn-b.test/720.mp4'];
 const d=structuredClone(detail);d.seasons[0].episodes[1].video_links={'tau-video.xyz':'   https://tau-video.xyz/embed/'+id,ad:'https://ad.test/fake.mp4'};
 const video={_id:id,title_id:1,season_number:1,episode_number:3,urls:[{label:'480p',url:files[0]},{label:'720p',url:files[1]},{label:'x',url:'https://cdn-b.test/master.m3u8'},{label:'720p',url:files[1]}]};
 const f={...fixture(),'https://next.seicode.net/anime/example-anime':{json:d},[api]:{json:video},[files[0]]:{body:mp4({width:854,height:480}),mime:'video/mp4'}};
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});
 try{const rows=await scanSeiCode(http,target);assert.deepEqual(rows.map(r=>r.url),files);assert.equal(rows[0].headers.Referer,'https://tau-video.xyz/');assert.equal(rows[0].claimedQuality,'480p');
  const probed=await probe(http,rows[0]);assert.equal(probed.downloadable,true);assert.equal(probed.dimensions.height,480);
  assert.ok(!calls.some(c=>/ad\.test/.test(c.url)));
 }finally{http.close();}
 for(const change of[{episode_number:4},{season_number:2},{_id:'fedcba9876543210fedcba98'}]){
  const other=createHttp({fetchImpl:fixtureFetch({...f,[api]:{json:{...video,...change}}})});
  try{assert.deepEqual(await scanSeiCode(other,target),[],JSON.stringify(change));}finally{other.close();}
 }
 assert.equal(tauVideoId('https://tau-video.xyz.evil.test/embed/'+id),null);assert.equal(tauVideoId('https://tau-video.xyz/embed/'+id+'/x'),null);
 assert.deepEqual(tauVideoCandidates({...video,urls:[{label:'480p',url:'http://cdn-a.test/a.mp4'}]},id,target),[]);
});
