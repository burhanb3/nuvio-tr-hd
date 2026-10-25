const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scanVixDirect}=require('../src/providers/vixsrc.cjs');
const {probe}=require('../src/media/probe.cjs');
const {createHttp}=require('../src/http.cjs');
const {fixtureFetch,target,vtt}=require('./helpers.cjs');
test('doğrudan VixSrc: gerçek HLS gövdesi ve native indirme filtresi birlikte korunur',async()=>{
 const base='https://vixsrc.to',expires=String(Math.floor(Date.now()/1000)+3600);
 const master=`${base}/playlist/77?token=public-token&expires=${expires}&h=1`;
 const fixture={
  [base+'/api/movie/603']:{json:{src:'/embed/77?t=VGhlIE1hdHJpeA%3D%3D'}},
  [base+'/embed/77?t=VGhlIE1hdHJpeA%3D%3D']:{body:`window.masterPlaylist = {\n params: {'token':'public-token','expires':'${expires}'},\n url: '${base}/playlist/77',\n }`,mime:'text/html'},
  [master]:{body:'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=1280x720\nhttps://vixsrc.to/playlist/77?type=video',mime:'application/vnd.apple.mpegurl'},
  [master+'&nuvio_format=master.m3u8']:{body:'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=1280x720\nhttps://vixsrc.to/playlist/77?type=video',mime:'application/vnd.apple.mpegurl'}
 };
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 const [candidate]=await scanVixDirect(http,target);assert.ok(candidate);
 const result=await probe(http,candidate,true);
 assert.equal(result.container,'hls');assert.equal(result.downloadable,false);
 const normalized=candidate.url.trim().toLowerCase();
 assert.ok(normalized.endsWith('.m3u8')||normalized.includes('.m3u8?'));
 assert.deepEqual(await scanVixDirect(http,{...target,type:'tv'}),[]);http.close();
});
