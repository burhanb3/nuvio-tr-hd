'use strict';
const { inspectContainer, mp4TailDimensions, ascii } = require('./containers.cjs');
const { opensubtitlesHash } = require('./hash.cjs');
const { inspectHls } = require('./hls.cjs');
function sameFile(first, second) {
  return first && second && first.total === second.total && (first.url === second.url ||
    (first.etag && !first.etag.startsWith('W/') && first.etag === second.etag));
}

async function probe(http, candidate, includeHls = false, hashEnabled = false) {
  const path = candidate.url.split(/[?#]/)[0].toLowerCase();
  if (/\.(mpd|torrent|zip|rar|exe)$/.test(path)) return null;
  const hlsUrl = /\.m3u8(?:$|[?#])/i.test(candidate.url);
  if (hlsUrl && !includeHls) return null;
  if (hlsUrl) {
    const playlist = await http.text(candidate.url, { headers: candidate.headers });
    if (!playlist || playlist.text.length > 131072 || !/\.m3u8(?:$|[?#])/i.test(playlist.url)) return null;
    const text = playlist.text.replace(/^\uFEFF/, '').trimStart();
    if (!text.startsWith('#EXTM3U') || !/#EXT-X-(STREAM-INF|TARGETDURATION):/.test(text)) return null;
    return inspectHls(http, text, playlist.url, candidate);
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
    return inspectHls(http, textPrefix, sample.url, candidate);
  }
  const info = inspectContainer(sample.bytes);
  if (!info) return null;
  const expectedDuration = candidate.identity?.runtimeMinutes * 60;
  if (info.duration && expectedDuration > 0 && (info.duration < expectedDuration * 0.7 || info.duration > expectedDuration * 1.35)) return null;
  if (/mpegurl|dash\+xml/.test(sample.mime) || /\.m3u8(?:$|[?#])/i.test(sample.url)) return null;
  const aliasMatches = info.container === 'mkv' ? /\.mkv(?:$|[?#])/i : /\.mp4(?:$|[?#])/i;
  const outputUrl = aliasMatches.test(candidate.downloadAlias || '') ? candidate.downloadAlias : sample.url;
  if (info.container === 'mkv' && !/\.mkv(?:$|[?#])/i.test(outputUrl)) return null;
  // Do not save MP4 data as .mkv or Matroska data as .mp4 in Nuvio downloads.
  if (info.container === 'mp4' && /\.mkv(?:$|[?#])/i.test(sample.url)) return null;
  if (info.container === 'mkv' && /\.mp4(?:$|[?#])/i.test(sample.url)) return null;
  let tailSample = null;
  if (!info.dimensions && info.container === 'mp4' && sample.total > sample.bytes.length && !http.expired()) {
    const start = Math.max(sample.bytes.length, sample.total - 262144);
    const tail = await http.bytes(candidate.url, candidate.headers, start, sample.total - 1);
    tailSample = tail;
    if (sameFile(sample, tail)) info.dimensions = mp4TailDimensions(tail.bytes);
  }
  let videoHash = null;
  if (hashEnabled && sample.total >= 131072 && !http.expired()) {
    if (!tailSample || tailSample.bytes.length < 65536) tailSample = await http.bytes(candidate.url, candidate.headers, sample.total - 65536, sample.total - 1);
    if (sameFile(sample, tailSample)) videoHash = opensubtitlesHash(sample.bytes, tailSample.bytes, sample.total);
  }
  return { ...info, url: outputUrl, size: sample.total, videoHash, downloadable: true };
}
module.exports = { probe };
