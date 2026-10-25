import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getQuickJS } from 'quickjs-emscripten';
import helpers from './helpers.cjs';

const { makeFixture, responseFor, identity } = helpers;
const bundle = await readFile(new URL('../providers/nuvio-tr-hd.js', import.meta.url), 'utf8');

async function runInQuickJs(fixture, { settings, args = ['603', 'movie'], invokeSettings = false, nativeTimers = false } = {}) {
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
      return vm.newString(JSON.stringify({ href: parsed.href, protocol: parsed.protocol, hostname: parsed.hostname, origin: parsed.origin }));
    });
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
      globalThis.URL = function(url) { Object.assign(this, JSON.parse(__fixture_parse_url(url))); };
      globalThis.fetch = async function(url, options) {
        var result = JSON.parse(__fixture_fetch(url, JSON.stringify(options || {})));
        return { status: result.status, ok: result.status >= 200 && result.status < 300, url: result.url,
          headers: { get: name => result.headers[name.toLowerCase()] || null },
          text: () => Promise.resolve(decodeURIComponent(result.body.map(b => '%' + b.toString(16).padStart(2, '0')).join(''))),
          arrayBuffer: () => Promise.resolve(Uint8Array.from(result.body).buffer) };
      };
      var module = { exports: {} }; var exports = module.exports;
      (function() { ${bundle}\n })();
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
  assert.equal(streams[0].quality, '1080p');
  assert.match(streams[0].subtitles[0].name, /^Türkçe · SRT/);
  assert.equal(streams[0].subtitles[0].language, 'tr');
  assert.equal(streams[1].type, 'mkv');
});
test('derlenmiş ayar formu KMP onSettings sözleşmesine uyar', async () => {
  const layout = await runInQuickJs({}, { invokeSettings: true });
  assert.ok(Array.isArray(layout));
  assert.ok(layout.some(field => field.type === 'toggle' && field.key === 'includeHls'));
  assert.ok(layout.every(field => ['header', 'info', 'text', 'toggle', 'select'].includes(field.type)));
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
  assert.equal(streams[0].quality, '1080p');
  assert.equal(streams[0].subtitles[0].language, 'tr');
});
