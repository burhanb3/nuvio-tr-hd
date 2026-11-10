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
function quotedJson(value){
  // JSON.parse('...') is a data envelope. Decode its bounded string literal,
  // never run a script, expression, function or an unknown escape sequence.
  if(typeof value!=='string'||value.length>260000)return null;
  let decoded='';
  const escapes={'"':'"',"'":"'",'\\':'\\','/':'/','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};
  for(let i=0;i<value.length;i++){
    const c=value[i];if(c!=='\\'){decoded+=c;continue;}
    const next=value[++i];
    if(next==='u'){
      const hex=value.slice(i+1,i+5);if(!/^[0-9a-f]{4}$/i.test(hex))return null;
      decoded+=String.fromCharCode(parseInt(hex,16));i+=4;
    }else if(Object.prototype.hasOwnProperty.call(escapes,next))decoded+=escapes[next];
    else return null;
  }
  try{return JSON.parse(decoded);}catch{return null;}
}
module.exports = { jsonLd, tagAttributes, canonicalNames, sameName, syntheticFilename, sameOrigin,quotedJson };
