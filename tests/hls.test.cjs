const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectPlaylist,inspectHls}=require('../src/media/hls.cjs');
const {describeQuality,describeSize}=require('../src/media/presentation.cjs');
const {createHttp}=require('../src/http.cjs');
const {fixtureFetch,target}=require('./helpers.cjs');

const url='https://stream.test/master.m3u8';
const master='#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2500000,AVERAGE-BANDWIDTH=2000000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"\nlow.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=5000000,AVERAGE-BANDWIDTH=4000000,RESOLUTION=1920x1080\nhigh.m3u8\n';
const vod='#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\na.ts\n#EXTINF:9.5,\nb.ts\n#EXT-X-ENDLIST\n';

test('HLS quoted codec virgülü attribute ayırmasını bozmaz; gerçek profiller korunur',()=>{
 const info=inspectPlaylist(master,url);
 assert.equal(info.variants[0].averageBandwidth,2000000);
 assert.equal(info.variants[0].url,'https://stream.test/low.m3u8');
 assert.deepEqual(info.variants[1].dimensions,{width:1920,height:1080});
});
test('HLS yaklaşık aktarım boyutu gerçek playlist süresi ve bitrate ile hesaplanır',async()=>{
 const http=createHttp({fetchImpl:fixtureFetch({'https://stream.test/low.m3u8':{body:vod}})});
 const video=await inspectHls(http,master,url,{headers:{},identity:target,filename:'Fake.2160p.mp4'});
 assert.equal(video.duration,19.5);assert.equal(video.size,null);assert.equal(video.downloadable,false);
 assert.equal(video.sizeEstimate.minimum,4875000);assert.equal(video.sizeEstimate.maximum,9750000);
 assert.equal(video.sizeEstimate.durationSource,'playlist');
 assert.equal(describeQuality(video,{}).quality,'1080p');assert.match(describeQuality(video,{}).text,/1280×720 \/ 1920×1080 · HLS/);
 assert.equal(describeSize(video).size,'0,010 GB');assert.match(describeSize(video).text,/boyutu değişken/);
 assert.match(describeSize({sizeEstimate:video.renditions[0].sizeEstimate}).size,/^[\d,]+ GB/);http.close();
});
test('HLS canlı akışa film süresi veya dosya boyutu uydurulmaz',async()=>{
 const http=createHttp({fetchImpl:fixtureFetch({})});
 const video=await inspectHls(http,vod.replace('#EXT-X-ENDLIST',''),url,{headers:{},identity:{runtimeMinutes:155}});
 assert.equal(video.sizeEstimate,null);assert.equal(video.duration,undefined);http.close();
});
test('çocuk playlist alınamazsa TMDB süresi yalnız tahmin kaynağı olarak kullanılır',async()=>{
 const http=createHttp({fetchImpl:fixtureFetch({})});
 const video=await inspectHls(http,master,url,{headers:{},identity:{runtimeMinutes:100}});
 assert.equal(video.durationSource,'tmdb');assert.equal(video.sizeEstimate.minimum,1500000000);
 assert.match(describeSize({sizeEstimate:video.renditions[0].sizeEstimate}).text,/tahmini; film süresi/);http.close();
});
test('gerçek piksel dosya adıyla değişmez; isim tahmini doğrulanmış diye sunulmaz',()=>{
 assert.equal(describeQuality({dimensions:{width:1280,height:720}},{filename:'Movie.2160p.mkv'}).quality,'720p');
 assert.match(describeQuality({},{filename:'Movie.2160p.mkv'}).text,/2160p tahmini · dosya adı/);
 assert.equal(describeQuality({},{filename:'Movie.mkv'}).quality,'Bilinmiyor');
 assert.equal(describeSize({size:1073741824}).text,'1,07 GB · dosya boyutu');
});

test('master altındaki canlı playlist için film süresinden boyut tahmini üretilmez',async()=>{
 const live=vod.replace('#EXT-X-ENDLIST','');
 const http=createHttp({fetchImpl:fixtureFetch({'https://stream.test/low.m3u8':{body:live}})});
 try{
  const video=await inspectHls(http,master,url,{headers:{},identity:{runtimeMinutes:120}});
  assert.equal(video.sizeEstimate,null);assert.equal(video.duration,undefined);
 }finally{http.close();}
});
test('HLS dış kökene kişisel Authorization/Cookie taşımaz',async()=>{
 let sent;
 const http=createHttp({fetchImpl:async(u,opts)=>{if(u.startsWith('https://cdn.test/'))sent=opts.headers;return fixtureFetch({'https://cdn.test/low.m3u8':{body:vod}})(u,opts);}});
 await inspectHls(http,master.replace('low.m3u8','https://cdn.test/low.m3u8'),url,
  {headers:{Authorization:'private',Cookie:'private',Referer:'https://stream.test/'}});
 assert.equal(sent.Authorization,undefined);assert.equal(sent.Cookie,undefined);assert.equal(sent.Referer,'https://stream.test/');http.close();
});
