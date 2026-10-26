'use strict';
const { safeUrl, mapLimit, normalizeTitle } = require('../util.cjs');
const { anchors, decodeEntities } = require('./directory.cjs');
const { syntheticFilename, sameOrigin } = require('./page-data.cjs');
const ORIGIN = 'https://www.filmmodu.one';
function matchesFilm(html, target) {
  const title = html.match(/<h1\b[^>]*itemprop=["']name["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const year = html.match(/itemprop=["']dateCreated["'][^>]*>\s*(\d{4})/i)?.[1];
  return normalizeTitle(decodeEntities(title || '')) === normalizeTitle(target.originalTitle) && Number(year) === target.year;
}
async function scanFilmModu(http, target) {
  if (target.type !== 'movie' || target.isAnime) return [];
  const search = await http.text(`${ORIGIN}/film-ara?term=${encodeURIComponent(target.originalTitle)}`);
  if (!search) return [];
  // A unique search redirects straight to the movie page.
  let page = matchesFilm(search.text,target) ? search : null;
  const found = [...new Set(anchors(search.text).filter(a => normalizeTitle(a.text).startsWith(normalizeTitle(target.originalTitle)))
    .map(a => sameOrigin(a.href, ORIGIN)).filter(url => url && !/\/film-(?:ara|yil|tur)\//.test(url)))];
  for (const url of page ? [] : found.slice(0,3)) {
    const result = await http.text(url);
    if (result && matchesFilm(result.text, target)) { page = result; break; }
    if (http.expired()) break;
  }
  if (!page) return [];
  const id = page.text.match(/var\s+videoId\s*=\s*['"](\d+)['"]/)?.[1];
  if (!id) return [];
  const types = new Set();
  const current = page.text.match(/var\s+videoType\s*=\s*['"]([^'"]*)['"]/)?.[1];
  if (['en','tr'].includes(current)) types.add(current);
  const base = new URL(page.url).pathname.replace(/-(?:(?:altyazili|turkce-dublaj)-)?film-izle\/?$/, '');
  for (const a of anchors(page.text)) {
    const url = sameOrigin(a.href, ORIGIN);
    if (!url) continue;
    const path = new URL(url).pathname.replace(/\/$/,'');
    if (path === base+'-altyazili-film-izle') types.add('en');
    if (path === base+'-turkce-dublaj-film-izle') types.add('tr');
  }
  return (await mapLimit(['en','tr'].filter(t=>types.has(t)),2,async type => {
    const data = await http.json(`${ORIGIN}/get-source?movie_id=${id}&type=${type}`, { headers: { Referer: page.url, 'X-Requested-With': 'XMLHttpRequest' } });
    if (!Array.isArray(data?.sources)) return [];
    const subtitle = safeUrl(data.subtitle, ORIGIN), imdb = subtitle?.match(/\/subs\/(tt\d+)\//)?.[1];
    if (imdb && target.imdbId && imdb !== target.imdbId) return [];
    const subtitles = subtitle ? [{ url: subtitle, language: 'tr', _scope: 'paired', identity: target, headers: { Referer: ORIGIN+'/' } }] : [];
    return data.sources.slice(0,5).map(entry => {
      const url = safeUrl(entry.src);
      return url && /\.(m3u8|mp4|mkv)(?:$|[?#])/i.test(url) ? { url, source: 'FilmModu', headers: { Referer: ORIGIN+'/' }, subtitles,
        identity: target, identityConfidence: imdb ? 100 : 90, filename: syntheticFilename(target), filenameSynthetic: true,
        claimedQuality: String(entry.label || ''), claimedAudioLanguages: [type === 'tr' ? 'tr' : target.originalLanguage].filter(Boolean) } : null;
    }).filter(Boolean);
  })).flat();
}
module.exports = { scanFilmModu, matchesFilm };
