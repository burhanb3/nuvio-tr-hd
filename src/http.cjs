'use strict';
const { safeUrl } = require('./util.cjs');
const { createScheduler } = require('./scheduler.cjs');

function createHttp({ fetchImpl, allowHttp = false, timeoutMs = 4500, deadline = Date.now() + 30000, scheduler, onEvent = () => {} }) {
  const fetcher = fetchImpl || globalThis.fetch;
  const clock = scheduler || createScheduler();
  const failures = new Map(), rateLimited = new Map(), denied = new Set();
  const controllers = new Set();
  let closed = false;
  const expired = () => closed || Date.now() >= deadline;
  const networkPools = { 'subtitle-body': { limit:4, active:0, waiting:[] }, 'subtitle-body-en': { limit:1, active:0, waiting:[] }, 'media-probe': { limit:3, active:0, waiting:[] } };
  async function fetchNetwork(url, options, group, end) {
    const pool = networkPools[group];
    if(!pool)return fetcher(url,options);
    if(pool.active>=pool.limit)await new Promise(resolve=>pool.waiting.push(resolve));else pool.active++;
    // Keep the lease until the underlying native fetch actually settles.
    // A logical JS timeout does not cancel Nuvio iOS networking.
    try{return expired()||Date.now()>=end?null:group==='subtitle-body-en'?await fetchNetwork(url,options,'subtitle-body',end):await fetcher(url,options);}
    finally{if(pool.waiting.length)pool.waiting.shift()();else pool.active--;}
  }
  const emit = event => { try { onEvent(event); } catch {} };
  async function bounded(work, end, controller) {
    let timer;
    try {
      return await Promise.race([work, new Promise(resolve => {
        timer = clock.schedule(() => { controller?.abort(); resolve(null); }, Math.max(1, end - Date.now()));
      })]);
    } catch { return null; }
    finally { clock.cancel(timer); }
  }
  async function request(rawUrl, options = {}) {
    const { timeoutMs: localTimeout, nativeGroup, ...fetchOptions } = options;
    let url = safeUrl(rawUrl, undefined, allowHttp);
    if (!url || expired()) return null;
    const denialKey=JSON.stringify([options.method||'GET',url,Object.entries(options.headers||{}).sort()]);
    if(denied.has(denialKey))return null;
    const started = Date.now();
    const requestedTimeout = Number.isFinite(localTimeout) ? Math.max(1, Math.min(localTimeout, 20000)) : timeoutMs;
    const end = Math.min(deadline, started + requestedTimeout);
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    if (controller) controllers.add(controller);
    const work = (async () => {
      for (let redirects = 0; redirects <= 3; redirects++) {
        if (expired() || Date.now() >= end || (rateLimited.get(new URL(url).origin) || 0) > Date.now()) return null;
        const response = await fetchNetwork(url, { ...fetchOptions, ...(controller ? { signal: controller.signal } : {}), redirect: 'manual' }, nativeGroup, end);
        if (!response) return null;
        emit({ stage: 'http', host: new URL(url).hostname, status: response.status, method: options.method || 'GET' });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const next = safeUrl(response.headers.get('location'), url, allowHttp);
          if (!next || redirects === 3) return null;
          // Avoid leaking Authorization/Cookie to a different redirect origin.
          if (new URL(next).origin !== new URL(url).origin && options.headers && Object.keys(options.headers).some(k => /authorization|cookie/i.test(k))) return null;
          url = next;
          continue;
        }
        const finalUrl = safeUrl(response.url || url, undefined, allowHttp);
        if (!finalUrl || !response.ok) {
          failures.set(rawUrl, { status: response.status });
          if([401,403,404,410].includes(response.status))denied.add(denialKey);
          if (response.status === 429) {
            const retry = Number(response.headers.get('retry-after'));
            rateLimited.set(new URL(finalUrl || url).origin, Date.now() + Math.max(1000, Math.min(60000, (retry || 30) * 1000)));
          }
          return null;
        }
        // Bound body consumption too. Nuvio buffers bodies in fetch; browser/
        // Node transports may resolve headers and then stall indefinitely.
        const wrapped = { ok: response.ok, status: response.status, url: response.url, headers: response.headers,
          text: async () => (await bounded(Promise.resolve().then(() => response.text()), end, controller)) ?? '',
          arrayBuffer: async () => (await bounded(Promise.resolve().then(() => response.arrayBuffer()), end, controller)) ?? new ArrayBuffer(0) };
        return { response: wrapped, url: finalUrl };
      }
      return null;
    })();
    const result = await bounded(work, end, controller);
    if (!result && !failures.has(rawUrl)) emit({ stage: 'http', host: new URL(rawUrl).hostname, reason: 'timeout_or_network' });
    return result;
  }

  async function json(url, options = {}) {
    const result = await request(url, { ...options, headers: { Accept: 'application/json', ...options.headers } });
    if (!result) return null;
    const mime = (result.response.headers.get('content-type') || '').toLowerCase();
    if (/html|video\//.test(mime)) return null;
    const text = await result.response.text();
    if (!text || text.length > 700000 || text.endsWith('...[truncated]')) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  async function text(url, options = {}) {
    const { maxChars = 700000, ...requestOptions } = options;
    const result = await request(url, requestOptions);
    if (!result) return null;
    const text = await result.response.text();
    if (!text || text.length > Math.min(1000000, Math.max(1, maxChars)) || text.endsWith('...[truncated]')) return null;
    return { text, url: result.url };
  }

  async function bytes(url, headers, start = 0, end = 131071) {
    const limit = end - start + 1;
    if (limit <= 0 || limit > 262144) return null;
    const result = await request(url, { headers: { ...headers, Range: `bytes=${start}-${end}` }, nativeGroup:'media-probe' });
    if (!result) return null;
    const response = result.response;
    const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase().trim();
    if (/html|json|xml/.test(mime)) return null;
    const length = Number(response.headers.get('content-length'));
    const range = (response.headers.get('content-range') || '').match(/^bytes (\d+)-(\d+)\/(\d+)$/i);
    let total = null;
    if (response.status === 206) {
      if (!range || Number(range[1]) !== start || Number(range[2]) > end || Number(range[2]) < start || Number(range[3]) <= Number(range[2])) return null;
      total = Number(range[3]);
    } else if (response.status !== 200 || start !== 0 || !Number.isSafeInteger(length) || length <= 0 || length > limit) return null;
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.length === 0 || body.length > limit) return null;
    if (range && body.length !== Number(range[2]) - start + 1) return null;
    if (!range && body.length !== length) return null;
    if (length > 0 && length !== body.length) return null;
    return { bytes: body, url: result.url, mime, total: total || length, etag: response.headers.get('etag') || null };
  }

  return { request, json, text, bytes, expired, note: emit, failureFor: url => failures.get(url),
    close: () => {
      closed = true;
      for (const controller of controllers) controller.abort();
      controllers.clear();
      if (!scheduler) clock.close();
    } };
}
module.exports = { createHttp };
