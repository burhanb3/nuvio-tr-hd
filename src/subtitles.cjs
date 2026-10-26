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

async function subtitleSlot(http, task) {
  const pool=http.subtitlePool||(http.subtitlePool={active:0,waiting:[]});
  if(pool.active>=4)await new Promise(resolve=>pool.waiting.push(resolve));else pool.active++;
  try{return http.expired()?null:await task();}
  finally{if(pool.waiting.length)pool.waiting.shift()();else pool.active--;}
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
  }).slice(0, 12);
  const loadTrack = async (sub, index) => {
    if (http.expired()) return null;
    const url = safeUrl(sub.url, candidate.subtitleBase, allowHttp);
    // Subtitle credentials are explicit; video credentials never cross over.
    const headers = cleanHeaders(sub.headers);
    const key = url + JSON.stringify(headers);
    if (!http.subtitleCache) http.subtitleCache = new Map();
    if (!http.subtitleCache.has(key)) http.subtitleCache.set(key, subtitleSlot(http, async () => {
      const result = await http.request(url, { headers, timeoutMs: 9000, nativeGroup:'subtitle-body' });
      if (!result || /html|zip|gzip|json/.test(result.response.headers.get('content-type') || '')) return null;
      const bytes = new Uint8Array(await result.response.arrayBuffer());
      if (!bytes.length || bytes.length > 262144) return null;
      // Decode/inspect a shared body once per search, rather than once for
      // every video mirror. Diagnostics contain counts/flags, never cue text.
      const text = decodeUtf8(bytes), format = text && subtitleFormat(text);
      http.note?.({ stage: 'subtitle_text', invalidUtf8: text === null,
        turkishCharacters: /[şŞğĞıİçÇöÖüÜ]/.test(text || ''), combiningCharacters: /[\u0300-\u036f]/.test(text || ''),
        inlineFont: /<font\b|font-family\s*:|\{\\fn/i.test(text || ''), mojibake: /Å[ŸžŞş]|Ä[±°Ÿž]|Ã[¶¼§–œ‡]/.test(text || '') });
      return format ? { bytes, url: result.url, text, format } : null;
    }));
    const result = await http.subtitleCache.get(key);
    if (!result) return null;
    // Nuvio decodes UTF-8; reject compressed/HTML bodies and malformed cues.
    const { text, format } = result;
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
    const provider = sub._subtitleProvider ? ` · ${sub._subtitleProvider}` : '';
    return { url: result.url, language: 'tr', name: `Türkçe · ${format.toUpperCase()}${provider} · ${String(index + 1).padStart(2, '0')} · ${release}${fps}${label}`,
      _contentKey: result.bytes.length + ':' + fingerprint,
      ...(options.keepScore ? { _score: match?.score || 90 } : {}), ...(Object.keys(headers).length ? { headers } : {}) };
  };
  const tracks = [], collected = new Set();
  const acceptTrack = track => {
    if(!track||collected.has(track._contentKey)||tracks.length>=4)return;
    collected.add(track._contentKey);tracks.push(track);
    // Keep a validated fast track even if another body in the same batch stalls.
    if(options.onTrack)options.onTrack(track);
  };
  // Try later alternatives when an earlier URL is broken. Stop after four
  // distinct valid bodies, instead of waiting on every subtitle in a release.
  for (let offset = 0; offset < entries.length && tracks.length < 4 && !http.expired(); offset += 2) {
    await mapLimit(entries.slice(offset, offset + 2), 2, async (sub,index) => acceptTrack(await loadTrack(sub,offset+index)));
  }
  // Same payload mirrored at two URLs is one subtitle, not two choices.
  const contents = new Set();
  return tracks.filter(t => { if (!t || contents.has(t._contentKey)) return false; contents.add(t._contentKey); return true; })
    .sort((a,b)=>(b._score||0)-(a._score||0)).slice(0, 4).map(({ _contentKey, ...track }) => track);
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
