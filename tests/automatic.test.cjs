const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createProvider } = require('../src/index.cjs');
const { scanDirectory, filenameIdentity } = require('../src/providers/directory.cjs');
const { archiveQuery, scanArchive } = require('../src/providers/archive.cjs');
const { scanPlayImdb, PLAY_API } = require('../src/providers/playimdb.cjs');
const { createHttp } = require('../src/http.cjs');
const { SUBTITLE_SERVICES, scoreSubtitle } = require('../src/subtitle-discovery.cjs');
const { opensubtitlesHash } = require('../src/media/hash.cjs');
const { balancedCandidates } = require('../src/ranking.cjs');
const { target, identity, makeFixture, fixtureFetch, mp4, mkv, srt, vtt } = require('./helpers.cjs');

const fileA = 'The.Matrix.1999.1080p.BluRay.x264-GROUP.mp4';
const fileB = 'The.Matrix.1999.720p.WEB-DL.x264-OTHER.mkv';
const dirUrl = 'https://a.111477.xyz/movies/The%20Matrix%20(1999)/';
const dirVideo = `https://a.111477.xyz/movies/The%20Matrix%20(1999)/${fileA}`;
function autoFixture() {
  return makeFixture({ extra: {
    [dirUrl]: { mime: 'text/html', body: `<a href="${fileA}">${fileA}</a><a href="The.Matrix.2003.1080p.mp4">wrong year</a>` },
    [dirVideo]: { body: mp4(), mime: 'video/mp4' },
    [archiveQuery(target)]: { json: { response: { docs: [{ identifier: 'matrix-test' }] } } },
    'https://archive.org/metadata/matrix-test': { json: { metadata: { title: 'The Matrix', year: '1999', tmdb_id: '603' }, files: [{ name: fileB }] } },
    [`https://archive.org/download/matrix-test/${fileB}`]: { body: mkv(), mime: 'video/x-matroska' },
    [PLAY_API + '?tmdb=603&type=movie']: { status: 503 },
    'https://media.test/exact-a.vtt': { body: vtt, mime: 'text/vtt' },
    'https://media.test/exact-b.srt': { body: srt, mime: 'text/plain' }
  } });
}
function autoFetch(fixture, calls = []) {
  const base = fixtureFetch(fixture, calls);
  return (url, options) => {
    if (url.startsWith(SUBTITLE_SERVICES[0] + '/subtitles/')) {
      fixture[url] = { json: { subtitles: [
        { url: 'https://media.test/exact-a.vtt', lang: 'tur', title: fileA.replace(/\.mp4$/, ''), ai_translated: false },
        { url: 'https://media.test/exact-b.srt', lang: 'tur', title: fileB.replace(/\.mkv$/, ''), ai_translated: false },
        { url: 'https://media.test/tr.srt', lang: 'eng', title: fileA },
        { url: 'https://media.test/tr.srt', lang: 'tur', title: fileA, ai_translated: true }
      ] } };
    }
    return base(url, options);
  };
}

test('boş ayarlarda iki bağımsız kaynağı otomatik bulur; her dosyaya farklı TR altyazı bağlar', async () => {
  const calls = [];
  const streams = await createProvider({ tmdbKey: 'test', settings: { directoryEnabled: true, hostedDiscovery: false }, fetchImpl: autoFetch(autoFixture(), calls) }).getStreams(603, 'movie');
  assert.equal(streams.length, 2);
  assert.match(streams[0].name, /^01 .*Internet Archive/);
  assert.match(streams[1].name, /^02 .*DahmerMovies/);
  assert.equal(streams[0].subtitles[0].url, 'https://media.test/exact-b.srt');
  assert.equal(streams[1].subtitles[0].url, 'https://media.test/exact-a.vtt');
  assert.ok(streams.every(s => s.subtitles[0].language === 'tr' && !('_score' in s.subtitles[0])));
  assert.ok(calls.some(c => c.url.startsWith(SUBTITLE_SERVICES[0] + '/subtitles/movie/')));
});
test('TR servisi yokken video varsayılan görünür; yalnız açık sıkı modda gizlenir', async () => {
  const fixture = autoFixture();
  const provider = settings => createProvider({ tmdbKey: 'test', settings, fetchImpl: fixtureFetch(fixture) });
  assert.deepEqual(await provider({ subtitlePolicy: 'require' }).getStreams(603, 'movie'), []);
  assert.equal((await provider({ directoryEnabled: true }).getStreams(603, 'movie')).length, 2);
});
test('hash algoritması 64-bit little-endian ve taşma kurallarıyla bilinen değerlere uyar', () => {
  const first = new Uint8Array(65536), last = new Uint8Array(65536);
  assert.equal(opensubtitlesHash(first, last, 131072), '0000000000020000');
  first[0] = 1; last[0] = 2;
  assert.equal(opensubtitlesHash(first, last, 131072), '0000000000020003');
  first.fill(255); last.fill(255);
  assert.equal(opensubtitlesHash(first, last, 131072), '000000000001c000');
  assert.equal(opensubtitlesHash(first, last, 100), null);
});
test('dosya hash eşleşmesi tam sürümden üstündür; farklı kesim/yıl kabul edilmez', () => {
  const candidate = { filename: fileA, url: dirVideo };
  const video = { videoHash: '0011223344556677' };
  const exact = scoreSubtitle({ language: 'tr', title: fileA, _scope: 'title' }, candidate, video, target);
  const hashed = scoreSubtitle({ language: 'tur', moviehash: video.videoHash, _scope: 'title' }, candidate, video, target);
  assert.equal(hashed.score, 100); assert.equal(exact.score, 95);
  assert.equal(scoreSubtitle({ lang: 'tur', title: fileA.replace('1999', '2003'), _scope: 'title' }, candidate, video, target), null);
  assert.equal(scoreSubtitle({ lang: 'tur', title: fileA.replace('1080p', 'EXTENDED.1080p'), _scope: 'title' }, candidate, video, target), null);
});
test('release/fps bilgisi olmayan genel film altyazısı sessizce doğru sürüm sayılmaz', () => {
  const sub = { lang: 'tur', title: 'The Matrix 1999', _scope: 'title' };
  assert.equal(scoreSubtitle(sub, { filename: fileA }, {}, target), null);
  assert.equal(scoreSubtitle(sub, { filename: fileA }, {}, target, true).score, 35);
});
test('kaynaklar dengeli taranır; ilk sağlayıcı tüm aday kotasını tüketmez', () => {
  assert.deepEqual(balancedCandidates([[1, 2, 3, 4], ['a', 'b'], ['x']], 5), [1, 'a', 'x', 2, 'b']);
});
test('dizin yanlış yılı ve yanlış bölümü elemek için metadata kullanır', async () => {
  assert.equal(filenameIdentity('The.Matrix.2003.1080p.mp4', target), false);
  const tv = { ...target, type: 'tv', season: 1, episode: 2 };
  assert.equal(filenameIdentity('The.Matrix.1999.S01E03.mkv', tv), false);
  const data = await scanDirectory(createHttp({ fetchImpl: fixtureFetch(autoFixture()) }), target);
  assert.equal(data.length, 1);
  assert.equal(data[0].filename, fileA);
});
test('Internet Archive çelişkili TMDB kimliğini ve yanlış yılı kabul etmez', async () => {
  const fixture = autoFixture();
  fixture['https://archive.org/metadata/matrix-test'].json.metadata.tmdb_id = '999';
  assert.deepEqual(await scanArchive(createHttp({ fetchImpl: fixtureFetch(fixture) }), target), []);
});

test('filmle aynı başlık/yıla sahip kısa fragmanlar tam film olarak sunulmaz', async () => {
  const fixture = autoFixture();
  fixture['https://archive.org/metadata/matrix-test'].json.files[0].length = '145.84';
  assert.deepEqual(await scanArchive(createHttp({ fetchImpl: fixtureFetch(fixture) }), { ...target, runtimeMinutes: 136 }), []);
});
test('PlayIMDb gerçek API şeması, dosya adı/yıl ve IMDb kontrolü', async () => {
  const fixture = { [PLAY_API + '?tmdb=603&type=movie']: { json: { status_code: '200', data: {
    imdb_id: target.imdbId, file_name: 'folder/' + fileA, stream_urls: ['https://media.test/file.mp4', 'https://media.test/hls.m3u8'] }, default_subs: [] } } };
  const http = createHttp({ fetchImpl: fixtureFetch(fixture) });
  assert.equal((await scanPlayImdb(http, target)).length, 2);
  fixture[PLAY_API + '?tmdb=603&type=movie'].json.data.imdb_id = 'tt0000000';
  assert.deepEqual(await scanPlayImdb(http, target), []);
});
test('uzantısız ve /sub.vtt/ altyazı uçları gövdeden doğrulanır, TR kodu çevrimdışı taşınır', async () => {
  const { loadSubtitles } = require('../src/subtitles.cjs');
  const url = 'https://subs.test/sub.vtt/?id=1';
  const http = createHttp({ fetchImpl: fixtureFetch({ [url]: { body: vtt, mime: 'text/vtt' } }) });
  const tracks = await loadSubtitles(http, { subtitles: [{ url, lang: 'tur' }], subtitleBase: url }, target, false);
  assert.equal(tracks[0].url, url);
  assert.equal(tracks[0].language, 'tr');
});

test('bir adayın gövdesi takılırsa tamamlanan video+altyazı çifti bütçede korunur', async () => {
  const fixture = makeFixture({ items: [{ ...identity, streams: [
    { url: 'https://media.test/movie.mp4', subtitles: [{ url: 'https://media.test/tr.srt', lang: 'tur' }] },
    { url: 'https://media.test/stuck.mp4' }
  ] }], files: { 'https://media.test/stuck.mp4': { body: mp4(), mime: 'video/mp4' } } });
  const fetcher = fixtureFetch(fixture);
  const wrapped = async (url, options) => {
    const r = await fetcher(url, options);
    if (url.includes('stuck') && options.method !== 'HEAD') r.arrayBuffer = () => new Promise(() => {});
    return r;
  };
  const provider = createProvider({ settings: { catalogUrls: 'https://library.test/catalog.json', autoDiscover: false, autoSubtitles: false },
    tmdbKey: 'test', fetchImpl: wrapped, budgetMs: 180 });
  const streams = await provider.getStreams(603, 'movie');
  assert.equal(streams.length, 1);
  assert.equal(streams[0].subtitles.length, 1);
});

test('süreye dayalı altyazı ancak gerçek video uzunluğuna yakınsa kabul edilir', async () => {
  const { loadSubtitles } = require('../src/subtitles.cjs');
  const url = 'https://media.test/timing.vtt';
  const entry = { url, lang: 'tur', _match: { score: 50, requireDuration: true } };
  const candidate = { subtitles: [entry], subtitleBase: url };
  const tooShort = createHttp({ fetchImpl: fixtureFetch({ [url]: { body: vtt, mime: 'text/vtt' } }) });
  assert.deepEqual(await loadSubtitles(tooShort, candidate, target, false, { videoDuration: 600, keepScore: true }), []);
  const close = createHttp({ fetchImpl: fixtureFetch({ [url]: { body: 'WEBVTT\n\n00:09:00.000 --> 00:09:30.000\nTürkçe\n', mime: 'text/vtt' } }) });
  const tracks = await loadSubtitles(close, candidate, target, false, { videoDuration: 600, keepScore: true });
  assert.equal(tracks[0]._score, 65);
  assert.match(tracks[0].name, /senkron doğrulanmadı/);
});
test('daha güçlü altyazı eşleşmesi daha yüksek çözünürlüğün önüne geçer', () => {
  const { rankStreams } = require('../src/ranking.cjs');
  const item = (url, height, score) => ({ candidate: { url }, video: { downloadable: true, dimensions: { width: height * 2, height }, size: 1000000 }, subtitles: [{ _score: score }] });
  const result = rankStreams([item('4k', 2160, 76), item('720', 720, 100)]);
  assert.equal(result[0].candidate.url, '720');
});

test('bir katalog gövdesi takılsa da diğer kaynağın tamamlanan çifti korunur', async () => {
  const fixture = makeFixture({ items: [{ ...identity, streams: [{ url: 'https://media.test/movie.mp4', subtitles: [{ url: 'https://media.test/tr.srt', lang: 'tur' }] }] }] });
  const transport = fixtureFetch(fixture);
  const fetchImpl = (url, options) => url.includes('stuck.test') ? new Promise(() => {}) : transport(url, options);
  const p = createProvider({ tmdbKey: 'test', fetchImpl, budgetMs: 180, requestTimeoutMs: 1000,
    settings: { catalogUrls: 'https://stuck.test/catalog.json https://library.test/catalog.json', autoDiscover: false, autoSubtitles: false } });
  const streams = await p.getStreams(603, 'movie');
  assert.equal(streams.length, 1);
  assert.equal(p.getReport().reason, 'deadline');
  assert.equal(p.getReport().results, 1);
});

test('HEAD erişim reddi sonrası aynı dosya GET ile yeniden zorlanmaz', async () => {
  const { probe } = require('../src/media/probe.cjs');
  const calls = [], url = 'https://blocked.test/movie.mp4';
  const http = createHttp({ fetchImpl: fixtureFetch({ [url]: { status: 403 } }, calls) });
  assert.equal(await probe(http, { url, headers: {} }), null);
  assert.equal(calls.length, 1);
  http.close();
});

test('HLS sıkıştırılmış uzunluk başlığına rağmen metinden doğrulanır; indirme etiketi almaz', async () => {
  const { probe } = require('../src/media/probe.cjs');
  const url = 'https://player.test/master.m3u8';
  const http = createHttp({ fetchImpl: fixtureFetch({ [url]: { body: '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000\nvideo.m3u8', mime: 'application/vnd.apple.mpegurl', ignoreRange: true, headers: { 'content-length': '30', 'content-encoding': 'gzip' } } }) });
  assert.equal((await probe(http, { url, headers: {} }, true)).downloadable, false);
  assert.equal(await probe(http, { url, headers: {} }, false), null);
  http.close();
});
