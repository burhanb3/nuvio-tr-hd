import{test}from'node:test';import assert from'node:assert/strict';import{summarizeCoverage}from'../scripts/coverage-model.mjs';
const limits={movieSmallFileBytes:3*1024**3,episodeSmallFileBytes:1024**3,minimumDistinctDownloadQualities:2};
function pair({hash='0011223344556677',size=700*1024**2,width=1280,height=536,tr=true,type='mkv'}={}){
 return{candidate:{source:'Fixture',filename:'Movie.2021.mkv'},video:{container:type,downloadable:type!=='hls',size,dimensions:{width,height},videoHash:hash},subtitles:tr?[{language:'tr'}]:[]};
}
test('kapsam raporu aynaları ayrı başarı saymaz; gerçek pikseli p etiketiyle yuvarlamaz',()=>{
 const result=summarizeCoverage([pair(),pair(),pair({hash:'1111223344556677',width:1920,height:800})],limits,'movie');
 assert.equal(result.downloadUrls,3);assert.equal(result.estimatedDistinctFiles,2);
 assert.deepEqual(result.downloadQualities,['1280x536','1920x800']);assert.equal(result.sourceCoverageCriteriaMet,true);
});
test('Bilinen yabancı sabit altyazı temiz TR hedefini doldurmaz; başka ayna bu bilgiyi silmez',()=>{
 const burned=pair();burned.candidate.burnedSubtitleLanguage='es';
 const result=summarizeCoverage([burned,pair(),pair({type:'hls'})],limits,'tv');
 assert.equal(result.smallWithTr,true);assert.equal(result.cleanSmallWithTr,false);
 assert.equal(result.cleanOnlineWithTr,true);assert.equal(result.files[0].knownForeignBurnedSubtitles,true);
 assert.ok(result.gaps.includes('only_known_foreign_burned_subtitle_small_downloads'));
 assert.equal(result.sourceCoverageCriteriaMet,false);
});
test('HLS kaliteleri indirme kapsamını doldurmaz; altyazısız veya büyük dosya küçük/TR başarısı olmaz',()=>{
 const result=summarizeCoverage([pair({type:'hls'}),pair({tr:false}),pair({hash:'2222334455667788',size:8*1024**3})],limits,'movie');
 assert.equal(result.onlineWithTr,true);assert.equal(result.smallWithTr,false);
 assert.ok(result.gaps.includes('small_download_with_tr_missing'));
 assert.ok(result.gaps.includes('multiple_verified_download_qualities_missing'));
 assert.equal(summarizeCoverage([pair({type:'hls'})],limits,'tv').downloadUrls,0);
});
test('aynı 480p sınıfındaki iki kırpma iki farklı indirme kalitesi sayılmaz; TR/EN adedi ayrılır',()=>{
 const a=pair({width:848,height:354}),b=pair({hash:'3333444455556666',width:853,height:476});a.subtitles.push({language:'en'});
 const result=summarizeCoverage([a,b],limits,'tv');assert.equal(result.downloadQualities.length,2);assert.deepEqual(result.downloadQualityGrades,['480p']);assert.equal(result.sourceCoverageCriteriaMet,false);
 assert.equal(result.files[0].externalTrackCount,2);assert.equal(result.files[0].externalTurkishTracks,1);
});
