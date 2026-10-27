const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHttp } = require('../src/http.cjs');
const { safeUrl, cleanHeaders } = require('../src/util.cjs');
const { fixtureFetch, mp4 } = require('./helpers.cjs');

test('güvenli URL çözümü, göreli yollar ve HTTP tercihi', () => {
  assert.equal(safeUrl('../film.mp4', 'https://media.test/a/b/catalog.json'), 'https://media.test/a/film.mp4');
  for (const url of ['file:///c:/a.mp4', 'javascript:alert(1)', 'https://user:pass@media.test/a.mp4', 'https://media.test/a\n.mp4', 'http://media.test/a.mp4']) assert.equal(safeUrl(url), null);
  assert.equal(safeUrl('http://192.168.1.2/a.mp4', undefined, true), 'http://192.168.1.2/a.mp4');
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
