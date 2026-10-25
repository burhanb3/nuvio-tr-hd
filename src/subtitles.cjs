'use strict';
const { safeUrl, cleanHeaders, mapLimit } = require('./util.cjs');
const { matchesIdentity } = require('./matching.cjs');

function isTurkish(language) {
  return /^(tr|tur|turkish|türkçe|turkce)(?:[-_].*)?$/i.test(String(language || '').trim());
}
function subtitleFormat(text) {
  const clean = text.replace(/^\uFEFF/, '').trimStart();
  if (/^WEBVTT(?:[ \t\r\n]|$)/.test(clean) && /(?:\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(?:\d{2}:)?\d{2}:\d{2}\.\d{3}/.test(clean)) return 'vtt';
  if (/(?:^|\n)\s*\d+\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}/.test(clean)) return 'srt';
  return null;
}

function lastCueSeconds(text) {
  let last = 0;
  for (const match of text.matchAll(/-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})/g)) {
    last = Math.max(last, Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000);
  }
  return last;
}

async function loadSubtitles(http, candidate, target, allowHttp, options = {}) {
  const seen = new Set();
  const entries = candidate.subtitles.slice(0, 120).filter(sub => {
    if (!sub || !isTurkish(sub.language || sub.lang)) return false;
    if (sub.identity && !matchesIdentity(sub.identity, target)) return false;
    const url = safeUrl(sub.url, candidate.subtitleBase, allowHttp);
    if (!url || seen.has(url) || /\.(zip|ass|ssa|rar)(?:\/?$|[?#])/i.test(url)) return false;
    seen.add(url);
    return true;
  }).slice(0, 4);
  const tracks = await mapLimit(entries, 2, async (sub, index) => {
    if (http.expired()) return null;
    const url = safeUrl(sub.url, candidate.subtitleBase, allowHttp);
    // Subtitle credentials are explicit; video credentials never cross over.
    const headers = cleanHeaders(sub.headers);
    const key = url + JSON.stringify(headers);
    if (!http.subtitleCache) http.subtitleCache = new Map();
    if (!http.subtitleCache.has(key)) http.subtitleCache.set(key, (async () => {
      const result = await http.request(url, { headers, timeoutMs: 9000 });
      if (!result || /html|zip|gzip|json/.test(result.response.headers.get('content-type') || '')) return null;
      const bytes = new Uint8Array(await result.response.arrayBuffer());
      if (!bytes.length || bytes.length > 262144) return null;
      return { bytes, url: result.url };
    })());
    const result = await http.subtitleCache.get(key);
    if (!result) return null;
    // Nuvio decodes UTF-8; reject compressed/HTML bodies and malformed cues.
    const text = await decodeUtf8(result.bytes);
    const format = text && subtitleFormat(text);
    if (!format) return null;
    let match = sub._match;
    if (match?.requireDuration) {
      const last = lastCueSeconds(text), duration = options.videoDuration;
      const close = duration > 0 && last / duration >= 0.9 && last / duration <= 1.01 && Math.abs(duration - last) <= 420;
      if (close) match = { score: 65, label: 'Süre uyumu; senkron doğrulanmadı' };
      else if (match.allowFilmFallback && duration > 0 && last / duration >= 0.75 && last / duration <= 1.03)
        match = { score: 35, label: 'Aynı film; sürüm/senkron belirsiz' };
      else return null;
    }
    const label = match ? ` · ${match.label}` : '';
    const release = String(sub.releaseName || sub.subtitleFileName || sub.title || sub.movieReleaseName || sub.name || 'Alternatif altyazı')
      .replace(/[\r\n\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').slice(0, 130);
    const fps = Number(sub.fpsMilli) > 0 ? ` · ${(Number(sub.fpsMilli) / 1000).toFixed(3)} fps` : '';
    let fingerprint = 2166136261;
    for (const byte of result.bytes) fingerprint = Math.imul(fingerprint ^ byte, 16777619) >>> 0;
    return { url: result.url, language: 'tr', name: `Türkçe · ${format.toUpperCase()} · ${String(index + 1).padStart(2, '0')} · ${release}${fps}${label}`,
      _contentKey: result.bytes.length + ':' + fingerprint,
      ...(options.keepScore ? { _score: match?.score || 90 } : {}), ...(Object.keys(headers).length ? { headers } : {}) };
  });
  // Same payload mirrored at two URLs is one subtitle, not two choices.
  const contents = new Set();
  return tracks.filter(t => { if (!t || contents.has(t._contentKey)) return false; contents.add(t._contentKey); return true; })
    .map(({ _contentKey, ...track }) => track);
}

function decodeUtf8(bytes) {
  try {
    // QuickJS/Nuvio TextDecoder support varies. This avoids a Node dependency.
    let encoded = '';
    for (const b of bytes) encoded += '%' + b.toString(16).padStart(2, '0');
    return decodeURIComponent(encoded);
  } catch { return null; }
}
module.exports = { isTurkish, subtitleFormat, loadSubtitles, decodeUtf8, lastCueSeconds };
