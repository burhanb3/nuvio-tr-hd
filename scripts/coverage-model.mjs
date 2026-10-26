export function summarizeCoverage(pairs, acceptance, type) {
  const files = pairs.filter(p => p.video.downloadable && ['mp4','mkv'].includes(p.video.container));
  const withTr = p => p.subtitles?.some(s => s.language === 'tr') || p.video.embeddedTurkish === true || p.candidate.embeddedTurkish === true;
  const quality = p => p.video.dimensions ? `${p.video.dimensions.width}x${p.video.dimensions.height}` : null;
  // Mirrors must not masquerade as extra download/quality coverage. A real
  // file hash plus size is the strongest available identity; URL-only results
  // remain unconfirmed distinct files and are counted separately below.
  const unique = new Map();
  for (const p of files) {
    const v=p.video, key=v.videoHash ? `${v.videoHash}:${v.size}` : `${p.candidate.source}:${p.candidate.filename}:${v.size}:${v.dimensions?.width}x${v.dimensions?.height}`;
    if(!unique.has(key)||withTr(p)) unique.set(key,p);
  }
  const downloads=[...unique.values()];
  const smallLimit=type==='tv'?acceptance.episodeSmallFileBytes:acceptance.movieSmallFileBytes;
  const qualities=[...new Set(downloads.filter(withTr).map(quality).filter(Boolean))];
  const online=pairs.some(p=>(p.video.container==='hls'||p.video.downloadable)&&withTr(p));
  const small=downloads.some(p=>p.video.size>0&&p.video.size<=smallLimit&&withTr(p));
  const gaps=[];
  if(!online)gaps.push('online_with_tr_missing');
  if(!files.length)gaps.push('download_missing');
  else if(!downloads.some(withTr))gaps.push('download_with_tr_missing');
  if(!small)gaps.push('small_download_with_tr_missing');
  if(qualities.length<acceptance.minimumDistinctDownloadQualities)gaps.push('multiple_verified_download_qualities_missing');
  return { onlineWithTr:online, downloadUrls:files.length, estimatedDistinctFiles:downloads.length, downloadQualities:qualities,
    smallWithTr:small, smallLimitBytes:smallLimit, sourceCoverageCriteriaMet:!gaps.length,gaps,
    files:downloads.map(p=>({source:p.candidate.source,container:p.video.container,bytes:p.video.size,
      filename:p.candidate.filename||null,sourceItemId:p.candidate.sourceItemId||null,releaseYearBasis:p.candidate.releaseYearBasis||null,
      mediaFilename:p.candidate.mediaFilename||null,
      audioLanguages:p.video.audioLanguages||[],subtitleBestScore:Math.max(0,...(p.subtitles||[]).map(s=>s._score||0)),
      dimensions:p.video.dimensions||null,quality:quality(p)||'unknown',turkishSubtitle:withTr(p),externalTurkishTracks:p.subtitles?.length||0,
      actualDurationSeconds:p.video.durationSource==='tmdb'?null:p.video.duration||null,hashAvailable:!!p.video.videoHash})) };
}
