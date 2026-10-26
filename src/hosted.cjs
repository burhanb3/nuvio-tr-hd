'use strict';
const { matchesIdentity } = require('./matching.cjs');
const { safeUrl, cleanHeaders } = require('./util.cjs');
const { subtitleLanguage, selectSubtitles } = require('./subtitles.cjs');
const SERVICE_ORIGIN = 'https://nuvio-tr-hd-download-bridge.kamilbsr03.chatgpt.site';

async function loadHosted(http, target) {
  // Only public canonical metadata goes to our service. Personal catalogs,
  // addon addresses, TMDB keys and access headers never leave the phone here.
  const data = await http.json(SERVICE_ORIGIN + '/api/discover', { method: 'POST', timeoutMs: 16000,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) });
  if (data?.schema !== 1 || !matchesIdentity(data.target, target) || !Array.isArray(data.pairs)) return null;
  return data.pairs.slice(0, 40).map(pair => {
    const c = pair?.candidate, v = pair?.video;
    if (!c || !v || !matchesIdentity(c.identity, target) || !['mp4', 'mkv', 'hls'].includes(v.container)) return null;
    const url = safeUrl(v.url);
    if (!url || (v.container === 'hls' && !/\.m3u8(?:$|[?#])/i.test(url)) ||
      (v.container !== 'hls' && /\.(m3u8|mpd)(?:$|[?#])/i.test(url))) return null;
    const dimensions = Number.isInteger(v.dimensions?.width) && Number.isInteger(v.dimensions?.height) &&
      v.dimensions.width > 0 && v.dimensions.height > 0 && v.dimensions.width <= 16384 && v.dimensions.height <= 16384 ? v.dimensions : null;
    return {
      candidate: { url, filename: String(c.filename || '').slice(0, 300), source: String(c.source || 'Ortak kaynak').slice(0, 80),
        headers: cleanHeaders(c.headers), identity: target, identityConfidence: Number(c.identityConfidence) || 90,
        claimedQuality: String(c.claimedQuality || '').slice(0, 30), embeddedTurkish: c.embeddedTurkish === true, embeddedEnglish:c.embeddedEnglish===true, subtitles: [] },
      video: { url, container: v.container, downloadable: v.container !== 'hls', dimensions,
        resolutionOptions: (v.resolutionOptions || []).filter(d => Number.isInteger(d?.width) && Number.isInteger(d?.height) && d.width > 0 && d.height > 0 && d.width <= 16384 && d.height <= 16384).slice(0, 16),
        sizeEstimate: Number.isSafeInteger(v.sizeEstimate?.minimum) && Number.isSafeInteger(v.sizeEstimate?.maximum) && v.sizeEstimate.minimum > 0 && v.sizeEstimate.maximum >= v.sizeEstimate.minimum ? v.sizeEstimate : null,
        size: Number.isSafeInteger(v.size) && v.size > 0 ? v.size : null, duration: Number(v.duration) || null },
      subtitles: selectSubtitles((Array.isArray(pair.subtitles) ? pair.subtitles : []).slice(0, 100).filter(s => subtitleLanguage(s?.language) && safeUrl(s.url))
        .map(s => ({ url: safeUrl(s.url), language: subtitleLanguage(s.language), name: String(s.name || (subtitleLanguage(s.language)==='tr'?'Türkçe':'İngilizce')).slice(0, 300), _score: Math.min(100, Math.max(0, Number(s._score) || 0)),
          ...(Object.keys(cleanHeaders(s.headers)).length ? { headers: cleanHeaders(s.headers) } : {}) })))
    };
  }).filter(Boolean);
}
async function registerDownloads(http, candidates, target) {
  // Nuvio's default suffix for an extensionless URL is MP4. A source-declared
  // MP4 can therefore go straight to the real container probe, without waiting
  // for the optional MKV naming bridge. A real MKV will still be rejected.
  const direct = candidates.filter(c => /\.(mkv|mp4)(?:$|[?#])/i.test(c.url) || /\.mp4$/i.test(c.filename || ''));
  const pending = candidates.filter(c => !direct.includes(c)).slice(0, 3);
  if (!pending.length) return direct;
  const data = await http.json(SERVICE_ORIGIN + '/api/files', { method: 'POST', timeoutMs: 6500,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target,
      candidates: pending.map(c => ({ url: c.url, filename: target.type === 'tv' && !String(c.filename).includes(String(target.year)) ?
        `${target.originalTitle}.${target.year}.${String(c.filename).replace(/^[^.]+\./, '')}` : c.filename })) }) });
  if (data?.schema !== 1 || !matchesIdentity(data.target, target) || !Array.isArray(data.files)) return direct;
  for (const entry of data.files) {
    const candidate = pending.find(c => c.url === entry.url);
    const alias = safeUrl(entry.downloadAlias);
    if (candidate && alias && new URL(alias).origin === SERVICE_ORIGIN && /^\/files\/[a-f0-9]{64}\.(mkv|mp4)$/.test(new URL(alias).pathname))
      direct.push({ ...candidate, downloadAlias: alias });
  }
  return direct;
}
module.exports = { loadHosted, registerDownloads, SERVICE_ORIGIN };
