'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createProvider } = require('../src/index.cjs');
const { createHttp } = require('../src/http.cjs');
const { createSubtitleDiscovery, scoreSubtitle, SUBTITLE_SERVICES } = require('../src/subtitle-discovery.cjs');
const { target, makeFixture, fixtureFetch, srt } = require('./helpers.cjs');

const ALTYAZIDB_LIST = 'https://altyazidb.online/subtitles/movie/tt0133093.json';
const HOMES_LIST = SUBTITLE_SERVICES[0] + '/subtitles/movie/tt0133093.json';
const V3_LIST = SUBTITLE_SERVICES[1] + '/subtitles/movie/tt0133093.json';
const altyazidbRows = n => Array.from({ length: n }, (_, i) => ({ lang: 'tur', title: 'NF ' + i, url: `https://altyazidb.online/subtitle/row${i}.srt` }));

test('AltyazıDB gövdeleri 502 verirken Türkçe yükleme hakkını tüketmez; OpenSubtitles TR satırı yüklenir', async () => {
  const fixture = makeFixture({ extra: {
    [ALTYAZIDB_LIST]: { json: { subtitles: altyazidbRows(14) } },
    ...Object.fromEntries(altyazidbRows(14).map(row => [row.url, { status: 502 }])),
    [HOMES_LIST]: { json: { subtitles: [{ lang: 'tur', title: 'The.Matrix.1999.1080p.BluRay', url: 'https://subs.test/os-tr.srt' }] } },
    'https://subs.test/os-tr.srt': { body: srt, mime: 'text/plain' }
  } });
  const calls = [];
  const streams = await createProvider({ tmdbKey: 'test', settings: { autoDiscover: false, catalogUrls: 'https://library.test/catalog.json' },
    fetchImpl: fixtureFetch(fixture, calls) }).getStreams(603, 'movie');
  assert.equal(streams.length, 1);
  const turkish = streams[0].subtitles.filter(s => s.language === 'tr');
  assert.deepEqual(turkish.map(s => s.url), ['https://subs.test/os-tr.srt']);
  assert.match(turkish[0].name, /OpenSubtitles/);
  // First-pass share is 4 bodies (loaded two at a time); the download path then
  // trips on 5xx although its catalogue path answered, so no fifth body goes out.
  assert.ok(calls.filter(c => c.url.startsWith('https://altyazidb.online/subtitle/')).length <= 4);
});

test('bir servisin ilk tur payı dolunca sonraki satırları ertelenir, son turda denenir', async () => {
  const homesRows = [0, 1, 2, 3, 4].map(i => ({ lang: 'tur', title: 'The.Matrix.1999.1080p.BluRay.' + i, url: `https://subs.test/os-${i}.srt` }));
  const fixture = makeFixture({ extra: {
    [ALTYAZIDB_LIST]: { json: { subtitles: altyazidbRows(14) } },
    ...Object.fromEntries(altyazidbRows(14).map(row => [row.url, { status: 502 }])),
    [HOMES_LIST]: { json: { subtitles: homesRows } },
    // The first four bodies are gone (404, not a refunded 5xx); only the fifth is valid.
    'https://subs.test/os-4.srt': { body: srt, mime: 'text/plain' }
  } });
  const streams = await createProvider({ tmdbKey: 'test', settings: { autoDiscover: false, catalogUrls: 'https://library.test/catalog.json' },
    fetchImpl: fixtureFetch(fixture) }).getStreams(603, 'movie');
  assert.equal(streams.length, 1);
  assert.deepEqual(streams[0].subtitles.filter(s => s.language === 'tr').map(s => s.url), ['https://subs.test/os-4.srt']);
});

test('yalnız sürüm etiketi taşıyan OpenSubtitles satırı film adını alır; yıl/başka ad/serbest not ve FORCED elenir; v3 tam sürüm korunur', async () => {
  const file = 'The.Matrix.1999.1080p.BluRay.x264-GROUP';
  const fixture = {
    [HOMES_LIST]: { json: { subtitles: [
      { lang: 'tur', title: 'Blu-ray.Remux.1080p.VC-1.DTS-HD.MA.5.1-HDRemuX', url: 'https://subs.test/remux.srt' },
      { lang: 'tur', title: 'Shutter.Island.2010.1080p.BluRay', url: 'https://subs.test/other-film.srt' },
      { lang: 'tur', title: 'Çeviriyi bu sürüme senkronladım, iyi seyirler', url: 'https://subs.test/note.srt' },
      { lang: 'tur', title: '2160p BluRay FORCED', url: 'https://subs.test/forced.srt' }
    ] } },
    [V3_LIST]: { json: { subtitles: [{ lang: 'tur', movieReleaseName: file, subtitleFileName: file + '.srt', url: 'https://subs.test/v3.srt' }] } }
  };
  const http = createHttp({ fetchImpl: fixtureFetch(fixture) });
  try {
    const discover = createSubtitleDiscovery(http, target, {});
    const candidate = { filename: file + '.mkv', url: 'https://media.test/' + file + '.mkv' };
    const rows = await discover(candidate, {}, { languages: ['tr'] });
    const byUrl = Object.fromEntries(rows.map(row => [row.url, row]));
    assert.equal(byUrl['https://subs.test/remux.srt']._releaseNotesOnly, true);
    assert.match(byUrl['https://subs.test/remux.srt'].releaseName, /^The Matrix\.1999\.Blu-ray/);
    assert.ok(scoreSubtitle(byUrl['https://subs.test/remux.srt'], candidate, {}, target, true));
    assert.equal(byUrl['https://subs.test/other-film.srt']._releaseNotesOnly, false);
    for (const url of ['other-film', 'note', 'forced']) assert.equal(scoreSubtitle(byUrl[`https://subs.test/${url}.srt`], candidate, {}, target, true), null, url);
    assert.equal(scoreSubtitle(byUrl['https://subs.test/v3.srt'], candidate, {}, target, true).score, 95);
  } finally { http.close(); }
  // A forced track named after the exact release is still not a full subtitle.
  const exact = { filename: 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mkv', url: 'https://media.test/m.mkv' };
  assert.equal(scoreSubtitle({ lang: 'tr', title: 'The.Matrix.1999.1080p.BluRay.x264-GROUP.FORCED', _scope: 'title', _identityBound: true }, exact, {}, target, true), null);
  assert.equal(scoreSubtitle({ lang: 'tr', title: 'The.Matrix.1999.1080p.BluRay.x264-GROUP', foreign_parts_only: true }, exact, {}, target, true), null);
  assert.equal(scoreSubtitle({ lang: 'tr', title: 'The.Matrix.1999.1080p.BluRay.x264-GROUP', _scope: 'title', _identityBound: true }, exact, {}, target, true).score, 95);
});
