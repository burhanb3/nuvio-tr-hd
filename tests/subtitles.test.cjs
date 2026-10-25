const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSubtitles, subtitleFormat, isTurkish } = require('../src/subtitles.cjs');
const { createHttp } = require('../src/http.cjs');
const { makeFixture, fixtureFetch, target, srt, vtt } = require('./helpers.cjs');

test('Türkçe dil kodları ve UTF-8 SRT/VTT ipuçları', () => {
  for (const code of ['tr', 'tur', 'tr-TR', 'Turkish', 'Türkçe']) assert.ok(isTurkish(code));
  assert.equal(isTurkish('en'), false);
  assert.equal(subtitleFormat(srt), 'srt');
  assert.equal(subtitleFormat(vtt), 'vtt');
  assert.equal(subtitleFormat('<html>1\n00:00:01,000 --> 00:00:03,000</html>'), null);
});
test('yanlış dil, kimlik, HTML, bozuk SRT ve yinelenen URL ayıklanır', async () => {
  const fixture = makeFixture({ files: {
    'https://media.test/bad.srt': { body: '<html>Forbidden</html>', mime: 'text/html' },
    'https://media.test/broken.srt': { body: 'This is no subtitle', mime: 'text/plain' }
  } });
  const http = createHttp({ fetchImpl: fixtureFetch(fixture) });
  const subs = await loadSubtitles(http, { subtitleBase: 'https://media.test/catalog.json', subtitles: [
    { url: 'tr.srt', language: 'tr' }, { url: 'tr.srt', language: 'tur' }, { url: 'tr.vtt', language: 'en' },
    { url: 'tr.vtt', language: 'tr', identity: { ...target, year: 2003 } },
    { url: 'bad.srt', language: 'tr' }, { url: 'broken.srt', language: 'tr' }, null
  ] }, target, false);
  assert.deepEqual(subs, [{ url: 'https://media.test/tr.srt', language: 'tr', name: 'Türkçe · SRT · 01 · Alternatif altyazı' }]);
});

test('farklı altyazılar sürüm adı ve numarayla ayırt edilir; aynı gövdenin aynası çoğalmaz', async () => {
  const fixture = makeFixture({ files: { 'https://mirror.test/same.srt': { body: srt, mime: 'text/plain' } } });
  const http = createHttp({ fetchImpl: fixtureFetch(fixture) });
  const tracks = await loadSubtitles(http, { subtitleBase: 'https://media.test/', subtitles: [
    { url: 'https://media.test/tr.srt', language: 'tr', title: 'Film.WEB-DL.GROUP-A' },
    { url: 'https://media.test/tr.vtt', language: 'tr', title: 'Film.BluRay.GROUP-B' },
    { url: 'https://mirror.test/same.srt', language: 'tr', title: 'Aynı gövde' }
  ] }, target, false);
  assert.equal(tracks.length, 2);
  assert.match(tracks[0].name, /01 · Film.WEB-DL.GROUP-A/);
  assert.match(tracks[1].name, /02 · Film.BluRay.GROUP-B/);
  assert.ok(tracks.every(t => !('_contentKey' in t)));
  http.close();
});
