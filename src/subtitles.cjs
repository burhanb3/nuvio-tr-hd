'use strict';
const { safeUrl, cleanHeaders, mapLimit } = require('./util.cjs');
const { matchesIdentity } = require('./matching.cjs');

function isTurkish(language) {
  return subtitleLanguage(language) === 'tr';
}
function subtitleLanguage(value) {
  const language=String(value||'').trim();
  if(/^(tr|tur|turkish|türkçe|turkce)(?:[-_].*)?$/i.test(language))return 'tr';
  return /^(en|eng|english|ingilizce|İngilizce)(?:[-_].*)?$/i.test(language) ? 'en' : null;
}
function subtitleKey(track) {
  return track.url+JSON.stringify(Object.entries(cleanHeaders(track.headers)).sort());
}
function selectSubtitles(tracks, perLanguage = 4) {
  const seen=new Set(),contents=new Set(),counts={tr:0,en:0},result=[];
  for(const track of tracks.slice().sort((a,b)=>
    (subtitleLanguage(a.language)==='en'?1:0)-(subtitleLanguage(b.language)==='en'?1:0)||(b._score||0)-(a._score||0))) {
    const language=subtitleLanguage(track.language);
    const key=subtitleKey(track);
    if(!language||counts[language]>=perLanguage||seen.has(key)||track._contentKey&&contents.has(track._contentKey))continue;
    seen.add(key);if(track._contentKey)contents.add(track._contentKey);counts[language]++;result.push(track);
  }
  return result;
}
function embeddedSubtitleLanguages(video, candidate = {}) {
  // A selected HLS profile's groups are authoritative; a master-level flag
  // must not leak a language from another profile's subtitle group.
  if(Array.isArray(video.subtitleLanguages))return [...new Set(video.subtitleLanguages.map(subtitleLanguage).filter(Boolean))];
  return [...new Set([...(video.subtitleTracks||[]).map(t=>subtitleLanguage(t.language)),
    video.embeddedTurkish||candidate.embeddedTurkish?'tr':null,video.embeddedEnglish||candidate.embeddedEnglish?'en':null].filter(Boolean))];
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

async function subtitleSlot(http, task, language) {
  const key=language==='en'?'subtitleEnglishPool':'subtitlePool',limit=language==='en'?1:4;
  const pool=http[key]||(http[key]={active:0,waiting:[]});
  if(pool.active>=limit)await new Promise(resolve=>pool.waiting.push(resolve));else pool.active++;
  try{return http.expired()?null:language==='en'?await subtitleSlot(http,task):await task();}
  finally{if(pool.waiting.length)pool.waiting.shift()();else pool.active--;}
}

async function loadSubtitles(http, candidate, target, allowHttp, options = {}) {
  const seen = new Set();
  const entries = candidate.subtitles.slice(0, 240).sort((a,b)=>(subtitleLanguage(a?.language||a?.lang||a?.lang_code)==='en'?1:0)-(subtitleLanguage(b?.language||b?.lang||b?.lang_code)==='en'?1:0)).filter(sub => {
    if (!sub || !subtitleLanguage(sub.language || sub.lang || sub.lang_code)) return false;
    if (sub.identity && !matchesIdentity(sub.identity, target)) return false;
    const url = safeUrl(sub.url, candidate.subtitleBase, allowHttp);
    const key=subtitleKey({...sub,url});
    if (!url || seen.has(key) || /\.(zip|ass|ssa|rar)(?:\/?$|[?#])/i.test(url)) return false;
    seen.add(key);
    return true;
  }).sort((a,b)=>(subtitleLanguage(a.language||a.lang||a.lang_code)==='en'?1:0)-(subtitleLanguage(b.language||b.lang||b.lang_code)==='en'?1:0));
  const limits={tr:12,en:8},ordinals={tr:0,en:0};
  const selected=entries.filter(sub=>--limits[subtitleLanguage(sub.language||sub.lang||sub.lang_code)]>=0)
    .map(sub=>({...sub,_ordinal:++ordinals[subtitleLanguage(sub.language||sub.lang||sub.lang_code)]}));
  const loadTrack = async (sub, index) => {
    if (http.expired()) return null;
    const url = safeUrl(sub.url, candidate.subtitleBase, allowHttp);
    // Subtitle credentials are explicit; video credentials never cross over.
    const headers = cleanHeaders(sub.headers);
    const key = url + JSON.stringify(headers);
    if (!http.subtitleCache) http.subtitleCache = new Map();
    if (!http.subtitleCache.has(key)) http.subtitleCache.set(key, subtitleSlot(http, async () => {
      const language=subtitleLanguage(sub.language||sub.lang||sub.lang_code);
      const result = await http.request(url, { headers, timeoutMs: 9000, nativeGroup:language==='en'?'subtitle-body-en':'subtitle-body' });
      if (!result || /html|zip|gzip|json/.test(result.response.headers.get('content-type') || '')) return null;
      const bytes = new Uint8Array(await result.response.arrayBuffer());
      if (!bytes.length || bytes.length > 262144) return null;
      // Decode/inspect a shared body once per search, rather than once for
      // every video mirror. Diagnostics contain counts/flags, never cue text.
      const text = decodeUtf8(bytes), format = text && subtitleFormat(text);
      http.note?.({ stage: 'subtitle_text', invalidUtf8: text === null,
        turkishCharacters: /[şŞğĞıİçÇöÖüÜ]/.test(text || ''), combiningCharacters: /[\u0300-\u036f]/.test(text || ''),
        inlineFont: /<font\b|font-family\s*:|\{\\fn/i.test(text || ''), mojibake: /Å[ŸžŞş]|Ä[±°Ÿž]|Ã[¶¼§–œ‡]/.test(text || '') });
      // Nuvio downloads the original URL again. We cannot repair its remote
      // bytes here, but can skip broken encodings in favour of clean tracks.
      const corrupted = /\uFFFD|Å[ŸžŞş]|Ä[±°Ÿž]|Ã[¶¼§–œ‡]/.test(text || '');
      if(!format||corrupted)return null;
      let fingerprint=2166136261;
      for(const byte of bytes)fingerprint=Math.imul(fingerprint^byte,16777619)>>>0;
      // Keep only the reusable evidence, not every full subtitle body. Many
      // quality/mirror choices share the same cues in a memory-limited VM.
      return {url:result.url,format,lastCue:lastCueSeconds(text),contentKey:bytes.length+':'+fingerprint};
    },subtitleLanguage(sub.language||sub.lang||sub.lang_code)));
    const result = await http.subtitleCache.get(key);
    if (!result) return null;
    // Nuvio decodes UTF-8; reject compressed/HTML bodies and malformed cues.
    const { format } = result;
    let match = sub._match;
    if (match?.requireDuration) {
      const last = result.lastCue, duration = options.videoDuration;
      const close = duration > 0 && last / duration >= 0.9 && last / duration <= 1.01 && Math.abs(duration - last) <= 420;
      if (close) match = { score: 65 + Math.max(0,4-Math.floor(Math.abs(duration-last)/60)), label: 'Süre uyumu; senkron doğrulanmadı' };
      else if (match.allowFilmFallback && duration > 0 && last / duration >= 0.75 && last / duration <= 1.03)
        match = { score: 35, label: 'Aynı film; sürüm/senkron belirsiz' };
      else return null;
    }
    const label = match ? ` · ${match.label}` : '';
    const release = String(sub.releaseName || sub.subtitleFileName || sub.title || sub.movieReleaseName || sub.name || 'Alternatif altyazı')
      .replace(/[\r\n\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').slice(0, 130);
    const fps = Number(sub.fpsMilli) > 0 ? ` · ${(Number(sub.fpsMilli) / 1000).toFixed(3)} fps` : '';
    const provider = sub._subtitleProvider ? ` · ${sub._subtitleProvider}` : '';
    const language=subtitleLanguage(sub.language||sub.lang||sub.lang_code),languageName=language==='tr'?'Türkçe':'İngilizce';
    return { url: result.url, language, name: `${languageName} · ${format.toUpperCase()}${provider} · ${String(sub._ordinal || index + 1).padStart(2, '0')} · ${release}${fps}${label}`,
      _contentKey: result.contentKey,
      ...(options.keepScore ? { _score: match?.score || 90 } : {}), ...(Object.keys(headers).length ? { headers } : {}) };
  };
  const tracks = [], collected = new Set();
  const acceptTrack = track => {
    if(!track||collected.has(track._contentKey)||tracks.filter(t=>t.language===track.language).length>=4)return;
    collected.add(track._contentKey);tracks.push(track);
    // Keep a validated fast track even if another body in the same batch stalls.
    if(options.onTrack)options.onTrack(track);
  };
  // Try later alternatives when an earlier URL is broken. Stop after four
  // distinct valid bodies, instead of waiting on every subtitle in a release.
  for (let offset = 0; offset < selected.length && tracks.length < 8 && !http.expired(); offset += 2) {
    await mapLimit(selected.slice(offset, offset + 2).filter(sub=>tracks.filter(t=>t.language===subtitleLanguage(sub.language||sub.lang||sub.lang_code)).length<4),2,
      async (sub,index) => acceptTrack(await loadTrack(sub,offset+index)));
  }
  // Same payload mirrored at two URLs is one subtitle, not two choices.
  const contents = new Set();
  return selectSubtitles(tracks.filter(t => { if (!t || contents.has(t._contentKey)) return false; contents.add(t._contentKey); return true; }))
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
module.exports = { isTurkish, subtitleLanguage, subtitleKey, selectSubtitles, embeddedSubtitleLanguages, subtitleFormat, loadSubtitles, decodeUtf8, lastCueSeconds };
