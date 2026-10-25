'use strict';

function balancedCandidates(groups, maximum = 18) {
  const result = [];
  for (let offset = 0; result.length < maximum; offset++) {
    let any = false;
    for (const group of groups) if (group[offset]) { result.push(group[offset]); any = true; if (result.length >= maximum) break; }
    if (!any) break;
  }
  return result;
}
function streamScore(entry) {
  const dimensions = entry.video.dimensions;
  const pixels = dimensions ? Math.min(dimensions.width, dimensions.height) : 0;
  const subScore = Math.max(0, ...entry.subtitles.map(s => s._score || 0));
  // Matched subtitles and real downloads first; avoid overvaluing huge files.
  return (entry.video.downloadable ? 1000000000 : 0) + subScore * 1000000 +
    (entry.candidate.identityConfidence || 100) * 1000 + Math.min(pixels, 2160) -
    (entry.video.size > 12 * 1024 ** 3 ? 2000 : 0);
}
function rankStreams(entries, maximum = 6) {
  return entries.slice().sort((a, b) => streamScore(b) - streamScore(a) || a.candidate.url.localeCompare(b.candidate.url)).slice(0, maximum);
}
module.exports = { balancedCandidates, rankStreams, streamScore };
