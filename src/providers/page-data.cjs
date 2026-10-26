'use strict';
const { normalizeTitle, safeUrl } = require('../util.cjs');
function jsonLd(html) {
  const rows = [];
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const data = JSON.parse(m[1]); rows.push(...(Array.isArray(data) ? data : data['@graph'] || [data])); } catch {}
  }
  return rows.slice(0, 80);
}
function tagAttributes(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)) out[m[1].toLowerCase()] = m[2].replace(/&amp;/g, '&');
  return out;
}
function canonicalNames(target) { return [...new Set([target.originalTitle, ...(target.searchTitles || [])].map(normalizeTitle).filter(Boolean))]; }
function sameName(name, target) { return canonicalNames(target).includes(normalizeTitle(name)); }
function syntheticFilename(target) {
  return `${target.originalTitle}.${target.year}` + (target.type === 'tv' ? `.S${String(target.season).padStart(2,'0')}E${String(target.episode).padStart(2,'0')}` : '');
}
function sameOrigin(value, base) { const url = safeUrl(value, base); return url && new URL(url).origin === new URL(base).origin ? url : null; }
module.exports = { jsonLd, tagAttributes, canonicalNames, sameName, syntheticFilename, sameOrigin };
