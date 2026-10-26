'use strict';
const { safeUrl, normalizeTitle } = require('../util.cjs');
const { anchors, decodeEntities } = require('./directory.cjs');
const { canonicalNames } = require('./page-data.cjs');
const { matchesEpisode } = require('../matching.cjs');
const { audioCode } = require('../media/audio.cjs');
const {base64Bytes}=require('../media/base64.cjs');

const ORIGINS = { movie: 'https://films.waploaded.com', tv: 'https://shows.waploaded.com' };
const indexes = new Map();
function heading(html) { return decodeEntities(String(html).match(/<h1\b[^>]*>([\s\S]{0,500}?)<\/h1>/i)?.[1] || ''); }
function sameTitle(value, target) { return canonicalNames(target).includes(normalizeTitle(value)); }
function primaryPost(html) {
  return String(html).slice(String(html).search(/<h1\b/i)).split(/<a\b[^>]*href=["']\/dl\//i)[0].slice(0, 80000);
}
function movieYears(target) { return [...new Set([target.year, ...(target.releaseYears || [])])]; }
function pageMatches(html, target) {
  const title = heading(html);
  const match = title.match(/^(.+?)\s*\((\d{4})(?:\s+TV series)?\)(?:\s*\[[^\]]{1,50}\])?$/i);
  if (!match || !sameTitle(match[1], target)) return false;
  // Restrict ID checks to the primary post, before its download section. Do
  // not bind an article to a recommendation or an uploader's unrelated URL.
  const post = primaryPost(html);
  const ids = anchors(post).map(a => a.href.match(/^https?:\/\/(?:www\.)?imdb\.com\/title\/(tt\d+)(?:$|[/?#])/i)?.[1]).filter(Boolean);
  if (target.imdbId && ids.some(id => id !== target.imdbId)) return false;
  return Number(match[2]) === target.year || target.type === 'movie' && target.imdbId && ids.includes(target.imdbId) && movieYears(target).includes(Number(match[2]));
}
function indexEntries(xml, target) {
  const origin = ORIGINS[target.type], kind = target.type === 'movie' ? 'movie' : 'series';
  if (!origin) return [];
  const names = canonicalNames(target), out = [];
  for (const m of String(xml).matchAll(/<loc>\s*([^<]{1,500})\s*<\/loc>/gi)) {
    const url = safeUrl(decodeEntities(m[1]));
    if (!url || new URL(url).origin !== origin) continue;
    const slug = new URL(url).pathname.match(new RegExp('^/' + kind + '/[1-9]\\d{0,9}/([a-z0-9-]{1,180})$'))?.[1];
    if (!slug) continue;
    const text = normalizeTitle(slug);
    // Index slugs can be truncated. A prefix is only a lookup hint: the full
    // page must still supply an exact canonical name and release year.
    if (!names.some(name => text.startsWith(name + ' ') || text === name || text.length >= 12 && name.startsWith(text))) continue;
    const year = text.match(/\b(?:19|20)\d{2}\b/)?.[0];
    if (year && !(target.type === 'movie' ? movieYears(target) : [target.year]).includes(Number(year))) continue;
    if (!out.includes(url)) out.push(url);
    if (out.length === 2) break;
  }
  return out;
}
function childPage(html, base, target, episode) {
  const origin = ORIGINS.tv, names = canonicalNames(target);
  return anchors(html, 1800).map(a => ({ ...a, url: safeUrl(a.href, base) })).find(a => {
    if (!a.url || new URL(a.url).origin !== origin || !/^\/(?:series|season)\/[1-9]\d{0,9}\/[a-z0-9-]+$/.test(new URL(a.url).pathname)) return false;
    const text = normalizeTitle(a.text), prefix = names.find(n => text.startsWith(n + ' '));
    if (!prefix) return false;
    if (episode) return matchesEpisode(a.text, target);
    const seasons = [...text.slice(prefix.length).matchAll(/\bseason\s+(\d{1,3})\b/g)];
    return seasons.length === 1 && Number(seasons[0][1]) === target.season;
  })?.url || null;
}
function sameEpisodeHeading(html, target) {
  const text = heading(html), normalized = normalizeTitle(text);
  const name = canonicalNames(target).find(n => normalized.startsWith(n + ' s'));
  return !!name && matchesEpisode(text, target) && /^s\d{1,3}\s*e\d{1,3}$/.test(normalized.slice(name.length).trim());
}
function decodeLink(key, value) {
  if (typeof key !== 'string' || !key.length || key.length > 200) return null;
  // XOR data contains NUL bytes. Keep it inside JS: passing an atob binary
  // string through a C-string/native bridge can truncate it at the first NUL.
  const data=base64Bytes(value);
  return data?safeUrl(Array.from(data,(byte,index)=>String.fromCharCode(byte^key.charCodeAt(index%key.length))).join('')):null;
}
function namedFile(url, slug) {
  const address = safeUrl(url);
  if (!address || !/^[a-z0-9-]+\.kissorgrab\.com$/i.test(new URL(address).hostname) || !new URL(address).pathname.endsWith('/' + slug)) return null;
  // This publisher accepts the public display-name segment with a real dot
  // suffix. The resource/signature path is unchanged. A Range/container probe
  // must succeed on this exact URL before it is ever labelled downloadable.
  return /-(mkv|mp4)$/i.test(slug) ? address.replace(/-(mkv|mp4)(?=$|[?#])/i, '.$1') : null;
}
async function resolveDownload(http, page, target) {
  const link = anchors(page.text, 1800).find(a => a.text === 'Download Video');
  const url = safeUrl(link?.href, page.url), match = url && new URL(url).pathname.match(/^\/dl\/([a-f0-9]{32})\/([a-z0-9-]{1,220})$/);
  if (!match || new URL(url).origin !== ORIGINS[target.type]) return null;
  const slug = match[2], normalized = normalizeTitle(slug);
  const displaySlug = slug.replace(/-\d{4,10}-(mkv|mp4)$/i, '');
  if (!canonicalNames(target).some(n => normalized.startsWith(n + ' ')) ||
      (target.type === 'movie' ? !movieYears(target).some(y => normalized.includes(' ' + y + ' ')) : !matchesEpisode(displaySlug, target))) return null;
  const filePage = await http.text(url);
  if (!filePage) return null;
  const fileOrigin = new URL(filePage.url).origin;
  if (fileOrigin !== 'https://meetdownload.com' && !(fileOrigin === ORIGINS[target.type] && new URL(filePage.url).pathname === new URL(url).pathname)) return null;
  const fileTitle = normalizeTitle(heading(filePage.text).replace(/^Download\s+/i, ''));
  if (fileTitle !== normalizeTitle(displaySlug)) return null;
  const api = safeUrl(filePage.text.match(/\bdata-md-dl=["']([^"']+)["']/)?.[1], filePage.url);
  const ticket = filePage.text.match(/\bdata-md-t=["']([^"']{1,200})["']/)?.[1];
  if (!api || new URL(api).origin !== fileOrigin || new URL(api).pathname !== '/api/v1/dl-link/' + match[1] || !ticket) return null;
  // The ordinary Download button posts its page-issued, expiring ticket.
  // The response carries its own encoding key; no account or secret constant.
  const result = await http.json(api, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest', Referer: filePage.url }, body: 't=' + encodeURIComponent(ticket) });
  if (result?.ok !== true) return null;
  const video = namedFile(decodeLink(result.k, result.d), slug);
  if (!video) return null;
  const text = decodeEntities(primaryPost(page.text).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' '));
  const declared = text.match(/\bAudio:\s*(English|Turkish|Hindi|French|Spanish|Japanese)\b/i)?.[1];
  // A companion without an explicit language remains unclaimed. Existing
  // canonical TR/EN discovery still runs for every verified video.
  const subtitle = decodeLink(result.k, result.s), subSlug = subtitle && new URL(subtitle).pathname.split('/').pop();
  const language = subSlug?.match(/(eng|tur)\d?-\d+-(?:srt|vtt)$/i)?.[1]?.toLowerCase();
  const compact = normalizeTitle(subSlug || '').replace(/ /g, '');
  let releaseName = subSlug;
  // Restore word separators only when the exact canonical compact title/year
  // is present. Preserve all remaining release/cut hints for normal scoring.
  if (target.type === 'movie') for (const name of canonicalNames(target)) {
    const year = movieYears(target).find(y => compact.startsWith(name.replace(/ /g, '') + y));
    if (year) { releaseName = target.originalTitle + '.' + year + '.' + compact.slice(name.replace(/ /g, '').length + 4); break; }
  }
  const subtitles = subtitle && /^[a-z0-9-]+\.kissorgrab\.com$/i.test(new URL(subtitle).hostname) && language ?
    [{ url: subtitle.replace(/-(srt|vtt)(?=$|[?#])/i, '.$1'), language: language === 'tur' ? 'tr' : 'en',
      releaseName, identity: target, _identityBound: true, _scope: 'title' }] : [];
  return { url: video, filename: slug.replace(/-\d{4,10}-(mkv|mp4)$/i, '.$1'), headers: { Referer: filePage.url },
    source: 'Waploaded', identity: target, identityConfidence: target.imdbId && text.includes(target.imdbId) ? 100 : 90,
    requireDuration: true, ...(target.runtimeMinutes > 0 ? { durationTolerance: 0.1 } : {}),
    ...(declared ? { claimedAudioLanguages: [audioCode(declared)] } : {}), subtitles, subtitleBase: filePage.url };
}
async function scanWaploaded(http, target) {
  if (target.isAnime || !ORIGINS[target.type]) return [];
  const indexUrl = ORIGINS[target.type] + '/sitemap/' + (target.type === 'movie' ? 'movie' : 'series');
  let index = indexes.get(indexUrl);
  if (!index || Date.now() - index.at > 300000) {
    const response = await http.text(indexUrl, { maxChars: 80000 });
    if (!response || !/<urlset\b/.test(response.text)) return [];
    index = { text: response.text, at: Date.now() }; indexes.set(indexUrl, index);
  }
  const candidates = [];
  for (const url of indexEntries(index.text, target)) {
    if (http.expired()) break;
    let page = await http.text(url);
    if (!page || !pageMatches(page.text, target)) continue;
    if (target.type === 'tv') {
      const seasonUrl = childPage(page.text, page.url, target, false), season = seasonUrl && await http.text(seasonUrl);
      const seasonTitle = season && normalizeTitle(heading(season.text));
      if (!seasonTitle || !canonicalNames(target).some(n => seasonTitle === n + ' season ' + target.season)) continue;
      const episodeUrl = childPage(season.text, season.url, target, true);
      page = episodeUrl && await http.text(episodeUrl);
      if (!page || !sameEpisodeHeading(page.text, target)) continue;
    }
    const candidate = await resolveDownload(http, page, target);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}
module.exports = { scanWaploaded, pageMatches, indexEntries, childPage, sameEpisodeHeading, decodeLink, namedFile, resolveDownload };
