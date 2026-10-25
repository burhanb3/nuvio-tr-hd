'use strict';
const { createHttp } = require('./http.cjs');
const { createScheduler } = require('./scheduler.cjs');
const { loadHosted, registerDownloads, SERVICE_ORIGIN } = require('./hosted.cjs');
const { resolveIdentity } = require('./matching.cjs');
const { loadCatalog } = require('./providers/catalog.cjs');
const { loadAddon } = require('./providers/stremio.cjs');
const { scanDirectory } = require('./providers/directory.cjs');
const { scanArchive } = require('./providers/archive.cjs');
const { scanPlayImdb } = require('./providers/playimdb.cjs');
const { scanVixDirect } = require('./providers/vixsrc.cjs');
const { scanHdHub } = require('./providers/hdhub.cjs');
const { probe } = require('./media/probe.cjs');
const { loadSubtitles } = require('./subtitles.cjs');
const { createSubtitleDiscovery, scoreSubtitle } = require('./subtitle-discovery.cjs');
const { safeUrl, mapLimit } = require('./util.cjs');
const { rankStreams } = require('./ranking.cjs');
const { describeQuality, describeSize } = require('./media/presentation.cjs');
const { profileAddress } = require('./media/hls.cjs');

function parseUrls(value, allowHttp) {
  if (typeof value !== 'string') return [];
  return [...new Set(value.trim().split(/\s+/).map(url => safeUrl(url, undefined, allowHttp)).filter(Boolean))].slice(0, 3);
}
function formatResults(completed, settings, target) {
  const maximum = Math.max(3, Math.min(20, Number(settings.maxResults) || 20));
  const expanded = completed.flatMap(pair => {
    const { video } = pair;
    if (video.container !== 'hls' || !video.renditions?.length || settings.hlsView === 'auto') return [pair];
    const profiles = video.renditions.map(r => {
      const publicSource = ['VixSrc', 'PlayIMDb', 'DiziYou'].includes(pair.candidate.source) &&
        !Object.keys(pair.candidate.headers || {}).some(key => /^(authorization|cookie)$/i.test(key));
      const address = settings.useDownloadBridge !== false && settings.hlsProfileBridgeReady === true && publicSource ? profileAddress(r.playlist, SERVICE_ORIGIN) :
        !r.hasExternalAudio && !r.hasExternalSubtitles && /\.m3u8(?:$|[?#])/i.test(r.url) ? r.url : null;
      if (!address) return null;
      return { ...pair, video: { ...video, url: address, renditions: undefined, resolutionOptions: [r.dimensions], sizeEstimate: r.sizeEstimate, duration: r.duration } };
    }).filter(Boolean);
    return profiles.length ? settings.hlsView === 'both' ? [pair, ...profiles] : profiles : [pair];
  });
  const ordering = { ...settings, sortOrder: settings.sortOrder || 'size_asc' };
  return rankStreams(expanded, maximum, ordering).map(({ candidate, video, subtitles }, index) => {
    const kind = video.downloadable ? `${video.container.toUpperCase()} · Online izlenebilir · İndirilebilir` : 'HLS · Online izlenebilir · İndirilemez';
    const quality = describeQuality(video, candidate), size = describeSize(video);
    const dimensionText = ` · ${quality.text}`;
    const subScore = subtitles[0]?._score || 0;
    const matchText = subScore >= 90 ? 'eşleşti' : subScore >= 70 ? 'sürüm benzerliği' : subScore >= 65 ? 'süre uyumu' : 'film düzeyi; senkron belirsiz';
    const subtitleText = subtitles.length ? ` · TR altyazı (${matchText})` : candidate.embeddedTurkish ? ' · TR altyazı (HLS içi)' : ' · TR altyazı bulunamadı';
    const title = `${target.originalTitle} (${target.year}) · ${kind}${dimensionText} · ${size.text}${subtitleText}`;
    const source = String(candidate.source || 'Kaynak').replace('4KHDHub / HubCloud', '4KHDHub').replace('Internet Archive', 'Archive') +
      (candidate.serverIndex ? ` ${candidate.serverIndex}` : '');
    const subTag = subtitles.length ? 'TR' : candidate.embeddedTurkish ? 'TR içi' : 'TR yok';
    const badge = video.downloadable ? 'İndirilebilir' : 'Online';
    const details = video.dimensions ? `${video.dimensions.width}×${video.dimensions.height}` :
      video.resolutionOptions?.length === 1 ? `${video.resolutionOptions[0].width}×${video.resolutionOptions[0].height}` :
        video.resolutionOptions?.length > 1 ? 'Otomatik kalite' : quality.quality;
    const label = settings.compactLabels === false ? `${source} · ${kind}${dimensionText} · ${size.text}${subtitleText}` : `${badge} · ${source}`;
    return { name: `${String(index + 1).padStart(2, '0')} · ${label}`,
      title, url: video.url, quality: quality.quality,
      ...(size.size ? { size: size.size } : {}),
      ...(settings.compactLabels !== false ? { quality: `${details}${video.dimensions ? ' ✓' : video.container === 'hls' ? ' HLS' : quality.quality === 'Bilinmiyor' ? '' : ' tahmin'}` } : {}),
      language: subTag + (subtitles.length && subScore < 90 ? ' · senkron belirsiz' : ''), provider: 'Nuvio TR HD', type: video.container,
      ...(Object.keys(candidate.headers).length ? { headers: candidate.headers } : {}),
      subtitles: subtitles.map(({ _score, ...subtitle }) => subtitle) };
  });
}

function createProvider({ settings = {}, fetchImpl, tmdbKey, budgetMs = 24000, requestTimeoutMs = 4500, onEvent = () => {}, sourceFactories = [] } = {}) {
  let lastReport = null, lastPairs = [];
  return {
    getReport: () => lastReport,
    getPairs: () => lastPairs,
    async getStreams(tmdbId, mediaType, season, episode) {
      const allowHttp = settings.allowHttp === true;
      const catalogs = parseUrls(settings.catalogUrls, allowHttp), addons = parseUrls(settings.addonUrls, allowHttp);
      if (settings.autoDiscover === false && !catalogs.length && !addons.length) return [];
      const started = Date.now(), scheduler = createScheduler();
      const report = { tmdbId: String(tmdbId), sources: [], rejected: {}, http: {}, results: 0, reason: 'searching' };
      const emit = event => {
        if (event.stage === 'http') {
          const key = `${event.host}:${event.status || event.reason}`;
          report.http[key] = (report.http[key] || 0) + 1;
        }
        try { onEvent(event); } catch {}
      };
      const reject = reason => { report.rejected[reason] = (report.rejected[reason] || 0) + 1; };
      const http = createHttp({ fetchImpl, allowHttp, timeoutMs: requestTimeoutMs, deadline: started + budgetMs, scheduler, onEvent: emit });
      const completed = [];
      const unique = new Map(), waiting = [];
      let active = 0;
      let timer, target, discoverSubtitles;
      let profileBridgeReady = false;
      const renderSettings = () => ({ ...settings, hlsProfileBridgeReady: profileBridgeReady });
      const strictSubtitles = settings.subtitlePolicy === 'require';
      async function withProbeSlot(job) {
        if (active >= 3) await new Promise(resolve => waiting.push(resolve));
        else active++;
        try { if (!http.expired()) return await job(); }
        finally { if (waiting.length) waiting.shift()(); else active--; }
      }
      const processCandidate = async candidate => {
        const key = candidate.url + JSON.stringify(Object.entries(candidate.headers).sort());
        if (unique.has(key)) { unique.get(key).subtitles.push(...candidate.subtitles); return; }
        unique.set(key, candidate);
        if (/\.m3u8(?:$|[?#])/i.test(candidate.url) && settings.includeHls === false) { reject('hls_disabled'); return; }
        const video = await withProbeSlot(() => probe(http, candidate, settings.includeHls !== false, settings.autoSubtitles !== false));
        if (!video || http.expired()) { reject('video_unavailable'); return; }
        const minimum = Number(settings.minimumQuality ?? 0);
        if (video.dimensions && Math.min(video.dimensions.width, video.dimensions.height) < minimum) { reject('quality'); return; }
        const pair = { candidate, video, subtitles: [] };
        if (!strictSubtitles || candidate.embeddedTurkish) completed.push(pair);
        const declared = candidate.subtitles.map(sub => {
          const match = sub && scoreSubtitle(sub, candidate, video, target, settings.subtitleMatchMode !== 'strict');
          return match ? { ...sub, _match: match } : null;
        }).filter(Boolean).sort((a, b) => b._match.score - a._match.score);
        if (declared.length) {
          pair.subtitles = await loadSubtitles(http, { ...candidate, subtitles: declared }, target, allowHttp, { keepScore: true, videoDuration: video.duration });
          if (pair.subtitles.length) {
            if (strictSubtitles && !candidate.embeddedTurkish) completed.push(pair);
            return;
          }
        }
        const discovered = await discoverSubtitles(candidate, video);
        const entries = [...candidate.subtitles, ...discovered].map(sub => {
          if (!sub || typeof sub !== 'object') return null;
          const match = scoreSubtitle(sub, candidate, video, target, settings.subtitleMatchMode !== 'strict');
          return match ? { ...sub, _match: match } : null;
        }).filter(Boolean).sort((a, b) => b._match.score - a._match.score);
        const subtitles = await loadSubtitles(http, { ...candidate, subtitles: entries }, target, allowHttp, { keepScore: true, videoDuration: video.duration });
        if (http.expired()) return;
        if (!subtitles.length) { reject(entries.length ? 'subtitle_unavailable' : 'subtitle_no_match'); return; }
        pair.subtitles = subtitles;
        if (strictSubtitles && !candidate.embeddedTurkish) completed.push(pair);
      };
      const run = async () => {
        try {
          target = await resolveIdentity(http, tmdbId, mediaType, season, episode, settings.tmdbApiKey || tmdbKey);
          if (!target) { report.reason = 'identity_unavailable'; return []; }
          discoverSubtitles = createSubtitleDiscovery(http, target, settings);
          if (settings.autoDiscover !== false && settings.useDownloadBridge !== false && settings.hlsView !== 'auto')
            void http.json(SERVICE_ORIGIN + '/api/health', { timeoutMs: 1500 }).then(data => { profileBridgeReady = data?.features?.hlsProfiles === true; });
          let hosted = null;
          if (settings.autoDiscover !== false && settings.hostedDiscovery === true) {
            hosted = await loadHosted(http, target);
            if (hosted && !hosted.length) hosted = null;
            if (hosted) {
              for (const pair of hosted) {
                const source = pair.candidate.source;
                if ((source.startsWith('VixSrc') && settings.vixsrcEnabled === false) ||
                    (source === 'Internet Archive' && settings.archiveEnabled === false) ||
                    (source === 'PlayIMDb' && settings.playImdbEnabled === false) ||
                    (source === '4KHDHub / HubCloud' && settings.hdhubEnabled === false) ||
                    (pair.video.container === 'hls' && settings.includeHls === false) ||
                    (pair.video.dimensions && Math.min(pair.video.dimensions.width, pair.video.dimensions.height) < Number(settings.minimumQuality || 0)) ||
                    (strictSubtitles && !pair.subtitles.length && !pair.candidate.embeddedTurkish)) continue;
                completed.push(pair);
              }
              report.sources.push({ name: 'Ortak tarama', candidates: hosted.length });
            }
          }
          const sourceJobs = [...catalogs.map(url => ({ name: 'JSON', run: () => loadCatalog(http, url, target, allowHttp) })),
            ...addons.map(url => ({ name: 'Stremio', run: () => loadAddon(http, url, target, allowHttp) }))];
          if (settings.autoDiscover !== false && hosted === null) {
            if (settings.directoryEnabled === true) sourceJobs.push({ name: 'DahmerMovies', run: () => scanDirectory(http, target, settings) });
            if (settings.archiveEnabled !== false) sourceJobs.push({ name: 'Internet Archive', run: () => scanArchive(http, target) });
            if (settings.playImdbEnabled !== false) sourceJobs.push({ name: 'PlayIMDb', run: () => scanPlayImdb(http, target) });
            if (settings.vixsrcEnabled !== false && settings.includeHls !== false && !sourceFactories.some(s => s.name === 'VixSrc'))
              sourceJobs.push({ name: 'VixSrc', run: () => scanVixDirect(http, target) });
            if (settings.hdhubEnabled !== false && !sourceFactories.some(s => s.name === '4KHDHub / HubCloud')) sourceJobs.push({ name: '4KHDHub / HubCloud', run: async () => {
              const candidates = await scanHdHub(http, target, { allowExtensionless: settings.useDownloadBridge !== false });
              return settings.useDownloadBridge !== false ? registerDownloads(http, candidates, target) : candidates;
            } });
          }
          for (const source of sourceFactories) sourceJobs.push({ name: source.name, run: () => source.run(http, target) });
          const quota = Math.max(1, Math.floor(40 / Math.max(1, sourceJobs.length)));
          await mapLimit(sourceJobs, 4, async job => {
            let candidates;
            try { candidates = await job.run(); } catch { candidates = []; }
            report.sources.push({ name: job.name, candidates: candidates.length });
            emit({ stage: 'source', source: job.name, candidates: candidates.length });
            if (!candidates.length || http.expired()) return;
            // Warm the shared title lookup while media probes run. It is not
            // started for wholly empty searches, and never blocks other sources.
            void discoverSubtitles.prefetch();
            await mapLimit(candidates.slice(0, quota), 3, processCandidate);
          });
          return formatResults(completed, renderSettings(), target);
        } catch { report.reason = 'internal_error'; return target ? formatResults(completed, renderSettings(), target) : []; }
      };
      try {
        const results = await Promise.race([run(), new Promise(resolve => {
          timer = scheduler.schedule(() => { report.reason = 'deadline'; resolve(target ? formatResults(completed, renderSettings(), target) : []); }, budgetMs);
        })]);
        report.results = results.length;
        if (report.reason === 'searching') report.reason = results.length ? 'ok' : 'no_eligible_sources';
        return results;
      } finally {
        http.close(); scheduler.cancel(timer); scheduler.close();
        report.elapsedMs = Date.now() - started;
        lastReport = JSON.parse(JSON.stringify(report));
        lastPairs = completed.slice();
        if (settings.debug === true) console.info('[Nuvio TR HD] ' + JSON.stringify(lastReport));
      }
    }
  };
}

function onSettings() {
  return [
    { type: 'header', label: 'Nuvio TR HD · Otomatik kaynak ve Türkçe altyazı' },
    { type: 'info', label: 'Varsayılan: tüm çözünürlükler, en fazla 20 alternatif. Online izlenebilir kaynaklar gösterilir; doğrulanmış MP4/MKV ayrıca İndirilebilir etiketlidir. Türkçe bulunamazsa video gizlenmez. Nuvio altyazı dilini Türkçe seçin.' },
    { type: 'toggle', key: 'autoDiscover', label: 'Otomatik kaynak tarama', defaultValue: true },
    { type: 'toggle', key: 'compactLabels', label: 'Kısa ve sade kaynak başlıkları', defaultValue: true },
    { type: 'select', key: 'sortOrder', label: 'Kaynak sıralaması', defaultValue: 'size_asc', options: [
      { value: 'size_asc', label: 'Boyut: küçükten büyüğe' }, { value: 'size_desc', label: 'Boyut: büyükten küçüğe' },
      { value: 'quality_desc', label: 'Kalite: yüksekten düşüğe' }, { value: 'quality_asc', label: 'Kalite: düşükten yükseğe' },
      { value: 'recommended', label: 'Önerilen: indirme ve Türkçe eşleşmesi' }] },
    { type: 'select', key: 'groupResults', label: 'Sıralamada grupla', defaultValue: 'none', description: 'Aynı gruptaki satırlar yan yana sıralanır; Nuvio içinde ayrı açılır başlık oluşturulmaz.', options: [
      { value: 'none', label: 'Gruplama yok' }, { value: 'type', label: 'Önce indirilebilir, sonra online' },
      { value: 'quality', label: 'Çözünürlüğe göre' }, { value: 'source', label: 'Sağlayıcıya göre' }] },
    { type: 'select', key: 'hlsView', label: 'HLS kalite seçenekleri', defaultValue: 'separate', options: [
      { value: 'separate', label: 'Her çözünürlüğü ayrı göster' }, { value: 'auto', label: 'Tek otomatik kalite' },
      { value: 'both', label: 'Ayrı kaliteler ve otomatik' }] },
    { type: 'toggle', key: 'useDownloadBridge', label: 'MKV indirme adını koruyan dosya köprüsü', defaultValue: true, description: 'Kaynaklar telefondan aranır. Yalnız bulunan public dosya adresi ve film metadatası köprüde doğrulanır. Video doğrudan kaynaktan gelir; kişisel katalog/anahtar gönderilmez.' },
    { type: 'toggle', key: 'vixsrcEnabled', label: 'VixSrc çevrimiçi alternatifleri', defaultValue: true },
    { type: 'toggle', key: 'hdhubEnabled', label: '4KHDHub / HubCloud doğrudan dosya araması', defaultValue: true, description: 'Ücretsiz public FSL dosyaları doğrulanır. Kaynak metadatası boyut/piksel doğrulaması sayılmaz.' },
    { type: 'toggle', key: 'directoryEnabled', label: 'DahmerMovies dizin taraması (deneysel yerel yedek)', defaultValue: false, description: 'Dosya CDN’i sık 403/429 döndürdüğünden varsayılan kapalıdır.' },
    { type: 'toggle', key: 'archiveEnabled', label: 'Internet Archive film araması', defaultValue: true },
    { type: 'toggle', key: 'playImdbEnabled', label: 'PlayIMDb API araması', defaultValue: true, description: 'Bazı sonuçlar HLS olabilir; dosya indirmesi olarak gösterilmez.' },
    { type: 'toggle', key: 'autoSubtitles', label: 'Türkçe altyazıyı otomatik ara', defaultValue: true },
    { type: 'select', key: 'subtitlePolicy', label: 'Türkçe altyazı bulunamazsa', defaultValue: 'prefer', options: [
      { value: 'prefer', label: 'Videoyu göster; TR yok bilgisini yaz' }, { value: 'require', label: 'Videoyu gizle' }] },
    { type: 'select', key: 'subtitleMatchMode', label: 'Altyazı eşleştirme', defaultValue: 'balanced', options: [
      { value: 'balanced', label: 'Önce güçlü eşleşme; aynı filmden alternatif de sun' },
      { value: 'strict', label: 'Yalnız güçlü eşleşme veya yakın süre' }],
      description: 'Yanlış film/yıl ve farklı kurgu reddedilir. Film düzeyi alternatiflerin senkronu belirsizdir; otomatik zaman düzeltmesi yapılmaz.' },
    { type: 'select', key: 'minimumQuality', label: 'En düşük doğrulanmış çözünürlük', defaultValue: '0', options: [
      { value: '0', label: 'Tümü (önerilen)' }, { value: '480', label: '480p' }, { value: '720', label: '720p' }, { value: '1080', label: '1080p' }] },
    { type: 'select', key: 'maxResults', label: 'Gösterilecek en fazla kaynak', defaultValue: '20', description: 'Üst sınırdır; olmayan alternatif üretilmez. Önceki kayıtlı 6/10 tercihini 20’ye değiştirebilirsiniz.', options: [
      { value: '6', label: '6 alternatif' }, { value: '10', label: '10 alternatif' }, { value: '20', label: '20 alternatif' }] },
    { type: 'text', key: 'catalogUrls', label: 'Ek JSON katalog adresleri', placeholder: 'İsteğe bağlı; boşlukla ayırın' },
    { type: 'text', key: 'addonUrls', label: 'Ek Stremio manifest adresleri', placeholder: 'İsteğe bağlı; boşlukla ayırın' },
    { type: 'text', key: 'subtitleUrls', label: 'Ek/alternatif altyazı addon adresleri', description: 'Boşsa AltyazıDB, Türkçe OpenSubtitles v3+ ve resmî v3 kullanılır.' },
    { type: 'text', key: 'tmdbApiKey', label: 'TMDB v3 anahtarı (isteğe bağlı)', description: 'Boşsa Nuvio tarafından sağlanan anahtar kullanılır.' },
    { type: 'toggle', key: 'includeHls', label: 'HLS çevrimiçi izleme alternatiflerini göster', defaultValue: true, description: 'Doğrudan dosyalar önce gelir. HLS yalnız oynatma içindir; Nuvio üzerinden dosya olarak indirilemez.' },
    { type: 'toggle', key: 'debug', label: 'Hata ayıklama özeti', defaultValue: false, description: 'Uygulama günlüklerine kaynak/adet/HTTP durumlarını yazar; erişim anahtarı veya video adresi yazılmaz.' },
    { type: 'toggle', key: 'allowHttp', label: 'Kişisel HTTP kaynaklarına izin ver', defaultValue: false }
  ];
}
async function getStreams(tmdbId, mediaType, season, episode) {
  const settings = typeof globalThis.SCRAPER_SETTINGS === 'object' && globalThis.SCRAPER_SETTINGS || {};
  const tmdbKey = typeof globalThis.TMDB_API_KEY === 'string' ? globalThis.TMDB_API_KEY : '';
  return createProvider({ settings, tmdbKey }).getStreams(tmdbId, mediaType, season, episode);
}
module.exports = { getStreams, onSettings, createProvider, formatResults };
