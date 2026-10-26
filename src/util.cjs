'use strict';

function positiveInt(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

function normalizeTitle(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/İ/g, 'i').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u0400-\u9fff]+/g, ' ').trim();
}

// Nuvio's URL polyfill does not normalize .href or implement writable setters.
// Resolve paths here; use its read-only parser only for scheme/host validation.
function safeUrl(value, base, allowHttp = false) {
  if (typeof value !== 'string' || !value.trim() || /[\s\\\x00-\x1f]/.test(value)) return null;
  let url = value.trim();
  if (!/^https?:\/\//i.test(url) && base) {
    const m = base.match(/^(https?:)\/\/([^/]+)(\/[^?#]*)?/i);
    if (!m) return null;
    if (url.startsWith('//')) url = m[1] + url;
    else if (url.startsWith('/')) url = m[1] + '//' + m[2] + url;
    else url = m[1] + '//' + m[2] + (m[3] || '/').replace(/[^/]*$/, '') + url;
  }
  const match = url.match(/^(https?):\/\/([^/?#]+)([^?#]*)(\?[^#]*)?(?:#.*)?$/i);
  if (!match || (!allowHttp && match[1].toLowerCase() !== 'https') || /@/.test(match[2])) return null;
  if (/[<>"'{}|^`]/.test(url)) return null;
  const segments = [];
  for (const part of (match[3] || '/').split('/')) {
    if (part === '..') segments.pop();
    else if (part !== '.') segments.push(part);
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || !/^https?:$/.test(parsed.protocol)) return null;
  } catch { return null; }
  return match[1].toLowerCase() + '://' + match[2] + (segments.join('/') || '/') + (match[4] || '');
}

function cleanHeaders(value) {
  const headers = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return headers;
  for (const [key, val] of Object.entries(value).slice(0, 30)) {
    if (!/^[A-Za-z0-9-]{1,80}$/.test(key) || /^(host|content-length|range|accept-encoding|connection)$/i.test(key)) continue;
    if (typeof val === 'string' && val.length <= 4096 && !/[\r\n\x00]/.test(val)) headers[key] = val;
  }
  return headers;
}

function mergeHeaders(...values) {
  const map = new Map();
  for (const value of values) for (const [k, v] of Object.entries(cleanHeaders(value))) map.set(k.toLowerCase(), [k, v]);
  return Object.fromEntries(map.values());
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      try { results[i] = await fn(items[i], i); } catch { results[i] = null; }
    }
  }));
  return results.filter(x => x != null);
}

function qualityLabel(dimensions) {
  if (!dimensions || !positiveInt(dimensions.width) || !positiveInt(dimensions.height)) return 'Bilinmiyor';
  const long=Math.max(dimensions.width,dimensions.height),short=Math.min(dimensions.width,dimensions.height);
  // Common widescreen encodes crop black bars (1920x800 is a 1080p encode).
  // Nonstandard widths retain their actual short edge, rather than inventing
  // a standard width from a filename. Portrait footage works the same way.
  const standard=[[7680,4320],[3840,2160],[2560,1440],[1920,1080],[1280,720],[854,480],[640,360],[426,240]]
    .find(([width,height])=>Math.abs(long-width)/width<=0.02&&short>=height*0.6&&short<=height*1.03);
  return `${standard?standard[1]:short}p`;
}

module.exports = { positiveInt, normalizeTitle, safeUrl, cleanHeaders, mergeHeaders, mapLimit, qualityLabel };
