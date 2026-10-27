'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{scanHdHub,pixelFilename,HDHUB_ORIGIN}=require('../src/providers/hdhub.cjs');
const{registerDownloads}=require('../src/hosted.cjs'),{probe}=require('../src/media/probe.cjs'),{createHttp}=require('../src/http.cjs');
const{fixtureFetch,ebml}=require('./helpers.cjs');
const target={tmdbId:123456,type:'tv',originalTitle:'Example Series',year:2020,season:1,episode:2,posterPath:'/Example.jpg',runtimeMinutes:30,originalLanguage:'en'};
const filename='Example.Series.S01E02.2160p.WEB-DL.mkv',pixel='https://pixeldrain.dev/u/Example1',file='https://pixeldrain.dev/api/file/Example1';
const short='https://greenmotors.club/example',hub='https://hubcloud.ist/drive/example',terminal='https://gamerxyt.com/hubcloud.php?id=example';
function media({width=3840,height=1600,language='en-US',seconds=1800}={}){
 const size=n=>[n>>8,n&255],duration=Buffer.alloc(8);duration.writeDoubleBE(seconds*1000);
 return Buffer.concat([ebml('1a45dfa3',ebml('4282',Buffer.from('matroska'))),ebml('18538067',Buffer.concat([
  ebml('1549a966',ebml('4489',duration)),ebml('1654ae6b',Buffer.concat([
   ebml('ae',Buffer.concat([ebml('83',[1]),ebml('e0',Buffer.concat([ebml('b0',size(width)),ebml('ba',size(height))]))])),
   ebml('ae',Buffer.concat([ebml('83',[2]),ebml('22b59c',Buffer.from(language))])),
   ebml('ae',Buffer.concat([ebml('83',[17]),ebml('22b59c',Buffer.from('tur')),ebml('86',Buffer.from('S_TEXT/UTF8'))]))]))])),Buffer.alloc(1000000)]);
}
function fixture(){const body=media(),encode=s=>Buffer.from(s).toString('base64'),value=encode(JSON.stringify({o:encode(hub)})).replace(/[A-Za-z]/g,c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<='m'?13:-13)));
 return{
 [HDHUB_ORIGIN+'/?s=Example%20Series']:{body:'<a href="/example-series-1/">Example Series 2020 S01</a>'},
 [HDHUB_ORIGIN+'/example-series-1/']:{body:'<script type="application/ld+json">'+JSON.stringify({'@type':'TVSeries',name:target.originalTitle,startDate:'2020',image:'https://image.tmdb.org/t/p/w500/Example.jpg'})+'</script><div class="episode-download-item"><div class="episode-file-title">'+filename+'</div><span>1 GB</span><a href="'+short+'">Download HubCloud</a></div>'},
 [short]:{body:"s('o','"+encode(encode(value))+"')"},[hub]:{body:'<title>'+filename+'</title><script>var url="'+terminal+'";</script>'},
 [terminal]:{body:'<script>var pxl="'+pixel+'";</script>'},
 [file+'/info']:{json:{success:true,id:'Example1',name:filename,size:body.length,mime_type:'video/matroska',can_download:true,availability:'',abuse_type:''}},
 [file]:{body,mime:'video/matroska'}
 };}
test('HDHub: tam dizi/bölümden gerçek 4K MKV, EN-US ses ve gömülü TR; köprü kapalıyken de doğrudan dosya',async()=>{
 const calls=[],http=createHttp({fetchImpl:fixtureFetch(fixture(),calls)});try{
  const fed=[],rows=await scanHdHub(http,target,{onCandidates:async cs=>fed.push(...cs)});assert.equal(rows.length,1);assert.equal(fed.length,1);
  assert.equal(rows[0].source,'4KHDHub / Pixeldrain');assert.equal(rows[0].url,file);
  assert.deepEqual(await registerDownloads(http,rows,target),rows);assert.ok(!calls.some(c=>/chatgpt\.site/.test(c.url)));
  const v=await probe(http,rows[0]);assert.equal(v.downloadable,true);assert.deepEqual(v.dimensions,{width:3840,height:1600});assert.equal(v.size,media().length);assert.deepEqual(v.audioLanguages,['en-us']);assert.ok(v.subtitleTracks.some(t=>t.language==='tr'));
  assert.ok(calls.every(c=>!Object.keys(c.headers||{}).some(k=>/cookie|authorization/i.test(k))));
 }finally{http.close();}
});
test('HDHub Pixel: başka bölüm, yıl, yapım/poster ve metadata dosya adı kabul edilmez',async()=>{
 assert.equal(pixelFilename(filename,target),true);for(const name of [filename.replace('S01E02','S02E02'),filename.replace('S01E02','S01E02-E03'),filename.replace('Example.Series','Other.Series'),'Example.Series.2021.S01E02.mkv','Example.Series.S01E02.Sample.mkv'])assert.equal(pixelFilename(name,target),false,name);
 for(const change of ['poster','episode','name','hubname']){
  const f=fixture();if(change==='poster')f[HDHUB_ORIGIN+'/example-series-1/'].body=f[HDHUB_ORIGIN+'/example-series-1/'].body.replace('/Example.jpg','/Other.jpg');
  if(change==='episode')f[HDHUB_ORIGIN+'/example-series-1/'].body=f[HDHUB_ORIGIN+'/example-series-1/'].body.replace('S01E02','S01E03');
  if(change==='name')f[file+'/info'].json.name=filename.replace('WEB-DL','BluRay');if(change==='hubname')f[hub].body=f[hub].body.replace('S01E02','S01E03');
  const http=createHttp({fetchImpl:fixtureFetch(f)});try{assert.deepEqual(await scanHdHub(http,target),[],change);}finally{http.close();}
 }
});
test('HDHub Pixel: kaynak kalite etiketi ölçülen pikseli geçmez; HI-only ve kısa/yanlış boyutlu medya elenir',async()=>{
 for(const kind of ['low','hi','short','size']){const f=fixture();f[file].body=media(kind==='low'?{width:1280,height:720}:kind==='hi'?{language:'hin'}:kind==='short'?{seconds:60}:{});f[file+'/info'].json.size=f[file].body.length+(kind==='size'?1:0);
  const http=createHttp({fetchImpl:fixtureFetch(f)});try{const rows=await scanHdHub(http,target),v=await probe(http,rows[0]);if(kind==='low')assert.deepEqual(v.dimensions,{width:1280,height:720});else assert.equal(v,null,kind);}finally{http.close();}
 }
});
test('HDHub Pixel: kısıtlı/403/429 dosyada alan adı veya hesap yolu denenmez; başka gerçek ayna engellenmez',async()=>{
 for(const patch of [{status:403},{status:429},{json:{can_download:false}},{json:{availability:'file_rate_limited_captcha_required'}}]){
  const f=fixture();f[file+'/info']=patch.json?{json:{...f[file+'/info'].json,...patch.json}}:patch;
  const calls=[],http=createHttp({fetchImpl:fixtureFetch(f,calls)});try{assert.deepEqual(await scanHdHub(http,target),[]);assert.equal(calls.filter(c=>/pixeldrain/.test(c.url)).length,1);assert.ok(!calls.some(c=>c.url===file));}finally{http.close();}
 }
});
test('HDHub Pixel: eski ayna/köprü beklerken hazır Pixel adayı teslim edilir',async()=>{
 const f=fixture(),legacy='https://old.workers.dev/Example.Series.S01E02.mkv';f[terminal].body+='<a href="'+legacy+'">FSL Server</a>';
 let release,seen;const gate=new Promise(r=>release=r),ready=new Promise(r=>seen=r);let delivered=false,finished=false;
 const http=createHttp({fetchImpl:fixtureFetch(f)}),work=scanHdHub(http,target,{onCandidates:async cs=>{if(cs[0].url===legacy)await gate;else{delivered=true;seen();}}}).then(r=>{finished=true;return r;});
 try{await ready;assert.equal(delivered,true);assert.equal(finished,false);}finally{release();await work;http.close();}
});
