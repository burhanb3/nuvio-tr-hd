'use strict';
// DiziBox fixture pages shaped like the live site. Placeholder ids and
// passphrase only; the envelope is made here with node:crypto.
const crypto=require('node:crypto');
const ORIGIN='https://www.dizibox.live',PLAYER='https://dbx.molystream.org';
const KING='b'.repeat(64),EMBED='123-'+'c'.repeat(32),PASS='placeholder-pass';
function envelope(plain,pass=PASS){
  const salt=crypto.randomBytes(8);let d=Buffer.alloc(0),p=Buffer.alloc(0);
  while(d.length<48){p=crypto.createHash('md5').update(Buffer.concat([p,Buffer.from(pass),salt])).digest();d=Buffer.concat([d,p]);}
  const c=crypto.createCipheriv('aes-256-cbc',d.subarray(0,32),d.subarray(32,48));
  return Buffer.concat([Buffer.from('Salted__'),salt,c.update(Buffer.from(plain)),c.final()]).toString('base64');
}
function heading(name,season,episode,flag='altyazi'){
  return '<div class="title"> <h1 class="full-width"> <span class=\'tv-title-archive\' itemprop="partOfSeries" itemscope itemtype="https://schema.org/TVSeries"><img src=\''+ORIGIN+'/'+flag+'.png\' alt=\'Dil Seçeneği\' class=\'subtitle-flag noselect\'> <span itemprop="name">'+name+'</span></span> <span class=\'tv-title-episode\'>'+season+'.Sezon '+episode+'.Bölüm</span> </h1> </div>';
}
function episodePage({name='Example Series',season=1,episode=2,flag='altyazi',slug='example-series',player=ORIGIN+'/player/king/king.php?v='+KING,options=''}={}){
  return '<html><body>'+heading(name,season,episode,flag)+
    '<select class="woca-linkpages-dd selectBox">'+options+'</select>'+
    '<div id="video-area"><div class="embed-responsive"><iframe src="'+player+'" width="100%" allowfullscreen></iframe></div></div>'+
    '<a href="'+ORIGIN+'/diziler/'+slug+'/" class="archive-title">'+name+'</a></body></html>';
}
function seriesPage({name='Example Series',year=2020,slug='example-series'}={}){
  return '<h1 class="full-width"><i class="icon"></i> <a href="'+ORIGIN+'/diziler/'+slug+'/">'+name+'</a></h1> <div class="title-terms pull-left"><a href="'+ORIGIN+'/yil/'+year+'/" rel="tag">'+year+'</a></div>';
}
function playerPlain({file=PLAYER+'/embed/sheila/'+EMBED,type='application/vnd.apple.mpegurl'}={}){
  return 'var player=new Playerjs({id:"player",sources:[{file:\''+file+'\',type:"'+type+'"}],title:"Örnek"});';
}
function embedPage(plain=playerPlain(),pass=PASS){
  return '<html><head><script>var x=CryptoJS.AES.decrypt("'+envelope(plain,pass)+'", "'+pass+'").toString(CryptoJS.enc.Utf8);</script></head></html>';
}
const master='#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1920x1080\n/embed/sheila/'+EMBED+'/1080\n';
function diziboxFixture(overrides={}){
  const ep=ORIGIN+'/example-series-1-sezon-2-bolum-izle/';
  return{
    [ep]:{body:episodePage(overrides.episode),mime:'text/html'},
    [ORIGIN+'/diziler/example-series/']:{body:seriesPage(overrides.series),mime:'text/html'},
    [ORIGIN+'/player/king/king.php?v='+KING]:{body:'<iframe src="'+PLAYER+'/embed/'+EMBED+'" allowfullscreen></iframe>',mime:'text/html'},
    [PLAYER+'/embed/'+EMBED]:{body:overrides.embed||embedPage(),mime:'text/html'},
    [PLAYER+'/embed/sheila/'+EMBED+'?format=.m3u8']:{body:master,mime:'application/x-mpegurl'}
  };
}
module.exports={ORIGIN,PLAYER,KING,EMBED,PASS,envelope,episodePage,seriesPage,playerPlain,embedPage,diziboxFixture};
