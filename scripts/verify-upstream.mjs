import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const lock = JSON.parse(await readFile(resolve(root, 'compatibility/upstream-lock.json'), 'utf8'));
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'nuvio-tr-hd-contract-check' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function getJson(path) {
  const response = await fetch(`https://api.github.com/repos/${lock.repository}/${path}`, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Upstream API HTTP ${response.status}; doğrulama tamamlanmadı`);
  return response.json();
}
function gitBlobSha(text) {
  const content = Buffer.from(text);
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}
const [release, head] = await Promise.all([getJson('releases/latest'), getJson(`commits/${encodeURIComponent(lock.defaultBranch)}`)]);
const paths = Object.keys(lock.sourceFiles);
const sources = new Map();
// Bounded API concurrency, useful on an unauthenticated personal workstation.
let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < paths.length) {
    const path = paths[next++];
    const response = await getJson(`contents/${path}?ref=${head.sha}`);
    sources.set(path, Buffer.from(response.content.replace(/\s/g, ''), 'base64').toString('utf8'));
  }
}));
const drift = paths.filter(path => gitBlobSha(sources.get(path)) !== lock.sourceFiles[path]);
const abiAssertions = [
  ['PluginModels.kt', /val scrapers: List<PluginManifestScraper>/, 'scrapers manifest listesi'],
  ['StreamsRepository.kt', /\(group\.streams \+ completion\.streams\)\.sortedForGroupedDisplay\(\)/, 'bağımsız scraper tamamlandığında sonuçların birleştirilmesi'],
  ['PluginModels.kt', /val filename: String/, 'filename alanı'],
  ['JsBindings.kt', /getStreams\(args\.tmdbId, args\.mediaType, season, episode\)/, 'getStreams dört argüman ABI'],
  ['JsBindings.kt', /globalThis\.SCRAPER_SETTINGS/, 'ayar enjeksiyonu'],
  ['PluginRuntime.kt', /item\["subtitles"\]/, 'harici altyazı sonuçları'],
  ['PluginRuntime.kt', /PLUGIN_TIMEOUT_MS = 60_000L/, '60 saniye host bütçesi'],
  ['DownloadSubtitles.kt', /item\.sourceSubtitles/, 'indirme altyazıları'],
  ['DownloadsRepository.kt', /private fun String\.fileExtensionFromUrl\(\)/, 'URL tabanlı indirme dosya adı'],
  ['DownloadsPlatformDownloader.ios.kt', /fwrite\(/, 'iOS dosya gövdesinin doğrudan yazılması'],
  ['MPVPlayerBridge.swift', /command\("loadfile", args: \[request\.urlString, "replace"\]\)/, 'iOS MPV içerik tanıma yolu'],
  ['PlayerEngine.android.kt', /mpv\.command\("loadfile", sourceUrl\.toMpvSource\(\), "replace"\)/, 'Android MPV içerik tanıma yolu'],
  ['PlayerStartupSubtitles.kt', /remoteStreamSubtitles\.map/, 'plugin altyazılarının oynatıcıya aktarımı'],
  ['PlayerScreenRuntimeTrackActions.kt', /preferredSubtitleLanguage/, 'tercih edilen altyazı diliyle otomatik seçim'],
  ['PlayerSubtitleMatching.kt', /"tur" to "tr"/, 'Türkçe ISO dil kodu'],
  ['DownloadsRepository.kt', /normalized\.contains\("\.m3u8\?"\)/, 'HLS indirme filtresi']
];
const failedAssertions = abiAssertions.filter(([suffix, regex]) => {
  const path = paths.find(p => p.endsWith('/' + suffix));
  return !path || !regex.test(sources.get(path));
}).map(([, , label]) => label);
const report = { checkedAt: new Date().toISOString(), expectedRelease: lock.release, latestRelease: release.tag_name,
  releasePublishedAt: release.published_at, expectedHead: lock.defaultHead, latestHead: head.sha,
  sourceDrift: drift, failedAssertions, sourceContractVerified: drift.length === 0 && failedAssertions.length === 0,
  latestReleaseMatches: release.tag_name === lock.release,
  deviceTests: { android: 'not-run', ios: 'not-run' } };
await mkdir(resolve(root, '.cache'), { recursive: true });
await writeFile(resolve(root, '.cache/upstream-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (drift.length || failedAssertions.length || release.tag_name !== lock.release) {
  console.error('Nuvio sözleşmesi/sürümü değişti. docs/UYUMLULUK.md yönergesiyle yeniden inceleyin; kilidi otomatik güncellemeyin.');
  process.exitCode = 1;
}
