'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createProvider,formatResults}=require('../src/index.cjs'),{createHttp}=require('../src/http.cjs');
const {createSubtitleDiscovery}=require('../src/subtitle-discovery.cjs'),{inspectHls}=require('../src/media/hls.cjs');
const {target,makeFixture,fixtureFetch,mp4}=require('./helpers.cjs');

test('discovery continues past blocked probes; the shared three-probe limit stays intact',async()=>{
 let release,lateStarted=false,active=0,maximum=0;const gate=new Promise(r=>release=r);
 const urls=Array.from({length:4},(_,i)=>`https://slow.test/${i}.mp4`),fixture=makeFixture({items:[],extra:Object.fromEntries(urls.map(url=>[url,{body:mp4()}]))}),fetcher=fixtureFetch(fixture);
 const provider=createProvider({tmdbKey:'test',budgetMs:700,settings:{autoDiscover:false,autoSubtitles:false,catalogUrls:'https://library.test/catalog.json'},
  sourceFactories:[...urls.map((url,i)=>({name:'Slow'+i,run:async()=>[{url,source:'Slow'+i,headers:{},subtitles:[],identity:target}]})),{name:'Late',run:async()=>{lateStarted=true;release();return [];}}],
  fetchImpl:async(url,options)=>{if(!url.startsWith('https://slow.test/'))return fetcher(url,options);active++;maximum=Math.max(maximum,active);await gate;try{return await fetcher(url,options);}finally{active--;}}
 });
 try{const streams=await provider.getStreams(603,'movie');assert.equal(lateStarted,true);assert.equal(streams.length,4);assert.ok(maximum<=3);assert.ok(provider.getReport().sources.every(s=>s.startedMs>=0&&s.discoveryMs>=0));}finally{release();}
});

test('the independent fast-online lane returns while main file discovery is still blocked',async()=>{
 let release,mainDone=false;const gate=new Promise(r=>release=r),root='https://dizibal.org',player='https://pilavyerplay.top',page=root+'/movie/the-matrix';
 const fixture=makeFixture({extra:{
  [root+'/ara/oneri?q=The%20Matrix']:{json:{movies:[{type:'movie',title:'The Matrix',meta:'Film · 1999',url:page}]}},
  [page]:{body:`<link rel="canonical" href="${page}"><h1>The Matrix</h1><div data-pv="publicFixture"></div><script src="${player}/assets/js/core.js"></script>`},
  [player+'/assets/js/s.php?s=publicFixture']:{body:'<script>window.__PLAYER__ = '+JSON.stringify({title:'The Matrix',stream:player+'/api/stream.php?s=fixture'})+';</script>'},
  [player+'/api/stream.php?s=fixture&format=.m3u8']:{body:'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720.m3u8\n'}
 }}),fetchImpl=fixtureFetch(fixture);
 const main=createProvider({lane:'main',tmdbKey:'test',fetchImpl,settings:{autoDiscover:false,autoSubtitles:false,catalogUrls:'https://library.test/catalog.json'},sourceFactories:[{name:'Blocked',run:async()=>{await gate;return [];}}]});
 const fast=createProvider({lane:'fastOnline',tmdbKey:'test',fetchImpl,settings:{autoSubtitles:false,hdfilmdelisiEnabled:false}});
 const work=main.getStreams(603,'movie').then(r=>{mainDone=true;return r;});
 try{const streams=await fast.getStreams(603,'movie');assert.equal(streams.length,1);assert.match(streams[0].name,/DiziBal/);assert.equal(mainDone,false);assert.deepEqual(fast.getReport().sources.map(s=>s.name),['DiziBal']);}
 finally{release();await work;}
});

test('a source budget stops its next hop without stopping other sources or releasing a native lease',async()=>{
 let release,slowCalls=0;const gate=new Promise(r=>release=r),fetcher=fixtureFetch({'https://fast.test/meta':{json:{ok:true}},'https://slow.test/first':{body:'done'}});
 const http=createHttp({timeoutMs:1000,fetchImpl:async(url,options)=>{if(url.startsWith('https://slow.test/')){slowCalls++;await gate;}return fetcher(url,options);}}),scoped=http.scope(25);
 try{assert.equal(await scoped.text('https://slow.test/first'),null);assert.equal(scoped.expired(),true);assert.equal(await scoped.text('https://slow.test/next'),null);assert.equal(slowCalls,1);assert.deepEqual(await http.json('https://fast.test/meta'),{ok:true});}finally{release();http.close();}
});

test('unavailable subtitle catalogues do not fan out additional hash queries',async()=>{
 const calls=[],http={expired:()=>false,json:async(url,options)=>{calls.push({url,options});return null;}};
 const discover=createSubtitleDiscovery(http,target,{});
 await discover({filename:'The.Matrix.1999.mp4'},{videoHash:'0123456789abcdef',size:12345});
 assert.ok(calls.length>0);assert.ok(calls.every(c=>!c.url.includes('videoHash=')));assert.ok(calls.every(c=>c.options.timeoutMs===4500));
});

test('a healthy subtitle catalogue still enables hash matching, shared across duplicate files',async()=>{
 const calls=[],http={expired:()=>false,json:async url=>{calls.push(url);return{subtitles:[]};}};
 const discover=createSubtitleDiscovery(http,target,{}),candidate={filename:'The.Matrix.1999.mp4'},video={videoHash:'0123456789abcdef',size:12345};
 await Promise.all([discover(candidate,video),discover(candidate,video)]);
 assert.equal(calls.filter(u=>u.includes('videoHash=')).length,2);
 assert.equal(calls.filter(u=>u.includes('stremio.homes/tr/')&&!u.includes('videoHash=')).length,1);
});

test('lightweight masters keep low through 4K variants without child or segment requests',async()=>{
 const heights=[360,480,720,1080,1440,2160],widths=[640,854,1280,1920,2560,3840],url='https://media.test/master.m3u8';
 const playlist='#EXTM3U\n'+heights.map((h,i)=>`#EXT-X-STREAM-INF:BANDWIDTH=${(i+1)*1000000},RESOLUTION=${widths[i]}x${h}\n${h}.m3u8`).join('\n');
 const candidate={url,source:'Fixture',headers:{},subtitles:[],identity:{...target,runtimeMinutes:100}};
 const video=await inspectHls({expired:()=>false,text:()=>{throw Error('unexpected network request');}},playlist,url,candidate,{detailed:false});
 assert.equal(video.renditions.length,6);assert.ok(video.resolutionOptions.some(d=>d.height===2160));
 const streams=formatResults([{candidate,video,subtitles:[]}],{},target);
 assert.equal(streams.length,6);assert.ok(streams.some(s=>s.quality==='2160p · 3840×2160'));assert.ok(streams.some(s=>s.quality==='360p · 640×360'));assert.ok(streams.every(s=>s.type==='hls'&&s.name.includes('Online')));
});
