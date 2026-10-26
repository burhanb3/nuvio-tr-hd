'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const {scanAniMom,searchRows,episodeAddress,uploadVideo}=require('../src/providers/animom.cjs');
const {mp4MetadataOffset,mp4MetadataInfo}=require('../src/media/containers.cjs');
const {fixtureFetch,box,moov}=require('./helpers.cjs');
const target={tmdbId:123456,type:'tv',originalTitle:'例のアニメ',searchTitles:['Example Anime','例のアニメ'],year:2020,season:1,episode:2,isAnime:true};
const root='https://animom.org/anime/example-anime',embed='https://www.yourupload.com/embed/Example1',file='https://vidcache.net:8161/example/video.mp4';
const ld=d=>`<script type="application/ld+json">${JSON.stringify(d)}</script>`;
const theme=`<li><a href="${root}"><img alt="Example Anime"></a><p>2020 - 例のアニメ</p></li>`;
function fixture(){return{
 'https://animom.org/search':{body:JSON.stringify({success:true,theme}),mime:'text/html'},
 [root]:{body:`<h1><a href="${root}">Example Anime</a> (2020)</h1>`+ld({name:'Example Anime',datePublished:'2020-01-01'})+`<a href="${root}-1-bolum">1</a><a href="${root}-2-bolum">2</a><a href="${root}-extra-2-bolum">wrong</a>`},
 [root+'-2-bolum']:{body:`<h1><a href="${root}">Example Anime</a> 2. Bölüm</h1><iframe src="https://ad.test/ad.mp4"></iframe><button data-frame="${embed}">YourUpload</button>`},
 [embed]:{body:`<meta property="og:video" content="${file}"><script>var player={file:'${file}'};</script>`},
 [file]:{body:(()=>{const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(1390661,16);return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',box('mvhd',mvhd),moov(1280,720).subarray(8)),box('mdat',Buffer.alloc(32))]);})(),mime:'video/mp4'}
};}
test('AniMOM: HTML MIME ile gelen JSON, kanonik ad/yıl, açık bölüm ve gerçek MP4 birlikte doğrulanır',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});
 try{const rows=await scanAniMom(http,target);assert.equal(rows.length,1);assert.equal(rows[0].filenameSynthetic,true);assert.equal(rows[0].url,file);
 const video=await probe(http,rows[0]);assert.equal(video.downloadable,true);assert.deepEqual(video.dimensions,{width:1280,height:720});
 assert.ok(calls.some(c=>c.method==='POST'&&c.body==='query=Example%20Anime'));assert.ok(!calls.some(c=>c.url.includes('ad.test')));
 }finally{http.close();}
});
test('AniMOM: yanlış yıl/ad, başka bölüm ve başka seri gövdesi elenir; düz bölümden ikinci sezon tahmin edilmez',async()=>{
 assert.deepEqual(searchRows(theme,{...target,year:2021}),[]);
 assert.deepEqual(searchRows(theme,{...target,originalTitle:'Example',searchTitles:['Example']}),[]);
 assert.equal(episodeAddress(fixture()[root].body,root,{...target,season:2}),null);
 const f=fixture();f[root+'-2-bolum'].body=f[root+'-2-bolum'].body.replace('>Example Anime</a> 2.','>Other Anime</a> 2.');
 const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanAniMom(http,target),[]);}finally{http.close();}
});
test('AniMOM: açık sezon yolu korunur; reklam alanı, farklı medya hostu ve çelişen player URL kabul edilmez',()=>{
 assert.equal(episodeAddress(`<a href="${root}/sezon-2/bolum-2">2</a>`,root,{...target,season:2}),root+'/sezon-2/bolum-2');
 assert.equal(uploadVideo(`<meta property="og:video" content="https://ad.test/video.mp4"><script>file:'https://ad.test/video.mp4'</script>`),null);
 assert.equal(uploadVideo(`<meta property="og:video" content="${file}"><script>file:'https://vidcache.net:8161/other/video.mp4'</script>`),null);
 assert.equal(uploadVideo(`<meta property="og:video" content="${file.replace('https:','http:')}"><script>file:'${file.replace('https:','http:')}'</script>`),null);
});
test('AniMOM: bozuk arama/host gövdesi aramayı çökertmez; anime olmayan film/diziye iş açılmaz',async()=>{
 const f=fixture();f['https://animom.org/search'].body='<html>Unavailable</html>';
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});
 try{assert.deepEqual(await scanAniMom(http,{...target,isAnime:false}),[]);assert.deepEqual(await scanAniMom(http,{...target,type:'movie'}),[]);assert.equal(calls.length,0);assert.deepEqual(await scanAniMom(http,target),[]);}finally{http.close();}
});
function largeMoov(audio=false){const ftyp=box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),mdat=box('mdat',Buffer.alloc(180000));
 const movie=box('moov',moov(1280,720,audio).subarray(8),box('free',Buffer.alloc(300000)));return{body:Buffer.concat([ftyp,mdat,movie]),offset:ftyp.length+mdat.length};}
test('Büyük moov: mdat sınırına tek sınırlı atlama ile gerçek piksel okunur; dosyanın tamamı indirilmez',async()=>{
 const {body,offset}=largeMoov(),url='https://media.test/claimed-4k.mp4',calls=[],http=createHttp({fetchImpl:fixtureFetch({[url]:{body,mime:'video/mp4'}},calls)});
 try{const video=await probe(http,{url,headers:{}});assert.deepEqual(video.dimensions,{width:1280,height:720});assert.equal(video.size,body.length);
 assert.deepEqual(calls.map(c=>c.headers.Range),['bytes=0-131071',`bytes=${offset}-${offset+262143}`]);
 }finally{http.close();}
});
test('MP4 sınırı taşması, bilinmeyen kutu ve mdat içindeki sahte moov metadata adresi sayılmaz',()=>{
 const {body,offset}=largeMoov();assert.equal(mp4MetadataOffset(body.subarray(0,131072),body.length),offset);
 assert.equal(mp4MetadataOffset(body.subarray(0,131072),offset),null);
 const invalid=Buffer.from(body.subarray(0,131072));invalid.writeUInt32BE(0xffffffff,24);assert.equal(mp4MetadataOffset(invalid,body.length),null);
 invalid.writeUInt32BE(180008,24);invalid.write('evil',28);assert.equal(mp4MetadataOffset(invalid,body.length),null);
 const metadata=body.subarray(offset,offset+262144);assert.equal(mp4MetadataInfo(metadata,metadata.length),null);
 assert.equal(mp4MetadataInfo(moov(1280,720,true),1000)?.invalidVideo,true);
});
test('Metadata isteğinde dosya kimliği değişirse o piksel doğrulanmış sayılmaz',async()=>{
 const {body}=largeMoov(),url='https://media.test/file.mp4';let requests=0;
 const http=createHttp({fetchImpl:async(u,o)=>{requests++;const r=await fixtureFetch({[url]:{body,mime:'video/mp4'}})(u,o);return {...r,url:requests===1?url:'https://other.test/file.mp4'};}});
 try{const video=await probe(http,{url,headers:{}});assert.equal(video.dimensions,null);}finally{http.close();}
});
test('Dönen CDN: metadata ve hash ilk byte sunucusunda kalır; yönlendirme hizmeti her Range için yeniden seçilmez',async()=>{
 const {body}=largeMoov(),url='https://redirect.test/file.mp4',server='https://cdn.test/file.mp4',calls=[];
 const http=createHttp({fetchImpl:fixtureFetch({[url]:{status:302,headers:{location:server}},[server]:{body,mime:'video/mp4'}},calls)});
 try{const video=await probe(http,{url,headers:{}},false,true);assert.deepEqual(video.dimensions,{width:1280,height:720});assert.ok(video.videoHash);
 assert.equal(video.url,server);assert.equal(calls.filter(c=>c.url===url).length,1);assert.ok(calls.filter(c=>c.headers.Range&&c.url===server).length>=3);
 }finally{http.close();}
});
test('AniMOM: resmi yönlendirme yalnız ağ hatasında bir kez yenilenir; HTML veya 403 tekrar edilmez',async()=>{
 const url='https://vidcache.net:8161/example/video.mp4',body=fixture()[file].body;let calls=0;
 const http=createHttp({fetchImpl:async(u,o)=>{calls++;if(calls===1)throw Error('CDN node unreachable');return fixtureFetch({[url]:{body,mime:'video/mp4'}})(u,o);}});
 try{const video=await probe(http,{url,headers:{},source:'AniMOM'},false,false);assert.ok(video);assert.equal(calls,2);}finally{http.close();}
 for(const entry of [{status:403},{body:'<html>Denied</html>',mime:'text/html'}]){const requests=[],http=createHttp({fetchImpl:fixtureFetch({[url]:entry},requests)});try{assert.equal(await probe(http,{url,headers:{},source:'AniMOM'}),null);assert.equal(requests.length,1);}finally{http.close();}}
});
