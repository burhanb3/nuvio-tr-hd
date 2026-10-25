import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { createHttp } = require('../src/http.cjs');
const { scanDirectory } = require('../src/providers/directory.cjs');
const { scanArchive } = require('../src/providers/archive.cjs');
const { scanPlayImdb } = require('../src/providers/playimdb.cjs');
const { probe } = require('../src/media/probe.cjs');
const { createSubtitleDiscovery, scoreSubtitle } = require('../src/subtitle-discovery.cjs');
const { loadSubtitles } = require('../src/subtitles.cjs');

// Public metadata and bounded ranges only. No full video download or content
// publication; the report deliberately omits media URLs and subtitle bodies.
const target = process.argv.includes('--matrix') ?
  { tmdbId: 603, originalTitle: 'The Matrix', year: 1999, type: 'movie', imdbId: 'tt0133093', runtimeMinutes: 136 } :
  { tmdbId: 10331, originalTitle: 'Night of the Living Dead', year: 1968, type: 'movie', imdbId: 'tt0063350', runtimeMinutes: 96 };
const requests = [];
async function boundedFetch(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(7000) });
  const reader = response.body?.getReader();
  const chunks = [];
  let size = 0, truncated = false;
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (size + value.length > 1024 * 1024) { truncated = true; await reader.cancel(); break; }
        chunks.push(value); size += value.length;
      }
    } finally { reader.releaseLock(); }
  }
  const bytes = Buffer.concat(chunks.map(c => Buffer.from(c)));
  requests.push({ host: new URL(url).hostname, method: options.method || 'GET', status: response.status, bytes: size, truncated });
  return { ok: response.ok, status: response.status, url: response.url, headers: response.headers,
    text: async () => bytes.toString('utf8') + (truncated ? '\n...[truncated]' : ''),
    arrayBuffer: async () => Uint8Array.from(bytes).buffer };
}
const http = createHttp({ fetchImpl: boundedFetch, timeoutMs: 7500, deadline: Date.now() + 110000 });
const report = { checkedAt: new Date().toISOString(), target: { tmdbId: target.tmdbId, year: target.year }, sources: [], samples: [],
  deviceTest: 'not-run', fullVideoDownloaded: false };
const sources = await Promise.allSettled([
  scanDirectory(http, target), scanArchive(http, target), scanPlayImdb(http, target)
]);
const names = ['DahmerMovies', 'Internet Archive', 'PlayIMDb'];
sources.forEach((result, i) => report.sources.push({ provider: names[i], candidates: result.status === 'fulfilled' ? result.value.length : 0,
  requestCompleted: result.status === 'fulfilled' }));
const discover = createSubtitleDiscovery(http, target, {});
for (const result of sources) {
  if (result.status !== 'fulfilled') continue;
  const files = result.value.filter(c => !/\.m3u8(?:$|\?)/.test(c.url));
  // Test a small sample across sources; no need to probe every release live.
  for (const candidate of files.slice(0, 2)) {
    const video = await probe(http, candidate, false, true);
    if (!video) { report.samples.push({ provider: candidate.source, containerVerified: false }); continue; }
    const found = await discover(candidate, video);
    const subtitles = [...candidate.subtitles, ...found].map(sub => {
      const match = scoreSubtitle(sub, candidate, video, target);
      return match ? { ...sub, _match: match } : null;
    }).filter(Boolean).sort((a, b) => b._match.score - a._match.score);
    const tracks = await loadSubtitles(http, { ...candidate, subtitles }, target, false, { keepScore: true, videoDuration: video.duration });
    report.samples.push({ provider: candidate.source, containerVerified: true, container: video.container, dimensions: video.dimensions,
      duration: video.duration || null, hashComputed: !!video.videoHash, turkishSubtitlesVerified: tracks.length, bestSubtitleScore: tracks[0]?._score || 0 });
  }
}
report.requests = requests;
report.pairedSamplesVerified = report.samples.filter(s => s.containerVerified && s.turkishSubtitlesVerified > 0).length;
await mkdir(resolve(import.meta.dirname, '../.cache'), { recursive: true });
await writeFile(resolve(import.meta.dirname, '../.cache/live-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, requests: { total: requests.length, bytesRead: requests.reduce((n, r) => n + r.bytes, 0),
  responseStatuses: [...new Set(requests.map(r => r.status))] } }, null, 2));
if (!report.pairedSamplesVerified) process.exitCode = 1;
