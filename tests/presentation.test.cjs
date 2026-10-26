'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {formatResults,onSettings}=require('../src/index.cjs');
const {inspectHls,profileAddress}=require('../src/media/hls.cjs');
const {describeSize}=require('../src/media/presentation.cjs');
const {createHttp}=require('../src/http.cjs');
const {fixtureFetch,target}=require('./helpers.cjs');
const pair=(id,size,height,type='mp4')=>({candidate:{url:`https://media.test/${id}.${type}`,source:'Source '+id,filename:'The.Matrix.1999.mkv',headers:{},subtitles:[]},video:{url:`https://media.test/${id}.${type}`,size,dimensions:{width:height*2,height},container:type,downloadable:type!=='hls'},subtitles:[]});
test('Görüntüye işlenmiş yabancı altyazı etiketlenir; önerilende temiz online öne geçer, boyut sırası korunur',()=>{
 const burned=pair('burned',1000,720),online=pair('online',2000,720,'hls');burned.candidate.burnedSubtitleLanguage='es';
 for(const p of[burned,online])p.subtitles=[{url:'https://subs.test/tr.srt',language:'tr',name:'Türkçe',_score:90}];
 const bySize=formatResults([burned,online],{},target);assert.match(bySize[0].language,/ES görüntüde/);assert.match(bySize[0].title,/İspanyolca altyazı görüntüye işlenmiş/);
 const recommended=formatResults([burned,online],{sortOrder:'recommended'},target);assert.match(recommended[0].name,/Online/);
 assert.equal(recommended[1].subtitles[0].language,'tr');
});
test('kısa kartlar native alanlara bölünür; varsayılan küçükten büyüğe, bilinmeyen sonda',()=>{
 const entries=[pair('big',5000,1080),pair('small',1000,720),pair('unknown',null,2160)];
 const list=formatResults(entries,{},target);
 assert.match(list[0].name,/Source small/);assert.match(list[2].name,/unknown/);
 assert.ok(list.every(s=>s.name.length<75));assert.ok(list.every(s=>!s.name.includes('Nuvio TR HD')));
 assert.equal(list[0].quality,'1440×720 ✓');assert.equal(list[0].language,'Ses: bilinmiyor · TR altyazı yok');
 const quality=formatResults(entries,{sortOrder:'quality_desc'},target);assert.match(quality[0].name,/unknown/);
 const descending=formatResults(entries,{sortOrder:'size_desc'},target);assert.match(descending[0].name,/big/);
 const grouped=formatResults([pair('hls',100,720,'hls'),...entries],{groupResults:'type'},target);
 assert.ok(grouped.slice(0,3).every(s=>s.type!=='hls'));assert.equal(grouped[3].type,'hls');
 assert.equal(onSettings().find(s=>s.key==='sortOrder').defaultValue,'size_asc');
});
test('HLS her kaliteye ayrı satır ve ayrı boyut; ayrı ses grubu koparılmaz',async()=>{
 const url='https://stream.test/master.m3u8';
 const master='#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1920x1080\n1080.m3u8\n';
 const vod='#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nvideo1.ts\n#EXTINF:10,\nvideo2.ts\n#EXT-X-ENDLIST\n';
 const http=createHttp({fetchImpl:fixtureFetch({'https://stream.test/720.m3u8':{body:vod},'https://stream.test/1080.m3u8':{body:vod}})});
 try{
  const video=await inspectHls(http,master,url,{headers:{},identity:target});
  const p={candidate:{url,source:'PlayIMDb',headers:{}},video,subtitles:[]};
  const list=formatResults([p],{},target);assert.equal(list.length,2);
  assert.equal(list[0].url,'https://stream.test/720.m3u8');assert.equal(list[1].url,'https://stream.test/1080.m3u8');
  assert.ok(list.every(s=>s.type==='hls'&&s.name.includes('Online')&&!s.name.includes('İndirilebilir')));
  assert.notEqual(list[0].size,list[1].size);assert.ok(list.every(s=>!s.size.includes('–')));
  const external={...video,renditions:video.renditions.map(r=>({...r,hasExternalAudio:true}))};
  const fallback=formatResults([{...p,video:external}],{},target);assert.equal(fallback.length,1);assert.equal(fallback[0].url,url);assert.equal(fallback[0].size,'Boyut değişken');
  const withBridge=formatResults([{...p,video:external}],{hlsProfileBridgeReady:true},target);
  assert.equal(withBridge.length,2);assert.ok(withBridge.every(s=>s.url.includes('/hls/profile.m3u8?data=')));
 }finally{http.close();}
});
test('parça HEAD örneği tepe bitrate yerine dar tahmin verir; örnek alınamazsa üst tahmin kalır',async()=>{
 const url='https://stream.test/master.m3u8';
 const master='#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1280x720\n720.m3u8\n';
 const vod='#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\na.ts\n#EXTINF:10,\nb.ts\n#EXTINF:10,\nc.ts\n#EXT-X-ENDLIST\n';
 const fixture={'https://stream.test/720.m3u8':{body:vod},'https://stream.test/a.ts':{body:'a',headers:{'content-length':'1000000'}},'https://stream.test/b.ts':{body:'a',headers:{'content-length':'2000000'}},'https://stream.test/c.ts':{body:'a',headers:{'content-length':'3000000'}}};
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const v=await inspectHls(http,master,url,{headers:{},identity:target});const e=v.renditions[0].sizeEstimate;
  assert.equal(e.basis,'segment-samples');assert.ok(e.minimum<15000000);assert.equal(e.minimum,e.maximum);
  assert.match(describeSize({sizeEstimate:e}).text,/parça başlığı örneği/);
 }finally{http.close();}
});
test('stateless HLS master ayrı ses/altyazı gruplarıyla sunulur, bozuk yük reddedilir',async()=>{
 const {createService}=await import('../hosting/worker.mjs');const service=createService({fetchImpl:async()=>{throw Error('No fetch expected');}});
 const text='#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",URI="https://cdn.test/audio.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720,AUDIO="audio"\nhttps://cdn.test/720.m3u8\n';
 const address=profileAddress(text,'https://bridge.test');const response=await service.fetch(new Request(address));
 assert.equal(response.status,200);assert.equal(await response.text(),text);assert.match(response.headers.get('content-type'),/mpegurl/);
 const invalid=profileAddress('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\njavascript:alert(1)','https://bridge.test');
 assert.equal((await service.fetch(new Request(invalid))).status,400);
});
