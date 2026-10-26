'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanHdFilmDelisi,filmMatches,playerLinks,mediaLinks}=require('../src/providers/hdfilmdelisi.cjs');
const{base64Bytes}=require('../src/media/base64.cjs'),{createHttp}=require('../src/http.cjs'),{probe}=require('../src/media/probe.cjs');
const{target,fixtureFetch}=require('./helpers.cjs');
const origin='https://hdfilmdelisi.one',embed='https://pl.vixolity.com/ExamplePublic',file='https://ha.vixolity.com/vs/tt0133093';
function encodedPlayer(url=file){const code=`new Player({file:'${url}'});`,shift=Buffer.from(Array.from(code,c=>(c.charCodeAt(0)+7)%256)),hex=Buffer.from(shift.toString('base64').split('').reverse().join(''),'latin1').toString('hex');return `})('${hex}',7);`;}
function fixture(){const row={orijinalBaslik:'The Matrix',baslik:'Matrix',yayinYili:1999,imdbId:'tt0133093',slug:'matrix',accessLevel:'public'};const data=JSON.stringify('x:{"videoUrl":"'+embed+'","requireAuthForWatch":false}');return{row,files:{
 [origin+'/api/search?q=The%20Matrix']:{json:{results:[{...row,yayinYili:2003},row]}},
 [origin+'/film/matrix']:{body:'<script type="application/ld+json">'+JSON.stringify({'@type':'Movie',name:'Matrix',datePublished:1999})+'</script><script>self.__next_f.push([1,'+data+'])</script>'},
 [embed]:{body:encodedPlayer()},
 [file+'?format=.m3u8']:{body:'#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="Türkçe",LANGUAGE="tr",URI="tr.m3u8"\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",NAME="English",LANGUAGE="en",URI="en.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1920x804,AUDIO="a"\nvideo.m3u8\n'}
 }};}
test('public canonical catalogue and static player data yield a real TR/EN HLS, excluded from native downloads',async()=>{
 const f=fixture(),http=createHttp({fetchImpl:fixtureFetch(f.files)});try{const rows=await scanHdFilmDelisi(http,{...target,runtimeMinutes:136});assert.equal(rows.length,1);assert.equal(rows[0].url,file+'?format=.m3u8');
 const v=await probe(http,rows[0],true,false,{detailedHls:false});assert.equal(v.container,'hls');assert.equal(v.downloadable,false);assert.deepEqual(v.audioLanguages,['tr','en']);assert.deepEqual(v.resolutionOptions,[{width:1920,height:804}]);
 const nativeAllowed=u=>!u.endsWith('.m3u8')&&!u.includes('.m3u8?');assert.equal(nativeAllowed(rows[0].url),false);
 }finally{http.close();}
});
test('wrong IMDb/year/title, private catalogue, paid watch gate and unrelated player URL are rejected',()=>{
 const {row}=fixture();for(const patch of[{imdbId:'tt0000001'},{yayinYili:2000},{orijinalBaslik:'The Matrix Reloaded'},{accessLevel:'premium'}])assert.equal(filmMatches({...row,...patch},target),false);
 const push=data=>'self.__next_f.push([1,'+JSON.stringify(JSON.stringify(data))+'])';
 assert.deepEqual(playerLinks(push({videoUrl:embed,requireAuthForWatch:true})),[]);assert.deepEqual(playerLinks(push({videoUrl:'https://other.test/embed'})),[]);
 assert.deepEqual(mediaLinks(encodedPlayer('https://ha.vixolity.com/vs/tt0000001'),target),[]);assert.deepEqual(mediaLinks(encodedPlayer('https://other.test/vs/tt0133093'),target),[]);
});
test('SEO mp4 placeholder and remote JavaScript are never used as downloadable media',async()=>{
 const f=fixture();f.files[origin+'/film/matrix'].body=f.files[origin+'/film/matrix'].body.split('<script>self.')[0]+'<video src="https://source.test/fake.mp4"></video>';
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(f.files,calls)});try{assert.deepEqual(await scanHdFilmDelisi(http,target),[]);assert.ok(!calls.some(c=>c.url.includes('fake.mp4')));}finally{http.close();}
});
test('binary base64 preserves every byte without native string/atob truncation',()=>{
 const bytes=Buffer.from(Array.from({length:256},(_,i)=>i));assert.deepEqual(Buffer.from(base64Bytes(bytes.toString('base64'))),bytes);assert.equal(base64Bytes('%%'),null);
});
