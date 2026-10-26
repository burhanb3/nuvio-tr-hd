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
  const subScore = Math.max(entry.video.embeddedTurkish || entry.candidate.embeddedTurkish ? 90 : 0, ...entry.subtitles.map(s => s._score || 0));
  // Matched subtitles and real downloads first; avoid overvaluing huge files.
  return (entry.video.downloadable ? 1000000000 : 0) + subScore * 1000000 +
    (entry.candidate.identityConfidence || 100) * 1000 + Math.min(pixels, 2160) -
    (entry.video.size > 12 * 1024 ** 3 ? 2000 : 0);
}
function sizeValue(entry) {
  if (entry.video.size > 0) return entry.video.size;
  const e = entry.video.sizeEstimate;
  return e?.minimum > 0 ? (e.minimum + e.maximum) / 2 : null;
}
function qualityValue(entry) {
  if (entry.video.dimensions) return Math.min(entry.video.dimensions.width, entry.video.dimensions.height);
  const sizes = (entry.video.resolutionOptions || []).map(d => Math.min(d.width, d.height));
  return sizes.length ? Math.max(...sizes) : null;
}
function groupValue(entry, group) {
  if (group === 'type') return entry.video.downloadable ? '0' : '1';
  if (group === 'source') return String(entry.candidate.source || '');
  if (group === 'quality') return String(20000 - (qualityValue(entry) || 0)).padStart(5, '0');
  return '';
}
function rankStreams(entries, maximum = 6, settings = {}) {
  const mode = settings.sortOrder || 'recommended', group = settings.groupResults || 'none';
  return entries.slice().sort((a, b) => {
    const grouped = groupValue(a, group).localeCompare(groupValue(b, group));
    if (grouped) return grouped;
    const x = mode.startsWith('size_') ? sizeValue(a) : qualityValue(a);
    const y = mode.startsWith('size_') ? sizeValue(b) : qualityValue(b);
    if (mode !== 'recommended') {
      if (x == null || y == null) { if (x == null && y != null) return 1; if (y == null && x != null) return -1; }
      else if (x !== y) return mode.endsWith('_asc') ? x - y : y - x;
    }
    return streamScore(b) - streamScore(a) || a.candidate.url.localeCompare(b.candidate.url);
  }).slice(0, maximum);
}
module.exports = { balancedCandidates, rankStreams, streamScore, sizeValue, qualityValue, groupValue };
