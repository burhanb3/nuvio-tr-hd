'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHttp } = require('../src/http.cjs');
const { inspectHls } = require('../src/media/hls.cjs');
const { target, fixtureFetch } = require('./helpers.cjs');

const film = { ...target, runtimeMinutes: 100 };
const media = (seconds, host = 'https://cdn.test') => {
  const lines = ['#EXTM3U', '#EXT-X-TARGETDURATION:10'];
  for (let t = 0; t < seconds; t += 10) lines.push('#EXTINF:10,', `${host}/seg${t}.html`);
  return lines.join('\n') + '\n#EXT-X-ENDLIST\n';
};

test('HLS: segment sunucusu ağda yoksa liste elenir; aynı ölü sunucu sonraki seçenekte istek atılmadan geçilir', async () => {
  const calls = [];
  const base = fixtureFetch({}, calls);
  const fetchImpl = async (url, options) => {
    if (new URL(url).hostname === 'gone.test') { calls.push({ url }); throw new TypeError('getaddrinfo ENOTFOUND gone.test'); }
    return base(url, options);
  };
  const http = createHttp({ fetchImpl });
  try {
    for (const n of [1, 2, 3]) {
      const url = `https://list.test/${n}.m3u8`;
      assert.equal(await inspectHls(http, media(6000, 'https://gone.test'), url, { url, headers: {}, identity: film }, { detailed: false }), null, String(n));
    }
    // Two transport failures prove the host is unreachable; the third list is decided without a request.
    assert.equal(calls.filter(c => c.url.includes('gone.test')).length, 2);
  } finally { http.close(); }
});

test('HLS: yavaş değil, yanıt veren segment sunucusu (404/HEAD yok) eski davranışla kabul edilir', async () => {
  const calls = [];
  const http = createHttp({ fetchImpl: fixtureFetch({}, calls) });
  try {
    const url = 'https://list.test/ok.m3u8';
    const video = await inspectHls(http, media(6000), url, { url, headers: {}, identity: film }, { detailed: false });
    assert.equal(video.container, 'hls');
    assert.equal(video.duration, 6000);
    // Exactly one HEAD of the first segment, no other segment traffic.
    assert.deepEqual(calls.map(c => [c.method, c.url]), [['HEAD', 'https://cdn.test/seg0.html']]);
  } finally { http.close(); }
});

test('HLS: bitmiş listenin süresi künye süresinin çok dışındaysa (çift kodlama) elenir', async () => {
  const http = createHttp({ fetchImpl: fixtureFetch({}) });
  try {
    const url = 'https://list.test/long.m3u8';
    for (const [seconds, ok] of [[6000, true], [7900, true], [12000, false], [3000, false]]) {
      const video = await inspectHls(http, media(seconds), url, { url, headers: {}, identity: film }, { detailed: false });
      assert.equal(!!video, ok, String(seconds));
    }
    // Without a runtime there is nothing to compare against.
    assert.ok(await inspectHls(http, media(12000), url, { url, headers: {}, identity: { ...target } }, { detailed: false }));
    // Detailed mode measures the child playlist and applies the same rule.
    const master = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720\nhttps://list.test/child.m3u8\n';
    const detailed = createHttp({ fetchImpl: fixtureFetch({ 'https://list.test/child.m3u8': { body: media(12000), mime: 'application/vnd.apple.mpegurl' } }) });
    try { assert.equal(await inspectHls(detailed, master, 'https://list.test/master.m3u8', { url: 'https://list.test/master.m3u8', headers: {}, identity: film }), null); }
    finally { detailed.close(); }
  } finally { http.close(); }
});
