'use strict';
const { safeUrl, mapLimit } = require('../util.cjs');
const {languageCode} = require('./languages.cjs');

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
  const mediaSegments = [], media = [];
  let segmentDuration = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const info = attributes(line.slice(18));
      const resolution = info.RESOLUTION?.match(/^(\d+)x(\d+)$/);
      const url = safeUrl(lines[i + 1], base);
      const bandwidth = Number(info.BANDWIDTH), averageBandwidth = Number(info['AVERAGE-BANDWIDTH']);
      if (url) variants.push({ url, line, audioGroup: info.AUDIO || null, subtitlesGroup: info.SUBTITLES || null,
        dimensions: resolution && Number(resolution[1]) <= 16384 && Number(resolution[2]) <= 16384 && Number(resolution[1]) > 0 && Number(resolution[2]) > 0 ? { width: Number(resolution[1]), height: Number(resolution[2]) } : null,
        bandwidth: bandwidth > 0 && bandwidth < 1000000000 ? bandwidth : null,
        averageBandwidth: averageBandwidth > 0 && averageBandwidth < 1000000000 ? averageBandwidth : null });
    }
    if (line.startsWith('#EXTINF:')) {
      const value = Number(line.slice(8).split(',')[0]);
      if (value > 0 && value < 3600) { duration += value; segments++; segmentDuration = value; }
    }
    if (segmentDuration && line && !line.startsWith('#')) {
      const address = safeUrl(line, base);
      if (address) mediaSegments.push({ url: address, duration: segmentDuration });
      segmentDuration = null;
    }
    if (line.startsWith('#EXT-X-MEDIA:')) {
      const info = attributes(line.slice(13));
      const uri = safeUrl(info.URI, base);
      if (uri || info.TYPE === 'AUDIO' && !info.URI) media.push({ type: info.TYPE, group: info['GROUP-ID'], language: info.LANGUAGE || languageCode(info.NAME),
        line: uri ? line.replace(/URI="[^"]*"/, `URI="${uri}"`) : line, url: uri });
    }
  }
  // One URI cannot prove three different resolutions. Some public masters
  // advertise 480/720/1080 for the identical child: keep Auto, clear claims.
  const unique = new Map();
  for (const variant of variants) {
    const key = JSON.stringify([variant.url,variant.audioGroup,variant.subtitlesGroup]);
    const previous = unique.get(key);
    if (!previous) unique.set(key,variant);
    else if (JSON.stringify(previous.dimensions) !== JSON.stringify(variant.dimensions) || previous.bandwidth !== variant.bandwidth || previous.averageBandwidth !== variant.averageBandwidth) {
      previous.dimensions = null; previous.bandwidth = null; previous.averageBandwidth = null;
    }
  }
  const ended = lines.includes('#EXT-X-ENDLIST');
  const live = segments > 0 && !ended;
  return { variants: [...unique.values()].slice(0, 16), media: media.slice(0, 40), segments: mediaSegments,
    duration: ended && duration > 0 && duration < 86400 ? duration : null, live,
    valid: variants.length > 0 || (segments > 0 && lines.some(l => l.startsWith('#EXT-X-TARGETDURATION:'))) };
}

function selectedMaster(master, variant) {
  const media = master.media.filter(m => (m.type === 'AUDIO' && m.group === variant.audioGroup) || (m.type === 'SUBTITLES' && m.group === variant.subtitlesGroup));
  return ['#EXTM3U', '#EXT-X-VERSION:6', ...media.map(m => m.line), variant.line, variant.url, ''].join('\n');
}
function profileAddress(text, origin) {
  if (!origin || text.length > 12000) return null;
  try {
    const binary = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    return origin + '/hls/profile.m3u8?data=' + encodeURIComponent(btoa(binary));
  } catch { return null; }
}
function requestHeaders(candidate, from, to) {
  return new URL(from).origin === new URL(to).origin ? candidate.headers :
    Object.fromEntries(Object.entries(candidate.headers || {}).filter(([k]) => !/^(authorization|cookie)$/i.test(k)));
}
async function sampledBytes(http, media, headers, totalDuration, base) {
  if (!media?.duration || media.live || !media.segments.length) return null;
  const indices = [...new Set([0.15, 0.5, 0.85].map(f => Math.floor((media.segments.length - 1) * f)))];
  const samples = await mapLimit(indices, 3, async index => {
    if (http.expired()) return null;
    const segment = media.segments[index];
    if (!http.hlsNoSampleOrigins) http.hlsNoSampleOrigins = new Set();
    const origin = new URL(segment.url).origin;
    if (http.hlsNoSampleOrigins.has(origin)) return null;
    const result = await http.request(segment.url, { method: 'HEAD', headers: requestHeaders({ headers }, base, segment.url), timeoutMs: 1600 });
    if (!result || /html|json|xml/.test(result.response.headers.get('content-type') || '')) { http.hlsNoSampleOrigins.add(origin); return null; }
    const range = result?.response.headers.get('content-range')?.match(/^bytes \d+-\d+\/(\d+)$/i);
    const size = Number(range?.[1] || result?.response.headers.get('content-length'));
    if (!(size > 0 && size < 200000000) || result.response.headers.get('content-encoding')) { http.hlsNoSampleOrigins.add(origin); return null; }
    return { bytes: size, duration: segment.duration };
  });
  const valid = samples.filter(Boolean);
  if (valid.length < Math.min(2, indices.length)) return null;
  return { bytes: Math.round(valid.reduce((sum, s) => sum + s.bytes, 0) / valid.reduce((sum, s) => sum + s.duration, 0) * totalDuration), samples: valid.length };
}

async function inspectHls(http, text, url, candidate, options = {}) {
  const master = inspectPlaylist(text, url);
  if (!master?.valid) return null;
  const groups = new Set(master.variants.map(v => v.audioGroup).filter(Boolean));
  const audioLanguages = [...new Set(master.media.filter(m => m.type === 'AUDIO' && groups.has(m.group) && m.language).map(m => m.language))];
  const subtitleGroups=new Set(master.variants.map(v=>v.subtitlesGroup).filter(Boolean));
  const subtitleLanguages=[...new Set(master.media.filter(m=>m.type==='SUBTITLES'&&subtitleGroups.has(m.group)).map(m=>languageCode(m.language)).filter(Boolean))];
  const variantSubtitles=variant=>[...new Set(master.media.filter(m=>m.type==='SUBTITLES'&&m.group===variant.subtitlesGroup).map(m=>languageCode(m.language)).filter(Boolean))];
  // A working master must not wait for every rendition and segment HEAD.
  // Native iOS fetches are not cancelled by the JS deadline; avoid starting
  // optional work in the default recovery path.
  if (options.detailed === false) {
    const duration = master.duration || (!master.live && Number(candidate.identity?.runtimeMinutes) > 0 ? candidate.identity.runtimeMinutes * 60 : null);
    const durationSource = master.duration ? 'playlist' : duration ? 'tmdb' : null;
    const renditions = master.variants.filter(v => v.dimensions).slice(0,5).map(variant => {
      const bitrate = variant.averageBandwidth || variant.bandwidth;
      const bytes = duration && bitrate ? Math.round(duration * bitrate / 8) : null;
      return { url: variant.url, dimensions: variant.dimensions, playlist: selectedMaster(master, variant),
        sizeEstimate: bytes ? { minimum: bytes, maximum: bytes, basis: variant.averageBandwidth ? 'average-bitrate' : 'peak-bitrate', durationSource } : null,
        duration, subtitleLanguages:variantSubtitles(variant), audioLanguages: master.media.filter(m=>m.type==='AUDIO'&&m.group===variant.audioGroup&&m.language).map(m=>m.language),
        hasExternalAudio: !!variant.audioGroup, hasExternalSubtitles: !!variant.subtitlesGroup };
    });
    const resolutionOptions = [...new Map(renditions.map(r => [r.dimensions.width+'x'+r.dimensions.height,r.dimensions])).values()]
      .sort((a,b) => Math.min(a.width,a.height) - Math.min(b.width,b.height));
    const sizes = renditions.map(r => r.sizeEstimate).filter(Boolean);
    return { url, container: 'hls', dimensions: null, size: null, downloadable: false, live:master.live, renditions, resolutionOptions, audioLanguages, subtitleLanguages,
      resolutionEvidence: resolutionOptions.length ? 'hls-manifest' : null,
      sizeEstimate: sizes.length ? { minimum: Math.min(...sizes.map(s=>s.minimum)), maximum: Math.max(...sizes.map(s=>s.maximum)),
        basis: master.variants.every(v=>!!v.averageBandwidth) ? 'average-bitrate' : 'peak-or-average-bitrate', durationSource } : null,
      ...(duration ? { duration, durationSource } : {}) };
  }
  let duration = master.duration, durationSource = duration ? 'playlist' : null, live = master.live;
  const variants = master.variants;
  let firstMedia = null, firstUrl = null;
  if (variants.length && !duration && !http.expired()) {
    const lowest = variants.slice().sort((a, b) => (a.bandwidth || Infinity) - (b.bandwidth || Infinity))[0];
    const sameOrigin = new URL(lowest.url).origin === new URL(url).origin;
    const headers = sameOrigin ? candidate.headers : Object.fromEntries(Object.entries(candidate.headers || {}).filter(([k]) => !/^(authorization|cookie)$/i.test(k)));
    const child = await http.text(lowest.url, { headers });
    const media = child && inspectPlaylist(child.text, child.url);
    firstMedia = media; firstUrl = lowest.url;
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
  const renditions = await mapLimit(variants.filter(v => v.dimensions).slice(0, 5), 2, async variant => {
    let media = variant.url === firstUrl ? firstMedia : null;
    if (!media && !http.expired()) {
      const child = await http.text(variant.url, { headers: requestHeaders(candidate, url, variant.url), timeoutMs: 2000 });
      media = child && inspectPlaylist(child.text, child.url);
    }
    const seconds = media?.duration || (media?.live ? null : duration);
    let estimate = seconds && (variant.averageBandwidth || variant.bandwidth) ? {
      minimum: Math.round((variant.averageBandwidth || variant.bandwidth) * seconds / 8),
      maximum: Math.round((variant.averageBandwidth || variant.bandwidth) * seconds / 8),
      basis: variant.averageBandwidth ? 'average-bitrate' : 'peak-bitrate', durationSource: media?.duration ? 'playlist' : durationSource
    } : null;
    // HEAD samples avoid fetching video segments into iOS's buffering bridge.
    // External audio would need separate measurement; use the advertised mux
    // average/peak rather than silently omitting its bytes.
    if (seconds && !variant.audioGroup && !variant.averageBandwidth && !http.expired()) {
      const sample = await sampledBytes(http, media, requestHeaders(candidate, url, variant.url), seconds, variant.url);
      if (sample) estimate = { minimum: sample.bytes, maximum: sample.bytes, basis: 'segment-samples', samples: sample.samples, durationSource: 'playlist' };
    }
    return { url: variant.url, dimensions: variant.dimensions, playlist: selectedMaster(master, variant), sizeEstimate: estimate,
      duration: seconds, subtitleLanguages:variantSubtitles(variant), audioLanguages: master.media.filter(m=>m.type==='AUDIO'&&m.group===variant.audioGroup&&m.language).map(m=>m.language),
      hasExternalAudio: !!variant.audioGroup, hasExternalSubtitles: !!variant.subtitlesGroup };
  });
  return { url, container: 'hls', dimensions: null, size: null, downloadable: false, live,
    renditions, audioLanguages, subtitleLanguages,
    resolutionOptions, resolutionEvidence: resolutionOptions.length ? 'hls-manifest' : null,
    sizeEstimate, ...(duration ? { duration, durationSource } : {}) };
}

module.exports = { attributes, inspectPlaylist, inspectHls, selectedMaster, profileAddress };
