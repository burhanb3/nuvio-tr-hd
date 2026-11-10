'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const manifest=require('../manifest.json');

test('desktop platformunda dört sağlayıcı görünür; mobil destek korunur',()=>{
  assert.equal(manifest.scrapers.length,4);
  for(const scraper of manifest.scrapers){
    for(const platform of ['desktop','android','ios']) assert.ok(scraper.supportedPlatforms.includes(platform),`${scraper.id}: ${platform}`);
    assert.equal(scraper.enabled,true);
    assert.ok(!scraper.disabledPlatforms?.includes('desktop'));
  }
});
