'use strict';
const { inspectContainer, mp4TailInfo, ascii } = require('./containers.cjs');
const { opensubtitlesHash } = require('./hash.cjs');
const { inspectHls } = require('./hls.cjs');
function sameFile(first, second) {
  return first && second && first.total === second.total && (first.url === second.url ||
    (first.etag && !first.etag.startsWith('W/') && first.etag === second.etag));
}

async function probeOne(http, candidate, includeHls = false, hashEnabled = false, options = {}) {
  const path = candidate.url.split(/[?#]/)[0].toLowerCase();
  if (/\.(mpd|torrent|zip|rar|exe)$/.test(path)) return null;
  const hlsUrl = /\.m3u8(?:$|[?#])/i.test(candidate.url);
  if (hlsUrl && !includeHls) return null;
  if (hlsUrl) {
    const cached = candidate.source === 'VixSrc' && candidate.hlsMaster;
    const playlist = cached && cached.url === candidate.url && typeof cached.text === 'string' ? cached : await http.text(candidate.url, { headers: candidate.headers });
    if (!playlist || playlist.text.length > 131072 || !/\.m3u8(?:$|[?#])/i.test(playlist.url)) return null;
    const text = playlist.text.replace(/^\uFEFF/, '').trimStart();
    if (!text.startsWith('#EXTM3U') || !/#EXT-X-(STREAM-INF|TARGETDURATION):/.test(text)) return null;
    return inspectHls(http, text, playlist.url, candidate, { detailed: options.detailedHls });
  }
  // S3/R2 presigned GET links sign the HTTP method. HEAD on a working GET
  // URL can legitimately be 403; inspect only a bounded GET range instead.
  const signedGet = /[?&]X-Amz-Algorithm=AWS4-HMAC-SHA256(?:&|$)/i.test(candidate.url) && /[?&]X-Amz-Signature=[a-f0-9]{64}(?:&|$)/i.test(candidate.url);
  const head = signedGet || candidate.getOnly === true ? null : await http.request(candidate.url, { method: 'HEAD', headers: candidate.headers });
  if (!head && [401, 403, 404, 410, 429].includes(http.failureFor?.(candidate.url)?.status)) return null;
  const mime = (head?.response.headers.get('content-type') || '').toLowerCase();
  if (/html|json/.test(mime)) return null;
  if (/mpegurl/.test(mime) && !includeHls) return null;
  const sample = await http.bytes(candidate.url, candidate.headers);
  if (!sample) return null;
  const textPrefix = ascii(sample.bytes, 0, Math.min(sample.bytes.length, 2048)).replace(/^\u00ef\u00bb\u00bf/, '').trimStart();
  if (textPrefix.startsWith('#EXTM3U')) {
    // Nuvio's download filter relies on the URL extension. Never expose an
    // extensionless HLS URL that its download UI would mistake for an MP4.
    if (!includeHls || !/\.m3u8(?:$|[?#])/i.test(sample.url) || !/#EXT-X-(STREAM-INF|TARGETDURATION):/.test(textPrefix)) return null;
    return inspectHls(http, textPrefix, sample.url, candidate, { detailed: options.detailedHls });
  }
  const info = inspectContainer(sample.bytes);
  if (!info) return null;
  const expectedDuration = candidate.identity?.runtimeMinutes * 60;
  if (/mpegurl|dash\+xml/.test(sample.mime) || /\.m3u8(?:$|[?#])/i.test(sample.url)) return null;
  const aliasMatches = info.container === 'mkv' ? /\.mkv(?:$|[?#])/i : /\.mp4(?:$|[?#])/i;
  const outputUrl = aliasMatches.test(candidate.downloadAlias || '') ? candidate.downloadAlias : sample.url;
  if (info.container === 'mkv' && !/\.mkv(?:$|[?#])/i.test(outputUrl)) return null;
  // Do not save MP4 data as .mkv or Matroska data as .mp4 in Nuvio downloads.
  if (info.container === 'mp4' && /\.mkv(?:$|[?#])/i.test(sample.url)) return null;
  if (info.container === 'mkv' && /\.mp4(?:$|[?#])/i.test(sample.url)) return null;
  let tailSample = null;
  if ((!info.dimensions || (candidate.requireDuration && !info.duration)) && info.container === 'mp4' && sample.total > sample.bytes.length && !http.expired()) {
    const start = Math.max(sample.bytes.length, sample.total - 262144);
    const tail = await http.bytes(candidate.url, candidate.headers, start, sample.total - 1);
    tailSample = tail;
    if (sameFile(sample, tail)) {
      const extra = mp4TailInfo(tail.bytes);
      if (extra?.invalidVideo) return null;
      if (extra?.dimensions && !info.dimensions) info.dimensions = extra.dimensions;
      if (extra?.duration && !info.duration) info.duration = extra.duration;
      if (extra?.audioLanguages?.length && !info.audioLanguages?.length) info.audioLanguages = extra.audioLanguages;
    }
  }
  if (candidate.requireDuration && !info.duration) return null;
  const durationTolerance = candidate.durationTolerance === 0.1 ? { low: 0.9, high: 1.1 } : { low: 0.7, high: 1.35 };
  if (info.duration && expectedDuration > 0 && (info.duration < expectedDuration * durationTolerance.low || info.duration > expectedDuration * durationTolerance.high)) return null;
  let videoHash = null;
  if ((hashEnabled || candidate.expectedFile) && sample.total >= 131072 && !http.expired()) {
    if (!tailSample || tailSample.bytes.length < 65536) tailSample = await http.bytes(candidate.url, candidate.headers, sample.total - 65536, sample.total - 1);
    if (sameFile(sample, tailSample)) videoHash = opensubtitlesHash(sample.bytes, tailSample.bytes, sample.total);
  }
  const pinned = candidate.expectedFile;
  if (pinned && (sample.total !== pinned.size || !videoHash || videoHash !== pinned.hash ||
    info.dimensions?.width !== pinned.width || info.dimensions?.height !== pinned.height ||
    !info.duration || Math.abs(info.duration - pinned.duration) > 0.5)) return null;
  return { ...info, url: outputUrl, size: sample.total, videoHash, downloadable: true };
}
async function probe(http, candidate, includeHls = false, hashEnabled = false, options = {}) {
  const canUseReplicas = candidate.source === 'Internet Archive' && !Object.keys(candidate.headers || {}).some(k => /^(authorization|cookie)$/i.test(k));
  const replicas = canUseReplicas && Array.isArray(candidate.alternateUrls) ? candidate.alternateUrls.filter(url => {
    try { const u=new URL(url),original=new URL(candidate.url);return u.protocol==='https:' && /^[a-z]{2}\d{4,8}\.(?:us|eu|ca)\.archive\.org$/.test(u.hostname) && u.pathname===original.pathname && u.search===original.search; } catch { return false; }
  }).slice(0,1) : [];
  for (const url of [...new Set([candidate.url,...replicas])]) {
    if (http.expired()) return null;
    const video = await probeOne(http, { ...candidate, url }, includeHls, hashEnabled, options);
    if (video) return video;
    if ([401,403,429].includes(http.failureFor?.(url)?.status)) return null;
  }
  return null;
}
module.exports = { probe };
