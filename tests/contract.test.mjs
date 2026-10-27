import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createProvider } = require('../src/index.cjs');
const { makeFixture, fixtureFetch } = require('./helpers.cjs');

test('manifest KMP scrapers şeması, yayın yolu ve sürümleri tutarlı', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url)));
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  assert.equal(manifest.name, 'Nuvio TR HD');
  assert.equal(manifest.version, pkg.version);
  assert.ok(manifest.scrapers.length > 0);
  const main=manifest.scrapers.find(s=>s.id==='nuvio-tr-hd');
  assert.equal(main?.name,'Nuvio TR HD');
  assert.ok(main?.formats.includes('hls'));
  const extra=manifest.scrapers.find(s=>s.id==='nuvio-tr-hd-extra-anime');
  assert.equal(extra?.enabled,true);assert.deepEqual(extra?.supportedTypes,['tv']);
  const fast=manifest.scrapers.find(s=>s.id==='nuvio-tr-hd-fast-online');
  assert.equal(fast?.enabled,true);assert.deepEqual(fast?.formats,['hls']);
  assert.equal(manifest.scrapers.length,4);
  assert.ok(!manifest.scrapers.some(s=>s.id==='nuvio-tr-hd-online'),'Film/dizi araması yeni online scraper kurulmasına bağımlı olmamalı');
  for (const scraper of manifest.scrapers) {
    for (const key of ['id', 'name', 'version', 'filename']) assert.equal(typeof scraper[key], 'string');
    assert.equal(scraper.version, manifest.version);
    assert.deepEqual(scraper.supportedTypes, scraper.id==='nuvio-tr-hd-extra-anime'?['tv']:['movie', 'tv']);
    assert.equal(scraper.hasSettings, true);
    await access(new URL('../' + scraper.filename, import.meta.url));
    const published = await readFile(new URL('../dist/' + scraper.filename, import.meta.url), 'utf8');
    assert.equal(published, await readFile(new URL('../' + scraper.filename, import.meta.url), 'utf8'));
  }
});
test('sonuç alanları KMP PluginRuntime parserına uyar; uydurma download alanı yoktur', async () => {
  const streams = await createProvider({ settings: { catalogUrls: 'https://library.test/catalog.json', autoDiscover: false, autoSubtitles: false, requireTurkishSubtitles: false }, tmdbKey: 'test', fetchImpl: fixtureFetch(makeFixture()) }).getStreams(603, 'movie');
  const fields = new Set(['title', 'name', 'url', 'quality', 'size', 'language', 'provider', 'type', 'headers', 'subtitles']);
  assert.equal(streams.length, 1);
  for (const stream of streams) {
    assert.ok(Object.keys(stream).every(key => fields.has(key)));
    for (const [key, value] of Object.entries(stream)) if (!['headers', 'subtitles'].includes(key)) assert.equal(typeof value, 'string');
  }
});
