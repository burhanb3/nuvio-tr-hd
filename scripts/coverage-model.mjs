import{createRequire}from'node:module';
const{qualityLabel}=createRequire(import.meta.url)('../src/util.cjs');
export function summarizeCoverage(pairs, acceptance, type) {
  const files = pairs.filter(p => p.video.downloadable && ['mp4','mkv'].includes(p.video.container));
  const withTr = p => p.subtitles?.some(s => s.language === 'tr') || p.video.embeddedTurkish === true || p.candidate.embeddedTurkish === true;
  const foreignBurned = p => !!p.candidate.burnedSubtitleLanguage && p.candidate.burnedSubtitleLanguage !== 'tr';
  const cleanTr = p => withTr(p) && !foreignBurned(p);
  const quality = p => p.video.dimensions ? `${p.video.dimensions.width}x${p.video.dimensions.height}` : null;
  // Mirrors must not masquerade as extra download/quality coverage. A real
  // file hash plus size is the strongest available identity; URL-only results
  // remain unconfirmed distinct files and are counted separately below.
  const unique = new Map();
  for (const p of files) {
    const v=p.video, key=v.videoHash ? `${v.videoHash}:${v.size}` : `${p.candidate.source}:${p.candidate.filename}:${v.size}:${v.dimensions?.width}x${v.dimensions?.height}`;
    const previous=unique.get(key),chosen=!previous||!withTr(previous)&&withTr(p)?p:previous;
    const known=foreignBurned(p)?p:previous&&foreignBurned(previous)?previous:null;
    unique.set(key,known&&!foreignBurned(chosen)?{...chosen,candidate:{...chosen.candidate,burnedSubtitleLanguage:known.candidate.burnedSubtitleLanguage}}:chosen);
  }
  const downloads=[...unique.values()];
  const smallLimit=type==='tv'?acceptance.episodeSmallFileBytes:acceptance.movieSmallFileBytes;
  const qualities=[...new Set(downloads.filter(withTr).map(quality).filter(Boolean))];
  const cleanQualities=[...new Set(downloads.filter(cleanTr).map(quality).filter(Boolean))];
  const qualityGrade=p=>p.video.dimensions?qualityLabel(p.video.dimensions):null;
  const grades=[...new Set(downloads.filter(withTr).map(qualityGrade).filter(Boolean))];
  const cleanGrades=[...new Set(downloads.filter(cleanTr).map(qualityGrade).filter(Boolean))];
  const online=pairs.some(p=>(p.video.container==='hls'||p.video.downloadable)&&withTr(p));
  const cleanOnline=pairs.some(p=>(p.video.container==='hls'||p.video.downloadable)&&cleanTr(p));
  const small=downloads.some(p=>p.video.size>0&&p.video.size<=smallLimit&&withTr(p));
  const cleanSmall=downloads.some(p=>p.video.size>0&&p.video.size<=smallLimit&&cleanTr(p));
  const gaps=[];
  if(!online)gaps.push('online_with_tr_missing');
  if(!files.length)gaps.push('download_missing');
  else if(!downloads.some(withTr))gaps.push('download_with_tr_missing');
  if(!small)gaps.push('small_download_with_tr_missing');
  if(small&&!cleanSmall)gaps.push('only_known_foreign_burned_subtitle_small_downloads');
  if(online&&!cleanOnline)gaps.push('only_known_foreign_burned_subtitle_online');
  if(cleanGrades.length<acceptance.minimumDistinctDownloadQualities)gaps.push('multiple_verified_download_qualities_missing');
  return { onlineWithTr:online, downloadUrls:files.length, estimatedDistinctFiles:downloads.length, downloadQualities:qualities,
    cleanOnlineWithTr:cleanOnline,cleanDownloadQualities:cleanQualities,downloadQualityGrades:grades,cleanDownloadQualityGrades:cleanGrades,cleanSmallWithTr:cleanSmall,
    smallWithTr:small, smallLimitBytes:smallLimit, sourceCoverageCriteriaMet:!gaps.length,gaps,
    files:downloads.map(p=>({source:p.candidate.source,container:p.video.container,bytes:p.video.size,
      filename:p.candidate.filename||null,sourceItemId:p.candidate.sourceItemId||null,releaseYearBasis:p.candidate.releaseYearBasis||null,
      mediaFilename:p.candidate.mediaFilename||null,
      audioLanguages:p.video.audioLanguages||[],subtitleBestScore:Math.max(0,...(p.subtitles||[]).map(s=>s._score||0)),
      burnedSubtitleLanguage:p.candidate.burnedSubtitleLanguage||null,knownForeignBurnedSubtitles:foreignBurned(p),
      dimensions:p.video.dimensions||null,quality:quality(p)||'unknown',qualityGrade:qualityGrade(p),turkishSubtitle:withTr(p),externalTrackCount:p.subtitles?.length||0,externalTurkishTracks:(p.subtitles||[]).filter(s=>s.language==='tr').length,
      actualDurationSeconds:p.video.durationSource==='tmdb'?null:p.video.duration||null,hashAvailable:!!p.video.videoHash})) };
}
