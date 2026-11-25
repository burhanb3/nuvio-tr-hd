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
function packedKey(n,base){
  // Mirrors the p,a,c,k,e,d encoder: digits, a-z, then A-Z above 35.
  const tail=n%base,digit=tail>35?String.fromCharCode(tail+29):tail.toString(36);
  return(n<base?'':packedKey(Math.floor(n/base),base))+digit;
}
function unpackPacked(html,{maxPayload=60000,maxWords=1500}={}){
  // Static dictionary substitution of a packed player script. Nothing is
  // evaluated; an oversized, unknown-base or malformed script is ignored.
  const at=String(html||'').indexOf("eval(function(p,a,c,k,e,");if(at<0)return null;
  const part=html.slice(at,at+maxPayload+maxWords*48+400);
  const m=part.match(/\}\('((?:\\.|[^'\\])*)',\s*(\d+),\s*(\d+),\s*'((?:\\.|[^'\\])*)'\.split\('\|'\)/);
  if(!m||m[1].length>maxPayload)return null;
  const base=Number(m[2]),count=Number(m[3]);
  if(!Number.isInteger(base)||base<2||base>62||!Number.isInteger(count)||count>maxWords)return null;
  const literal=s=>s.replace(/\\(.)/g,(raw,c)=>c==='n'?'\n':c==='r'?'\r':c==='t'?'\t':"\\'\"/".includes(c)?c:raw);
  const words=literal(m[4]).split('|');if(words.length>count+1)return null;
  const dictionary=new Map();
  for(let i=0;i<count;i++){const key=packedKey(i,base);dictionary.set(key,words[i]||key);}
  return literal(m[1]).replace(/\b\w+\b/g,w=>dictionary.has(w)?dictionary.get(w):w);
}
module.exports = { jsonLd, tagAttributes, canonicalNames, sameName, syntheticFilename, sameOrigin,quotedJson,unpackPacked };
