'use strict';
// CizgiMax fixture pages shaped like the live site. Placeholder Drive ids and
// player tokens only.
const{box,moov}=require('./helpers.cjs');
const ORIGIN='https://cizgimax.online',SERIES=ORIGIN+'/diziler/example-toon-izle/';
const TOKEN='placeholder-token-0001',TOKEN2='placeholder-token-0002',ID='PLACEHOLDERdriveFILEid0001';
const DOWNLOAD='https://drive.usercontent.google.com/download?id='+ID+'&export=download&confirm=t';
function ld(value){return '<script type="application/ld+json">'+JSON.stringify(value,null,4)+'</script>';}
function searchPage(){
  return '<div class="items"><a href="/diziler/example-toon-two-izle/" class="film-name">Example Toon Two</a>'+
    '<a href="/diziler/example-toon-izle/" class="film-name" data-alt-title="Example Toon">Örnek Çizgi</a></div>';
}
function button(season,episode,{titled=true,label=episode,slug='example-toon'}={}){
  return '<a href="/'+slug+'-'+season+'-sezon-'+episode+'-bolum-izle/"\n   class="ep-num-btn"\n   data-ep-id="'+(season*100+episode)+'"\n   title="'+
    (titled?'Örnek Çizgi : '+season+'.Sezon '+episode+'.Bölüm':'Episode Name '+episode)+'">\n   <span class="ep-num-label">'+label+'</span></a>';
}
function seriesPage({year='2010',name='Örnek Çizgi',alt='Example Toon',url=SERIES,count=3,season=1,buttons}={}){
  const list=buttons||Array.from({length:count},(_,i)=>button(season,i+1,{titled:i%2===0})).join('\n');
  return '<html><head>'+ld({'@context':'https://schema.org','@type':'TVSeries',name,alternateName:alt,url,datePublished:year})+
    '</head><body><script>document.querySelectorAll(\'.ep-num-btn[data-ep-id]\');</script><div data-season-pane="'+season+'">'+list+'</div>'+
    '<a href="/diziler/other-toon-izle/" class="film-name">Other Toon</a></body></html>';
}
function servers(list){
  // JSON-in-script escapes "/" in the base64 text, like the site does.
  return Buffer.from(JSON.stringify(list)).toString('base64').replace(/\//g,'\\/');
}
const DUB=[{type:'iframe',src:'/oynat/?t='+TOKEN,label:'Drive',lang:'dub'},{type:'iframe',src:'/oynat/?t='+TOKEN2,label:'Sibnet',lang:'dub'}];
// The site's own HLS entry. Placeholder token, placeholder subdomain label and
// a placeholder third-party fallback that must never be requested.
const MEDIA_TOKEN='placeholder-media-token-0001',MEDIA_HOST='https://placeholder.cizgimax.online';
const MEDIA={type:'media',streamUrl:'/api/stream/media/?t='+MEDIA_TOKEN,label:'RubyVidHub',lang:'dub',embedToken:MEDIA_TOKEN,fallbackSrc:'https://player.test/embed/'+MEDIA_TOKEN};
const MASTER=ORIGIN+MEDIA.streamUrl+'&format=.m3u8',CHILD=MEDIA_HOST+'/api/stream/media/?p=placeholder-child-0001';
function masterPlaylist(child=CHILD){
  return '#EXTM3U\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1500000,RESOLUTION=1280x720,FRAME-RATE=25.000,CODECS="avc1.4d401f,mp4a.40.2"\n'+child+'\n'+
    '#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=300000,RESOLUTION=1280x720,CODECS="avc1.4d401f",URI="'+MEDIA_HOST+'/api/stream/media/?p=placeholder-iframe-0001"\n';
}
function childPlaylist(seconds=1300,{ended=true,host=MEDIA_HOST}={}){
  const lines=['#EXTM3U','#EXT-X-VERSION:3','#EXT-X-TARGETDURATION:10','#EXT-X-MEDIA-SEQUENCE:0'];
  for(let i=0;i<Math.ceil(seconds/10);i++)lines.push('#EXTINF:'+Math.min(10,seconds-i*10).toFixed(3)+',',host+'/api/stream/media/?p=placeholder-segment-'+i);
  if(ended)lines.push('#EXT-X-ENDLIST');
  return lines.join('\n')+'\n';
}
function episodePage({season=1,episode=2,series=SERIES,list={dub:DUB,sub:[]},raw}={}){
  return '<html><head>'+ld({'@context':'https://schema.org','@type':'TVEpisode',name:'Örnek Çizgi - '+season+'. Sezon '+episode+'. Bölüm',episodeNumber:episode,seasonNumber:season,partOfSeries:{'@type':'TVSeries',name:'Örnek Çizgi',url:series}})+
    '</head><body><script>\n// serverList ve serversByLang base64-encode edilmis JSON olarak gomulur\nvar serversByLang= JSON.parse(atob("'+(raw||servers(list))+'"));\nif (!serversByLang) {}\n</script></body></html>';
}
function media(seconds=1320,width=1920,height=1080){
  const mvhd=Buffer.alloc(20);mvhd.writeUInt32BE(1000,12);mvhd.writeUInt32BE(seconds*1000,16);
  return Buffer.concat([box('ftyp',Buffer.from('isom\0\0\0\0isommp42','binary')),box('moov',box('mvhd',mvhd),moov(width,height).subarray(8)),box('mdat',Buffer.alloc(32))]);
}
function drivePage(title='S1 B2.mp4',{id=ID,extra=''}={}){
  return '<html><head><meta property="og:title" content="'+title+'"><meta property="og:url" content="https://drive.google.com/file/d/'+id+'/preview?usp=embed_facebook">'+
    '<title>'+title+' - Google Drive</title></head><body><script>var c={"docs-seu":"https://drive.google.com/file/d/'+id+'/preview"};</script>'+extra+'</body></html>';
}
function cizgimaxFixture(o={}){
  const ep=ORIGIN+'/example-toon-1-sezon-2-bolum-izle/',preview='https://drive.google.com/file/d/'+ID+'/preview';
  return{
    [ORIGIN+'/ara/?q=Example%20Toon']:{body:searchPage(),mime:'text/html'},
    [SERIES]:{body:o.series||seriesPage(),mime:'text/html'},
    // o.stream: the episode also lists the site's HLS entry, served below.
    [ep]:{body:o.episode||(o.stream?episodePage({list:{dub:[...DUB,MEDIA],sub:[]}}):episodePage()),mime:'text/html'},
    // o.direct: the transport reports the requested address, not the redirect target.
    [ORIGIN+'/oynat/?t='+TOKEN]:o.direct?{body:o.drive||drivePage(o.title),mime:'text/html'}:{status:302,headers:{location:o.preview||preview}},
    [preview]:{body:o.drive||drivePage(o.title),mime:'text/html'},
    [DOWNLOAD]:{body:o.media||media(),mime:'video/mp4'},
    [MASTER]:o.masterEntry||{body:o.master||masterPlaylist(),mime:'application/vnd.apple.mpegurl'},
    [CHILD]:o.childEntry||{body:o.child||childPlaylist(),mime:'application/vnd.apple.mpegurl'}
  };
}
module.exports={ORIGIN,SERIES,TOKEN,TOKEN2,ID,DOWNLOAD,DUB,MEDIA,MEDIA_HOST,MASTER,CHILD,searchPage,button,seriesPage,servers,episodePage,media,drivePage,masterPlaylist,childPlaylist,cizgimaxFixture};
