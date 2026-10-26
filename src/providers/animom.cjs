'use strict';
const { safeUrl, normalizeTitle, mapLimit } = require('../util.cjs');
const { anchors, decodeEntities } = require('./directory.cjs');
const { tagAttributes, sameName, sameOrigin, syntheticFilename, jsonLd } = require('./page-data.cjs');
const ORIGIN = 'https://animom.org';

function searchRows(html, target) {
  const rows = [];
  for (const block of String(html).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const links = anchors(block[1]).map(a=>({...a,href:sameOrigin(a.href,ORIGIN)})).filter(a=>a.href);
    const link = links.find(a => /^\/anime\/[a-z0-9-]+\/?$/i.test(new URL(a.href).pathname));
    const image = block[1].match(/<img\b[^>]*>/i), name = link?.text || (image && tagAttributes(image[0]).alt);
    const info = decodeEntities(block[1].match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
    const year = info.match(/^(\d{4})\s*[-–]\s*(.*)$/);
    if (!link || !name || !year || Number(year[1]) !== target.year || ![name,year[2]].some(n => sameName(n,target))) continue;
    const url = sameOrigin(link.href, ORIGIN);
    if (!rows.some(r=>r.url===url)) rows.push({ url, name, year: Number(year[1]) });
    if (rows.length >= 3) break;
  }
  return rows;
}
function matchingSeries(html, row) {
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  const name = anchors(heading)[0]?.text;
  const year = heading.match(/\((\d{4})\)/)?.[1];
  return normalizeTitle(name) === normalizeTitle(row.name) && Number(year) === row.year &&
    jsonLd(html).some(r => normalizeTitle(r.name) === normalizeTitle(row.name) && Number(String(r.datePublished||'').slice(0,4)) === row.year);
}
function episodeAddress(html, seriesUrl, target) {
  const root = new URL(seriesUrl).pathname.replace(/\/$/, '');
  for (const a of anchors(html,2000)) {
    const url = sameOrigin(a.href,ORIGIN);if(!url)continue;
    const path = new URL(url).pathname.replace(/\/$/, '');
    if (path === `${root}/sezon-${target.season}/bolum-${target.episode}` ||
        target.season === 1 && path === `${root}-${target.episode}-bolum`) return url;
  }
  return null;
}
function uploadVideo(html) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>tagAttributes(m[0])).find(a=>a.property==='og:video');
  const url = safeUrl(tag?.content), file = safeUrl(html.match(/\bfile\s*:\s*['"]([^'"]+\.mp4(?:\?[^'"]*)?)['"]/)?.[1]);
  if (!url || url !== file) return null;
  const parsed = new URL(url);
  return /^(?:[a-z0-9-]+\.)?vidcache\.net$/i.test(parsed.hostname) && /^https:$/.test(parsed.protocol) && /\/video\.mp4$/.test(parsed.pathname) ? url : null;
}
async function scanAniMom(http, target) {
  if (!target.isAnime || target.type !== 'tv') return [];
  let match;
  for (const title of (target.searchTitles||[target.originalTitle]).slice(0,2)) {
    // This public search returns JSON with text/html Content-Type. Parse only
    // its bounded JSON response here; leave the shared HTML rejection intact.
    const response = await http.text(`${ORIGIN}/search`, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest',Referer:ORIGIN+'/'}, body:'query='+encodeURIComponent(title) });
    let data;try{data=response&&JSON.parse(response.text);}catch{}
    for(const row of data?.success && typeof data.theme==='string' ? searchRows(data.theme,target) : []) {
      const page = await http.text(row.url);
      if(page && matchingSeries(page.text,row)){match={...row,page};break;}
    }
    if(match||http.expired())break;
  }
  if(!match||http.expired())return [];
  const address = episodeAddress(match.page.text,match.url,target);if(!address)return [];
  const episode = await http.text(address);if(!episode)return [];
  const heading = episode.text.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'';
  const parent = anchors(heading)[0];
  const headingSeason = Number(decodeEntities(heading).match(/\b(\d+)\.\s*Sezon/i)?.[1]);
  if(!parent || sameOrigin(parent.href,ORIGIN)!==match.url || normalizeTitle(parent.text)!==normalizeTitle(match.name) ||
      Number(decodeEntities(heading).match(/\b(\d+)\.\s*Bölüm/i)?.[1])!==target.episode ||
      headingSeason && headingSeason!==target.season || target.season>1 && !headingSeason) return [];
  const embeds = [...episode.text.matchAll(/<button\b[^>]*>/gi)].map(m=>tagAttributes(m[0])).map(a=>safeUrl(a['data-frame']))
    .filter(url=>url && /^https:\/\/www\.yourupload\.com\/embed\/[a-z0-9]+$/i.test(url));
  return (await mapLimit([...new Set(embeds)].slice(0,2),2,async embed=>{
    const page = await http.text(embed,{headers:{Referer:address}}), url = page && uploadVideo(page.text);
    return url ? {url,source:'AniMOM',headers:{Referer:'https://www.yourupload.com/'},identity:target,identityConfidence:90,subtitles:[],
      filename:syntheticFilename(target)+'.mp4',filenameSynthetic:true} : null;
  }));
}
module.exports={scanAniMom,searchRows,matchingSeries,episodeAddress,uploadVideo};
