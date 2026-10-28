'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),{scanMoviesDrive,seriesTitleMatches,fileMatches,searchPages,releaseEntries,episodeHub}=require('../src/providers/moviesdrive.cjs');
const{fixtureFetch,ebml}=require('./helpers.cjs'),{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const target={tmdbId:123456,type:'tv',originalTitle:'Example Series',year:2020,imdbId:'tt1234567',season:1,episode:2,runtimeMinutes:30},origin='https://new4.moviesdrive.beer',archive='https://mdrive.lol/archive/123/',hub='https://hubcloud.ist/drive/Example2',terminal='https://gamerxyt.com/hubcloud.php?id=example',file='https://pixeldrain.dev/api/file/Example2',name='Example.Series.S01E02.1080p.mkv';
function fixture(){const duration=Buffer.alloc(8);duration.writeDoubleBE(1800000);const body=Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([ebml('1549a966',ebml('4489',duration)),ebml('1654ae6b',Buffer.concat([ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',[7,128]),ebml('ba',[4,56])]))])),ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from('eng'))]))]))])),Buffer.alloc(1000000)]);
return{[origin+'/search.php?q=Example%20Series&page=1']:{json:{hits:[{document:{post_title:'Example Series (Season 1) 2020 Dual Audio',imdb_id:target.imdbId,permalink:'/example-series/'}}]}},
 [origin+'/example-series/']:{body:'<article class="post-content"><h1>Example Series (Season 1) 2020</h1><a href="https://www.imdb.com/title/tt1234567/">IMDb</a><h5>Example Series (Season 1) 1080p [500MB/E]</h5><h5><a href="'+archive+'">1080p Single Episode</a></h5><h5><a href="https://mdrive.lol/archive/456/">Zip</a></h5></article>'},
 [archive]:{body:'<title>Example Series (Season 1) 1080p</title><h5>Ep01&ndash;1080p [500MB]</h5><h5><a href="https://hubcloud.ist/drive/WrongEp1">HubCloud</a></h5><h5>Ep02&ndash;1080p [500MB]</h5><h5><a href="'+hub+'">HubCloud</a></h5><h5>Ep03&ndash;1080p [500MB]</h5>'},
 [hub]:{body:'<title>'+name+'</title><script>var url="'+terminal+'";</script>'},[terminal]:{body:'<script>var pxl="https://pixeldrain.dev/u/Example2";</script>'},
 [file+'/info']:{json:{success:true,id:'Example2',name,size:body.length,mime_type:'video/matroska',can_download:true}},[file]:{body,mime:'video/matroska'}};
}
test('MoviesDrive TV: aynı IMDb/ad/ilk yıl ve tek bölüm bağlantısı gerçek indirilebilir dosyaya ulaşır',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{const emitted=[],rows=await scanMoviesDrive(http,target,{onCandidates:async r=>emitted.push(...r)});assert.equal(rows.length,1);assert.equal(emitted.length,1);const v=await probe(http,rows[0]);assert.equal(v.downloadable,true);assert.equal(v.duration,1800);assert.deepEqual(v.audioLanguages,['eng']);assert.ok(!calls.some(c=>/WrongEp1|archive\/456/.test(c.url)));}finally{http.close();}
});
test('MoviesDrive TV: yanlış seri, IMDb, sezon yılı veya istenmeyen bölüm dosyası kabul edilmez',()=>{
 assert.equal(seriesTitleMatches('Example Series (Season 1) 2020',target),true);assert.equal(seriesTitleMatches('Example Series (Season 1) 2021',target),false);assert.equal(seriesTitleMatches('Example Series Two (Season 1) 2020',target),false);assert.equal(seriesTitleMatches('Example Series (Season 2) 2020',target),false);
 assert.equal(fileMatches(name,target),true);for(const f of[name.replace('E02','E03'),name.replace('S01','S02'),name.replace('Series','Series.Two'),name.replace('.1080p','.2021.1080p'),name.replace('E02','E02-E03')])assert.equal(fileMatches(f,target),false,f);
 const data=fixture(),page=data[origin+'/example-series/'].body;assert.deepEqual(releaseEntries(page.replace('tt1234567','tt9999999'),target),[]);assert.deepEqual(releaseEntries(page.replace(/<a href="https:\/\/www.imdb.com[\s\S]*?<\/a>/,''),target),[]);
 assert.deepEqual(searchPages({hits:[{document:{post_title:'Example Series (Season 1) 2020',permalink:'/example/',imdb_id:'tt9999999'}}]},target),[]);
});
test('MoviesDrive TV: eksik/çoklu bölüm başlığı, farklı arşiv veya dosya bilgisi güvenli boş sonuç verir',async()=>{
 const f=fixture();assert.equal(episodeHub(f[archive].body.replace('Ep02&ndash;','Ep02-Ep03&ndash;'),target),null);
 for(const change of['wrongFile','wrongArchive','restricted']){const data=fixture();if(change==='wrongFile')data[hub].body=data[hub].body.replace('E02','E03');if(change==='wrongArchive')data[archive].body=data[archive].body.replace('Season 1','Season 2');if(change==='restricted')data[file+'/info'].json.can_download=false;
 const http=createHttp({fetchImpl:fixtureFetch(data)});try{assert.deepEqual(await scanMoviesDrive(http,target),[],change);}finally{http.close();}}
});
function laterFixture(){
 const data=fixture();for(const value of Object.values(data))if(typeof value.body==='string')value.body=value.body.replaceAll('Season 1','Season 3').replaceAll('S01E02','S03E02');
 data[origin+'/search.php?q=Example%20Series&page=1'].json.hits[0].document.post_title='Example Series (Season 3) Dual Audio';
 data[origin+'/example-series/'].body=data[origin+'/example-series/'].body.replace('Season 3) 2020','Season 3)').replace('</article>','<strong>Released Year:</strong> 2024<br></article>');
 data[file+'/info'].json.name=name.replace('S01','S03');const bytes=data[file].body,p=bytes.indexOf(Buffer.from('4489','hex'));bytes.writeDoubleBE(4320000,p+3);return data;
}
test('MoviesDrive TV: sonraki sezonun yılı ve kendi süresi kullanılır; seri ilk yılı değişmez',async()=>{
 const f=laterFixture(),later={...target,season:3},http=createHttp({fetchImpl:fixtureFetch(f)});let loads=0;
 try{const rows=await scanMoviesDrive(http,later,{loadSeason:async()=>{loads++;return{seasonReleaseYear:2024,runtimeMinutes:72};}});assert.equal(loads,1);assert.equal(rows.length,1);assert.equal(rows[0].identity.year,2020);assert.equal(rows[0].identity.runtimeMinutes,72);assert.equal(later.runtimeMinutes,30);assert.equal((await probe(http,rows[0])).duration,4320);}finally{http.close();}
});
test('MoviesDrive TV: kanonik sezon verisi veya kaynak sezon yılı uyuşmazsa sonuca zorlanmaz',async()=>{
 for(const change of['missing','year','absentYear','wrongEpisode']){const f=laterFixture();if(change==='year')f[origin+'/example-series/'].body=f[origin+'/example-series/'].body.replace('2024','2025');if(change==='absentYear')f[origin+'/example-series/'].body=f[origin+'/example-series/'].body.replace('Released Year:','Upload Year:');if(change==='wrongEpisode')f[hub].body=f[hub].body.replace('E02','E03');
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});try{assert.deepEqual(await scanMoviesDrive(http,{...target,season:3},{loadSeason:async()=>change==='missing'?null:{seasonReleaseYear:2024,runtimeMinutes:72}}),[],change);if(change==='missing')assert.equal(calls.length,0);}finally{http.close();}}
});
test('MoviesDrive TV: kısıtlı ilk4K yanında ayrı yayımlanan ikinci4K da aynı dört route sınırında aranır',async()=>{
 const f=fixture(),highA='https://mdrive.lol/archive/401/',highB='https://mdrive.lol/archive/402/';
 f[origin+'/example-series/'].body=f[origin+'/example-series/'].body.replace('</article>',[highA,highB].map(u=>'<h5>Example Series (Season 1) 2160p [2GB/E]</h5><h5><a href="'+u+'">2160p Single Episode</a></h5>').join('')+'</article>');
 const highName=name.replace('1080p','2160p'),highBody=Buffer.from(f[file].body);const width=highBody.indexOf(Buffer.from('b0820780','hex')),height=highBody.indexOf(Buffer.from('ba820438','hex'));highBody.writeUInt16BE(3840,width+2);highBody.writeUInt16BE(2160,height+2);
 for(const[id,url]of[['High0001',highA],['High0002',highB]]){const h='https://hubcloud.ist/drive/'+id,t='https://gamerxyt.com/hubcloud.php?id='+id,p='https://pixeldrain.dev/api/file/'+id;
 f[url]={body:'<title>Example Series (Season 1) 2160p</title><h5>Ep02&ndash;2160p [2GB]</h5><h5><a href="'+h+'">HubCloud</a></h5>'};f[h]={body:'<title>'+highName+'</title><script>var url="'+t+'";</script>'};f[t]={body:'<script>var pxl="https://pixeldrain.dev/u/'+id+'";</script>'};f[p+'/info']={json:{success:true,id,name:highName,size:highBody.length,mime_type:'video/matroska',can_download:true,...(id==='High0001'?{availability:'file_rate_limited_captcha_required'}:{})}};f[p]={body:highBody,mime:'video/matroska'};}
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});try{const rows=await scanMoviesDrive(http,target);assert.equal(rows.length,2);const v=await probe(http,rows.find(r=>r.url.endsWith('High0002')));assert.deepEqual(v.dimensions,{width:3840,height:2160});assert.ok(!calls.some(c=>c.url==='https://pixeldrain.dev/api/file/High0001'));assert.ok(calls.filter(c=>c.url.includes('/archive/')).length<=4);}finally{http.close();}
});
