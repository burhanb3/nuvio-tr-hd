const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHttp } = require('../src/http.cjs');
const { safeUrl, cleanHeaders } = require('../src/util.cjs');
const { fixtureFetch, mp4 } = require('./helpers.cjs');

test('güvenli URL çözümü, göreli yollar ve HTTP tercihi', () => {
  assert.equal(safeUrl('../film.mp4', 'https://media.test/a/b/catalog.json'), 'https://media.test/a/film.mp4');
  for (const url of ['file:///c:/a.mp4', 'javascript:alert(1)', 'https://user:pass@media.test/a.mp4', 'https://media.test/a\n.mp4', 'http://media.test/a.mp4']) assert.equal(safeUrl(url), null);
  assert.equal(safeUrl('http://192.168.1.2/a.mp4', undefined, true), 'http://192.168.1.2/a.mp4');
  // A title with an apostrophe must not silently drop the search request.
  assert.equal(safeUrl("https://media.test/search/Ocean's-Eleven?q=" + encodeURIComponent("Journey's End")), 'https://media.test/search/Ocean%27s-Eleven?q=Journey%27s%20End');
  for (const url of ['https://media.test/a"b', 'https://media.test/<a>', 'https://media.test/a`b']) assert.equal(safeUrl(url), null);
});
test('kullanıcı Range/Host ve CRLF başlıkları aktarılmaz', () => {
  assert.deepEqual(cleanHeaders({ Range: 'bytes=2-3', Host: 'bad', Referer: 'https://player.test/', Cookie: 'a\r\nb' }), { Referer: 'https://player.test/' });
});
test('kırık Content-Range ve yetkisiz yanıtlar elenir', async () => {
  const fetcher = async () => ({ ok: true, status: 206, url: 'https://media.test/a.mp4', headers: { get: k => ({ 'content-range': 'bytes 9-20/100', 'content-length': '12' }[k] || null) }, arrayBuffer: async () => new Uint8Array(12).buffer });
  assert.equal(await createHttp({ fetchImpl: fetcher }).bytes('https://media.test/a.mp4', {}), null);
  assert.equal(await createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/a.mp4': { status: 403 } }) }).bytes('https://media.test/a.mp4', {}), null);
});
test('redirect döngüsü biter ve farklı kökene kimlik bilgisi gitmez', async () => {
  const fixture = { 'https://a.test/video.mp4': { status: 302, headers: { location: 'https://b.test/video.mp4' } },
    'https://b.test/video.mp4': { status: 302, headers: { location: 'https://a.test/video.mp4' } } };
  const calls = [];
  const http = createHttp({ fetchImpl: fixtureFetch(fixture, calls) });
  assert.equal(await http.request('https://a.test/video.mp4'), null);
  assert.equal(calls.length, 4);
  calls.length = 0;
  assert.equal(await http.request('https://a.test/video.mp4', { headers: { Authorization: 'Bearer private' } }), null);
  assert.equal(calls.length, 1);
});
test('geçerli yönlendirme sonrası gerçek dosya URL’si döner', async () => {
  const http = createHttp({ fetchImpl: fixtureFetch({ 'https://media.test/start': { status: 302, headers: { location: '/movie.mp4' } }, 'https://media.test/movie.mp4': { body: mp4() } }) });
  assert.equal((await http.bytes('https://media.test/start', {})).url, 'https://media.test/movie.mp4');
});

test('public oturum yönlendirmesi yalnız açık kökene gider, Cookie silinir ve Authorization istisnası yoktur',async()=>{
 const calls=[],f={'https://catalog.test/start':{status:302,headers:{location:'https://player.test/watch'}},'https://player.test/watch':{body:'public page'}},http=createHttp({fetchImpl:fixtureFetch(f,calls)});
 try{const r=await http.text('https://catalog.test/start',{headers:{Cookie:'publicSession=fixture'},publicCookieRedirectOrigin:'https://player.test'});
  assert.equal(r.text,'public page');assert.deepEqual(calls[1].headers,{});assert.ok(calls.every(c=>!('publicCookieRedirectOrigin'in c)));
  calls.length=0;assert.equal(await http.text('https://catalog.test/start',{headers:{Cookie:'publicSession=fixture'},publicCookieRedirectOrigin:'https://other.test'}),null);assert.equal(calls.length,1);
  calls.length=0;assert.equal(await http.text('https://catalog.test/start',{headers:{Authorization:'Bearer private'},publicCookieRedirectOrigin:'https://player.test'}),null);assert.equal(calls.length,1);
 }finally{http.close();}
});

test('yanıt başlığı hızlı gelse de takılan JSON ve dosya gövdeleri ayrı sınırda biter', async () => {
  const fetchImpl = async url => ({ ok: true, status: 200, url, headers: { get: () => null },
    text: () => new Promise(() => {}), arrayBuffer: () => new Promise(() => {}) });
  const http = createHttp({ fetchImpl, timeoutMs: 20 });
  const start = Date.now();
  assert.equal(await http.json('https://source.test/meta.json'), null);
  const r = await http.request('https://source.test/video.mp4');
  assert.equal((await r.response.arrayBuffer()).byteLength, 0);
  assert.ok(Date.now() - start < 1000);
  http.close();
});

test('429 sonrası aynı kökene tekrar yüklenmez, diğer kaynak etkilenmez', async () => {
  const calls = [];
  const http = createHttp({ fetchImpl: fixtureFetch({
    'https://blocked.test/one': { status: 429 }, 'https://blocked.test/two': { body: 'unreachable' },
    'https://working.test/meta.json': { json: { ok: true } }
  }, calls) });
  assert.equal(await http.request('https://blocked.test/one'), null);
  assert.equal(await http.request('https://blocked.test/two'), null);
  assert.deepEqual(await http.json('https://working.test/meta.json'), { ok: true });
  assert.equal(calls.length, 2);
  http.close();
});

test('ağın reddettiği paylaşımlı alan adı ailesi ve sürekli 5xx veren köken aynı aramada tekrar denenmez', async () => {
  const calls = [], events = [];
  const fixture = { 'https://good.test/a.json': { json: { ok: true } }, 'https://down.test/1': { status: 502 }, 'https://down.test/2': { status: 502 },
    'https://down.test/3': { status: 502 }, 'https://down.test/4': { json: { ok: true } } };
  const base = fixtureFetch(fixture, calls);
  const fetchImpl = async (url, options) => {
    if (new URL(url).hostname.endsWith('.workers.dev')) { calls.push({ url }); throw new TypeError('fetch failed'); }
    return base(url, options);
  };
  const http = createHttp({ fetchImpl, onEvent: e => events.push(e) });
  try {
    assert.equal(await http.request('https://one.alpha.workers.dev/a.mkv'), null);
    assert.equal(await http.request('https://two.beta.workers.dev/b.mkv'), null);
    // Third Worker host: skipped without a network request.
    assert.equal(await http.request('https://three.gamma.workers.dev/c.mkv'), null);
    assert.equal(calls.filter(c => c.url.includes('workers.dev')).length, 2);
    assert.equal(http.failureFor('https://three.gamma.workers.dev/c.mkv').reason, 'host_unreachable');
    assert.equal(http.failureFor('https://one.alpha.workers.dev/a.mkv').reason, 'timeout_or_network');
    assert.ok(events.some(e => e.reason === 'host_unreachable'));
    // Unrelated hosts are unaffected.
    assert.deepEqual(await http.json('https://good.test/a.json'), { ok: true });
    for (const n of [1, 2, 3]) assert.equal(await http.request('https://down.test/' + n), null);
    assert.equal(await http.json('https://down.test/4'), null);
    assert.equal(calls.filter(c => c.url.startsWith('https://down.test/')).length, 3);
    assert.equal(http.failureFor('https://down.test/4').reason, 'server_unavailable');
  } finally { http.close(); }
});

test('katalog yolu çalışırken sürekli 5xx veren indirme yolu ayrıca kesilir; kardeş yol etkilenmez', async () => {
  const calls = [];
  const fixture = { 'https://subs.test/subtitles/movie/tt1.json': { json: { ok: true } }, 'https://subs.test/subtitles/movie/tt2.json': { json: { ok: true } } };
  for (const n of [1, 2, 3, 4]) fixture['https://subs.test/subtitle/' + n] = { status: 502 };
  const http = createHttp({ fetchImpl: fixtureFetch(fixture, calls) });
  try {
    assert.deepEqual(await http.json('https://subs.test/subtitles/movie/tt1.json'), { ok: true });
    for (const n of [1, 2, 3]) assert.equal(await http.request('https://subs.test/subtitle/' + n), null);
    assert.equal(http.unavailable('https://subs.test/subtitle/4'), true);
    assert.equal(http.scope(1000).unavailable('https://subs.test/subtitle/5'), true);
    assert.equal(await http.request('https://subs.test/subtitle/4'), null);
    assert.equal(http.failureFor('https://subs.test/subtitle/4').reason, 'server_unavailable');
    assert.equal(calls.filter(c => c.url.includes('/subtitle/')).length, 3);
    assert.equal(http.unavailable('https://subs.test/subtitles/movie/tt2.json'), false);
    assert.deepEqual(await http.json('https://subs.test/subtitles/movie/tt2.json'), { ok: true });
  } finally { http.close(); }
});

test('tek ağ hatası veya başarılı yanıtı olan köken devre kesiciyi açmaz', async () => {
  let failOnce = true;
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(url);
    if (url.includes('flaky') && failOnce) { failOnce = false; throw new TypeError('fetch failed'); }
    if (url.includes('mixed') && url.includes('/bad')) throw new TypeError('fetch failed');
    return fixtureFetch({ [url]: { json: { ok: true } } })(url, options);
  };
  const http = createHttp({ fetchImpl });
  try {
    assert.equal(await http.json('https://flaky.test/a'), null);
    assert.deepEqual(await http.json('https://flaky.test/b'), { ok: true });
    assert.deepEqual(await http.json('https://mixed.test/ok'), { ok: true });
    for (const n of [1, 2, 3]) assert.equal(await http.json('https://mixed.test/bad?' + n), null);
    assert.deepEqual(await http.json('https://mixed.test/ok?again'), { ok: true });
  } finally { http.close(); }
});
