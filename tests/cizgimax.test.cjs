'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanCizgiMax,searchResults,seasonEpisodes,driveFile}=require('../src/providers/cizgimax.cjs');
const{resolveSeasonEpisodes}=require('../src/matching.cjs');
const{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const{createProvider}=require('../src/index.cjs');
const{fixtureFetch}=require('./helpers.cjs');
const F=require('./cizgimax-fixture.cjs');
const target={tmdbId:123456,type:'tv',originalTitle:'Example Toon',searchTitles:['Example Toon'],year:2010,season:1,episode:2,isAnimation:true,isAnime:false,runtimeMinutes:null};
const season=async()=>({airedEpisodes:3,runtimeMinutes:22});
async function run(fixture,{t=target,loadSeason=season}={}){
  const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture,calls)});
  try{const rows=await scanCizgiMax(http,t,{loadSeason});return{rows,calls,checked:rows[0]?await probe(http,rows[0]):null};}finally{http.close();}
}

test('CizgiMax: ad, yıl, bölüm sayısı ve Drive başlığı tutunca Türkçe dublaj MP4 indirilebilir satır olur',async()=>{
  let loads=0;
  const{rows,calls,checked}=await run(F.cizgimaxFixture(),{loadSeason:async()=>{loads++;return season();}});
  assert.equal(loads,1);assert.equal(rows.length,1);const row=rows[0];
  assert.equal(row.url,F.DOWNLOAD);assert.deepEqual(row.headers,{});assert.equal(row.source,'CizgiMax');
  assert.match(row.filename,/\.S01E02\.mp4$/);assert.equal(row.filenameSynthetic,true);
  assert.deepEqual(row.claimedAudioLanguages,['tr']);assert.equal(row.identity.runtimeMinutes,22);assert.equal(target.runtimeMinutes,null);
  assert.equal(checked.downloadable,true);assert.deepEqual(checked.dimensions,{width:1920,height:1080});assert.equal(checked.duration,1320);
  // Only the dub "Drive" server is opened, with the episode page as Referer.
  const player=calls.filter(c=>c.url.includes('/oynat/'));
  assert.equal(player.length,1);assert.ok(player[0].url.endsWith(F.TOKEN));assert.equal(player[0].headers.Referer,F.ORIGIN+'/example-toon-1-sezon-2-bolum-izle/');
  assert.ok(calls.every(c=>['cizgimax.online','drive.google.com','drive.usercontent.google.com'].includes(new URL(c.url).hostname)));
  assert.ok(calls.every(c=>!Object.keys(c.headers||{}).some(k=>/authorization|cookie/i.test(k))));
});

test('CizgiMax: sezon bölüm sayısı TMDB ile aynı değilse veya TMDB okunamazsa satır yok',async()=>{
  for(const loadSeason of [async()=>({airedEpisodes:4,runtimeMinutes:22}),async()=>({airedEpisodes:2,runtimeMinutes:22}),async()=>null,async()=>{throw new Error('tmdb');}]){
    // The large episode page is not read when the count already disagrees.
    const r=await run(F.cizgimaxFixture(),{loadSeason});assert.deepEqual(r.rows,[]);assert.ok(!r.calls.some(c=>/bolum-izle|\/oynat\//.test(c.url)));
  }
  // Duration is checked against TMDB's own episode runtime.
  const r=await run(F.cizgimaxFixture(),{loadSeason:async()=>({airedEpisodes:3,runtimeMinutes:44})});
  assert.equal(r.rows.length,1);assert.equal(r.checked,null);
});

test('CizgiMax: yanlış yıl, ad, dizi adresi veya bölüm kaydı reddedilir',async()=>{
  for(const series of [F.seriesPage({year:'2011'}),F.seriesPage({name:'Other Toon',alt:'Other Toon'}),F.seriesPage({url:F.ORIGIN+'/diziler/other-toon-izle/'})]){
    const r=await run(F.cizgimaxFixture({series}));assert.deepEqual(r.rows,[]);assert.ok(!r.calls.some(c=>/bolum-izle/.test(c.url)));
  }
  for(const episode of [F.episodePage({episode:3}),F.episodePage({season:2}),F.episodePage({series:F.ORIGIN+'/diziler/other-toon-izle/'})]){
    const r=await run(F.cizgimaxFixture({episode}));assert.deepEqual(r.rows,[]);assert.ok(!r.calls.some(c=>c.url.includes('/oynat/')));
  }
});

test('CizgiMax: bölüm listesi 1..n değilse, çelişirse veya etiket uyuşmazsa sayılmaz',()=>{
  const page=buttons=>F.seriesPage({buttons:buttons.join('\n')});
  assert.equal(seasonEpisodes(F.seriesPage(),1).size,3);
  assert.equal(seasonEpisodes(F.seriesPage(),2),null);
  assert.equal(seasonEpisodes(page([F.button(1,1),F.button(1,2),F.button(1,4)]),1),null);
  assert.equal(seasonEpisodes(page([F.button(1,1),F.button(1,1,{slug:'other-toon'})]),1),null);
  // A label or "S.Sezon E.Bölüm" title that disagrees with the address is skipped.
  assert.equal(seasonEpisodes(page([F.button(1,1),F.button(1,2,{label:5})]),1).size,1);
  assert.equal(seasonEpisodes(page([F.button(1,1),F.button(1,2).replace('1.Sezon 2.Bölüm','1.Sezon 3.Bölüm')]),1).size,1);
  assert.deepEqual(searchResults(F.searchPage(),target),[F.SERIES]);
  assert.deepEqual(searchResults(F.searchPage().replace('/diziler/example-toon-izle/','/filmler/example-toon/'),target),[]);
});

test('CizgiMax: Drive dışı, dublaj dışı veya bozuk sunucu listesi açılmaz',async()=>{
  const lists=[{dub:[F.DUB[1]],sub:[]},{dub:[],sub:[{...F.DUB[0],lang:'sub'}]},{dub:[{...F.DUB[0],lang:'sub'}]},{dub:[{...F.DUB[0],label:'Drive · 1.Part'}]},
    {dub:[{...F.DUB[0],type:'video'}]},{dub:[{...F.DUB[0],src:'https://evil.test/oynat/?t='+F.TOKEN}]}];
  for(const list of lists){const r=await run(F.cizgimaxFixture({episode:F.episodePage({list})}));assert.deepEqual(r.rows,[]);assert.ok(!r.calls.some(c=>c.url.includes('/oynat/')),JSON.stringify(list));}
  for(const raw of ['bm90IGpzb24=','%%%%']){const r=await run(F.cizgimaxFixture({episode:F.episodePage({raw})}));assert.deepEqual(r.rows,[]);}
});

test('CizgiMax: Drive başlığı parça, başka biçim veya başka bölümse ya da yönlendirme Drive değilse satır yok',async()=>{
  for(const title of ['S1 B2 Part 1.mp4','S1 B2 Part1.mp4','S1 B2 2Part.mp4','S1 B2 2.Parça.mp4','S1 B2.ts','S1 B2.mkv','S1 B3.mp4','S2 B2.mp4','S1 E3.mp4']){
    assert.deepEqual((await run(F.cizgimaxFixture({title}))).rows,[],title);
  }
  assert.equal((await run(F.cizgimaxFixture({title:'Örnek Çizgi 2.mp4'}))).rows.length,1);
  for(const preview of ['https://evil.test/file/d/'+F.ID+'/preview','https://drive.google.com/file/d/'+F.ID+'/view','https://drive.google.com/file/d/short/preview']){
    assert.deepEqual((await run(F.cizgimaxFixture({preview}))).rows,[],preview);
  }
  const url='https://drive.google.com/file/d/'+F.ID+'/preview',other='OTHERplaceholderFILEid0002';
  assert.equal(driveFile({url,text:F.drivePage('S01E02.mp4')},target,'x'),F.ID);
  // og:url must name the same file; a second file on the page or no og:url is refused.
  assert.equal(driveFile({url,text:F.drivePage('S1 B2.mp4',{id:other})},target,'x'),null);
  assert.equal(driveFile({url,text:F.drivePage('S1 B2.mp4',{extra:'<a href="https://drive.google.com/file/d/'+other+'/view">x</a>'})},target,'x'),null);
  assert.equal(driveFile({url,text:F.drivePage().replace(/<meta property="og:url"[^>]*>/,'')},target,'x'),null);
});

test('CizgiMax: taşıyıcı yönlendirme sonrası adresi bildirmezse Drive kimliği sayfanın kendi og:url kaydından alınır',async()=>{
  const r=await run(F.cizgimaxFixture({direct:true}));
  assert.equal(r.rows.length,1);assert.equal(r.rows[0].url,F.DOWNLOAD);assert.equal(r.checked.downloadable,true);
  assert.deepEqual((await run(F.cizgimaxFixture({direct:true,drive:'<html><head><title>S1 B2.mp4 - Google Drive</title></head></html>'}))).rows,[]);
});

test('CizgiMax: düşük çözünürlük gösterilir, video izi veya süresi olmayan dosya reddedilir',async()=>{
  const low=await run(F.cizgimaxFixture({media:F.media(1320,640,360)}));assert.deepEqual(low.checked.dimensions,{width:640,height:360});
  const html=await run(F.cizgimaxFixture({media:Buffer.from('<html>not a video</html>')}));assert.equal(html.checked,null);
});

test('CizgiMax: metin sınırını aşan sayfa boş döner; film, geçersiz bölüm ve sezon verisi yoksa istek yok',async()=>{
  const big=F.seriesPage().replace('</body>','<!--'+'x'.repeat(1000001)+'--></body>');
  assert.deepEqual((await run(F.cizgimaxFixture({series:big}))).rows,[]);
  for(const t of [{...target,type:'movie'},{...target,season:0},{...target,episode:1.5}]){
    const r=await run(F.cizgimaxFixture(),{t});assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,0);
  }
  const r=await run(F.cizgimaxFixture(),{loadSeason:null});assert.deepEqual(r.rows,[]);assert.equal(r.calls.length,0);
});

const seasonUrl='https://api.themoviedb.org/3/tv/123456/season/1?api_key=test';
function seasonData(dates,{showId=123456}={}){return{season_number:1,episodes:dates.map((air_date,i)=>({episode_number:i+1,season_number:1,show_id:showId,air_date,runtime:22}))};}
test('TMDB sezon bölüm sayısı yalnız yayınlanmış bölümleri sayar; eksik numara veya başka dizi reddedilir',async()=>{
  const check=async(data,t=target)=>{const http=createHttp({fetchImpl:fixtureFetch({[seasonUrl]:{json:data}})});try{return await resolveSeasonEpisodes(http,t,'test','2026-01-10');}finally{http.close();}};
  assert.deepEqual(await check(seasonData(['2026-01-01','2026-01-08','2026-01-15',null])),{airedEpisodes:2,runtimeMinutes:22});
  assert.equal(await check(seasonData(['2026-01-01','2026-01-15'])),null,'target episode not aired');
  assert.equal(await check(seasonData(['2026-01-01','2026-01-08'],{showId:999})),null);
  const gap=seasonData(['2026-01-01','2026-01-08','2026-01-08']);gap.episodes[1].episode_number=3;
  assert.equal(await check(gap),null);
  assert.equal(await check({...seasonData(['2026-01-01','2026-01-08']),season_number:2}),null);
  const calls=[],http=createHttp({fetchImpl:fixtureFetch({},calls)});
  try{assert.equal(await resolveSeasonEpisodes(http,{...target,type:'movie'},'test'),null);assert.equal(await resolveSeasonEpisodes(http,target,''),null);assert.equal(calls.length,0);}finally{http.close();}
});

test('CizgiMax yalnız anime olmayan animasyon dizilerde çalışır ve sezon sayısını TMDB’den alır',async()=>{
  const reference=(genres,language='en')=>({id:123456,name:'Example Toon',original_name:'Example Toon',first_air_date:'2010-04-05',original_language:language,genres,external_ids:{}});
  for(const[genres,language,expected]of[[[{id:16}],'en',1],[[{id:35}],'en',0],[[{id:16}],'ja',0],[[],'en',0]]){
    const seen=[],f={'https://api.themoviedb.org/3/tv/123456?api_key=test&append_to_response=external_ids':{json:reference(genres,language)},[seasonUrl]:{json:seasonData(['2010-04-05','2010-04-12','2010-04-19'])}};
    const provider=createProvider({lane:'main',tmdbKey:'test',settings:{autoSubtitles:false},fetchImpl:fixtureFetch(f),
      adapters:{scanCizgiMax:async(http,t,{loadSeason})=>{seen.push({t,season:await loadSeason()});return[];}}});
    await provider.getStreams(123456,'tv',1,2);
    assert.equal(seen.length,expected,JSON.stringify(genres)+language);
    if(expected){assert.equal(seen[0].t.isAnimation,true);assert.deepEqual(seen[0].season,{airedEpisodes:3,runtimeMinutes:22});}
  }
  const off=[],provider=createProvider({lane:'main',tmdbKey:'test',settings:{autoSubtitles:false,cizgimaxEnabled:false},
    fetchImpl:fixtureFetch({'https://api.themoviedb.org/3/tv/123456?api_key=test&append_to_response=external_ids':{json:reference([{id:16}])}}),adapters:{scanCizgiMax:async()=>{off.push(1);return[];}}});
  await provider.getStreams(123456,'tv',1,2);assert.equal(off.length,0);
});
