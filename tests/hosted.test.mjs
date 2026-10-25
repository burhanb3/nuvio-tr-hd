import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createService,validTarget} from '../hosting/worker.mjs';
import helpers from './helpers.cjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createProvider}=require('../src/index.cjs');
const {loadHosted,SERVICE_ORIGIN}=require('../src/hosted.cjs');
const {createHttp}=require('../src/http.cjs');
const {parseMaster,selectMaster,vixCandidates}=require('../src/providers/vixsrc.cjs');
const {scoreSubtitle}=require('../src/subtitle-discovery.cjs');
const {target,identity,makeFixture,fixtureFetch}=helpers;
const hls='#EXTM3U\n#EXT-X-MEDIA:TYPE=SUBTITLES,LANGUAGE="tur",URI="https://vixsrc.to/playlist/1?type=subtitle"\n#EXT-X-STREAM-INF:BANDWIDTH=1000,RESOLUTION=1920x1080\nhttps://vixsrc.to/playlist/1?type=video\n#EXT-X-STREAM-INF:BANDWIDTH=500,RESOLUTION=854x480\nhttps://vixsrc.to/playlist/1?type=low\n';

test('VixSrc master gerçek profilleri ayırır; farklı film başlığı reddedilir',()=>{
 const parsed=parseMaster(hls);
 assert.equal(parsed.variants.length,2);assert.ok(parsed.turkish);
 const single=selectMaster(hls,'480');assert.match(single,/854x480/);assert.doesNotMatch(single,/1920x1080/);
 assert.equal(selectMaster(hls,'720'),null);
 const bundle={...parsed,embedTitle:'The Matrix',embeddedTurkish:true,subtitleUrl:'https://subs.test/tr.vtt'};
 assert.equal(vixCandidates(bundle,target,SERVICE_ORIGIN).length,3);
 assert.deepEqual(vixCandidates({...bundle,embedTitle:'The Matrix Reloaded'},target,SERVICE_ORIGIN),[]);
});

test('ortak sonuçların kimliği, HLS indirme sınıfı ve özel bilgilerin gönderilmemesi',async()=>{
 const fixture=makeFixture(),calls=[];
 fixture[SERVICE_ORIGIN+'/api/discover']={json:{schema:1,target,pairs:[{
  candidate:{identity:target,source:'VixSrc',headers:{},embeddedTurkish:true},
  video:{url:SERVICE_ORIGIN+'/hls/vix/movie/603/auto.m3u8',container:'hls',downloadable:true},subtitles:[]
 }]}};
 const p=createProvider({tmdbKey:'test',settings:{hostedDiscovery:true,catalogUrls:'https://private.test/catalog.json',tmdbApiKey:'test'},fetchImpl:fixtureFetch(fixture,calls)});
 const streams=await p.getStreams(603,'movie');assert.equal(streams.length,1);
 assert.match(streams[0].name,/Online izlenebilir · İndirilemez/);assert.match(streams[0].title,/HLS içi/);
 const body=calls.find(c=>c.url.endsWith('/api/discover')).body;
 assert.deepEqual(Object.keys(JSON.parse(body)),['target']);assert.ok(!body.includes('private.test'));assert.ok(!body.includes('api_key'));
 const badHttp=createHttp({fetchImpl:fixtureFetch({[SERVICE_ORIGIN+'/api/discover']:{json:{schema:1,target:{...target,year:2003},pairs:[]}}})});
 assert.equal(await loadHosted(badHttp,target),null);badHttp.close();
});

test('gösterim varsayılanında takılan altyazı doğrulanmış videoyu silmez',async()=>{
 const fixture=makeFixture(),base=fixtureFetch(fixture);
 const p=createProvider({tmdbKey:'test',budgetMs:160,settings:{autoDiscover:false,catalogUrls:'https://library.test/catalog.json'},
 fetchImpl:async(url,options)=>url.includes('/subtitles/')?new Promise(()=>{}):base(url,options)});
 const result=await p.getStreams(603,'movie');assert.equal(result.length,1);assert.equal(result[0].subtitles.length,0);
});

test('film adı+yılı tek başına tam sürüm altyazı eşleşmesi sayılmaz',()=>{
 const match=scoreSubtitle({lang:'tur',_scope:'title',title:'The.Matrix.1999.1080p.WEB-DL.GROUP'},
 {filename:'The.Matrix.1999.mp4'},{duration:8000},target);
 assert.equal(match.score,50);assert.equal(match.requireDuration,true);
});

test('Worker: boş yanıt önbelleğe alınmaz; geçerli çift tekrar aramada yeniden sorgulanmaz',async()=>{
 let calls=0;const cached=new Map();
 const cache={match:async k=>cached.get(k)?.clone(),put:async(k,r)=>{cached.set(k,r.clone());}};
 const service=createService({cache,fetchImpl:async(url)=>{
  calls++;
  if(url.includes('streamdata.'))return new Response(JSON.stringify({status_code:200,data:{imdb_id:target.imdbId,file_name:'The.Matrix.1999.WEBRip-GROUP.mp4',stream_urls:['https://cdn.test/film.m3u8']}}),{headers:{'Content-Type':'application/json'}});
  if(url.includes('cdn.test'))return new Response('#EXTM3U\n#EXT-X-TARGETDURATION:8\n#EXTINF:8,\nvideo.ts');
  return new Response('{}',{headers:{'Content-Type':'application/json'}});
 }});
 const request=()=>new Request(SERVICE_ORIGIN+'/api/discover',{method:'POST',body:JSON.stringify({target})});
 const first=await(await service.fetch(request())).json();assert.equal(first.pairs.length,1);const afterFirst=calls;
 const second=await(await service.fetch(request())).json();assert.equal(second.cache,'hit');assert.equal(calls,afterFirst);
 const emptyCache=new Map();let emptyCalls=0;
 const emptyService=createService({cache:{match:async()=>null,put:async(k,r)=>emptyCache.set(k,r)},fetchImpl:async()=>{emptyCalls++;return new Response('{}',{headers:{'Content-Type':'application/json'}});}});
 assert.equal((await(await emptyService.fetch(request())).json()).pairs.length,0);const beforeRetry=emptyCalls;
 await emptyService.fetch(request());assert.ok(emptyCalls>beforeRetry);assert.equal(emptyCache.size,0);
 assert.equal(validTarget({...target,originalTitle:'x'.repeat(201)}),false);
 const invalid=await service.fetch(new Request(SERVICE_ORIGIN+'/api/discover',{method:'POST',body:'{"target":{"tmdbId":3}}'}));assert.equal(invalid.status,400);
});
