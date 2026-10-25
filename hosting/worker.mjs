import providerModule from '../src/index.cjs';
import httpModule from '../src/http.cjs';
import vixModule from '../src/providers/vixsrc.cjs';
import hdModule from '../src/providers/hdhub.cjs';
import probeModule from '../src/media/probe.cjs';
import utilModule from '../src/util.cjs';
const { createProvider } = providerModule;
const { createHttp } = httpModule;
const { loadVixBundle, vixCandidates, selectMaster } = vixModule;
const { scanHdHub } = hdModule;
const { probe } = probeModule;
const { safeUrl, normalizeTitle, mapLimit } = utilModule;
export const VERSION = '1.5.0';
const cors = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });

export function validTarget(t) {
  return t && Number.isSafeInteger(t.tmdbId) && t.tmdbId > 0 && ['movie','tv'].includes(t.type) &&
    typeof t.originalTitle === 'string' && t.originalTitle.length > 0 && t.originalTitle.length <= 200 &&
    Number.isInteger(t.year) && t.year >= 1880 && t.year <= 2100 &&
    (t.imdbId == null || /^tt\d{5,12}$/.test(t.imdbId)) &&
    (t.type === 'movie' || (Number.isInteger(t.season) && t.season > 0 && t.season < 1000 && Number.isInteger(t.episode) && t.episode > 0 && t.episode < 10000));
}

export function createService({ fetchImpl = globalThis.fetch, cache: suppliedCache, budgetMs = 13000 } = {}) {
  const inFlight = new Map(), bundleJobs = new Map(), bundleMemory = new Map(), files = new Map();
  let active = 0;
  const cacheFor = () => suppliedCache || (typeof caches !== 'undefined' ? caches.default : null);
  async function cached(key) { try { return await cacheFor()?.match(key); } catch { return null; } }
  async function save(key, data, ttl, ctx) {
    const response = new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` } });
    const work = Promise.resolve(cacheFor()?.put(key, response)).catch(() => {});
    if (ctx?.waitUntil) ctx.waitUntil(work);
    await work;
  }
  async function boundedTransport(url, options = {}) {
    const response = await fetchImpl(url, options);
    const limit = options.headers?.Range ? 262144 : 1048576;
    const chunks = []; let size = 0;
    const reader = response.body?.getReader();
    if (!reader) return response;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (size + value.length > limit) { await reader.cancel(); return { ok: false, status: 413, url: response.url || url, headers: response.headers }; }
        chunks.push(value); size += value.length;
      }
    } finally { reader.releaseLock(); }
    const body = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    return { ok: response.ok, status: response.status, url: response.url || url, headers: response.headers,
      text: async () => new TextDecoder().decode(body), arrayBuffer: async () => body.buffer };
  }
  async function bundle(id, origin, ctx) {
    const key = `${origin}/_cache/vix-v1/${id}`;
    if (bundleMemory.get(key)?.expiresAt > Date.now() + 30000) return bundleMemory.get(key);
    const hit = await cached(key);
    if (hit) { const data = await hit.json(); if (data.expiresAt > Date.now() + 30000) return data; }
    if (bundleJobs.has(key)) return bundleJobs.get(key);
    const job = (async () => {
      const http = createHttp({ fetchImpl: boundedTransport, timeoutMs: 3500, deadline: Date.now() + 7000 });
      try {
        const data = await loadVixBundle(http, id);
        if (data) {
          if (bundleMemory.size >= 32) bundleMemory.delete(bundleMemory.keys().next().value);
          bundleMemory.set(key, data);
          await save(key, data, 240, ctx);
        }
        return data;
      } finally { http.close(); }
    })();
    bundleJobs.set(key, job);
    try { return await job; } finally { bundleJobs.delete(key); }
  }
  async function playlist(url, ctx) {
    const match = url.pathname.match(/^\/hls\/vix\/movie\/([1-9]\d{0,9})\/(auto|\d{3,4})\.m3u8$/);
    if (!match) return new Response('Not found', { status: 404 });
    const data = await bundle(Number(match[1]), url.origin, ctx);
    const text = data && selectMaster(data.master, match[2]);
    if (!text) return new Response('Playlist unavailable', { status: 502, headers: cors });
    // Upstream child playlists, segments and keys are already absolute URLs.
    // Only this small master is served here; video/audio bytes remain upstream.
    return new Response(text, { headers: { ...cors, 'Content-Type': 'application/vnd.apple.mpegurl' } });
  }
  async function fileAlias(candidate, origin, ctx) {
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(candidate.url)));
    const id = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    const extension = /\.mp4$/i.test(candidate.filename) ? 'mp4' : 'mkv';
    // Include the public signed address so another isolate can recover without
    // relying on transient Cache API state. The path still ends in .mkv/.mp4.
    const path = `/files/${id}.${extension}?source=${encodeURIComponent(candidate.url)}`, key = `${origin}/_cache/file-v1/${id}`;
    const existing = files.get(id) || await (await cached(key))?.json();
    if (existing?.verified && existing.expiresAt > Date.now() + 30000 && existing.extension === extension) {
      files.set(id, existing);
      return { ...candidate, downloadAlias: origin + path };
    }
    const signed = new URL(candidate.url), date = signed.searchParams.get('X-Amz-Date') || '';
    const timestamp = /^\d{8}T\d{6}Z$/.test(date) ? Date.parse(date.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z')) : NaN;
    const signedExpiry = timestamp + Number(signed.searchParams.get('X-Amz-Expires')) * 1000 - 60000;
    const record = { url: candidate.url, extension, expiresAt: Math.min(Date.now() + 6 * 3600000, Number.isFinite(signedExpiry) ? signedExpiry : Infinity) };
    if (files.size > 64) files.delete(files.keys().next().value);
    files.set(id, record); await save(key, record, 6 * 3600, ctx);
    return { ...candidate, downloadAlias: origin + path };
  }
  async function redirectFile(request, url) {
    const match = url.pathname.match(/^\/files\/([a-f0-9]{64})\.(mkv|mp4)$/);
    if (!match) return new Response('Not found', { status: 404 });
    let hit = files.get(match[1]) || await (await cached(`${url.origin}/_cache/file-v1/${match[1]}`))?.json();
    if (!hit?.verified || hit.expiresAt < Date.now()) {
      const source = safeUrl(url.searchParams.get('source'));
      if (source && source.length <= 4000) {
        const parsed = new URL(source);
        if (parsed.hostname.endsWith('.r2.cloudflarestorage.com') && parsed.searchParams.get('X-Amz-Algorithm') === 'AWS4-HMAC-SHA256' && /^[a-f0-9]{64}$/.test(parsed.searchParams.get('X-Amz-Signature') || '')) {
          const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source)));
          const id = [...digest].map(b => b.toString(16).padStart(2, '0')).join('');
          if (id === match[1]) {
            const http = createHttp({ fetchImpl: boundedTransport, timeoutMs: 4000, deadline: Date.now() + 5000 });
            try {
              const video = await probe(http, { url: source, filename: `video.${match[2]}`, downloadAlias: url.href, headers: { Referer: 'https://gamerxyt.com/' } });
              if (video?.container === match[2] && video.downloadable) {
                hit = { url: source, extension: match[2], verified: true, size: video.size, expiresAt: Date.now() + 300000 };
                files.set(id, hit);
              }
            } finally { http.close(); }
          }
        }
      }
    }
    if (!hit?.verified || hit.extension !== match[2] || hit.expiresAt < Date.now() || !new URL(hit.url).hostname.endsWith('.r2.cloudflarestorage.com')) return new Response('Link expired; search again', { status: 410, headers: cors });
    if (request.method === 'HEAD') return new Response(null, { headers: { ...cors,
      'Content-Type': match[2] === 'mkv' ? 'video/x-matroska' : 'video/mp4',
      ...(hit.size ? { 'Content-Length': String(hit.size) } : {}), 'Accept-Ranges': 'bytes' } });
    return new Response(null, { status: 307, headers: { ...cors, Location: hit.url } });
  }
  async function discover(target, origin, ctx) {
    const canonical = { tmdbId: target.tmdbId, type: target.type, originalTitle: target.originalTitle, year: target.year,
      imdbId: target.imdbId || null, runtimeMinutes: Math.max(0, Math.min(1440, Number(target.runtimeMinutes) || 0)),
      season: target.type === 'tv' ? target.season : null, episode: target.type === 'tv' ? target.episode : null };
    // Include canonical identity in the cache key; arbitrary client metadata
    // cannot poison the correct title/year's cached result.
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical))));
    const digest = [...hash].map(b => b.toString(16).padStart(2, '0')).join('');
    const key = `${origin}/_cache/discovery-v140/${digest}`;
    const hit = await cached(key);
    if (hit) { const value = await hit.json(); if (value.validUntil > Date.now()) return { ...value, cache: 'hit' }; }
    if (inFlight.has(key)) return inFlight.get(key);
    if (active >= 4) return null;
    active++;
    const job = (async () => {
      const fetcher = async (url, options) => {
        if (url.startsWith('https://api.themoviedb.org/3/')) {
          const body = JSON.stringify({ id: canonical.tmdbId, original_title: canonical.originalTitle, original_name: canonical.originalTitle,
            release_date: `${canonical.year}-01-01`, first_air_date: `${canonical.year}-01-01`, imdb_id: canonical.imdbId, runtime: canonical.runtimeMinutes });
          return { ok: true, status: 200, url, headers: new Headers({ 'Content-Type': 'application/json' }), text: async () => body };
        }
        if (url.startsWith(origin + '/hls/vix/')) {
          const response = await playlist(new URL(url), ctx);
          return { ok: response.ok, status: response.status, url, headers: response.headers, text: () => response.text() };
        }
        return boundedTransport(url, options);
      };
      const provider = createProvider({ settings: { useDownloadBridge: false, directoryEnabled: false, minimumQuality: '0', maxResults: '20', subtitlePolicy: 'prefer', hashLookups: false },
        tmdbKey: 'canonical-metadata-only', fetchImpl: fetcher, budgetMs,
        sourceFactories: canonical.type === 'movie' ? [
          { name: 'VixSrc', run: async (_, target) => vixCandidates(await bundle(target.tmdbId, origin, ctx), target, origin) },
          { name: '4KHDHub / HubCloud', run: async (http, target) => {
            const candidates = await scanHdHub(http, target, { allowExtensionless: true });
            return Promise.all(candidates.map(candidate => fileAlias(candidate, origin, ctx)));
          } }
        ] : [] });
      await provider.getStreams(canonical.tmdbId, canonical.type, canonical.season, canonical.episode);
      // Enable redirects only after this exact object passed container/range
      // validation. HEAD is answered locally: presigned GET links reject HEAD.
      for (const { video } of provider.getPairs()) {
        const id = new URL(video.url).pathname.match(/^\/files\/([a-f0-9]{64})\./)?.[1];
        const record = id && files.get(id);
        if (record && video.downloadable) {
          record.verified = true; record.size = video.size;
          await save(`${origin}/_cache/file-v1/${id}`, record, Math.max(1, Math.floor((record.expiresAt - Date.now()) / 1000)), ctx);
        }
      }
      const pairs = provider.getPairs().slice(0, 40).map(({ candidate: c, video: v, subtitles }) => ({
        candidate: { url: v.url, filename: c.filename || '', source: c.source, headers: c.headers, identity: canonical,
          identityConfidence: c.identityConfidence || 90, embeddedTurkish: !!c.embeddedTurkish, claimedQuality: c.claimedQuality || '' },
        video: { url: v.url, container: v.container, downloadable: v.downloadable, dimensions: v.dimensions,
          resolutionOptions: v.resolutionOptions, resolutionEvidence: v.resolutionEvidence, sizeEstimate: v.sizeEstimate,
          size: v.size || null, duration: v.duration || null }, subtitles
      }));
      let ttl = 180;
      for (const pair of pairs) for (const address of [pair.video.url, ...pair.subtitles.map(s => s.url)]) {
        const expires = Number(new URL(address).searchParams.get('expires') || new URL(address).searchParams.get('exp'));
        if (expires > 1000000000) ttl = Math.min(ttl, Math.floor((expires * (expires < 100000000000 ? 1000 : 1) - Date.now()) / 1000) - 30);
      }
      const result = { schema: 1, version: VERSION, target: canonical, pairs, report: provider.getReport(), cache: 'miss', validUntil: Date.now() + Math.max(0, ttl) * 1000 };
      // Never retain an empty/transient failure. Successful public pairs are
      // briefly cached so repeated taps don't re-hit subtitle rate limits.
      if (pairs.length && ttl >= 15) await save(key, result, ttl, ctx);
      return result;
    })();
    inFlight.set(key, job);
    try { return await job; } finally { active--; inFlight.delete(key); }
  }
  async function registerFiles(input, origin, ctx) {
    if (!validTarget(input.target) || !Array.isArray(input.candidates) || input.candidates.length > 3) return json({ error: 'Invalid file request' }, 400);
    if (active >= 4) return json({ error: 'Busy; retry later' }, 429);
    active++;
    const http = createHttp({ fetchImpl: boundedTransport, timeoutMs: 4000, deadline: Date.now() + 5500 });
    try {
      const accepted = await mapLimit(input.candidates, 2, async c => {
        const address = safeUrl(c?.url), filename = typeof c?.filename === 'string' ? c.filename : '';
        if (!address || address.length > 4000 || filename.length > 300 || !/\.(mkv|mp4)$/i.test(filename)) return null;
        const parsed = new URL(address), normalized = normalizeTitle(filename);
        if (!parsed.hostname.endsWith('.r2.cloudflarestorage.com') ||
          parsed.searchParams.get('X-Amz-Algorithm') !== 'AWS4-HMAC-SHA256' || !/^[a-f0-9]{64}$/.test(parsed.searchParams.get('X-Amz-Signature') || '') ||
          !normalized.startsWith(normalizeTitle(input.target.originalTitle) + ' ') || !normalized.includes(' ' + input.target.year + ' ')) return null;
        const candidate = await fileAlias({ url: address, filename, identity: input.target, headers: { Referer: 'https://gamerxyt.com/' } }, origin, ctx);
        const video = await probe(http, candidate);
        if (!video?.downloadable || video.url !== candidate.downloadAlias) return null;
        const id = new URL(video.url).pathname.match(/^\/files\/([a-f0-9]{64})\./)[1];
        const record = files.get(id); record.verified = true; record.size = video.size;
        await save(`${origin}/_cache/file-v1/${id}`, record, Math.max(1, Math.floor((record.expiresAt - Date.now()) / 1000)), ctx);
        return { url: address, downloadAlias: video.url };
      });
      return json({ schema: 1, target: input.target, files: accepted.filter(Boolean) });
    } finally { active--; http.close(); }
  }
  return {
    async fetch(request, env, ctx) {
      void env;
      const url = new URL(request.url);
      try {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
        if (request.method === 'GET' && url.pathname === '/hls/profile.m3u8') {
          const data = url.searchParams.get('data');
          if (!data || data.length > 24000) return new Response('Invalid profile', { status: 400, headers: cors });
          const text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(data), c => c.charCodeAt(0)));
          const lines = text.trim().split(/\r?\n/);
          if (lines[0] !== '#EXTM3U' || lines.filter(l => l.startsWith('#EXT-X-STREAM-INF:')).length !== 1 ||
            lines.some(l => l.startsWith('#') && !/^#EXTM3U$|^#EXT-X-(VERSION:|MEDIA:|STREAM-INF:)/.test(l)) ||
            lines.some(l => !l.startsWith('#') && !safeUrl(l)) ||
            [...text.matchAll(/URI="([^"]*)"/g)].some(m => !safeUrl(m[1]))) return new Response('Invalid profile', { status: 400, headers: cors });
          // Stateless small master only: video, audio and subtitle bytes remain
          // on their original servers. No upstream fetch or segment proxy.
          return new Response(text, { headers: { ...cors, 'Content-Type': 'application/vnd.apple.mpegurl' } });
        }
        if (url.pathname === '/api/health') return json({ version: VERSION, discovery: true, cacheSeconds: 180, features: { hlsProfiles: true } });
        if (['GET','HEAD'].includes(request.method) && url.pathname.startsWith('/files/')) return await redirectFile(request, url);
        if (request.method === 'GET' && url.pathname.startsWith('/hls/vix/')) return await playlist(url, ctx);
        if (url.pathname === '/api/files' && request.method === 'POST') {
          const body = await request.text();
          if (body.length > 16000) return json({ error: 'Request too large' }, 413);
          return await registerFiles(JSON.parse(body), url.origin, ctx);
        }
        if (url.pathname !== '/api/discover' || request.method !== 'POST') return new Response('Not found', { status: 404 });
        const text = await request.text();
        if (text.length > 2000) return json({ error: 'Request too large' }, 413);
        const input = JSON.parse(text);
        if (!validTarget(input.target)) return json({ error: 'Invalid canonical identity' }, 400);
        const result = await discover(input.target, url.origin, ctx);
        return result ? json(result) : json({ error: 'Busy; retry later' }, 429);
      } catch { return json({ error: 'Source temporarily unavailable' }, 502); }
    }
  };
}

const service = createService();
export default service;
