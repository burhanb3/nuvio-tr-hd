'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scanJetFilmizle, cards, matchingCards, goldIndex, goPlayer, workerVideo, variantUrls, ORIGIN, PLAYER } = require('../src/providers/jetfilmizle.cjs');
const { createHttp } = require('../src/http.cjs');
const { probe } = require('../src/media/probe.cjs');
const { mp4NextTrackOffset, mp4TrackAt } = require('../src/media/containers.cjs');
const { cardFields } = require('../src/media/presentation.cjs');
const { fixtureFetch, box, moov } = require('./helpers.cjs');

const target = { tmdbId: 27205, type: 'movie', originalTitle: 'Inception', searchTitles: ['Inception'], year: 2010, releaseYears: [2010], imdbId: 'tt1375666', runtimeMinutes: 148, originalLanguage: 'en' };
const workerBase = 'https://dl-a.fixture.workers.dev';
const playerUrl = PLAYER + '/go/?id=30179';

function packLang(code) {
  const n = ((code.charCodeAt(0) - 96) << 10) | ((code.charCodeAt(1) - 96) << 5) | (code.charCodeAt(2) - 96);
  return Buffer.from([(n >> 8) & 255, n & 255]);
}
function audioTrack(lang) {
  const hdlr = Buffer.alloc(16);
  hdlr.write('soun', 8, 'ascii');
  const mdhd = Buffer.alloc(24);
  packLang(lang).copy(mdhd, 20);
  return box('trak', box('mdia', box('hdlr', hdlr), box('mdhd', mdhd)));
}
function largeMoovTrMp4(lang = 'tur', seconds = 8880) {
  const mvhd = Buffer.alloc(20);
  mvhd.writeUInt32BE(1000, 12);
  mvhd.writeUInt32BE(seconds * 1000, 16);
  const videoTrak = moov(1280, 534).subarray(8);
  // Pad video trak past 131072 bytes so the audio trak sits at a separate offset
  // beyond the initial 128 KiB head read.
  const paddedVideo = box('trak', videoTrak.subarray(8), box('free', Buffer.alloc(140000)));
  const fullMoov = box('moov', box('mvhd', mvhd), paddedVideo, audioTrack(lang));
  return Buffer.concat([box('ftyp', Buffer.from('isom\0\0\0\0isommp42', 'binary')), fullMoov, box('mdat', Buffer.alloc(16384))]);
}

function makeFixture(body = largeMoovTrMp4('tur')) {
  const url360 = workerBase + '/v/30179?q=360';
  const url1080 = workerBase + '/v/30179?q=1080';
  return {
    [ORIGIN + '/arama?q=Inception']: { body: `<div class="film-card"><a href="${ORIGIN}/film/baslangic"><h3 class="fc-title">Başlangıç</h3><span class="fc-orig">Inception</span><span class="fc-year">2010</span></a></div>` },
    [ORIGIN + '/film/baslangic']: { body: `<input name="film_id" value="4420"><a href="https://www.imdb.com/title/tt1375666/">IMDb</a><button data-source-index="0" data-player-type="dublaj">Vip</button><button data-source-index="2" data-player-type="dublaj">Gold</button>` },
    [ORIGIN + '/jetplayer']: { body: `<iframe src="${playerUrl}"></iframe>` },
    [playerUrl]: { body: `<script>var WORKER_BASE = "${workerBase.replace(/\//g, '\\/')}"; var VIDEO_ID = 30179;</script>` },
    [workerBase + '/v/30179/info']: { json: { id: 30179, qualities: [1080, 720, 360] } },
    [url360]: { body, mime: 'video/mp4' },
    // 1080 ignores Range (200) -> HEAD pre-check must reject it before GET.
    [url1080]: { status: 200, body: Buffer.alloc(64), headers: { 'content-type': 'video/mp4', 'content-length': '2500000000' } },
    [workerBase + '/v/30179?q=720']: { status: 404 }
  };
}

test('JetFilmizle: IMDb bağlı Gold MP4 bulunur, 200-stream varyantı HEAD ile elenir ve büyük moov içindeki TR ses ölçülür', async () => {
  const body = largeMoovTrMp4('tur'), calls = [], f = makeFixture(body);
  const fetcher = fixtureFetch(f, calls);
  const http = createHttp({ fetchImpl: async (url, options = {}) => {
    if (options.method === 'HEAD' && url === workerBase + '/v/30179?q=360') {
      calls.push({ url, ...options });
      return { ok: true, status: 206, url, headers: { get: n => ({ 'content-range': `bytes 0-15/${body.length}`, 'content-type': 'video/mp4' })[n.toLowerCase()] || null }, text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) };
    }
    if (options.method === 'HEAD' && url === workerBase + '/v/30179?q=1080') {
      calls.push({ url, ...options });
      return { ok: true, status: 200, url, headers: { get: n => ({ 'content-length': '2500000000', 'content-type': 'video/mp4' })[n.toLowerCase()] || null }, text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) };
    }
    return fetcher(url, options);
  } });
  try {
    const candidates = await scanJetFilmizle(http, target);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].url, workerBase + '/v/30179?q=360');
    assert.equal(candidates[0].source, 'JetFilmizle');
    assert.equal(candidates[0].readAudioTracks, true);
    assert.deepEqual(candidates[0].subtitles, []);
    const post = calls.find(c => c.url === ORIGIN + '/jetplayer');
    assert.equal(post.method, 'POST');
    assert.equal(post.headers.Origin, ORIGIN);
    assert.ok(post.headers['User-Agent']);
    assert.ok(!calls.some(c => c.url.includes('q=1080') && c.method !== 'HEAD'), 'Range yok sayan 1080 varyantına GET açılmamalı');
    const video = await probe(http, candidates[0], false, false);
    assert.equal(video.downloadable, true);
    assert.deepEqual(video.dimensions, { width: 1280, height: 534 });
    assert.deepEqual(video.audioLanguages, ['tur']);
    assert.match(cardFields(video, candidates[0], []).language, /Ses: TR/);
  } finally { http.close(); }
});

test('JetFilmizle: yanlış IMDb, Gold yokluğu, dizi/anime ve bozuk worker adresi reddedilir; tembel Türkçe ad çalışır', async () => {
  assert.equal(goldIndex('<button data-source-index="0" data-player-type="dublaj">Vip</button>'), null);
  assert.equal(workerVideo('var WORKER_BASE="https://evil.example"; var VIDEO_ID=1;'), null);
  assert.equal(goPlayer('<iframe src="https://evil.example/go/?id=1"></iframe>'), null);
  assert.deepEqual(variantUrls({ base: workerBase, id: '1' }, { id: 2, qualities: [360] }), []);
  assert.deepEqual(variantUrls({ base: workerBase, id: '1' }, { id: 1, qualities: [1080, 720, 480, 360] }).slice(0, 2), [workerBase + '/v/1?q=360', workerBase + '/v/1?q=1080']);

  const body = largeMoovTrMp4('und'), f = makeFixture(body);
  // Wrong IMDb on film page must be rejected.
  const bad = { ...f, [ORIGIN + '/film/baslangic']: { body: f[ORIGIN + '/film/baslangic'].body.replace('tt1375666', 'tt9999999') } };
  const h1 = createHttp({ fetchImpl: fixtureFetch(bad) });
  try {
    assert.deepEqual(await scanJetFilmizle(h1, target), []);
    assert.deepEqual(await scanJetFilmizle(h1, { ...target, type: 'tv', season: 1, episode: 1 }), []);
    assert.deepEqual(await scanJetFilmizle(h1, { ...target, isAnime: true }), []);
  } finally { h1.close(); }

  // Undetermined audio language in MP4 trak is never fabricated as measured TR.
  const h2 = createHttp({ fetchImpl: fixtureFetch({ [workerBase + '/v/30179?q=360']: { body, mime: 'video/mp4' } }) });
  try {
    const v = await probe(h2, { url: workerBase + '/v/30179?q=360', headers: {}, filename: 'Inception.2010.mp4', source: 'JetFilmizle', claimedAudioLanguages: ['tr'], readAudioTracks: true, expectedSize: body.length, identity: target, requireDuration: true, durationTolerance: 0.1, requireVideoDimensions: true, subtitles: [] }, false, false);
    assert.equal(v.downloadable, true);
    assert.equal(v.audioLanguages, undefined);
  } finally { h2.close(); }

  // Lazy Turkish title fallback when English query returns empty.
  const trFixture = {
    ...f,
    [ORIGIN + '/arama?q=Inception']: { body: '<html>no hits</html>' },
    [ORIGIN + '/arama?q=Ba%C5%9Flang%C4%B1%C3%A7']: { body: `<div class="film-card"><a href="${ORIGIN}/film/baslangic"><h3 class="fc-title">Başlangıç</h3><span class="fc-year">2010</span></a></div>` }
  };
  let loadedTitles = 0;
  const trFetcher = fixtureFetch(trFixture);
  const h3 = createHttp({ fetchImpl: async (url, options = {}) => {
    if (options.method === 'HEAD' && url === workerBase + '/v/30179?q=360') {
      return { ok: true, status: 206, url, headers: { get: n => ({ 'content-range': `bytes 0-15/${body.length}`, 'content-type': 'video/mp4' })[n.toLowerCase()] || null }, text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) };
    }
    return trFetcher(url, options);
  } });
  try {
    const rows = await scanJetFilmizle(h3, target, { loadTitles: async () => { loadedTitles++; return ['Başlangıç']; } });
    assert.equal(loadedTitles, 1);
    assert.equal(rows.length, 1);
  } finally { h3.close(); }
});

test('mp4NextTrackOffset ve mp4TrackAt: yalnız tam sınırda sonraki trak okunur; und/bozuk kutu atlanır', () => {
  const body = largeMoovTrMp4('tur');
  const next = mp4NextTrackOffset(body.subarray(0, 131072), 0);
  assert.ok(next && next.offset > 131072 && next.offset < next.moovEnd);
  const track = mp4TrackAt(body.subarray(next.offset, next.offset + 65536));
  assert.equal(track.kind, 'soun');
  assert.equal(track.language, 'tur');
  assert.equal(mp4TrackAt(Buffer.from('not-a-trak')), null);
});

test('probe ayna önceliği: ilk dosyada taşıma hatası veren sunucu ikinci dosyada sona itilir', async () => {
  const mvhd = Buffer.alloc(20);
  mvhd.writeUInt32BE(1000, 12);
  mvhd.writeUInt32BE(8880000, 16);
  const body = Buffer.concat([box('ftyp', Buffer.from('isom\0\0\0\0isommp42', 'binary')), box('moov', box('mvhd', mvhd), moov(640, 360).subarray(8)), box('mdat', Buffer.alloc(64))]);
  const s1a = 'https://bad.files.test/res/a/file1.mp4', s1b = 'https://good.files.test/res/a/file1.mp4';
  const s2a = 'https://bad.files.test/res/b/file2.mp4', s2b = 'https://good.files.test/res/b/file2.mp4';
  const calls = [];
  const base = fixtureFetch({ [s1b]: { body, mime: 'video/mp4' }, [s2b]: { body, mime: 'video/mp4' } });
  const http = createHttp({ fetchImpl: async (url, opts) => {
    calls.push(url);
    if (url.startsWith('https://bad.files.test/')) throw new Error('TLS handshake failed');
    return base(url, opts);
  } });
  try {
    const v1 = await probe(http, { url: s1a, alternateUrls: [s1b], source: 'FzMovies', headers: {}, identity: target, requireDuration: true, durationTolerance: 0.1, requireVideoDimensions: true }, false, false);
    assert.equal(v1.url, s1b);
    const v2 = await probe(http, { url: s2a, alternateUrls: [s2b], source: 'FzMovies', headers: {}, identity: target, requireDuration: true, durationTolerance: 0.1, requireVideoDimensions: true }, false, false);
    assert.equal(v2.url, s2b);
    assert.equal(calls.filter(u => u.startsWith('https://bad.files.test/')).length, 1, 'İkinci dosyada bozuk sunucuya tekrar istek açılmamalı');
  } finally { http.close(); }
});
