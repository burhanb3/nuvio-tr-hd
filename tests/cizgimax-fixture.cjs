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
    [ep]:{body:o.episode||episodePage(),mime:'text/html'},
    // o.direct: the transport reports the requested address, not the redirect target.
    [ORIGIN+'/oynat/?t='+TOKEN]:o.direct?{body:o.drive||drivePage(o.title),mime:'text/html'}:{status:302,headers:{location:o.preview||preview}},
    [preview]:{body:o.drive||drivePage(o.title),mime:'text/html'},
    [DOWNLOAD]:{body:o.media||media(),mime:'video/mp4'}
  };
}
module.exports={ORIGIN,SERIES,TOKEN,TOKEN2,ID,DOWNLOAD,DUB,searchPage,button,seriesPage,servers,episodePage,media,drivePage,cizgimaxFixture};
