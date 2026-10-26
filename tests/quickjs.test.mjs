import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getQuickJS } from 'quickjs-emscripten';
import helpers from './helpers.cjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {SERVICE_ORIGIN}=require('../src/hosted.cjs');

const { makeFixture, responseFor, identity, target, mkv } = helpers;
const bundle = await readFile(new URL('../providers/nuvio-tr-hd.js', import.meta.url), 'utf8');
const onlineBundle = await readFile(new URL('../providers/nuvio-tr-hd-online.js', import.meta.url), 'utf8');
const animeBundle = await readFile(new URL('../providers/nuvio-tr-hd-anime.js', import.meta.url), 'utf8');

test('QuickJS HDHub public zincirini çözer; köprü adı ve gerçek MKV piksel/boyutu korunur', async () => {
  const file='https://bucket.r2.cloudflarestorage.com/object?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature='+'a'.repeat(64);
  const alias=SERVICE_ORIGIN+'/files/'+'b'.repeat(64)+'.mkv?source='+encodeURIComponent(file);
  const enc=s=>Buffer.from(s).toString('base64');
  const packed=enc(JSON.stringify({o:enc('https://hubcloud.example/file')})).replace(/[A-Za-z]/g,c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<='m'?13:-13)));
  const fixture=makeFixture({extra:{
    'https://4khdhub.one/?s=The%20Matrix':{body:'<a href="https://4khdhub.one/matrix/">The Matrix (1999)</a>'},
    'https://4khdhub.one/matrix/':{body:`<script>var defaultVideoId='603'</script><script type="application/ld+json">{"@type":"Movie","name":"The Matrix","datePublished":"1999-03-31"}</script><div class="download-item"><div class="file-title">The.Matrix.1999.WEB-DL.mkv</div><a href="https://greenmotors.club/example">Download HubCloud</a></div>`},
    'https://greenmotors.club/example':{body:`s('o','${enc(enc(packed))}')`},
    'https://hubcloud.example/file':{body:'var url="https://gamerxyt.com/hubcloud.php?token=example"'},
    'https://gamerxyt.com/hubcloud.php?token=example':{body:`<a href="${file.replaceAll('&','&amp;')}">FSL Server</a>`},
    [SERVICE_ORIGIN+'/api/files']:{json:{schema:1,target,files:[{url:file,downloadAlias:alias}]}},
    [file]:{body:mkv(1920,800),headStatus:403}
  }});
  const streams=await runInQuickJs(fixture,{settings:{autoSubtitles:false,archiveEnabled:false,playImdbEnabled:false,vixsrcEnabled:false}});
  assert.equal(streams.length,1);assert.equal(streams[0].url,alias);assert.equal(streams[0].quality,'1920×800 ✓');
  assert.match(streams[0].name,/İndirilebilir/);assert.equal(streams[0].type,'mkv');assert.ok(streams[0].size);
});

async function runInQuickJs(fixture, { settings, args = ['603', 'movie'], invokeSettings = false, nativeTimers = false, code = bundle } = {}) {
  const engine = await getQuickJS();
  const runtime = engine.newRuntime();
  runtime.setMemoryLimit(64 * 1024 * 1024);
  runtime.setMaxStackSize(1024 * 1024);
  const vm = runtime.newContext();
  const timers = new Map();
  let timerId = 0;
  const started = Date.now();
  runtime.setInterruptHandler(() => Date.now() - started > 5000);
  const setHost = (name, callback) => {
    const fn = vm.newFunction(name, callback);
    vm.setProp(vm.global, name, fn);
    fn.dispose();
  };
  const evalValue = code => {
    const result = vm.evalCode(code);
    if (result.error) { const error = vm.dump(result.error); result.error.dispose(); throw new Error(JSON.stringify(error)); }
    const out = vm.dump(result.value);
    if (result.value.alive) result.value.dispose();
    return out;
  };
  try {
    // Deliberately minimal Nuvio-shaped bridge: no Node require/Buffer/process,
    // no browser fetch streaming, no effective AbortSignal, read-only URL.
    setHost('__fixture_fetch', (url, options) => vm.newString(JSON.stringify(responseFor(fixture, vm.getString(url), JSON.parse(vm.getString(options))))));
    setHost('__fixture_parse_url', url => {
      const parsed = new URL(vm.getString(url));
      return vm.newString(JSON.stringify({ href: parsed.href, protocol: parsed.protocol, hostname: parsed.hostname, origin: parsed.origin, pathname: parsed.pathname, search: parsed.search, hash: parsed.hash, params: Object.fromEntries(parsed.searchParams) }));
    });
    setHost('__fixture_atob', value => vm.newString(Buffer.from(vm.getString(value),'base64').toString('latin1')));
    setHost('__set_timer', (callback, delay) => {
      const id = ++timerId;
      const fn = callback.dup();
      const timer = setTimeout(() => {
        const cancelled = timers.get(id)?.cancelled;
        timers.delete(id);
        const result = !cancelled && vm.callFunction(fn, vm.undefined);
        fn.dispose();
        if (result) { if (result.error) result.error.dispose(); else result.value.dispose(); }
      }, vm.getNumber(delay));
      timers.set(id, { timer, fn });
      return vm.newNumber(id);
    });
    setHost('__clear_timer', id => {
      const key = vm.getNumber(id), entry = timers.get(key);
      if (entry && nativeTimers) entry.cancelled = true;
      else if (entry) { clearTimeout(entry.timer); entry.fn.dispose(); timers.delete(key); }
    });
    evalValue(`
      globalThis.SCRAPER_SETTINGS = ${JSON.stringify(settings || { catalogUrls: 'https://library.test/catalog.json', autoDiscover: false, autoSubtitles: false, requireTurkishSubtitles: false })};
      globalThis.TMDB_API_KEY = 'test';
      globalThis.setTimeout = (fn, ms) => __set_timer(fn, ms);
      globalThis.clearTimeout = id => __clear_timer(id);
      globalThis.URL = function(url) { Object.assign(this, JSON.parse(__fixture_parse_url(url))); this.searchParams = {get: key => this.params[key] ?? null}; };
      // These read-only fields/base64 operations also exist in Nuvio's locked
      // JsBindings.kt. No Node or browser object is exposed to plugin code.
      globalThis.atob = value => __fixture_atob(value);
      globalThis.fetch = async function(url, options) {
        var result = JSON.parse(__fixture_fetch(url, JSON.stringify(options || {})));
        return { status: result.status, ok: result.status >= 200 && result.status < 300, url: result.url,
          headers: { get: name => result.headers[name.toLowerCase()] || null },
          text: () => Promise.resolve(decodeURIComponent(result.body.map(b => '%' + b.toString(16).padStart(2, '0')).join(''))),
          arrayBuffer: () => Promise.resolve(Uint8Array.from(result.body).buffer) };
      };
      var module = { exports: {} }; var exports = module.exports;
      (function() { ${code}\n })();
      globalThis.__done = false;
      Promise.resolve(${invokeSettings ? 'module.exports.onSettings()' : `module.exports.getStreams(...${JSON.stringify(args)})`})
        .then(value => { globalThis.__result = JSON.stringify(value); globalThis.__done = true; },
          error => { globalThis.__error = String(error); globalThis.__done = true; });
      void 0;
    `);
    for (let turns = 0; turns < 2500 && !evalValue('__done'); turns++) {
      const result = runtime.executePendingJobs();
      if (result.error) { const error = vm.dump(result.error); result.error.dispose(); throw new Error(JSON.stringify(error)); }
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    assert.equal(evalValue('__done'), true, 'QuickJS promise tamamlanmadı');
    assert.equal(evalValue('globalThis.__error'), undefined);
    // quickjs-kt v1.0.15 waits for native jobs even after __capture_result.
    // Model that drain explicitly; cleared native sleeps still have to finish.
    if (nativeTimers) {
      const drainStarted = Date.now();
      while (timers.size && Date.now() - drainStarted < 1000) await new Promise(resolve => setTimeout(resolve, 2));
      assert.equal(timers.size, 0, 'İptal edilmiş uzun native timer evaluate dönüşünü geciktiriyor');
    }
    return JSON.parse(evalValue('__result'));
  } finally {
    for (const { timer, fn } of timers.values()) { clearTimeout(timer); fn.dispose(); }
    timers.clear();
    vm.dispose();
    runtime.dispose();
  }
}

test('derlenmiş gerçek sağlayıcı QuickJS üzerinde MP4/MKV ve Türkçe altyazı döndürür', async () => {
  const fixture = makeFixture({ items: [{ ...identity, streams: [
    { url: 'https://media.test/movie.mp4', subtitles: [{ url: 'https://media.test/tr.srt', language: 'tr' }] },
    { url: 'https://media.test/movie.mkv' }, { url: 'https://media.test/broken.mp4' }
  ] }] });
  const streams = await runInQuickJs(fixture);
  assert.equal(streams.length, 2);
  const subtitled=streams.find(stream=>stream.type==='mp4');
  assert.equal(subtitled.quality, '1920×1080 ✓');
  assert.match(subtitled.subtitles[0].name, /^Türkçe · SRT/);
  assert.equal(subtitled.subtitles[0].language, 'tr');
  assert.equal(streams[0].type, 'mkv');
});
test('derlenmiş ayar formu KMP onSettings sözleşmesine uyar', async () => {
  const layout = await runInQuickJs({}, { invokeSettings: true });
  assert.ok(Array.isArray(layout));
  assert.ok(layout.some(field => field.type === 'toggle' && field.key === 'includeHls'));
  assert.ok(layout.every(field => ['header', 'info', 'text', 'toggle', 'select'].includes(field.type)));
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.ok(layout.some(field=>field.type==='info' && field.label.includes(`Tanı · ${pkg.version} · TMDB anahtarı: var`)));
});

test('QuickJS anime paketi: doğru kanonik bölüm, gerçek 720p MP4 ve eşlenmiş TR',async()=>{
 const id='a'.repeat(24),identity={tmdbId:13916,type:'tv',originalTitle:'DEATH NOTE',year:2006,season:1,episode:1};
 const fixture={
  'https://api.themoviedb.org/3/tv/13916?api_key=test&append_to_response=external_ids':{json:{id:13916,name:'Death Note',original_name:'DEATH NOTE',first_air_date:'2006-10-04',genres:[{id:16}],original_language:'ja'}},
  'https://animecix.tv/secure/search/Death-Note?type=&limit=20':{json:{results:[{id:7585,tmdb_id:13916,original_title:'DEATH NOTE',year:2006,is_series:true}]}},
  'https://animecix.tv/secure/episode-videos?titleId=7585&episode=1&season=1':{json:[{title_id:7585,season_num:1,episode_num:1,category:'full',url:'https://tau-video.xyz/embed/'+id,captions:[{url:'https://subs.test/tr.srt',language:'tr'}]}]},
  ['https://tau-video.xyz/api/video/'+id]:{json:{_id:id,title_id:7585,season_number:1,episode_number:1,urls:[{label:'1080p',url:'https://media.test/anime.mp4'}]}},
  'https://media.test/anime.mp4':{body:helpers.mp4({width:1280,height:720})},
  'https://subs.test/tr.srt':{body:helpers.srt,mime:'text/plain'}
 };
 const streams=await runInQuickJs(fixture,{code:animeBundle,args:['13916','tv',1,1],settings:{autoSubtitles:false}});
 assert.equal(streams.length,1);assert.equal(streams[0].quality,'1280×720 ✓');assert.equal(streams[0].subtitles[0].language,'tr');
 const ordinary=makeFixture();assert.deepEqual(await runInQuickJs(ordinary,{code:animeBundle,settings:{}}),[]);
});

test('QuickJS: yıl içermeyen doğru dizi bölümü ve AltyazıDB Türkçe SRT birlikte döner',async()=>{
 const tv={id:67070,original_name:'Fleabag',first_air_date:'2016-07-21',external_ids:{imdb_id:'tt5687612'},episode_run_time:[26]};
 const fixture={
  'https://api.themoviedb.org/3/tv/67070?api_key=test&append_to_response=external_ids':{json:tv},
  'https://streamdata.vaplayer.ru/api.php?tmdb=67070&type=tv&season=1&episode=1':{json:{status_code:200,data:{imdb_id:'tt5687612',file_name:'Fleabag.S01E01.1080p.WEB-DL',stream_urls:['https://media.test/episode.mp4']}}},
  'https://media.test/episode.mp4':{body:helpers.mp4()},
  'https://altyazidb.online/subtitles/series/tt5687612%3A1%3A1.json':{json:{subtitles:[{lang:'tur',title:'S01E01 WEB-DL',url:'https://subs.test/tr.srt'}]}},
  'https://subs.test/tr.srt':{body:'1\n00:00:00,000 --> 00:25:00,000\nÖrnek\n',mime:'application/x-subrip'}
 };
 const streams=await runInQuickJs(fixture,{args:['67070','tv',1,1],settings:{vixsrcEnabled:false,hdhubEnabled:false}});
 assert.equal(streams.length,1);assert.equal(streams[0].subtitles[0].language,'tr');assert.match(streams[0].subtitles[0].name,/AltyazıDB/);
});

test('QuickJS: eski ana sağlayıcı tek başına dosyayı ve online HLS alternatifini birlikte getirir',async()=>{
 const fixture=makeFixture({items:[{...identity,streams:[{url:'https://media.test/movie.mkv'}]}],extra:{
  'https://streamdata.vaplayer.ru/api.php?tmdb=603&type=movie':{json:{status_code:200,data:{imdb_id:'tt0133093',file_name:'The.Matrix.1999.WEB-DL.mkv',stream_urls:['https://media.test/online.m3u8']}}},
  'https://media.test/online.m3u8':{body:'#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nsegment.ts\n#EXT-X-ENDLIST\n'}
 }});
 const streams=await runInQuickJs(fixture,{settings:{catalogUrls:'https://library.test/catalog.json',autoSubtitles:false,vixsrcEnabled:false,hdhubEnabled:false,archiveEnabled:false}});
 assert.equal(streams.length,2);assert.ok(streams.some(s=>s.type==='mkv'&&s.name.includes('İndirilebilir')));assert.ok(streams.some(s=>s.type==='hls'&&s.name.includes('Online')));
});

test('QuickJS: ana sağlayıcı grup önekli Shameless bölümünü kaybetmez',async()=>{
 const fixture={
  'https://api.themoviedb.org/3/tv/34307?api_key=test&append_to_response=external_ids':{json:{id:34307,original_name:'Shameless',first_air_date:'2011-01-09',external_ids:{imdb_id:'tt1586680'}}},
  'https://streamdata.vaplayer.ru/api.php?tmdb=34307&type=tv&season=1&episode=1':{json:{status_code:200,data:{imdb_id:'tt1586680',file_name:'Shameless.US.S01.1080p.BluRay.X264-UNTOUCHABLES/untouchables-shameless.us.s01e01.1080p.mkv',stream_urls:['https://media.test/show.m3u8']}}},
  'https://media.test/show.m3u8':{body:'#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nsegment.ts\n#EXT-X-ENDLIST\n'}
 };
 const streams=await runInQuickJs(fixture,{args:['34307','tv',1,1],settings:{autoSubtitles:false,vixsrcEnabled:false,hdhubEnabled:false}});
 assert.equal(streams.length,1);assert.equal(streams[0].type,'hls');
});

test('QuickJS: clearTimeout native beklemeyi iptal etmese de hızlı çağrı uzun bütçeyi beklemez', async () => {
  const start = Date.now();
  const streams = await runInQuickJs(makeFixture(), { nativeTimers: true });
  assert.equal(streams.length, 1);
  assert.ok(Date.now() - start < 1000);
});
test('QuickJS bozuk JSON ve ağ hatalarında çökmez', async () => {
  const fixture = makeFixture({ extra: { 'https://library.test/catalog.json': { body: '{bad' } } });
  assert.deepEqual(await runInQuickJs(fixture), []);
});

test('QuickJS otomatik dizin taraması, BigInt dosya hash’i ve Türkçe eşleme çalışır', async () => {
  const filename = 'The.Matrix.1999.1080p.BluRay.x264-TEST.mp4';
  const directory = 'https://a.111477.xyz/movies/The%20Matrix%20(1999)/';
  const { mp4, srt } = helpers;
  const fixture = makeFixture({ extra: {
    [directory]: { body: `<a href="${filename}">${filename}</a><a href="${filename}.tr.srt">${filename}.tr.srt</a>`, mime: 'text/html' },
    [directory + filename]: { body: mp4({ tail: true }), mime: 'video/mp4' },
    [directory + filename + '.tr.srt']: { body: srt, mime: 'text/plain' }
  } });
  const streams = await runInQuickJs(fixture, { settings: { directoryEnabled: true, hostedDiscovery: false, archiveEnabled: false, playImdbEnabled: false } });
  assert.equal(streams.length, 1);
  assert.equal(streams[0].quality, '1920×1080 ✓');
  assert.equal(streams[0].subtitles[0].language, 'tr');
});
