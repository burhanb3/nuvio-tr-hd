'use strict';
const { matchesIdentity } = require('../matching.cjs');
const { safeUrl, cleanHeaders } = require('../util.cjs');

async function loadCatalog(http, catalogUrl, target, allowHttp) {
  const catalog = await http.json(catalogUrl);
  if (!catalog || catalog.version !== 1 || !Array.isArray(catalog.items)) return [];
  const candidates = [];
  for (const item of catalog.items.slice(0, 1000)) {
    if (!matchesIdentity(item, target) || !Array.isArray(item.streams)) continue;
    for (const stream of item.streams.slice(0, 40)) {
      if (!stream || typeof stream !== 'object') continue;
      const url = safeUrl(stream.url, catalogUrl, allowHttp);
      if (!url) continue;
      candidates.push({ url, headers: cleanHeaders(stream.headers), name: stream.name,
        filename: stream.filename,
        subtitles: [...(Array.isArray(item.subtitles) ? item.subtitles : []), ...(Array.isArray(stream.subtitles) ? stream.subtitles : [])],
        subtitleBase: catalogUrl, source: 'JSON', identity: target });
    }
  }
  return candidates;
}
module.exports = { loadCatalog };
