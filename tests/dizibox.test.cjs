'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const{scanDiziBox,slugs,episodeHeading,kingAddress,playerFile}=require('../src/providers/dizibox.cjs');
const{decryptCryptoJsAes,md5,base64Bytes}=require('../src/media/cryptojs.cjs');
const{normalizeTitle}=require('../src/util.cjs'),{sameName}=require('../src/providers/page-data.cjs');
const{createHttp}=require('../src/http.cjs'),{fixtureFetch}=require('./helpers.cjs');
const F=require('./dizibox-fixture.cjs');
const target={tmdbId:123456,type:'tv',originalTitle:'Example Series',searchTitles:['Example Series'],year:2020,firstAirDate:'2020-01-01',season:1,episode:2,originalLanguage:'en',isAnime:false};
async function run(fixture,t=target){const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture,calls)});try{return{rows:await scanDiziBox(http,t),calls};}finally{http.close();}}

test('CryptoJS zarfı node:crypto ile aynı açılır; yanlış parola, bozuk zarf ve sınır reddedilir',()=>{
  for(const n of [0,1,55,56,63,64,65,1000]){const b=crypto.randomBytes(n);assert.equal(Buffer.from(md5(b)).toString('hex'),crypto.createHash('md5').update(b).digest('hex'));}
  const b=crypto.randomBytes(100);assert.deepEqual(Buffer.from(base64Bytes(b.toString('base64'))),b);
  assert.equal(base64Bytes('abc'),null);assert.equal(base64Bytes('a$bc'),null);
  const text='şğüİ dizi '+crypto.randomBytes(3000).toString('base64');
  const env=F.envelope(text,'parola');
  assert.equal(decryptCryptoJsAes(env,'parola'),text);
  assert.notEqual(decryptCryptoJsAes(env,'parolax'),text);
  assert.equal(decryptCryptoJsAes(Buffer.from('NotSalt_12345678'+'x'.repeat(16)).toString('base64'),'parola'),null);
  assert.equal(decryptCryptoJsAes(env.slice(0,-8),'parola'),null);
  assert.equal(decryptCryptoJsAes(env,'parola',{maxBytes:64}),null);
  assert.equal(decryptCryptoJsAes(env,''),null);
});

test('başlık normalizasyonu tipografik kesme/tireyi ayırıcı sayar; Kiril, kana, CJK ve 々 korunur',()=>{
  assert.equal(normalizeTitle('Grey’s Anatomy'),normalizeTitle("Grey's Anatomy"));
  assert.equal(normalizeTitle('Mission: Impossible – Fallout'),normalizeTitle('Mission: Impossible - Fallout'));
  assert.equal(normalizeTitle('“Quoted” Title…'),'quoted title');
  assert.equal(normalizeTitle('Брат 2'),'брат 2');
  assert.equal(normalizeTitle('進撃の巨人'),'進撃の巨人');
  assert.equal(normalizeTitle('佐々木と宮野'),'佐々木と宮野');
  assert.ok(sameName('Grey’s Anatomy',{originalTitle:"Grey's Anatomy",searchTitles:[]}));
});

test('DiziBox: ad, sezon/bölüm ve dizi sayfası yılı birlikte doğrulanır; UA ve Referer akışa taşınır',async()=>{
  const{rows,calls}=await run(F.diziboxFixture());
  assert.equal(rows.length,1);const row=rows[0];
  assert.equal(row.url,F.PLAYER+'/embed/sheila/'+F.EMBED+'?format=.m3u8');
  assert.equal(row.headers.Referer,F.PLAYER+'/');assert.match(row.headers['User-Agent'],/Safari/);
  assert.equal(row.source,'DiziBox');assert.equal(row.filenameSynthetic,true);assert.match(row.filename,/\.S01E02\.m3u8$/);
  assert.equal(row.burnedSubtitleLanguage,'tr');assert.equal(row.burnedSubtitleBasis,'site-label');assert.deepEqual(row.claimedAudioLanguages,['en']);
  assert.deepEqual(row.subtitles,[]);
  assert.equal(calls.length,4);
  assert.ok(calls.every(c=>/Safari/.test(c.headers?.['User-Agent']||'')));
  assert.ok(calls.every(c=>['www.dizibox.live','dbx.molystream.org'].includes(new URL(c.url).hostname)));
  assert.ok(calls.every(c=>!Object.keys(c.headers||{}).some(k=>/authorization|cookie/i.test(k))));
  assert.ok(calls.filter(c=>/dizibox\.live\/(?:example|diziler)/.test(c.url)).every(c=>/^bytes=-\d+$/.test(c.headers.Range)));
});

test('DiziBox: "altyazi" etiketi yoksa Türkçe altyazı iddiası eklenmez',async()=>{
  const{rows}=await run(F.diziboxFixture({episode:{flag:'dublaj-yok'}}));
  assert.equal(rows.length,1);assert.equal(rows[0].burnedSubtitleLanguage,undefined);assert.equal(rows[0].claimedAudioLanguages,undefined);
});

test('DiziBox: yanlış yıl, ad veya bölüm; yabancı oynatıcı; uyuşmayan dosya boş döner',async()=>{
  // Remake with the same name: the series page year decides (Shameless 2004 vs 2011).
  assert.deepEqual((await run(F.diziboxFixture({series:{year:2004}}))).rows,[]);
  let r=await run(F.diziboxFixture({episode:{name:'Other Series'}}));
  assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,1);
  r=await run(F.diziboxFixture({episode:{episode:3}}));assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,1);
  r=await run(F.diziboxFixture({episode:{player:'https://evil.test/player/king/king.php?v='+F.KING}}));
  assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,1,'no King and no DBX Pro option: no series or player request');
  // Only a "Moly" alternative: nothing else is fetched.
  r=await run(F.diziboxFixture({episode:{player:F.ORIGIN+'/player/moly/moly.php?h='+'d'.repeat(64)}}));
  assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,1);
  assert.deepEqual((await run(F.diziboxFixture({embed:F.embedPage(F.playerPlain({file:F.PLAYER+'/embed/sheila/999-'+'e'.repeat(32)}))}))).rows,[]);
  assert.deepEqual((await run(F.diziboxFixture({embed:F.embedPage(F.playerPlain({type:'video/mp4'}))}))).rows,[]);
  assert.deepEqual((await run(F.diziboxFixture({embed:F.embedPage(F.playerPlain()).replace('"'+F.PASS+'"','"wrong-passphrase"')}))).rows,[]);
});

test('DiziBox: varsayılan oynatıcı King değilse DBX Pro seçeneği bir kez izlenir ve başlık yeniden doğrulanır',async()=>{
  const alt=F.ORIGIN+'/example-series-1-sezon-2-bolum-izle/2/';
  const f=F.diziboxFixture({episode:{player:F.ORIGIN+'/player/moly/moly.php?h='+'d'.repeat(64),options:'<option class=\'woca-current-page\' selected=\'selected\'>Moly</option><option value="'+alt+'">DBX Pro</option>'}});
  f[alt]={body:F.episodePage(),mime:'text/html'};
  let r=await run(f);assert.equal(r.rows.length,1);assert.ok(r.calls.some(c=>c.url===alt));
  f[alt]={body:F.episodePage({episode:5}),mime:'text/html'};
  r=await run(f);assert.deepEqual(r.rows,[]);
});

test('DiziBox: film, anime ve geçersiz bölüm hiç istek açmaz; slug kesme işaretini düşürür',async()=>{
  for(const t of [{...target,type:'movie'},{...target,isAnime:true},{...target,season:0},{...target,episode:1.5}]){
    const r=await run(F.diziboxFixture(),t);assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,0);
  }
  assert.deepEqual(slugs({originalTitle:"Grey's Anatomy",searchTitles:['Grey’s Anatomy']}),['greys-anatomy']);
  assert.deepEqual(slugs({originalTitle:'Брат',searchTitles:['Örnek Dizi']}),['ornek-dizi']);
  assert.equal(episodeHeading(F.episodePage({name:'Grey’s Anatomy'}),{...target,originalTitle:"Grey's Anatomy",searchTitles:[]})?.name,'Grey’s Anatomy');
  assert.equal(kingAddress('<div id="video-area"><iframe src="'+F.ORIGIN+'/player/king/king.php?v=xyz"></iframe></div>'),null);
  assert.equal(playerFile('<script>CryptoJS.AES.decrypt("abc","pass1234")</script>',{id:F.EMBED}),null);
});
