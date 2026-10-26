'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createProvider, onSettings } = require('../src/index.cjs');
const { configuration, effectiveTmdbKey } = require('../src/diagnostics.cjs');
const { createHttp } = require('../src/http.cjs');
const { resolveIdentity } = require('../src/matching.cjs');
const { scanPlayImdb, PLAY_API } = require('../src/providers/playimdb.cjs');
const { scoreSubtitle } = require('../src/subtitle-discovery.cjs');
const { makeFixture, fixtureFetch, target } = require('./helpers.cjs');

const meta = { id: 1339713, original_title: 'Obsession', release_date: '2026-05-13', imdb_id: 'tt37287335', runtime: 109,
  release_dates: { results: [{ release_dates: [
    { type: 1, release_date: '2025-09-06T00:00:00.000Z' },
    { type: 5, release_date: '2027-01-01T00:00:00.000Z' },
    { type: 3, release_date: '2030-01-01T00:00:00.000Z' }
  ] }] } };

test('Obsession: doğrulanmış festival yılı + aynı IMDb kabul edilir; genel yıl toleransı yok', async () => {
  const fixture = {
    'https://api.themoviedb.org/3/movie/1339713?api_key=test&append_to_response=external_ids,release_dates': { json: meta },
    [PLAY_API + '?tmdb=1339713&type=movie']: { json: { status_code: '200', data: { imdb_id: meta.imdb_id,
      file_name: 'Obsession.2025.1080p.WEBRip.x264.GROUP.mp4', stream_urls: ['https://media.test/master.m3u8'] } } }
  };
  const http = createHttp({ fetchImpl: fixtureFetch(fixture) });
  try {
    const identity = await resolveIdentity(http, 1339713, 'movie', undefined, undefined, 'test');
    assert.equal(identity.year, 2026); assert.deepEqual(identity.releaseYears, [2025, 2026]);
    const [candidate] = await scanPlayImdb(http, identity);
    assert.equal(candidate.identity.year, 2026); assert.equal(candidate.identityImdbBound, true);
    assert.equal((await scanPlayImdb(http, { ...identity, releaseYears: [2026] })).length, 0);
    fixture[PLAY_API + '?tmdb=1339713&type=movie'].json.data.imdb_id = 'tt0000001';
    assert.deepEqual(await scanPlayImdb(http, identity), []);
    fixture[PLAY_API + '?tmdb=1339713&type=movie'].json.data.imdb_id = null;
    assert.deepEqual(await scanPlayImdb(http, identity), []);
    fixture[PLAY_API + '?tmdb=1339713&type=movie'].json.data.imdb_id = meta.imdb_id;
    fixture[PLAY_API + '?tmdb=1339713&type=movie'].json.data.file_name = 'Obsession.2024.1080p.mp4';
    assert.deepEqual(await scanPlayImdb(http, identity), []);
    fixture[PLAY_API + '?tmdb=1339713&type=movie'].json.data.file_name = 'Other.Obsession.2025.1080p.mp4';
    assert.deepEqual(await scanPlayImdb(http, identity), []);
  } finally { http.close(); }
});

test('festival yılı altyazısı kesin sorgu bağı olmadan veya farklı IMDb ile birleştirilmez', () => {
  const identity = { tmdbId: meta.id, type: 'movie', originalTitle: 'Obsession', year: 2026, releaseYears: [2025, 2026], imdbId: meta.imdb_id };
  const candidate = { filename: 'Obsession.2025.1080p.WEBRip.x264.GROUP.mp4' };
  const sub = { language: 'tr', title: 'Obsession.2025.1080p.WEBRip.x264.GROUP', _scope: 'title', _identityBound: true };
  assert.equal(scoreSubtitle(sub, candidate, {}, identity, true).score, 95);
  assert.equal(scoreSubtitle({ ...sub, _identityBound: false }, candidate, {}, identity, true), null);
  assert.equal(scoreSubtitle({ ...sub, imdb_id: 'tt0000001' }, candidate, {}, identity, true), null);
  assert.equal(scoreSubtitle({ ...sub, tmdbId: 1 }, candidate, {}, identity, true), null);
  assert.equal(scoreSubtitle({ ...sub, title: 'Other.2025.1080p.WEBRip' }, candidate, {}, identity, true), null);
  assert.equal(scoreSubtitle({ ...sub, title: sub.title.replace('2025', '2024') }, candidate, {}, identity, true), null);
});

test('TMDB film süresi altyazının gerçek videoyla süre uyumu kanıtı sayılmaz', () => {
  const sub = { language: 'tr', title: 'The Matrix 1999', _scope: 'title', _identityBound: true };
  const candidate = { filename: 'The.Matrix.1999.mp4' };
  assert.equal(scoreSubtitle(sub, candidate, { duration: 8160, durationSource: 'tmdb' }, target, true).score, 35);
  assert.equal(scoreSubtitle(sub, candidate, { duration: 8160, durationSource: 'tmdb' }, target, false), null);
  assert.equal(scoreSubtitle(sub, candidate, { duration: 8160, durationSource: 'playlist' }, target, false).requireDuration, true);
});

test('geçerli HLS master varsayılan aramada iptal edilemeyen ek profil sorgusunu başlatmaz', async () => {
  const url = 'https://stream.test/master.m3u8';
  const master = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1920x1080,AUDIO="aud"\nslow.m3u8\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",URI="audio.m3u8"\n';
  const calls = [], base = fixtureFetch(makeFixture({ extra: { [url]: { body: master } } }), calls);
  let optionalRequests = 0;
  const provider = createProvider({ tmdbKey: 'test', lane: 'main', budgetMs: 1000,
    settings: { archiveEnabled: false, hdhubEnabled: false, playImdbEnabled: false, vixsrcEnabled: false, autoSubtitles: false, useDownloadBridge: false },
    fetchImpl: (address, options) => {
      if (address.includes('slow.m3u8') || address.includes('audio.m3u8')) { optionalRequests++; return new Promise(() => {}); }
      return base(address, options);
    },
    sourceFactories: [{ name: 'PlayIMDb', run: async () => [{ url, source: 'PlayIMDb', filename: 'The.Matrix.1999.mp4', headers: {}, subtitles: [], identity: { ...target, runtimeMinutes: 136 } }] }]
  });
  const streams = await provider.getStreams(603, 'movie');
  assert.equal(streams.length, 1); assert.equal(streams[0].url, url, 'ayrı sesli master korunmalı');
  assert.equal(streams[0].type, 'hls'); assert.match(streams[0].title, /İndirilemez/);
  assert.equal(optionalRequests, 0, 'native fetch hiç başlatılmamalı; JS timeout yeterli değil');
  assert.equal(provider.getReport().identity.reason, 'ok');
});

test('boş sonuç tanısı eksik anahtar, TMDB hatası, eksik bölüm ve kapalı taramayı ayırır', async () => {
  for (const [options, args, expected] of [
    [{}, [603, 'movie'], 'missing_tmdb_key'],
    [{ tmdbKey: 'test' }, [603, 'movie'], 'tmdb_request_failed'],
    [{ tmdbKey: 'test' }, [603, 'tv'], 'missing_episode']
  ]) {
    const p = createProvider({ fetchImpl: fixtureFetch({}), ...options });
    assert.deepEqual(await p.getStreams(...args), []);
    assert.equal(p.getReport().identity.reason, expected);
  }
  const p = createProvider({ settings: { autoDiscover: false }, fetchImpl: () => { throw new Error('Ağ çağrısı olmamalı'); } });
  assert.deepEqual(await p.getStreams(603, 'movie'), []);
  assert.equal(p.getReport().reason, 'automatic_search_disabled');
});

test('ayar tanısı ağa çıkmaz, yalnız anahtarın varlığını gösterir ve eski kapalı filtreyi korur', () => {
  const oldSettings = globalThis.SCRAPER_SETTINGS, oldKey = globalThis.TMDB_API_KEY;
  try {
    globalThis.TMDB_API_KEY = 'PRIVATE-INJECTED-KEY';
    globalThis.SCRAPER_SETTINGS = { includeHls: false, subtitlePolicy: 'require', tmdbApiKey: 'PRIVATE-OVERRIDE', catalogUrls: 'https://private.test/secret' };
    const fields = onSettings(), text = JSON.stringify(fields.filter(f => f.type === 'info'));
    assert.match(text, /TMDB anahtarı: var/); assert.match(text, /HLS: kapalı/); assert.match(text, /TR zorunlu: evet/);
    assert.ok(!/PRIVATE|private\.test/.test(text));
    assert.equal(configuration(globalThis.SCRAPER_SETTINGS).includeHls, false);
    assert.equal(effectiveTmdbKey({ tmdbApiKey: '  ' }, ' injected '), 'injected');
    assert.equal(fields.find(f => f.key === 'detailedHlsMetadata').defaultValue, false);
  } finally { globalThis.SCRAPER_SETTINGS = oldSettings; globalThis.TMDB_API_KEY = oldKey; }
});
