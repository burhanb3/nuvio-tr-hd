const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchesIdentity, matchesAddonMeta, matchesStreamFilename, resolveIdentity, resolveAlternativeTitles } = require('../src/matching.cjs');
const { target, identity, makeFixture, fixtureFetch } = require('./helpers.cjs');
const { createHttp } = require('../src/http.cjs');

test('alternatif başlıklar aynı TMDB kimliğinden alınır; bozuk/yanlış yanıt eşleşmeyi gevşetmez',async()=>{
 let data={id:603,titles:[{iso_3166_1:'US',title:'The Matrix Alias'},{iso_3166_1:'TR',title:'Matrix'},{iso_3166_1:'US',title:'The Matrix Alias'},{iso_3166_1:'XX',title:'Other'}]},url;
 const http={expired:()=>false,json:async u=>{url=u;return data;}};
 assert.deepEqual(await resolveAlternativeTitles(http,target,'fixture'),['The Matrix Alias','Matrix']);assert.match(url,/movie\/603\/alternative_titles/);
 data={...data,id:604};assert.deepEqual(await resolveAlternativeTitles(http,target,'fixture'),[]);
 data={id:603,results:[{iso_3166_1:'GB',title:'TV Alias'}]};assert.deepEqual(await resolveAlternativeTitles(http,{...target,type:'tv'},'fixture'),['TV Alias']);
 assert.deepEqual(await resolveAlternativeTitles(http,target,''),[]);
});

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
