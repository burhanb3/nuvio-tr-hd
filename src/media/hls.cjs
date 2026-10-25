'use strict';
const { safeUrl } = require('../util.cjs');

function attributes(line) {
  const result = {};
  for (const match of line.matchAll(/([A-Z0-9-]+)=(?:"([^"]*)"|([^,]*))(?:,|$)/g)) result[match[1]] = match[2] ?? match[3];
  return result;
}
function inspectPlaylist(text, base) {
  const lines = text.replace(/^\uFEFF/, '').trimStart().split(/\r?\n/).map(s => s.trim());
  if (lines[0] !== '#EXTM3U') return null;
  const variants = [];
  let duration = 0, segments = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const info = attributes(line.slice(18));
      const resolution = info.RESOLUTION?.match(/^(\d+)x(\d+)$/);
      const url = safeUrl(lines[i + 1], base);
      const bandwidth = Number(info.BANDWIDTH), averageBandwidth = Number(info['AVERAGE-BANDWIDTH']);
      if (url) variants.push({ url,
        dimensions: resolution && Number(resolution[1]) <= 16384 && Number(resolution[2]) <= 16384 && Number(resolution[1]) > 0 && Number(resolution[2]) > 0 ? { width: Number(resolution[1]), height: Number(resolution[2]) } : null,
        bandwidth: bandwidth > 0 && bandwidth < 1000000000 ? bandwidth : null,
        averageBandwidth: averageBandwidth > 0 && averageBandwidth < 1000000000 ? averageBandwidth : null });
    }
    if (line.startsWith('#EXTINF:')) {
      const value = Number(line.slice(8).split(',')[0]);
      if (value > 0 && value < 3600) { duration += value; segments++; }
    }
  }
  const ended = lines.includes('#EXT-X-ENDLIST');
  const live = segments > 0 && !ended;
  return { variants: variants.slice(0, 16), duration: ended && duration > 0 && duration < 86400 ? duration : null, live,
    valid: variants.length > 0 || (segments > 0 && lines.some(l => l.startsWith('#EXT-X-TARGETDURATION:'))) };
}

async function inspectHls(http, text, url, candidate) {
  const master = inspectPlaylist(text, url);
  if (!master?.valid) return null;
  let duration = master.duration, durationSource = duration ? 'playlist' : null, live = master.live;
  const variants = master.variants;
  if (variants.length && !duration && !http.expired()) {
    const lowest = variants.slice().sort((a, b) => (a.bandwidth || Infinity) - (b.bandwidth || Infinity))[0];
    const sameOrigin = new URL(lowest.url).origin === new URL(url).origin;
    const headers = sameOrigin ? candidate.headers : Object.fromEntries(Object.entries(candidate.headers || {}).filter(([k]) => !/^(authorization|cookie)$/i.test(k)));
    const child = await http.text(lowest.url, { headers });
    const media = child && inspectPlaylist(child.text, child.url);
    if (media?.live) live = true;
    if (media?.duration) { duration = media.duration; durationSource = 'playlist'; }
  }
  if (!duration && !live && Number(candidate.identity?.runtimeMinutes) > 0) {
    duration = Number(candidate.identity.runtimeMinutes) * 60;
    durationSource = 'tmdb';
  }
  const resolutionOptions = [...new Map(variants.filter(v => v.dimensions).map(v => [v.dimensions.width + 'x' + v.dimensions.height, v.dimensions])).values()]
    .sort((a, b) => Math.min(a.width, a.height) - Math.min(b.width, b.height));
  const estimates = variants.map(v => {
    const bitrate = v.averageBandwidth || v.bandwidth;
    return duration && bitrate ? bitrate * duration / 8 : null;
  }).filter(n => Number.isFinite(n) && n > 0);
  const sizeEstimate = estimates.length ? { minimum: Math.round(Math.min(...estimates)), maximum: Math.round(Math.max(...estimates)),
    basis: variants.every(v => !!v.averageBandwidth) ? 'average-bitrate' : 'peak-or-average-bitrate', durationSource } : null;
  return { url, container: 'hls', dimensions: null, size: null, downloadable: false,
    resolutionOptions, resolutionEvidence: resolutionOptions.length ? 'hls-manifest' : null,
    sizeEstimate, ...(duration ? { duration, durationSource } : {}) };
}

module.exports = { attributes, inspectPlaylist, inspectHls };
