'use strict';
const { safeUrl, cleanHeaders } = require('../util.cjs');
const { matchesAddonMeta, matchesStreamFilename } = require('../matching.cjs');

function supports(manifest, resource, type, id) {
  if (!manifest || !Array.isArray(manifest.resources)) return false;
  return manifest.resources.some(r => {
    const item = typeof r === 'string' ? { name: r, types: manifest.types, idPrefixes: manifest.idPrefixes } : r;
    return item && item.name === resource && (!Array.isArray(item.types) || item.types.includes(type)) &&
      (!Array.isArray(item.idPrefixes) || item.idPrefixes.some(prefix => id.startsWith(prefix)));
  });
}

async function loadAddon(http, manifestUrl, target, allowHttp) {
  const manifest = await http.json(manifestUrl);
  if (!manifest || typeof manifest.id !== 'string' || !/\/manifest\.json(?:\?|$)/.test(manifestUrl)) return [];
  const base = manifestUrl.replace(/\/manifest\.json(?:\?.*)?$/, '');
  const type = target.type === 'tv' ? 'series' : 'movie';
  const ids = [`tmdb:${target.tmdbId}`, target.imdbId].filter(Boolean);
  for (const id of ids) {
    if (!supports(manifest, 'stream', type, id)) continue;
    const hasMeta = supports(manifest, 'meta', type, id);
    if (hasMeta) {
      const meta = await http.json(`${base}/meta/${type}/${encodeURIComponent(id)}.json`);
      if (!matchesAddonMeta(meta?.meta, target, id)) continue;
    }
    const videoId = target.type === 'tv' ? `${id}:${target.season}:${target.episode}` : id;
    const resource = encodeURIComponent(videoId);
    const response = await http.json(`${base}/stream/${type}/${resource}.json`);
    if (!response || !Array.isArray(response.streams)) continue;
    let subtitles = [];
    if (supports(manifest, 'subtitles', type, id)) {
      const result = await http.json(`${base}/subtitles/${type}/${resource}.json`);
      if (Array.isArray(result?.subtitles)) subtitles = result.subtitles;
    }
    return response.streams.slice(0, 40).flatMap(stream => {
      if (!stream || stream.infoHash || stream.ytId || stream.externalUrl) return [];
      if (!hasMeta && !matchesStreamFilename(stream, target)) return [];
      const url = safeUrl(stream.url, undefined, allowHttp);
      if (!url) return [];
      return [{ url, headers: cleanHeaders(stream.behaviorHints?.proxyHeaders?.request), name: stream.name, filename: stream.behaviorHints?.filename,
        subtitles: [...subtitles, ...(Array.isArray(stream.subtitles) ? stream.subtitles : [])],
        subtitleBase: manifestUrl, source: 'Stremio', identity: target }];
    });
  }
  return [];
}
module.exports = { loadAddon, supports };
