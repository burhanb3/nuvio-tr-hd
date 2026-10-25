'use strict';
const { matchesIdentity } = require('./matching.cjs');
const { safeUrl, cleanHeaders } = require('./util.cjs');
const SERVICE_ORIGIN = 'https://nuvio-tr-hd.hayatimbitmiss.chatgpt.site';

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
        claimedQuality: String(c.claimedQuality || '').slice(0, 30), embeddedTurkish: c.embeddedTurkish === true, subtitles: [] },
      video: { url, container: v.container, downloadable: v.container !== 'hls', dimensions,
        size: Number.isSafeInteger(v.size) && v.size > 0 ? v.size : null, duration: Number(v.duration) || null },
      subtitles: (Array.isArray(pair.subtitles) ? pair.subtitles : []).slice(0, 4).filter(s => s?.language === 'tr' && safeUrl(s.url))
        .map(s => ({ url: safeUrl(s.url), language: 'tr', name: String(s.name || 'Türkçe').slice(0, 300), _score: Math.min(100, Math.max(0, Number(s._score) || 0)),
          ...(Object.keys(cleanHeaders(s.headers)).length ? { headers: cleanHeaders(s.headers) } : {}) }))
    };
  }).filter(Boolean);
}
module.exports = { loadHosted, SERVICE_ORIGIN };
