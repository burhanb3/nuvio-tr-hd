'use strict';
const { inspectContainer, mp4TailInfo, mp4MetadataOffset, mp4MetadataInfo, ascii } = require('./containers.cjs');
const { opensubtitlesHash } = require('./hash.cjs');
const { inspectHls } = require('./hls.cjs');
function sameFile(first, second) {
  return first && second && first.total === second.total && (first.url === second.url ||
    (first.etag && !first.etag.startsWith('W/') && first.etag === second.etag));
}
function nativeExtension(url) {
  // DownloadsRepository strips query/fragment before taking the final suffix.
  // A query ending in .mkv cannot fix an otherwise extensionless Matroska URL.
  const suffix=String(url||'').split(/[?#]/)[0].split('.').pop().toLowerCase().trim();
  return /^[a-z0-9]{2,5}$/.test(suffix)?suffix:'mp4';
}

async function probeOne(http, candidate, includeHls = false, hashEnabled = false, options = {}) {
  const path = candidate.url.split(/[?#]/)[0].toLowerCase();
  if (/\.(mpd|torrent|zip|rar|exe)$/.test(path)) return null;
  const hlsUrl = /\.m3u8(?:$|[?#])/i.test(candidate.url);
  if (hlsUrl && !includeHls) return null;
  if (hlsUrl) {
    const cached = candidate.source === 'VixSrc' && candidate.hlsMaster;
    const playlist = cached && cached.url === candidate.url && typeof cached.text === 'string' ? cached : await http.text(candidate.url, { headers: candidate.headers });
    // Long signed segment names can make a valid feature playlist >128 KiB.
    // Still bounded by http.text and below the native bridge's body limit.
    if (!playlist || playlist.text.length > 700000 || !/\.m3u8(?:$|[?#])/i.test(playlist.url)) return null;
    const text = playlist.text.replace(/^\uFEFF/, '').trimStart();
    if (!text.startsWith('#EXTM3U') || !/#EXT-X-(STREAM-INF|TARGETDURATION):/.test(text)) return null;
    return inspectHls(http, text, playlist.url, candidate, { detailed: options.detailedHls });
  }
  // The range GET already supplies type, size and actual container bytes.
  // A separate HEAD adds a native job and may reject valid signed GET links.
  // Every GET still enforces permissions, ranges, bounded bodies and format.
  // YourUpload performs an extra public CDN redirect. Allow that hop within
  // the existing search deadline; all other sources keep their normal limit.
  let dataUrl = candidate.url;
  const supplemental = ['AniMOM','SeiCode'].includes(candidate.source);
  const bytes = (start, end, timeoutMs) => http.bytes(dataUrl, candidate.headers, start, end,
    supplemental ? { timeoutMs: timeoutMs || (candidate.source==='AniMOM'?7000:4500) } : {});
  const sample = await bytes();
  if (!sample) return null;
  // Read the rest from the exact server that returned the first bytes. A
  // rotating redirect can otherwise send each range to a different replica.
  // This is also the URL we already return for playback/download.
  dataUrl = sample.url;
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
  const outputUrl = candidate.downloadAlias && nativeExtension(candidate.downloadAlias)===info.container ? candidate.downloadAlias : sample.url;
  if (nativeExtension(outputUrl)!==info.container) return null;
  // Do not save MP4 data as .mkv or Matroska data as .mp4 in Nuvio downloads.
  const sampleExtension=nativeExtension(sample.url);
  if (info.container === 'mp4' && sampleExtension==='mkv') return null;
  if (info.container === 'mkv' && /\.mp4$/i.test(sample.url.split(/[?#]/)[0])) return null;
  let tailSample = null;
  let optionalMetadataFailed = false;
  if (info.container === 'mp4' && (!info.dimensions || candidate.requireDuration && !info.duration) && !http.expired()) {
    const offset = mp4MetadataOffset(sample.bytes, sample.total);
    if (offset !== null) {
      const metadata = await bytes(offset, Math.min(sample.total - 1, offset + 262143),3000);
      if (supplemental && !metadata) optionalMetadataFailed = true;
      if (sameFile(sample, metadata)) {
        const extra = mp4MetadataInfo(metadata.bytes, sample.total - offset);
        if (extra?.invalidVideo) return null;
        if (extra?.dimensions) info.dimensions = extra.dimensions;
        if (extra?.duration && !info.duration) info.duration = extra.duration;
        if (extra?.audioLanguages?.length && !info.audioLanguages?.length) info.audioLanguages = extra.audioLanguages;
      }
    }
  }
  if ((!info.dimensions || (candidate.requireDuration && !info.duration)) && !optionalMetadataFailed && info.container === 'mp4' && sample.total > sample.bytes.length && !http.expired()) {
    const start = Math.max(sample.bytes.length, sample.total - 262144);
    const tail = await bytes(start, sample.total - 1,3000);
    tailSample = tail;
    if (supplemental && !tail) optionalMetadataFailed = true;
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
  if ((hashEnabled || candidate.expectedFile) && !optionalMetadataFailed && sample.total >= 131072 && !http.expired()) {
    if (!tailSample || tailSample.bytes.length < 65536) tailSample = await bytes(sample.total - 65536, sample.total - 1,3000);
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
  const attempts = candidate.source === 'AniMOM' ? [candidate.url,candidate.url] : [...new Set([candidate.url,...replicas])];
  for (const [index,url] of attempts.entries()) {
    if (http.expired()) return null;
    const video = await probeOne(http, { ...candidate, url }, includeHls, hashEnabled, options);
    if (video) return video;
    if ([401,403,429].includes(http.failureFor?.(url)?.status)) return null;
    // The official YourUpload redirect rotates CDN nodes. Refresh it once only
    // after a network failure, within the same deadline and physical quota.
    if (candidate.source === 'AniMOM' && index === 0 && http.failureFor?.(url)?.reason !== 'timeout_or_network') return null;
  }
  return null;
}
module.exports = { probe };
