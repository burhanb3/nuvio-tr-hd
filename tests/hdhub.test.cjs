'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHttp } = require('../src/http.cjs');
const { scanHdHub, pageMatches, shortlinkTarget, releaseEntries, HDHUB_ORIGIN } = require('../src/providers/hdhub.cjs');
const { probe } = require('../src/media/probe.cjs');
const { target, fixtureFetch, responseFor, mkv } = require('./helpers.cjs');

function shortPage(url) {
  const encode = text => Buffer.from(text).toString('base64');
  const data = encode(JSON.stringify({ o: encode(url) }));
  const rot13 = data.replace(/[A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13)));
  return `<script>s('o','${encode(encode(rot13))}')</script>`;
}
function hdFixture() {
  const file = 'https://bucket.r2.cloudflarestorage.com/public/object?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=' + 'a'.repeat(64);
  const page = `<script>var defaultVideoId = '603'</script><script type="application/ld+json">${JSON.stringify({ '@type': 'Movie', name: 'The Matrix', datePublished: '1999-03-31' })}</script>` +
    '<div class="download-item"><div class="file-title">The.Matrix.1999.1080p.WEB-DL.GROUP.mkv</div><span>2.50 GB</span><a href="https://greenmotors.club/example">Download HubCloud</a></div>';
  return { file, page, fixture: {
    [HDHUB_ORIGIN + '/?s=The%20Matrix']: { body: `<a href="${HDHUB_ORIGIN}/matrix-movie-1/">Download The Matrix (1999)</a>` },
    [HDHUB_ORIGIN + '/matrix-movie-1/']: { body: page },
    'https://greenmotors.club/example': { body: shortPage('https://hubcloud.example/file') },
    'https://hubcloud.example/file': { body: '<script>var url = "https://gamerxyt.com/hubcloud.php?token=example"</script>' },
    'https://gamerxyt.com/hubcloud.php?token=example': { body: `<a href="${file.replaceAll('&', '&amp;')}">FSL Server</a>` },
    [file]: { body: mkv(1920, 800), headStatus: 403 }
  } };
}
test('ücretsiz HDHub zinciri kanonik film kimliği ve gerçek konteyner ile doğrulanır', async () => {
  const { fixture, file } = hdFixture(), calls = [];
  const http = createHttp({ fetchImpl: fixtureFetch(fixture, calls) });
  try {
    const candidates = await scanHdHub(http, target, { allowExtensionless: true });
    assert.equal(candidates.length, 1); assert.equal(candidates[0].url, file);
    const alias = 'https://bridge.test/files/' + 'b'.repeat(64) + '.mkv';
    const video = await probe(http, { ...candidates[0], downloadAlias: alias });
    assert.deepEqual(video.dimensions, { width: 1920, height: 800 });
    assert.equal(video.size, mkv(1920, 800).length); assert.equal(video.url, alias); assert.equal(video.downloadable, true);
    assert.equal(calls.filter(c => c.url === file && c.method === 'HEAD').length, 0);
    assert.ok(calls.some(c => c.url === file && c.headers.Range));
  } finally { http.close(); }
});
test('HDHub hızlı release, diğer release beklerken doğrulama kuyruğuna verilir',{timeout:2000},async()=>{
 const {fixture,page}=hdFixture();
 fixture[HDHUB_ORIGIN+'/matrix-movie-1/'].body=page+'<div class="download-item"><div class="file-title">The.Matrix.1999.720p.WEB-DL.SLOW.mkv</div><span>3.0 GB</span><a href="https://greenmotors.club/slow">Download HubCloud</a></div>';
 let release;const gate=new Promise(resolve=>release=resolve);const fetcher=fixtureFetch(fixture);let fed=0,scanDone=false;
 const http=createHttp({fetchImpl:async(url,options)=>{if(url.endsWith('/slow'))await gate;return fetcher(url,options);}});
 let gotCandidate;const first=new Promise(resolve=>gotCandidate=resolve);
 const scan=scanHdHub(http,target,{allowExtensionless:true,onCandidates:async candidates=>{fed+=candidates.length;gotCandidate();}}).then(r=>{scanDone=true;return r;});
 try{await first;assert.equal(fed,1);assert.equal(scanDone,false);}finally{release();await scan;http.close();}
});

test('çok sayıda erken ayna daha sonraki büyük dosya sürümünün taranmasını durdurmaz', async () => {
  const { fixture, page } = hdFixture();
  fixture[HDHUB_ORIGIN + '/matrix-movie-1/'].body = page.split('<div class="download-item">')[0] + Array.from({ length: 6 }, (_, i) =>
    `<div class="download-item"><div class="file-title">The.Matrix.1999.${i === 5 ? '2160p.LARGE' : '1080p.RELEASE' + i}.mkv</div><span>${i + 1}.0 GB</span><a href="https://greenmotors.club/release${i}">Download HubCloud</a></div>`).join('');
  for (let i = 0; i < 6; i++) {
    fixture['https://greenmotors.club/release' + i] = { body: shortPage('https://hubcloud.example/release' + i) };
    fixture['https://hubcloud.example/release' + i] = { body: `<script>var url = 'https://gamerxyt.com/hubcloud.php?token=release${i}'</script>` };
    fixture['https://gamerxyt.com/hubcloud.php?token=release' + i] = { body: Array.from({ length: 3 }, (_, mirror) =>
      `<a href="https://mirror${mirror}.workers.dev/The.Matrix.1999.${i}.mkv">FSL Server</a>`).join('') };
  }
  const http = createHttp({ fetchImpl: fixtureFetch(fixture) }), accepted = [];
  try {
    await scanHdHub(http, target, { onCandidates: async found => { accepted.push(...found); }, verifiedCount: () => 99 });
    assert.equal(accepted.length, 18);
    assert.ok(accepted.some(c => c.filename.includes('2160p.LARGE')));
  } finally { http.close(); }
});

test('HDHub uzantısız gösterim adı atlanmaz; HubCloud adı yalnız uzantı ipucudur',async()=>{
 const{fixture,page}=hdFixture();
 fixture[HDHUB_ORIGIN+'/matrix-movie-1/'].body=page.replace('The.Matrix.1999.1080p.WEB-DL.GROUP.mkv','The.Matrix.1999.1080p.WEB-DL.GROUP');
 fixture['https://hubcloud.example/file'].body='<title>The.Matrix.1999.1080p.WEB-DL.GROUP.mkv</title>'+fixture['https://hubcloud.example/file'].body;
 const http=createHttp({fetchImpl:fixtureFetch(fixture)});
 try{const candidates=await scanHdHub(http,target,{allowExtensionless:true});assert.equal(candidates.length,1);assert.ok(candidates[0].filename.endsWith('.mkv'));}finally{http.close();}
});

test('HDHub yalnız bilinen koleksiyon etiketi ve kanıtlı gösterim yılına izin verir; kimlik/yıl çelişkisi kalır',()=>{
 const{page}=hdFixture();
 assert.equal(pageMatches(page.replace('"name":"The Matrix"','"name":"The Matrix Marvel Phase 4"'),target),true);
 assert.equal(pageMatches(page.replace('"name":"The Matrix"','"name":"The Matrix Reloaded"'),target),false);
 assert.equal(pageMatches(page.replace('1999-03-31','1998-03-31'),target),false);
 assert.equal(pageMatches(page.replace('1999-03-31','1998-03-31'),{...target,releaseYears:[1998,1999]}),true);
 assert.equal(pageMatches(page.replace('1999-03-31','1998-03-31'),{...target,tmdbId:999,releaseYears:[1998,1999]}),false);
});

test('yanlış TMDB/yıl, bozuk kısa bağlantı ve keyfi hedef reddedilir', () => {
  const { page } = hdFixture();
  assert.equal(pageMatches(page, target), true);
  assert.equal(pageMatches(page, { ...target, tmdbId: 604 }), false);
  assert.equal(pageMatches(page, { ...target, year: 2003 }), false);
  assert.equal(shortlinkTarget(shortPage('https://private.test/secret')), null);
  assert.equal(shortlinkTarget("s('o','broken')"), null);
  assert.equal(releaseEntries(page.replace('The.Matrix.1999.', 'The.Matrix.2003.'), target).length, 0);
});
test('uzantısız dosyalar köprü olmadan, bozuk zincirler ve diziler atlanır', async () => {
  const { fixture } = hdFixture();
  const http = createHttp({ fetchImpl: fixtureFetch(fixture) });
  try {
    assert.deepEqual(await scanHdHub(http, target), []);
    assert.deepEqual(await scanHdHub(http, { ...target, type: 'tv', season: 1, episode: 1 }, { allowExtensionless: true }), []);
    fixture['https://hubcloud.example/file'].body = '<html>Link unavailable</html>';
    assert.deepEqual(await scanHdHub(http, target, { allowExtensionless: true }), []);
  } finally { http.close(); }
});

test('public dosya terminalindeki boşluklu MKV yolu ve GET-only sunucu desteklenir',async()=>{
 const {fixture}=hdFixture();const url='https://download.example.workers.dev/The Matrix 1999.mkv';
 fixture['https://gamerxyt.com/hubcloud.php?token=example']={body:`<a href="${url}">Download File [1.5 GB]</a>`};
 fixture[url.replaceAll(' ','%20')]={body:mkv(),headStatus:403};
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture,calls)});
 try{const candidates=await scanHdHub(http,target);assert.equal(candidates.length,1);assert.equal(candidates[0].getOnly,true);
  const video=await probe(http,candidates[0]);assert.equal(video.container,'mkv');assert.equal(video.downloadable,true);
  assert.equal(calls.filter(c=>c.url.includes('.workers.dev')&&c.method==='HEAD').length,0);
 }finally{http.close();}
});
test('köprü doğrulanan dosyaya MKV adı sağlar; HEAD dosyaya yeniden istek atmaz', async () => {
  const { createService } = await import('../hosting/worker.mjs');
  const { fixture, file } = hdFixture(), calls = [], memory = new Map();
  const cache = { match: async key => memory.get(key)?.clone(), put: async (key, response) => { memory.set(key, response.clone()); } };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, ...options });
    const response = responseFor(fixture, url, options);
    return new Response(options.method === 'HEAD' ? null : Uint8Array.from(response.body), { status: response.status, headers: response.headers });
  };
  const service = createService({ fetchImpl, cache });
  const response = await service.fetch(new Request('https://bridge.test/api/discover', { method: 'POST', body: JSON.stringify({ target }) }));
  const result = await response.json(); assert.equal(result.pairs.length, 1);
  const pair = result.pairs[0]; assert.match(pair.video.url, /^https:\/\/bridge.test\/files\/[a-f0-9]{64}\.mkv\?source=/);
  const before = calls.length;
  const head = await service.fetch(new Request(pair.video.url, { method: 'HEAD' }));
  assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), String(mkv(1920, 800).length));
  assert.equal(head.headers.get('content-type'), 'video/x-matroska');
  const get = await service.fetch(new Request(pair.video.url, { headers: { Range: 'bytes=0-100' } }));
  assert.equal(get.status, 307); assert.equal(get.headers.get('location'), file); assert.equal(calls.length, before);
  const anotherIsolate = createService({ fetchImpl, cache });
  assert.equal((await anotherIsolate.fetch(new Request(pair.video.url))).status, 307);
  const coldIsolate = createService({ fetchImpl });
  assert.equal((await coldIsolate.fetch(new Request(pair.video.url))).status, 307);
  assert.equal((await coldIsolate.fetch(new Request(pair.video.url.split('?')[0]))).status, 307);
  assert.equal((await createService({fetchImpl}).fetch(new Request(pair.video.url.split('?')[0]))).status, 410);
  assert.equal((await service.fetch(new Request(pair.video.url.replace('.mkv', '.mp4')))).status, 410);
  assert.equal((await service.fetch(new Request('https://bridge.test/files/' + '0'.repeat(64) + '.mkv'))).status, 410);
});

test('telefonun çözdüğü public imzalı dosya köprüde kaydedilir; keyfi/yanlış adlı adres kabul edilmez', async () => {
  const { createService } = await import('../hosting/worker.mjs');
  const { registerDownloads, SERVICE_ORIGIN } = require('../src/hosted.cjs');
  const { fixture, file } = hdFixture();
  const service = createService({ fetchImpl: async (url, options = {}) => {
    const r = responseFor(fixture, url, options);
    return new Response(options.method === 'HEAD' ? null : Uint8Array.from(r.body), { status: r.status, headers: r.headers });
  } });
  const http = createHttp({ fetchImpl: async (url, options = {}) => {
    const r = await service.fetch(new Request(url, options));
    return { ok: r.ok, status: r.status, url, headers: r.headers, text: () => r.text(), arrayBuffer: () => r.arrayBuffer() };
  } });
  try {
    const candidate = { url: file, filename: 'The.Matrix.1999.WEB-DL.mkv', headers: {} };
    const list = await registerDownloads(http, [candidate], target);
    assert.equal(list.length, 1); assert.equal(new URL(list[0].downloadAlias).origin, SERVICE_ORIGIN);
    assert.equal((await service.fetch(new Request(list[0].downloadAlias))).status, 307);
    assert.deepEqual(await registerDownloads(http, [{ ...candidate, url: 'https://private.test/object' }], target), []);
    assert.deepEqual(await registerDownloads(http, [{ ...candidate, filename: 'Wrong.Movie.1999.mkv' }], target), []);
  } finally { http.close(); }
});
