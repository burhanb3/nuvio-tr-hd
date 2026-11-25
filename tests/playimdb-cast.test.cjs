'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHttp}=require('../src/http.cjs');
const {scanPlayImdb,PLAY_API}=require('../src/providers/playimdb.cjs');
const {fixtureFetch,target}=require('./helpers.cjs');
test('PlayIMDb: yeni cast_urls alanı eski stream_urls gibi okunur; IMDb/dosya adı denetimi aynen kalır',async()=>{
 const api=PLAY_API+'?tmdb=603&type=movie';
 const data={imdb_id:target.imdbId,file_name:'The Matrix (1999) [1080p]/The.Matrix.1999.1080p.BrRip.x264.mp4',cast_urls:['https://cast-a.test/plc/one','https://cast-b.test/plc/two']};
 const http=createHttp({fetchImpl:fixtureFetch({[api]:{json:{status_code:'200',data}}})});
 try{const rows=await scanPlayImdb(http,target);assert.deepEqual(rows.map(r=>r.url),data.cast_urls);assert.equal(rows[0].identityImdbBound,true);}finally{http.close();}
 const wrong=createHttp({fetchImpl:fixtureFetch({[api]:{json:{status_code:'200',data:{...data,imdb_id:'tt0000001'}}}})});
 try{assert.deepEqual(await scanPlayImdb(wrong,target),[]);}finally{wrong.close();}
});
