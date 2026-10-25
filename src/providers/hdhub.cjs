'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('../util.cjs');
const { anchors } = require('./directory.cjs');
const { decodeUtf8 } = require('../subtitles.cjs');
const HDHUB_ORIGIN = 'https://4khdhub.one';

function decode64(value) {
  if (typeof value !== 'string' || value.length > 30000) return null;
  try { return decodeUtf8(Uint8Array.from(atob(value), c => c.charCodeAt(0))); } catch { return null; }
}
function shortlinkTarget(html) {
  // Public URL encoding used by this shortener, not script execution. Read
  // only its data literal; no cookies, challenge solving, or remote eval.
  const value = html.match(/s\('o','([A-Za-z0-9+/=]+)'/)?.[1];
  try {
    const inner = decode64(decode64(value));
    if (!inner) return null;
    const rotated = inner.replace(/[A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13)));
    const data = JSON.parse(decode64(rotated));
    const url = safeUrl(decode64(data.o));
    return url && /^hubcloud\.[a-z.]+$/i.test(new URL(url).hostname) ? url : null;
  } catch { return null; }
}
function pageMatches(html, target) {
  const id = html.match(/\bdefaultVideoId\s*=\s*['"](\d+)['"]/)?.[1];
  if (Number(id) !== target.tmdbId) return false;
  for (const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(block[1]);
      if (data['@type'] === 'Movie' && normalizeTitle(data.name) === normalizeTitle(target.originalTitle) && Number(String(data.datePublished).slice(0, 4)) === target.year) return true;
    } catch {}
  }
  return false;
}
function releaseEntries(html, target) {
  const out = [];
  for (const section of html.split(/<div\s+class="download-item\b/).slice(1, 30)) {
    const filename = section.match(/<div\s+class="file-title">([^<]+)</)?.[1]?.trim();
    if (!filename || !/\.(mkv|mp4)$/i.test(filename)) continue;
    const normalized = normalizeTitle(filename);
    const title = normalizeTitle(target.originalTitle);
    if (!normalized.startsWith(title + ' ') || !normalized.includes(' ' + target.year + ' ')) continue;
    const years = normalized.match(/\b(?:19|20)\d{2}\b/g);
    if (years?.some(y => Number(y) !== target.year)) continue;
    const link = anchors(section).find(a => /Download HubCloud/i.test(a.text));
    const url = safeUrl(link?.href, HDHUB_ORIGIN + '/');
    if (!url || !/^greenmotors\.(?:club|cc)$/i.test(new URL(url).hostname)) continue;
    const size = Number(section.match(/>\s*([\d.]+)\s*GB\s*</i)?.[1]) || Infinity;
    // Size/codec text orders which candidates to inspect. It is never used as
    // a verified resolution or byte count in the returned stream.
    out.push({ filename, url, size, av1: /\bAV1\b/i.test(filename) });
  }
  return out.sort((a, b) => a.size - b.size);
}
async function resolveRelease(http, entry, target, allowExtensionless) {
  const redirect = await http.text(entry.url);
  const hub = redirect && shortlinkTarget(redirect.text);
  if (!hub || http.expired()) return [];
  const page = await http.text(hub);
  const terminal = page && safeUrl(page.text.match(/\bvar\s+url\s*=\s*['"]([^'"]+)['"]/)?.[1]);
  if (!terminal || new URL(terminal).hostname !== 'gamerxyt.com' || new URL(terminal).pathname !== '/hubcloud.php') return [];
  const result = await http.text(terminal);
  if (!result) return [];
  return anchors(result.text).filter(a => /FSL(?:v2)? Server/i.test(a.text)).slice(0, 2).map(a => {
    const url = safeUrl(a.href, result.url);
    if (!url || !new URL(url).hostname.endsWith('.r2.cloudflarestorage.com')) return null;
    // Raw R2 object keys often lack .mkv. A published bridge must supply the
    // filename-preserving alias; direct fallback cannot promise native naming.
    if (!allowExtensionless && !/\.(?:mkv|mp4)(?:$|[?#])/i.test(url)) return null;
    return { url, filename: entry.filename, headers: { Referer: 'https://gamerxyt.com/' }, subtitles: [],
      subtitleBase: result.url, source: '4KHDHub / HubCloud', identity: target, identityConfidence: 95 };
  }).filter(Boolean);
}
async function scanHdHub(http, target, options = {}) {
  if (target.type !== 'movie') return [];
  const search = await http.text(HDHUB_ORIGIN + '/?s=' + encodeURIComponent(target.originalTitle));
  if (!search) return [];
  const expected = normalizeTitle(target.originalTitle) + ' ' + target.year;
  const result = anchors(search.text).find(a => normalizeTitle(a.text).endsWith(expected));
  const pageUrl = result && safeUrl(result.href, search.url);
  if (!pageUrl || new URL(pageUrl).origin !== HDHUB_ORIGIN) return [];
  const page = await http.text(pageUrl);
  if (!page || !pageMatches(page.text, target)) return [];
  const entries = releaseEntries(page.text, target);
  const selected = entries.slice(0, 3);
  return (await mapLimit(selected, 2, entry => resolveRelease(http, entry, target, options.allowExtensionless === true))).flat();
}
module.exports = { scanHdHub, shortlinkTarget, pageMatches, releaseEntries, HDHUB_ORIGIN };
