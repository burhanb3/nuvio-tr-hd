const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createProvider, onSettings, formatResults } = require('../src/index.cjs');
const { identity, makeFixture, fixtureFetch, mp4 } = require('./helpers.cjs');

const settings = { catalogUrls: 'https://library.test/catalog.json', autoDiscover: false, autoSubtitles: false, requireTurkishSubtitles: false };
function provider(fixture, overrides = {}) { return createProvider({ tmdbKey: 'test', fetchImpl: fixtureFetch(fixture), ...overrides, settings: { ...settings, ...overrides.settings } }); }

test('JSON uçtan uca: MP4 + MKV, Türkçe SRT/VTT, bozuk kaynak izolasyonu', async () => {
  const fixture = makeFixture({ items: [{ ...identity, streams: [
    { url: 'https://media.test/movie.mp4', subtitles: [{ url: 'https://media.test/tr.srt', lang: 'tur' }, { url: 'https://media.test/tr.vtt', language: 'tr-TR' }] },
    { url: 'https://media.test/movie.mkv' }, { url: 'https://media.test/broken.mp4' }, { url: 'magnet:?xt=bad' }, null
  ] }] });
  const streams = await provider(fixture).getStreams('603', 'movie');
  assert.equal(streams.length, 2);
  const subtitled = streams.find(stream => stream.type === 'mp4');
  assert.equal(subtitled.quality, '1920×1080 ✓');
  assert.equal(subtitled.subtitles.length, 2);
  assert.equal(subtitled.subtitles[0].language, 'tr');
  assert.match(subtitled.name, /İndirilebilir/);
  assert.equal(streams[0].type, 'mkv', 'küçük dosya varsayılan önce gelir');
  assert.ok(streams.every(s => typeof s.url === 'string' && typeof s.size === 'string'));
});
test('remake yılı, yanlış TMDB ve benzer isimler elenir', async () => {
  const fixture = makeFixture({ items: [2003, 2021].map(year => ({ ...identity, year, streams: [{ url: 'https://media.test/movie.mp4' }] })) });
  assert.deepEqual(await provider(fixture).getStreams(603, 'movie'), []);
});
test('JSON bozuksa çalışan diğer kaynak korunur ve tekrar URL birleştirilir', async () => {
  const fixture = makeFixture({ extra: { 'https://broken.test/catalog.json': { body: '{bad json' } } });
  const streams = await provider(fixture, { settings: { catalogUrls: 'https://broken.test/catalog.json https://library.test/catalog.json https://library.test/catalog.json' } }).getStreams('603', 'movie');
  assert.equal(streams.length, 1);
});
test('Stremio meta/stream/subtitles standart sözleşmesi çalışır', async () => {
  const fixture = makeFixture({ addonManifest: { id: 'test', resources: ['meta', 'stream', 'subtitles'], types: ['movie'], idPrefixes: ['tmdb:'] },
    addonMeta: { id: 'tmdb:603', type: 'movie', name: 'The Matrix', releaseInfo: '1999' },
    addonStreams: [{ url: 'https://media.test/movie.mp4', behaviorHints: { proxyHeaders: { request: { Referer: 'https://player.test/' } } } }],
    addonSubs: [{ url: 'https://media.test/tr.srt', lang: 'tur' }] });
  const streams = await provider(fixture, { settings: { catalogUrls: '', addonUrls: 'https://addon.test/manifest.json' } }).getStreams(603, 'movie');
  assert.equal(streams.length, 1);
  assert.equal(streams[0].headers.Referer, 'https://player.test/');
  assert.equal(streams[0].subtitles.length, 1);
});
test('Stremio meta çelişkisi dosya adıyla aşılmaz', async () => {
  const fixture = makeFixture({ addonManifest: { id: 'test', resources: ['meta', 'stream'] },
    addonMeta: { id: 'tmdb:603', type: 'movie', name: 'The Matrix', releaseInfo: '2003' },
    addonStreams: [{ url: 'https://media.test/movie.mp4', behaviorHints: { filename: 'The.Matrix.1999.mp4' } }] });
  assert.deepEqual(await provider(fixture, { settings: { catalogUrls: '', addonUrls: 'https://addon.test/manifest.json' } }).getStreams(603, 'movie'), []);
});
test('stream-only Stremio: kesin başlık+yıl, torrent ve yanlış ad filtreleri', async () => {
  const fixture = makeFixture({ addonManifest: { id: 'test', resources: ['stream'] }, addonStreams: [
    { url: 'https://media.test/movie.mp4', behaviorHints: { filename: 'The.Matrix.1999.2160p.mp4' } },
    { url: 'https://media.test/movie.mkv', behaviorHints: { filename: 'The.Matrix.2003.mkv' } },
    { infoHash: '0123456789', url: 'https://media.test/movie.mp4' }
  ] });
  const streams = await provider(fixture, { settings: { catalogUrls: '', addonUrls: 'https://addon.test/manifest.json' } }).getStreams(603, 'movie');
  assert.equal(streams.length, 1);
  assert.equal(streams[0].quality, '1920×1080 ✓');
});
test('süresiz ağ isteği zaman aşımında boş sonuç verir', async () => {
  const start = Date.now();
  const p = createProvider({ settings, tmdbKey: 'test', requestTimeoutMs: 15, budgetMs: 100, fetchImpl: () => new Promise(() => {}) });
  assert.deepEqual(await p.getStreams(603, 'movie'), []);
  assert.ok(Date.now() - start < 1000);
});
test('otomatik tarama kapalı ve ek kaynak yoksa ağ çağrısı yapılmaz', async () => {
  let calls = 0;
  const p = createProvider({ settings: { autoDiscover: false }, fetchImpl: () => { calls++; throw new Error(); } });
  assert.deepEqual(await p.getStreams(603, 'movie'), []);
  assert.equal(calls, 0);
  assert.ok(onSettings().some(x => x.key === 'catalogUrls' && x.type === 'text'));
});
test('konteyner ve dosya adı kalite bilgisi vermiyorsa eksik bilgi açık kalır', async () => {
  const fixture = makeFixture({ files: { 'https://media.test/movie.mp4': { body: mp4({ width: 0, height: 0 }), mime: 'video/mp4' } } });
  const streams = await provider(fixture).getStreams(603, 'movie');
  assert.equal(streams[0].quality, 'Kalite bilinmiyor');
  assert.match(streams[0].title, /Kalite bilinmiyor/);
});

test('varsayılan Tümü/20; eski 6/10 seçilebilir ve sonuç çoğaltılmaz', () => {
  const resultSetting = onSettings().find(field => field.key === 'maxResults');
  assert.equal(resultSetting.defaultValue, '20');
  assert.equal(onSettings().find(field => field.key === 'minimumQuality').defaultValue, '0');
  assert.deepEqual(resultSetting.options.map(option => option.value), ['6', '10', '20']);
  const entries = Array.from({ length: 25 }, (_, i) => ({
    candidate: { url: `https://media.test/${i}.mp4`, source: 'Test', headers: {} },
    video: { url: `https://media.test/${i}.mp4`, downloadable: true, container: 'mp4', dimensions: { width: 1920, height: 1080 }, size: 1000000 },
    subtitles: []
  }));
  assert.equal(formatResults(entries, {}, identity).length, 20);
  assert.equal(formatResults(entries, { maxResults: '6' }, identity).length, 6);
  assert.equal(formatResults(entries, { maxResults: '10' }, identity).length, 10);
  assert.equal(formatResults(entries.slice(0, 2), { maxResults: '10' }, identity).length, 2);
});
