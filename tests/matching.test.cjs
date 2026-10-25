const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchesIdentity, matchesAddonMeta, matchesStreamFilename, resolveIdentity } = require('../src/matching.cjs');
const { target, identity, makeFixture, fixtureFetch } = require('./helpers.cjs');
const { createHttp } = require('../src/http.cjs');

test('TMDB, orijinal başlık ve yıl birlikte eşleşir', () => {
  assert.equal(matchesIdentity(identity, target), true);
  for (const patch of [{ tmdbId: 604 }, { originalTitle: 'Matrix Reloaded' }, { year: 2003 }, { type: 'tv' }, { originalTitle: '' }]) {
    assert.equal(matchesIdentity({ ...identity, ...patch }, target), false);
  }
});
test('farklı dizi bölümleri karışmaz', () => {
  const tv = { ...target, type: 'tv', season: 1, episode: 2 };
  assert.equal(matchesIdentity({ ...tv, episode: 3 }, tv), false);
  assert.equal(matchesIdentity(tv, tv), true);
});
test('Stremio meta kimliği, orijinal başlık ve yıl kontrol edilir', () => {
  const meta = { id: 'tmdb:603', type: 'movie', name: 'The Matrix', releaseInfo: '1999' };
  assert.equal(matchesAddonMeta(meta, target, 'tmdb:603'), true);
  for (const patch of [{ id: 'tmdb:604' }, { name: 'Matrix' }, { releaseInfo: '2003' }, { tmdbId: 99 }]) {
    assert.equal(matchesAddonMeta({ ...meta, ...patch }, target, 'tmdb:603'), false);
  }
});
test('stream-only kaynakta açık dosya adı gerekir; gevşek başlık kabul edilmez', () => {
  assert.equal(matchesStreamFilename({ behaviorHints: { filename: 'The.Matrix.1999.2160p.mp4' } }, target), true);
  assert.equal(matchesStreamFilename({ title: 'The Matrix' }, target), false);
  assert.equal(matchesStreamFilename({ behaviorHints: { filename: 'The.Matrix.Reloaded.2003.mp4' } }, target), false);
});
test('bozuk TMDB yanıtı ve geçersiz parametreler güvenle elenir', async () => {
  const http = createHttp({ fetchImpl: fixtureFetch(makeFixture()) });
  assert.equal(await resolveIdentity(http, 'tt0133093', 'movie', null, null, 'test'), null);
  assert.equal(await resolveIdentity(http, '603', 'movie', null, null, ''), null);
  assert.equal(await resolveIdentity(http, '603', 'tv', 0, 2, 'test'), null);
  assert.equal((await resolveIdentity(http, '603', 'movie', null, null, 'test')).originalTitle, 'The Matrix');
});
