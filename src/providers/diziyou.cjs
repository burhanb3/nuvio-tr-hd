'use strict';
const { safeUrl, mapLimit, normalizeTitle } = require('../util.cjs');
const { anchors } = require('./directory.cjs');
const { jsonLd, tagAttributes, sameName, sameOrigin, syntheticFilename } = require('./page-data.cjs');
const ORIGIN = 'https://www.diziyou.one';
function seriesMatches(html, target) {
  return jsonLd(html).some(r => r['@type'] === 'TVSeries' && sameName(r.name, target) && Number(String(r.startDate || r.datePublished || '').slice(0,4)) === target.year);
}
function episodeMatches(html, target) {
  return jsonLd(html).some(r => r['@type'] === 'TVEpisode' && sameName(r.partOfSeries?.name, target) &&
    Number(r.episodeNumber) === target.episode && Number(r.partOfSeason?.seasonNumber) === target.season);
}
async function scanDiziYou(http, target) {
  if (target.type !== 'tv' || target.isAnime) return [];
  let series;
  const slug = normalizeTitle(target.originalTitle).replace(/ /g, '-');
  const direct = await http.text(`${ORIGIN}/${slug}/`);
  if (direct && seriesMatches(direct.text, target)) series = direct;
  if (!series && !http.expired()) {
    const search = await http.text(`${ORIGIN}/?s=${encodeURIComponent(target.originalTitle)}`);
    const links = search && anchors(search.text,2000).filter(a => sameName(a.text, target)).map(a => sameOrigin(a.href, ORIGIN)).filter(Boolean);
    for (const url of [...new Set(links || [])].slice(0,2)) {
      const page = await http.text(url);
      if (page && seriesMatches(page.text, target)) { series = page; break; }
    }
  }
  if (!series || http.expired()) return [];
  const suffix = `-${target.season}-sezon-${target.episode}-bolum/`;
  const episodeUrl = anchors(series.text,2000).map(a => sameOrigin(a.href, ORIGIN)).find(url => url && new URL(url).pathname.endsWith(suffix));
  if (!episodeUrl) return [];
  const episode = await http.text(episodeUrl);
  if (!episode || !episodeMatches(episode.text, target)) return [];
  const iframe = [...episode.text.matchAll(/<iframe\b[^>]*>/gi)].map(m => tagAttributes(m[0])).find(a => a.id === 'diziyouPlayer');
  const playerUrl = sameOrigin(iframe?.src, ORIGIN), id = playerUrl && new URL(playerUrl).pathname.match(/^\/player\/(\d+)\.html$/)?.[1];
  if (!id) return [];
  const versions = [{ url: `${ORIGIN}/player/${id}.html`, audio: target.originalLanguage }];
  if (/id=["']turkceDublaj["']/.test(episode.text)) versions.push({ url: `${ORIGIN}/player/${id}_tr.html`, audio: 'tr' });
  return (await mapLimit(versions, 2, async version => {
    const player = await http.text(version.url, { headers: { Referer: episodeUrl } });
    // Only the actual player video: the page also contains MP4 advertisements.
    const video = player && [...player.text.matchAll(/<video\b([^>]*)>([\s\S]*?)<\/video>/gi)].find(m => tagAttributes(m[1]).id === 'diziyou');
    if (!video) return [];
    const subtitles = [...video[2].matchAll(/<track\b[^>]*>/gi)].map(m => tagAttributes(m[0])).filter(a => a.srclang === 'tr')
      .map(a => ({ url: safeUrl(a.src, player.url), language: 'tr', _scope: 'paired', identity: target, headers: { Referer: ORIGIN+'/' } })).filter(s => s.url);
    return [...video[2].matchAll(/<source\b[^>]*>/gi)].slice(0,5).map(m => {
      const url = safeUrl(tagAttributes(m[0]).src, player.url);
      if (!url || !/\.(m3u8|mp4|mkv)(?:$|[?#])/i.test(url)) return null;
      return { url, headers: { Referer: ORIGIN+'/' }, filename: syntheticFilename(target), filenameSynthetic: true, subtitles,
        source: 'DiziYou', identity: target, identityConfidence: 90, claimedAudioLanguages: version.audio ? [version.audio] : [] };
    }).filter(Boolean);
  })).flat();
}
module.exports = { scanDiziYou, seriesMatches, episodeMatches };
