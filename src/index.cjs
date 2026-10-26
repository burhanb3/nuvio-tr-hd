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
const { scanAnimecix } = require('./providers/animecix.cjs');
const { scanSonAnime } = require('./providers/sonanime.cjs');
const { scanDiziYou } = require('./providers/diziyou.cjs');
const { scanFilmModu } = require('./providers/filmmodu.cjs');
const { scanAniMom } = require('./providers/animom.cjs');
const { scanDiziBak } = require('./providers/dizibak.cjs');
const { probe } = require('./media/probe.cjs');
const { loadSubtitles, subtitleLanguage, subtitleKey, selectSubtitles, embeddedSubtitleLanguages } = require('./subtitles.cjs');
const { createSubtitleDiscovery, scoreSubtitle } = require('./subtitle-discovery.cjs');
const { safeUrl, mapLimit } = require('./util.cjs');
const { rankStreams } = require('./ranking.cjs');
const { describeQuality, describeSize, cardFields, subtitleLabel } = require('./media/presentation.cjs');
const { profileAddress } = require('./media/hls.cjs');
const { configuration, configurationLabel, effectiveTmdbKey, writeDiagnostic } = require('./diagnostics.cjs');
const { describeAudio } = require('./media/audio.cjs');

function parseUrls(value, allowHttp) {
  if (typeof value !== 'string') return [];
  return [...new Set(value.trim().split(/\s+/).map(url => safeUrl(url, undefined, allowHttp)).filter(Boolean))].slice(0, 3);
}
function formatResults(completed, settings, target) {
  const maximum = Math.max(3, Math.min(20, Number(settings.maxResults) || 20));
  const files = new Map(), distinct = [];
  for (const pair of completed) {
    const v=pair.video, key=v.downloadable&&v.videoHash&&v.size ? `${v.videoHash}:${v.size}:${v.dimensions?.width}x${v.dimensions?.height}` : null;
    const previous=key&&files.get(key);
    if(previous) {
      const tracks=new Map();
      for(const sub of [...previous.subtitles,...pair.subtitles].sort((a,b)=>(b._score||0)-(a._score||0)))if(!tracks.has(subtitleKey(sub)))tracks.set(subtitleKey(sub),sub);
      previous.subtitles=selectSubtitles([...tracks.values()]);
      if(pair.candidate.burnedSubtitleLanguage)previous.candidate={...previous.candidate,burnedSubtitleLanguage:pair.candidate.burnedSubtitleLanguage};
    } else { const copy={...pair,subtitles:pair.subtitles.slice()}; distinct.push(copy);if(key)files.set(key,copy); }
  }
  const expanded = distinct.flatMap(pair => {
    const { video } = pair;
    if (video.container !== 'hls' || !video.renditions?.length || settings.hlsView === 'auto') return [pair];
    const profiles = video.renditions.map(r => {
      const publicSource = ['VixSrc', 'PlayIMDb', 'DiziYou'].includes(pair.candidate.source) &&
        !Object.keys(pair.candidate.headers || {}).some(key => /^(authorization|cookie)$/i.test(key));
      const address = settings.useDownloadBridge !== false && settings.hlsProfileBridgeReady === true && publicSource ? profileAddress(r.playlist, SERVICE_ORIGIN) :
        !r.hasExternalAudio && !r.hasExternalSubtitles && /\.m3u8(?:$|[?#])/i.test(r.url) ? r.url : null;
      if (!address) return null;
      return { ...pair, video: { ...video, url: address, renditions: undefined, resolutionOptions: [r.dimensions], sizeEstimate: r.sizeEstimate, duration: r.duration,
        audioLanguages: r.audioLanguages || video.audioLanguages, subtitleLanguages:r.subtitleLanguages||video.subtitleLanguages } };
    }).filter(Boolean);
    return profiles.length ? settings.hlsView === 'both' ? [pair, ...profiles] : profiles : [pair];
  });
  const ordering = { ...settings, sortOrder: settings.sortOrder || 'size_asc' };
  return rankStreams(expanded, maximum, ordering).map(({ candidate, video, subtitles }, index) => {
    const kind = video.downloadable ? `${video.container.toUpperCase()} · Online izlenebilir · İndirilebilir` : 'HLS · Online izlenebilir · İndirilemez';
    const quality = describeQuality(video, candidate), size = describeSize(video);
    const audio = describeAudio(video, candidate);
    const fields = cardFields(video,candidate,subtitles);
    const dimensionText = ` · ${quality.text}`;
    const subScore = subtitles[0]?._score || 0;
    const matchText = subScore >= 90 ? 'eşleşti' : subScore >= 70 ? 'sürüm benzerliği' : subScore >= 65 ? 'süre uyumu' : 'film düzeyi; senkron belirsiz';
    const embedded = embeddedSubtitleLanguages(video,candidate).length>0;
    const burnedForeign = candidate.burnedSubtitleLanguage === 'es' ? 'İspanyolca altyazı görüntüye işlenmiş' : '';
    const subtitleText = ` · ${subtitleLabel(video,candidate,subtitles)}` + (subtitles.length ? ` (${matchText})` : embedded ? ` (${video.container==='hls'?'HLS':'dosya'} içi)` : '');
    const detailedTitle = `${target.originalTitle} (${target.year}) · ${kind}${dimensionText} · ${size.text}${audio ? ' · Ses: '+audio.text : ''}${subtitleText}${burnedForeign ? ' · '+burnedForeign : ''}`;
    const title = settings.compactLabels === false ? detailedTitle : `${fields.quality} · ${fields.size} · ${fields.language}${!subtitles.length&&embedded?' · '+(video.container==='hls'?'HLS':'Dosya')+' içi altyazı':''}${burnedForeign ? ' · '+burnedForeign : ''}${video.container === 'hls' ? ' · Online izlenebilir · İndirilemez' : ''}`;
    const source = String(candidate.source || 'Kaynak').replace('4KHDHub / HubCloud', '4KHDHub').replace('Internet Archive', 'Archive') +
      (candidate.serverIndex ? ` ${candidate.serverIndex}` : '');
    const badge = video.downloadable ? 'İndirilebilir' : 'Online';
    const label = settings.compactLabels === false ? `${source} · ${kind}${dimensionText} · ${size.text}${subtitleText}` : `${badge} · ${source}`;
    return { name: `${String(index + 1).padStart(2, '0')} · ${label}`,
      title, url: video.url, quality: fields.quality, size: fields.size,
      language: fields.language, provider: 'Nuvio TR HD', type: video.container,
      ...(Object.keys(candidate.headers).length ? { headers: candidate.headers } : {}),
      subtitles: subtitles.map(({ _score, ...subtitle }) => subtitle) };
  });
}

function createProvider({ settings = {}, fetchImpl, tmdbKey, budgetMs = 24000, requestTimeoutMs = 4500, onEvent = () => {}, sourceFactories = [], lane = 'all' } = {}) {
  let lastReport = null, lastPairs = [];
  return {
    getReport: () => lastReport,
    getPairs: () => lastPairs,
    async getStreams(tmdbId, mediaType, season, episode) {
      const allowHttp = settings.allowHttp === true;
      const catalogs = parseUrls(settings.catalogUrls, allowHttp), addons = parseUrls(settings.addonUrls, allowHttp);
      const filesLane = ['all','main','files'].includes(lane), onlineLane = ['all','main','online'].includes(lane), animeLane = lane === 'all' || lane === 'anime';
      const started = Date.now(), scheduler = createScheduler();
      const report = { tmdbId: /^\d+$/.test(String(tmdbId)) ? String(tmdbId) : 'invalid', lane, configuration: configuration(settings, tmdbKey),
        identity: { reason: 'not_requested' }, sources: [], rejected: {}, http: {}, subtitleText: {}, results: 0, reason: 'searching' };
      if (settings.autoDiscover === false && !catalogs.length && !addons.length) {
        report.reason = 'automatic_search_disabled'; report.elapsedMs = Date.now() - started;
        lastReport = report; lastPairs = []; scheduler.close(); writeDiagnostic(report, true);
        return [];
      }
      const emit = event => {
        if (event.stage === 'identity') report.identity = { reason: event.reason, ...(event.year ? { year: event.year, type: event.type } : {}) };
        if (event.stage === 'http') {
          const key = `${event.host}:${event.status || event.reason}`;
          report.http[key] = (report.http[key] || 0) + 1;
        }
        if (event.stage === 'subtitle_text') for (const [key, value] of Object.entries(event)) {
          if (key !== 'stage' && value === true) report.subtitleText[key] = (report.subtitleText[key] || 0) + 1;
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
        if (unique.size >= 40) { reject('candidate_limit'); return; }
        unique.set(key, candidate);
        if (/\.m3u8(?:$|[?#])/i.test(candidate.url) && settings.includeHls === false) { reject('hls_disabled'); return; }
        const lightweightHls = ['PlayIMDb', 'VixSrc', 'DiziYou', 'DiziBak', 'FilmModu'].includes(candidate.source) && settings.detailedHlsMetadata !== true;
        const video = await withProbeSlot(() => probe(http, candidate, settings.includeHls !== false, settings.autoSubtitles !== false,
          { detailedHls: !lightweightHls }));
        if (!video || http.expired()) { reject('video_unavailable'); return; }
        const minimum = Number(settings.minimumQuality ?? 0);
        if (video.dimensions && Math.min(video.dimensions.width, video.dimensions.height) < minimum) { reject('quality'); return; }
        const pair = { candidate, video, subtitles: [] };
        const embedded = embeddedSubtitleLanguages(video,candidate).includes('tr');
        let published = !strictSubtitles || embedded;
        if (published) completed.push(pair);
        const validatedTracks = new Map();
        const acceptTrack = track => {
          if(http.expired())return;
          const key=track._contentKey||track.url,previous=validatedTracks.get(key);
          const { _contentKey, ...clean }=track;
          if(!previous||(clean._score||0)>(previous._score||0)||clean.language==='tr'&&previous.language==='en')validatedTracks.set(key,clean);
          pair.subtitles=selectSubtitles([...validatedTracks.values()]);
          if(pair.subtitles.some(s=>s.language==='tr')&&!published){completed.push(pair);published=true;}
        };
        const declared = candidate.subtitles.map(sub => {
          const match = sub && scoreSubtitle(sub, candidate, video, target, settings.subtitleMatchMode !== 'strict');
          return match ? { ...sub, _match: match } : null;
        }).filter(Boolean).sort((a, b) => b._match.score - a._match.score);
        if (declared.length) {
          await loadSubtitles(http, { ...candidate, subtitles: declared }, target, allowHttp,
            { keepScore: true, onTrack: acceptTrack, videoDuration: video.durationSource === 'tmdb' ? undefined : video.duration });
          if (['tr','en'].every(language=>pair.subtitles.some(s=>s.language===language))) return;
        }
        const needed=['tr','en'].filter(language=>!pair.subtitles.some(s=>s.language===language));
        const scheduled = new Set(), deferred=[],counts={tr:0,en:0},generalCount={tr:0,en:0},releaseReserved={tr:false,en:false},limits={tr:12,en:8};let totalCount=0;
        const acceptBatch = async rows => {
          if(http.expired())return;
          const entries = rows.map(sub => {
          if (!sub || typeof sub !== 'object') return null;
          const match = scoreSubtitle(sub, candidate, video, target, settings.subtitleMatchMode !== 'strict');
          return match ? { ...sub, _match: match } : null;
          }).filter(Boolean).sort((a,b)=>b._match.score-a._match.score).filter(sub=>{
            const url=safeUrl(sub.url,candidate.subtitleBase,allowHttp);
            const language=subtitleLanguage(sub.language||sub.lang||sub.lang_code),key=url+JSON.stringify(sub.headers||{}),strong=sub._match.score>=90;
            if(!language||!needed.includes(language)||!url||scheduled.has(key)||counts[language]>=limits[language]||/\.(zip|ass|ssa|rar)(?:\/?$|[?#])/i.test(url))return false;
            const generalLimit=video.videoHash&&!releaseReserved[language]?limits[language]-4:limits[language];
            if(!strong&&generalCount[language]>=generalLimit){deferred.push(sub);return false;}
            const existing=pair.subtitles.filter(s=>s.language===language);
            if(existing.length===4&&sub._match.score<=(existing[3]._score||0))return false;
            scheduled.add(key);totalCount++;counts[language]++;if(!strong)generalCount[language]++;return true;
          });
          if(entries.length)await loadSubtitles(http,{...candidate,subtitles:entries},target,allowHttp,
            {keepScore:true,onTrack:acceptTrack,videoDuration:video.durationSource==='tmdb'?undefined:video.duration});
        };
        await discoverSubtitles(candidate,video,{onBatch:acceptBatch,languages:needed});
        if(!http.expired()&&deferred.length){for(const language of needed)releaseReserved[language]=true;await acceptBatch(deferred.slice());}
        if(!http.expired()&&!pair.subtitles.length)reject(totalCount?'subtitle_unavailable':'subtitle_no_match');
      };
      const run = async () => {
        try {
          target = await resolveIdentity(http, tmdbId, mediaType, season, episode, effectiveTmdbKey(settings, tmdbKey));
          if (!target) { report.reason = 'identity_unavailable'; return []; }
          if (lane === 'anime' && !target.isAnime) { report.reason = 'not_anime'; return []; }
          discoverSubtitles = createSubtitleDiscovery(http, target, settings);
          if (onlineLane && settings.autoDiscover !== false && settings.useDownloadBridge !== false && settings.hlsView !== 'auto')
            void http.json(SERVICE_ORIGIN + '/api/health', { timeoutMs: 1500 }).then(data => { profileBridgeReady = data?.features?.hlsProfiles === true; });
          let hosted = null;
          if (lane === 'all' && settings.autoDiscover !== false && settings.hostedDiscovery === true) {
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
                    (strictSubtitles && !pair.subtitles.some(s=>s.language==='tr') && !embeddedSubtitleLanguages(pair.video,pair.candidate).includes('tr'))) continue;
                completed.push(pair);
              }
              report.sources.push({ name: 'Ortak tarama', candidates: hosted.length });
            }
          }
          const pending = [], streamed = new Set();
          const acceptCandidates = async (candidates, bridge = false) => {
            const ready = bridge && settings.useDownloadBridge !== false ? await registerDownloads(http, candidates, target) : candidates;
            for (const candidate of ready) {
              const key = candidate.url + JSON.stringify(Object.entries(candidate.headers).sort());
              if (streamed.has(key)) continue;
              streamed.add(key);
              void discoverSubtitles.prefetch();
              pending.push(processCandidate(candidate).catch(() => reject('candidate_error')));
            }
          };
          let archiveAccepted = 0;
          const acceptArchive = async candidates => {
            const selected = candidates.slice(0, Math.max(0, quota - archiveAccepted));
            archiveAccepted += selected.length;
            await acceptCandidates(selected);
          };
          const sourceJobs = filesLane ? [...catalogs.map(url => ({ name: 'JSON', run: () => loadCatalog(http, url, target, allowHttp) })),
            ...addons.map(url => ({ name: 'Stremio', run: () => loadAddon(http, url, target, allowHttp) }))] : [];
          if (settings.autoDiscover !== false && hosted === null) {
            if (filesLane && settings.directoryEnabled === true) sourceJobs.push({ name: 'DahmerMovies', run: () => scanDirectory(http, target, settings) });
            if (filesLane && settings.archiveEnabled !== false) sourceJobs.push({ name: 'Internet Archive', run: () => scanArchive(http, target, { onCandidates: acceptArchive }) });
            if (onlineLane && settings.playImdbEnabled !== false) sourceJobs.push({ name: 'PlayIMDb', run: () => scanPlayImdb(http, target) });
            if (onlineLane && settings.vixsrcEnabled !== false && settings.includeHls !== false && !sourceFactories.some(s => s.name === 'VixSrc'))
              sourceJobs.push({ name: 'VixSrc', run: () => scanVixDirect(http, target) });
            if (animeLane && settings.animecixEnabled !== false && target.isAnime) sourceJobs.push({ name: 'Animecix', run: () => scanAnimecix(http, target) });
            if (animeLane && settings.sonanimeEnabled !== false && target.isAnime) sourceJobs.push({ name: 'SonAnime', run: () => scanSonAnime(http, target) });
            if (animeLane && settings.animomEnabled === true && target.isAnime) sourceJobs.push({ name: 'AniMOM', run: () => scanAniMom(http, target) });
            if (onlineLane && settings.includeHls !== false && settings.diziyouEnabled !== false && target.type === 'tv' && !target.isAnime)
              sourceJobs.push({ name: 'DiziYou', run: () => scanDiziYou(http, target) });
            if (onlineLane && settings.includeHls !== false && settings.dizibakEnabled !== false && target.type === 'tv' && !target.isAnime)
              sourceJobs.push({ name: 'DiziBak', run: () => scanDiziBak(http, target) });
            if (onlineLane && settings.includeHls !== false && settings.filmmoduEnabled !== false && target.type === 'movie' && !target.isAnime)
              sourceJobs.push({ name: 'FilmModu', run: () => scanFilmModu(http, target) });
            if (filesLane && settings.hdhubEnabled !== false && !sourceFactories.some(s => s.name === '4KHDHub / HubCloud')) sourceJobs.push({ name: '4KHDHub / HubCloud', run: async () => {
              return scanHdHub(http, target, { allowExtensionless: settings.useDownloadBridge !== false, onCandidates: candidates => acceptCandidates(candidates, true) });
            } });
          }
          for (const source of sourceFactories) sourceJobs.push({ name: source.name, run: () => source.run(http, target) });
          // Adding an online fallback must not shrink the existing file quota.
          // The common admission/probe limit still bounds the whole search.
          const quota = 10;
          await mapLimit(sourceJobs, 4, async job => {
            let candidates;
            try { candidates = await job.run(); } catch { candidates = []; }
            report.sources.push({ name: job.name, candidates: candidates.length });
            emit({ stage: 'source', source: job.name, candidates: candidates.length });
            if (!candidates.length || http.expired()) return;
            if (['4KHDHub / HubCloud','Internet Archive'].includes(job.name) && !sourceFactories.some(s => s.name === job.name)) return;
            // Warm the shared title lookup while media probes run. It is not
            // started for wholly empty searches, and never blocks other sources.
            void discoverSubtitles.prefetch();
            await mapLimit(candidates.slice(0, quota), 3, processCandidate);
          });
          await Promise.all(pending);
          return formatResults(completed, renderSettings(), target);
        } catch { report.reason = 'internal_error'; return target ? formatResults(completed, renderSettings(), target) : []; }
      };
      try {
        const results = await Promise.race([run(), new Promise(resolve => {
          timer = scheduler.schedule(() => { report.reason = 'deadline'; resolve(target ? formatResults(completed, renderSettings(), target) : []); }, budgetMs);
        })]);
        report.results = results.length;
        // Request and search timers can expire in the same scheduler tick.
        // Even if the last request wins the promise race, the wall-clock
        // deadline has still been reached; preserve completed pairs and report it.
        if (report.reason === 'searching') report.reason = http.expired() ? 'deadline' : results.length ? 'ok' : 'no_eligible_sources';
        return results;
      } finally {
        http.close(); scheduler.cancel(timer); scheduler.close();
        report.elapsedMs = Date.now() - started;
        lastReport = JSON.parse(JSON.stringify(report));
        lastPairs = completed.slice();
        writeDiagnostic(lastReport, settings.debug === true || !report.results);
      }
    }
  };
}

function onSettings() {
  const settings = typeof globalThis.SCRAPER_SETTINGS === 'object' && globalThis.SCRAPER_SETTINGS || {};
  const tmdbKey = typeof globalThis.TMDB_API_KEY === 'string' ? globalThis.TMDB_API_KEY : '';
  return [
    { type: 'header', label: 'Nuvio TR HD · Otomatik kaynak ve TR/EN altyazı' },
    { type: 'info', label: configurationLabel(settings, tmdbKey) },
    { type: 'info', label: 'Kart sırası: kalite · GB · ses · TR/EN altyazı. Eksik bilgi açıkça yazılır; ? ses iddiası, ~ boyut tahminidir. En fazla 20 sonuç, tüm çözünürlükler. Türkçe yoksa varsayılan olarak video korunur; İngilizce altyazılar da sunulur. Nuvio altyazı dilini Türkçe seçebilirsiniz.' },
    { type: 'toggle', key: 'autoDiscover', label: 'Otomatik kaynak tarama', defaultValue: true },
    { type: 'toggle', key: 'compactLabels', label: 'Kısa ve sade kaynak başlıkları', defaultValue: true },
    { type: 'select', key: 'audioPreference', label: 'Önerilen sıralamada ses tercihi', defaultValue: 'preferred', options: [
      { value: 'preferred', label: 'Özgün ses / TR / EN önce' }, { value: 'all', label: 'Bütün ses dilleri eşit' }],
      description: 'Dosyalar gizlenmez. Önerilen sırada ölçülmüş farklı dublaj geriye alınır; boyut/kalite sıralaması tercihiniz korunur. Harici ses otomatik birleştirilmez.' },
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
    { type: 'toggle', key: 'detailedHlsMetadata', label: 'HLS için ek süre ve boyut ölçümleri', defaultValue: false,
      description: 'Ek profil/parça istekleri aramayı uzatabilir. Kapalıyken doğrulanan ana liste korunur; boyut varsa bitrate ve TMDB süresinden açıkça tahmin edilir. MP4/MKV dosya doğrulaması her zaman yapılır.' },
    { type: 'toggle', key: 'useDownloadBridge', label: 'MKV indirme adını koruyan dosya köprüsü', defaultValue: true, description: 'Kaynaklar telefondan aranır. Yalnız bulunan public dosya adresi ve film metadatası köprüde doğrulanır. Video doğrudan kaynaktan gelir; kişisel katalog/anahtar gönderilmez.' },
    { type: 'toggle', key: 'vixsrcEnabled', label: 'VixSrc çevrimiçi alternatifleri', defaultValue: true },
    { type: 'toggle', key: 'hdhubEnabled', label: '4KHDHub / HubCloud doğrudan dosya araması', defaultValue: true, description: 'Ücretsiz public FSL dosyaları doğrulanır. Kaynak metadatası boyut/piksel doğrulaması sayılmaz.' },
    { type: 'toggle', key: 'directoryEnabled', label: 'DahmerMovies dizin taraması (deneysel yerel yedek)', defaultValue: false, description: 'Dosya CDN’i sık 403/429 döndürdüğünden varsayılan kapalıdır.' },
    { type: 'toggle', key: 'archiveEnabled', label: 'Internet Archive film araması', defaultValue: true },
    { type: 'toggle', key: 'playImdbEnabled', label: 'PlayIMDb API araması', defaultValue: true, description: 'Bazı sonuçlar HLS olabilir; dosya indirmesi olarak gösterilmez.' },
    { type: 'toggle', key: 'animecixEnabled', label: 'Animecix anime MP4 araması', defaultValue: true, description: 'TMDB kimliği, özgün başlık, yıl ve tam sezon/bölüm doğrulanır. TR kaynak bilgisi tek başına altyazı kanıtı değildir.' },
    { type: 'toggle', key: 'sonanimeEnabled', label: 'SonAnime anime dosyası araması', defaultValue: true, description: 'Tam TMDB/yıl/bölüm bağı ve gerçek dosya kontrolü. Aynı dosyanın aynası ek kalite sayılmaz.' },
    { type: 'toggle', key: 'diziyouEnabled', label: 'DiziYou dizi ve eşlenmiş TR altyazılar', defaultValue: true },
    { type: 'toggle', key: 'dizibakEnabled', label: 'DiziBak dizi alternatifi', defaultValue: true, description: 'Küçük public metadata yanıtları kullanılır. İlk bölüm tarihi ve dizi kategorisi uyuşmazsa sonuç eklenmez.' },
    { type: 'toggle', key: 'filmmoduEnabled', label: 'FilmModu online film ve kaynak ses seçenekleri', defaultValue: true },
    { type: 'info', label: 'Ses kodları: EN İngilizce, TR Türkçe, JA Japonca, HI Hintçe. ? işareti kaynak/dosya adı iddiasıdır. ES görüntüde, İspanyolca sabit altyazıdır; ses dili değildir.' },
    { type: 'toggle', key: 'autoSubtitles', label: 'TR ve EN altyazıları otomatik ara', defaultValue: true },
    { type: 'toggle', key: 'animomEnabled', label: 'Deneysel AniMOM anime dosyaları', defaultValue: false, description: 'Varsayılan kapalı: tekil MP4/TR doğrulandı, birleşik arama ve bazı bölümlerde CDN kararsız. Tam ad/yıl/bölüm gerekir; düz bölüm numarası başka sezona taşınmaz.' },
    { type: 'select', key: 'subtitlePolicy', label: 'Türkçe altyazı bulunamazsa', defaultValue: 'prefer', options: [
      { value: 'prefer', label: 'Videoyu göster; TR altyazı yok bilgisini yaz' }, { value: 'require', label: 'Videoyu gizle' }] },
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
    { type: 'text', key: 'subtitleUrls', label: 'Ek/alternatif TR/EN altyazı addon adresleri', description: 'Boşsa AltyazıDB, TR/EN OpenSubtitles v3+ ve resmî v3 kullanılır. Dil başına en fazla dört geçerli alternatif sunulur.' },
    { type: 'text', key: 'tmdbApiKey', label: 'TMDB v3 anahtarı (isteğe bağlı)', description: 'Boşsa Nuvio tarafından sağlanan anahtar kullanılır.' },
    { type: 'toggle', key: 'includeHls', label: 'HLS çevrimiçi izleme alternatiflerini göster', defaultValue: true, description: 'Doğrudan dosyalar önce gelir. HLS yalnız oynatma içindir; Nuvio üzerinden dosya olarak indirilemez.' },
    { type: 'toggle', key: 'debug', label: 'Hata ayıklama özeti', defaultValue: false, description: 'Boş sonuçlarda tanı zaten yazılır; açıkken başarılı aramaları da yazar. Günlükte ayar/kimlik/kaynak/adet/HTTP durumları vardır; anahtar ve video adresi yoktur.' },
    { type: 'toggle', key: 'allowHttp', label: 'Kişisel HTTP kaynaklarına izin ver', defaultValue: false }
  ];
}
async function getStreams(tmdbId, mediaType, season, episode) {
  const settings = typeof globalThis.SCRAPER_SETTINGS === 'object' && globalThis.SCRAPER_SETTINGS || {};
  const tmdbKey = typeof globalThis.TMDB_API_KEY === 'string' ? globalThis.TMDB_API_KEY : '';
  return createProvider({ settings, tmdbKey }).getStreams(tmdbId, mediaType, season, episode);
}
function createEntry(lane) {
  const titles = { main: 'Film/dizi · online ve dosyalar', files: 'Dosyalar', online: 'Hızlı kaynaklar', anime: 'Anime' };
  const only = { files: ['hdhubEnabled','directoryEnabled','archiveEnabled','catalogUrls','addonUrls'], online: ['playImdbEnabled','vixsrcEnabled','diziyouEnabled','dizibakEnabled','filmmoduEnabled','hlsView'], anime: ['animecixEnabled','sonanimeEnabled'] };
  only.main = [...only.files, ...only.online];
  const sourceFields = Object.values(only).flat();
  return {
    async getStreams(...args) {
      const settings = typeof globalThis.SCRAPER_SETTINGS === 'object' && globalThis.SCRAPER_SETTINGS || {};
      const tmdbKey = typeof globalThis.TMDB_API_KEY === 'string' ? globalThis.TMDB_API_KEY : '';
      return createProvider({ settings, tmdbKey, lane, budgetMs: lane === 'main' ? 24000 : lane === 'online' ? 16000 : lane === 'anime' ? 20000 : 28000 }).getStreams(...args);
    },
    onSettings: () => [{ type: 'info', label: lane === 'main' ? 'Film/dizi araması online HLS ile gerçek MP4/MKV dosyalarını aynı listede sunar. Dosya araması boşsa online alternatifler korunur. Anime ayrı taramadır.' : `Bu ayarlar yalnız ${titles[lane]} taramasına aittir. En fazla kaynak sınırı bu tarama içindir.` },
      ...onSettings().filter(field => !sourceFields.includes(field.key) || only[lane].includes(field.key))]
  };
}
module.exports = { getStreams, onSettings, createProvider, formatResults, createEntry };
