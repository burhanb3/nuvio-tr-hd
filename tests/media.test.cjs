const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inspectContainer } = require('../src/media/containers.cjs');
const { probe } = require('../src/media/probe.cjs');
const { qualityLabel } = require('../src/util.cjs');
const { createHttp } = require('../src/http.cjs');
const { mp4, mkv, box, moov, fixtureFetch } = require('./helpers.cjs');

test('MP4 video track ve Matroska video boyutları konteynerden okunur', () => {
  assert.deepEqual(inspectContainer(mp4()), { container: 'mp4', dimensions: { width: 1920, height: 1080 } });
  assert.deepEqual(inspectContainer(mkv()), { container: 'mkv', dimensions: { width: 1280, height: 720 } });
  assert.equal(qualityLabel(inspectContainer(mp4({ width: 1920, height: 800 })).dimensions), '720p');
});
test('WebM, sahte uzantı, tek ftyp, HTML ve bozuk baytlar kabul edilmez', () => {
  for (const data of [Buffer.from('<html>movie.mp4</html>'), Buffer.from('fake.mkv'), mkv(1280, 720, 'webm'),
    box('ftyp', Buffer.from('isom\0\0\0\0isom', 'binary')), Buffer.from([0, 0, 0, 1]), mp4().subarray(0, 8)]) {
    assert.equal(inspectContainer(data), null);
  }
});
test('yalnız ses içeren MP4 video kaynağı sayılmaz', () => {
  assert.equal(inspectContainer(mp4({ audio: true })), null);
});
test('dosya adındaki 2160p, gerçek 720p değerini değiştirmez', async () => {
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/2160p.mp4': { body: mp4({ width: 1280, height: 720 }), mime: 'video/mp4' } }) });
  const info = await probe(http, { url: 'https://media.test/2160p.mp4', headers: {} });
  assert.equal(qualityLabel(info.dimensions), '720p');
});
test('MP4 sonunda moov varsa sınırlı kuyruk aralığı incelenir', async () => {
  const calls = [];
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/tail.mp4': { body: mp4({ tail: true }) } }, calls) });
  const info = await probe(http, { url: 'https://media.test/tail.mp4', headers: {} });
  assert.deepEqual(info.dimensions, { width: 1920, height: 1080 });
  assert.equal(calls.filter(c => c.headers?.Range).length, 2);
});
test('range göz ardı eden büyük yanıt doğrulanmış dosya sayılmaz', async () => {
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/large.mp4': { body: mp4({ tail: true }), ignoreRange: true } }) });
  assert.equal(await probe(http, { url: 'https://media.test/large.mp4', headers: {} }), null);
});
test('HEAD 405 ise küçük gerçek dosyada range fallback çalışır', async () => {
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/a.mp4': { body: mp4(), headStatus: 405, ignoreRange: true } }) });
  assert.equal((await probe(http, { url: 'https://media.test/a.mp4', headers: {} })).container, 'mp4');
});
test('HLS varsayılan kapalıdır; açıldığında indirilebilir sayılmaz', async () => {
  const body = '#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nsegment.ts\n';
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/hls.m3u8': { body, mime: 'application/vnd.apple.mpegurl' }, 'https://media.test/hls': { body, mime: 'application/vnd.apple.mpegurl' } }) });
  const candidate = { url: 'https://media.test/hls.m3u8', headers: {} };
  assert.equal(await probe(http, candidate), null);
  assert.equal((await probe(http, candidate, true)).downloadable, false);
  assert.equal(await probe(http, { ...candidate, url: 'https://media.test/hls' }, true), null);
});
test('MIME video/mp4 olsa bile HTML gövde elenir', async () => {
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/a.mp4': { body: '<html>blocked</html>', mime: 'video/mp4' } }) });
  assert.equal(await probe(http, { url: 'https://media.test/a.mp4', headers: {} }), null);
});
test('uzantısız veya MP4 uzantılı MKV indirme adı hatasına karşı elenir', async () => {
  for (const path of ['a', 'a.mp4']) {
    const url = `https://media.test/${path}`;
    const http = createHttp({ fetchImpl: fixtureFetch({ [url]: { body: mkv() } }) });
    assert.equal(await probe(http, { url, headers: {} }), null);
  }
});
test('bozuk ve rastgele konteyner girdileri çökmez', () => {
  let seed = 7;
  for (let n = 0; n < 400; n++) {
    const data = Buffer.alloc(n);
    for (let i = 0; i < n; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed & 255; }
    assert.doesNotThrow(() => inspectContainer(data));
  }
});

test('büyük moov kısmen okununca tamamlanmış tkhd/hdlr alanlarından boyut alınır', () => {
  const ftyp = box('ftyp', Buffer.from('isom\0\0\0\0isommp42', 'binary'));
  const largeMovie = box('moov', moov(1920, 1080).subarray(8), box('free', Buffer.alloc(200000)));
  const prefix = Buffer.concat([ftyp, largeMovie]).subarray(0, 131072);
  assert.deepEqual(inspectContainer(prefix).dimensions, { width: 1920, height: 1080 });
});
test('gerçek MP4 mvhd süresi okunur ve tam filme ait kısa video elenir', async () => {
  const mvhd = Buffer.alloc(24);
  mvhd.writeUInt32BE(1000, 12); mvhd.writeUInt32BE(145000, 16);
  const ftyp = box('ftyp', Buffer.from('isom\0\0\0\0isommp42', 'binary'));
  const bytes = Buffer.concat([ftyp, box('moov', box('mvhd', mvhd), moov().subarray(8)), box('mdat', Buffer.alloc(32))]);
  assert.equal(inspectContainer(bytes).duration, 145);
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/a.mp4': { body: bytes, mime: 'video/mp4' } }) });
  assert.equal(await probe(http, { url: 'https://media.test/a.mp4', headers: {}, identity: { runtimeMinutes: 136 } }), null);
});
