'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHttp } = require('../src/http.cjs');
const { probe } = require('../src/media/probe.cjs');
const { scanWaploaded, pageMatches, indexEntries, childPage, namedFile, decodeLink } = require('../src/providers/waploaded.cjs');
const { target, fixtureFetch, ebml } = require('./helpers.cjs');
const FILMS = 'https://films.waploaded.com', SHOWS = 'https://shows.waploaded.com';
function encode(value, key = 'fixture') { return Buffer.from(Array.from(value, (c, i) => c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).toString('base64'); }
function videoBytes() {
  const duration = Buffer.alloc(8); duration.writeDoubleBE(60000);
  return Buffer.concat([ebml('1a45dfa3', ebml('4282', Buffer.from('matroska'))),
    ebml('18538067', Buffer.concat([ebml('1549a966', ebml('4489', duration)), ebml('1654ae6b',
      ebml('ae', Buffer.concat([ebml('83', [1]), ebml('e0', Buffer.concat([ebml('b0', [5,0]), ebml('ba', [2,208])]))])))]))]);
}
function fixtureFor(tv = false) {
  const t = tv ? { ...target, tmdbId: 123, type: 'tv', originalTitle: 'Example Show', year: 2020, season: 2, episode: 1 } : target;
  const origin = tv ? SHOWS : FILMS, kind = tv ? 'series' : 'movie';
  const root = origin + '/' + kind + (tv ? '/123/example-show-2020' : '/123/the-matrix-1999');
  const slug = tv ? 'example-show-ca-s02e01-4321-mkv' : 'the-matrix-1999-4321-mkv', token = 'a'.repeat(32);
  const dl = origin + '/dl/' + token + '/' + slug, filePage = 'https://meetdownload.com/' + token + '/' + slug;
  const raw = 'https://files.kissorgrab.com/public/example/' + slug, url = raw.replace(/-mkv$/, '.mkv');
  const h1 = tv ? 'Example Show S02 E01' : 'The Matrix (1999)';
  const release = `<h1>${h1}</h1><p>Audio: English</p><a href="https://www.imdb.com/title/${t.imdbId}/">IMDb</a><a href="/dl/${token}/${slug}">Download Video</a>`;
  const fixture = {
    [origin + '/sitemap/' + kind]: { body: `<urlset><url><loc>${root}</loc></url></urlset>` },
    [root]: { body: tv ? '<h1>Example Show (2020 TV series)</h1><a href="/series/124/example-show-season-2">Example Show Season 2</a>' : release },
    [dl]: { status: 303, headers: { location: filePage } },
    [filePage]: { body: `<h1>${tv ? 'Example Show CA S02E01' : 'The Matrix (1999)'}</h1><div data-md-dl="/api/v1/dl-link/${token}" data-md-t="fixture-ticket"></div>` },
    ['https://meetdownload.com/api/v1/dl-link/' + token]: { json: { ok: true, k: 'fixture', d: encode(raw), s: '' } },
    [url]: { body: videoBytes(), mime: 'video/x-matroska' }
  };
  if (tv) {
    fixture[origin + '/series/124/example-show-season-2'] = { body: '<h1>Example Show Season 2</h1><a href="/series/125/example-show-s02-e01">Example Show S02 E01</a><a href="/series/126/example-show-s02-e02">Example Show S02 E02</a>' };
    fixture[origin + '/series/125/example-show-s02-e01'] = { body: release };
  }
  return { target: t, fixture, root, dl, filePage, raw, url, token };
}
test('güncel film indeksi genel ad/yıl arar, doğru adlı gerçek MKV Range ile doğrulanır', async () => {
  const f = fixtureFor(), calls = [], http = createHttp({ fetchImpl: fixtureFetch(f.fixture, calls) });
  try {
    const rows = await scanWaploaded(http, f.target); assert.equal(rows.length, 1); assert.equal(rows[0].url, f.url);
    assert.deepEqual(rows[0].claimedAudioLanguages, ['en']); assert.equal(rows[0].filename, 'the-matrix-1999.mkv');
    const v = await probe(http, rows[0]); assert.equal(v.downloadable, true); assert.equal(v.container, 'mkv');
    assert.deepEqual(v.dimensions, { width: 1280, height: 720 }); assert.equal(v.duration, 60);
    assert.ok(calls.some(c => c.url === f.url && c.headers.Range));
    const post = calls.find(c => c.method === 'POST'); assert.equal(post.body, 't=fixture-ticket');
  } finally { http.close(); }
});
test('dizi tam yıl, sezon ve bölüm bağıyla seçilir; yayıncı dosya sayacı bölüm aralığı sayılmaz', async () => {
  const f = fixtureFor(true), calls = [], http = createHttp({ fetchImpl: fixtureFetch(f.fixture, calls) });
  try { const rows = await scanWaploaded(http, f.target); assert.equal(rows.length, 1); assert.equal(rows[0].filename, 'example-show-ca-s02e01.mkv');
    assert.equal((await probe(http, rows[0])).downloadable, true); assert.ok(!calls.some(c => c.url.includes('/126/')));
  } finally { http.close(); }
});
test('indekste olmayan yapım için tüm arşiv/bölümler gezilmez', async () => {
  const f = fixtureFor(), calls = [], http = createHttp({ fetchImpl: fixtureFetch(f.fixture, calls) });
  try { assert.deepEqual(await scanWaploaded(http, { ...f.target, originalTitle: 'Absent Film' }), []); assert.ok(calls.length <= 1); }
  finally { http.close(); }
});
test('indeks ipucudur; yanlış yıl, IMDb, devam filmi ve keyfi URL kimlik sayılmaz', () => {
  const html = '<h1>The Matrix (1999)</h1><a href="https://www.imdb.com/title/tt9999999/">IMDb</a>';
  assert.equal(pageMatches(html, target), false);
  assert.equal(pageMatches(html.replace('tt9999999/', 'tt9999999'), target), false);
  assert.equal(pageMatches('<h1>The Matrix Reloaded (1999)</h1>', target), false);
  assert.equal(pageMatches('<h1>The Matrix (2000)</h1>', target), false);
  assert.deepEqual(indexEntries('<urlset><loc>https://other.test/movie/123/the-matrix-1999</loc></urlset>', target), []);
  assert.equal(childPage('<a href="https://other.test/series/123/show-season-2">Example Show Season 2</a>', SHOWS, fixtureFor(true).target, false), null);
});
test('festival yılı yalnız kanonik alternatif yıl ve aynı açık IMDb ile kabul edilir', () => {
  const t = { ...target, year: 2000, releaseYears: [1999,2000] };
  const h = '<h1>The Matrix (1999)</h1><a href="https://www.imdb.com/title/tt0133093/">IMDb</a>';
  assert.equal(pageMatches(h, t), true); assert.equal(pageMatches('<h1>The Matrix (1999)</h1>', t), false);
  assert.equal(pageMatches(h, { ...t, releaseYears: [2000] }), false);
});
test('bozuk ticket/403 ve yanlış dosya başlığı yeni indirme seçeneği üretmez', async () => {
  for (const fault of ['denied','wrong-file','external-api']) {
    const f = fixtureFor(), calls = [];
    if (fault === 'denied') f.fixture['https://meetdownload.com/api/v1/dl-link/' + f.token] = { status: 403 };
    if (fault === 'wrong-file') f.fixture[f.filePage].body = f.fixture[f.filePage].body.replace('The Matrix (1999)', 'Other Film (1999)');
    if (fault === 'external-api') f.fixture[f.filePage].body = f.fixture[f.filePage].body.replace('/api/v1/dl-link/', 'https://other.test/api/v1/dl-link/');
    const http = createHttp({ fetchImpl: fixtureFetch(f.fixture,calls) });
    try { assert.deepEqual(await scanWaploaded(http, f.target), []); assert.ok(calls.filter(c => c.method === 'POST').length <= 1); }
    finally { http.close(); }
  }
});
test('yanlış sezon/bölüm için ilk bulunan başka bölüm kullanılmaz', async () => {
  const f = fixtureFor(true), calls = [], http = createHttp({ fetchImpl: fixtureFetch(f.fixture,calls) });
  try { assert.deepEqual(await scanWaploaded(http, { ...f.target, episode: 3 }), []); assert.ok(!calls.some(c => /\/dl\//.test(c.url))); }
  finally { http.close(); }
});
test('adı koruyan URL sadece yayıncının kendi dosya hostu ve aynı slug için üretilir', () => {
  const f = fixtureFor(); assert.equal(decodeLink('fixture', encode(f.raw)), f.raw);
  assert.equal(namedFile(f.raw, 'the-matrix-1999-4321-mkv'), f.url);
  assert.equal(namedFile('https://other.test/' + f.raw.split('/').pop(), f.raw.split('/').pop()), null);
  assert.equal(namedFile(f.raw, 'other-film-1999-4321-mkv'), null);
  assert.equal(decodeLink('', encode(f.raw)), null); assert.equal(decodeLink('key','%%%'), null);
});
test('bölüm aralığı yayıncı dosya sayacından ayrı tutulur; HTML/HLS dosya sayılmaz', async () => {
  const f = fixtureFor(true);
  f.fixture[SHOWS + '/series/125/example-show-s02-e01'].body = f.fixture[SHOWS + '/series/125/example-show-s02-e01'].body.replaceAll('s02e01-4321-mkv', 's02e01-02-4321-mkv');
  const http = createHttp({fetchImpl:fixtureFetch(f.fixture)});
  try { assert.deepEqual(await scanWaploaded(http, f.target), []); } finally { http.close(); }
  for (const body of ['<html>not a video</html>', '#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nvideo.ts']) {
    const movie=fixtureFor();movie.fixture[movie.url]={body};const h=createHttp({fetchImpl:fixtureFetch(movie.fixture)});
    try { const rows=await scanWaploaded(h,movie.target);assert.equal(rows.length,1);assert.equal(await probe(h,rows[0],true),null); } finally { h.close(); }
  }
});
