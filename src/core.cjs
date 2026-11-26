'use strict';
const { createHttp } = require('./http.cjs');
const { createScheduler } = require('./scheduler.cjs');
const { loadHosted, registerDownloads, SERVICE_ORIGIN } = require('./hosted.cjs');
const { resolveIdentity,resolveTranslatedTitles,resolveAlternativeTitles,resolveSeasonEpisode,resolveSeasonEpisodes,resolvePosterPaths } = require('./matching.cjs');
const { probe } = require('./media/probe.cjs');
const {languageCodes}=require('./media/languages.cjs');
const { loadSubtitles, subtitleLanguage, subtitleKey, selectSubtitles, embeddedSubtitleLanguages } = require('./subtitles.cjs');
const { createSubtitleDiscovery, scoreSubtitle } = require('./subtitle-discovery.cjs');
const { safeUrl, mapLimit, qualityLabel } = require('./util.cjs');
const { rankStreams } = require('./ranking.cjs');
const { cardFields, subtitleLabel } = require('./media/presentation.cjs');
const { profileAddress } = require('./media/hls.cjs');
const { configuration, configurationLabel, effectiveTmdbKey, writeDiagnostic } = require('./diagnostics.cjs');

const FAST_ONLINE_BUDGET_MS = 18000;
const FAST_ONLINE_AFTER_IDENTITY_MS = 8000;
// Scrapers split off because one of their hosts can hang a native request for
// 60 s on iOS. Subtitle traffic starts only after media bytes pass the probe,
// and HLS/bridge/HTTP settings do not apply.
const ISOLATED_LANES = ['extraAnime', 'goojara', 'hdrezka'];

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
  const ordering = { ...settings, downloadFirst: settings.downloadFirst !== false, sortOrder: settings.sortOrder || 'size_asc' };
  return rankStreams(expanded, maximum, ordering).map(({ candidate, video, subtitles }, index) => {
    const kind = video.downloadable ? `${video.container.toUpperCase()} · Online izlenebilir · İndirilebilir` : 'HLS · Online izlenebilir · İndirilemez';
    const fields = cardFields(video,candidate,subtitles);
    const burnedForeign = candidate.burnedSubtitleLanguage === 'es' ? 'İspanyolca altyazı görüntüye işlenmiş' : candidate.burnedSubtitleLanguage === 'en' ? 'İngilizce altyazı görüntüye işlenmiş' : candidate.burnedSubtitleLanguage==='und'?'Sabit altyazılı olarak etiketlenmiş':candidate.burnedSubtitleLanguage==='tr'&&candidate.burnedSubtitleBasis==='site-label'?'Sitede Türkçe altyazılı olarak etiketlenmiş':'';
    const description=[fields.quality,fields.size,fields.language].filter(Boolean).join(' · ');
    const detailedTitle=[`${target.originalTitle} (${target.year})`,kind,description,burnedForeign].filter(Boolean).join(' · ');
    const title = settings.compactLabels === false ? detailedTitle : description+(burnedForeign?' · '+burnedForeign:'')+(video.container==='hls'?' · Online izlenebilir · İndirilemez':'');
    const source = String(candidate.source || 'Kaynak').replace('4KHDHub / HubCloud', '4KHDHub').replace('MoviesDrive / Pixeldrain','MoviesDrive').replace('Internet Archive', 'Archive') +
      (candidate.serverIndex ? ` ${candidate.serverIndex}` : '');
    const badge = video.downloadable ? 'İndirilebilir' : 'Online';
    const label = settings.compactLabels === false ? [source,kind,fields.quality,fields.size,subtitleLabel(video,candidate,subtitles)].filter(Boolean).join(' · ') : `${badge} · ${source}`;
    return { name: `${String(index + 1).padStart(2, '0')} · ${label}`,
      title, url: video.url, quality: fields.quality, size: fields.size,
      language: fields.language, provider: 'Nuvio TR HD', type: video.container,
      ...(Object.keys(candidate.headers).length ? { headers: candidate.headers } : {}),
      subtitles: subtitles.map(({ _score, ...subtitle }) => subtitle) };
  });
}

function createProvider({ settings = {}, fetchImpl, tmdbKey, budgetMs, requestTimeoutMs = 4500, onEvent = () => {}, sourceFactories = [], lane = 'all', adapters = {} } = {}) {
  const totalBudgetMs = budgetMs ?? (lane === 'fastOnline' ? FAST_ONLINE_BUDGET_MS : 24000);
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
      const http = createHttp({ fetchImpl, allowHttp, timeoutMs: requestTimeoutMs, deadline: started + totalBudgetMs, scheduler, onEvent: emit });
      const completed = [];
      const rejectedAudioFamilies=new Set();
      const availablePairs=()=>completed.filter(pair=>!pair.candidate.mediaFamily||!rejectedAudioFamilies.has(pair.candidate.mediaFamily)||languageCodes(pair.video.audioLanguages).some(code=>code!=='hi'));
      const unique = new Map(), waiting = [];
      let active = 0;
      let timer, target, discoverSubtitles;
      let scheduleDeadline;
      let profileBridgeReady = false;
      const renderSettings = () => ({ ...settings, hlsProfileBridgeReady: profileBridgeReady });
      const searchTimeout = new Promise(resolve => {
        scheduleDeadline = end => {
          http.shortenDeadline(end);
          scheduler.cancel(timer);
          timer = scheduler.schedule(() => {
            report.reason = 'deadline';
            resolve(target ? formatResults(availablePairs(), renderSettings(), target) : []);
          }, end - Date.now());
        };
        scheduleDeadline(started + totalBudgetMs);
      });
      const strictSubtitles = settings.subtitlePolicy === 'require';
      async function withProbeSlot(job) {
        if (active >= (lane === 'extraAnime' ? 1 : 3)) await new Promise(resolve => waiting.push(resolve));
        else active++;
        try { if (!http.expired()) return await job(); }
        finally { if (waiting.length) waiting.shift()(); else active--; }
      }
      const processCandidate = async candidate => {
        const key = candidate.url + JSON.stringify(Object.entries(candidate.headers).sort());
        if (unique.has(key)) { unique.get(key).subtitles.push(...(candidate.subtitles || [])); return; }
        if (unique.size >= 40) { reject('candidate_limit'); return; }
        unique.set(key, candidate);
        if (/\.m3u8(?:$|[?#])/i.test(candidate.url) && settings.includeHls === false) { reject('hls_disabled'); return; }
        const lightweightHls = ['PlayIMDb', 'VixSrc', 'DiziYou', 'DiziBak', 'FilmModu','HDFilmDelisi','DiziBal','Purstream','KultFilmler','DiziBox'].includes(candidate.source) && settings.detailedHlsMetadata !== true;
        let unwantedAudio = false;
        const video = await withProbeSlot(() => probe(http, candidate, settings.includeHls !== false, settings.autoSubtitles !== false,
          { detailedHls: !lightweightHls,onUnwantedAudio:()=>{unwantedAudio=true;reject('hindi_only_audio');if(typeof candidate.mediaFamily==='string')rejectedAudioFamilies.add(candidate.mediaFamily);} }));
        if (!video || http.expired()) {
          const failure = http.failureFor(candidate.url)?.reason;
          if (!unwantedAudio) reject(['host_unreachable','server_unavailable'].includes(failure) ? failure : 'video_unavailable');
          return;
        }
        const minimum = Number(settings.minimumQuality ?? 0);
        if (video.dimensions && parseInt(qualityLabel(video.dimensions)) < minimum) { reject('quality'); return; }
        const pair = { candidate, video, subtitles: [] };
        if (ISOLATED_LANES.includes(lane)) void discoverSubtitles.prefetch();
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
        const declared = (candidate.subtitles || []).map(sub => {
          const match = sub && scoreSubtitle(sub, candidate, video, target, settings.subtitleMatchMode !== 'strict');
          return match ? { ...sub, _match: match } : null;
        }).filter(Boolean).sort((a, b) => b._match.score - a._match.score);
        if (declared.length) {
          await loadSubtitles(http, { ...candidate, subtitles: declared }, target, allowHttp,
            { keepScore: true, onTrack: acceptTrack, videoDuration: video.durationSource === 'tmdb' ? undefined : video.duration });
          if (['tr','en'].every(language=>pair.subtitles.some(s=>s.language===language))) return;
        }
        const needed=['tr','en'].filter(language=>!pair.subtitles.some(s=>s.language===language));
        const scheduled = new Set(), deferred=[],counts={tr:0,en:0},generalCount={tr:0,en:0},releaseReserved={tr:false,en:false},limits={tr:12,en:8},serviceCounts=new Map();let totalCount=0;
        const failedFast=url=>{const failure=http.failureFor(url);return http.unavailable?.(url)===true||!!failure&&(failure.status>=500||['host_unreachable','server_unavailable'].includes(failure.reason));};
        const acceptBatch = async (rows,finalPass=false) => {
          if(http.expired())return;
          const entries = rows.map(sub => {
          if (!sub || typeof sub !== 'object') return null;
          const match = scoreSubtitle(sub, candidate, video, target, settings.subtitleMatchMode !== 'strict');
          return match ? { ...sub, _match: match } : null;
          }).filter(Boolean).sort((a,b)=>b._match.score-a._match.score).filter(sub=>{
            const url=safeUrl(sub.url,candidate.subtitleBase,allowHttp);
            const language=subtitleLanguage(sub.language||sub.lang||sub.lang_code),key=url+JSON.stringify(sub.headers||{}),strong=sub._match.score>=90;
            if(!language||!needed.includes(language)||!url||scheduled.has(key)||/\.(zip|ass|ssa|rar)(?:\/?$|[?#])/i.test(url)||failedFast(url))return false;
            if(counts[language]>=limits[language]){if(!finalPass)deferred.push(sub);return false;}
            const generalLimit=video.videoHash&&!releaseReserved[language]?limits[language]-4:limits[language];
            if(!strong&&generalCount[language]>=generalLimit){deferred.push(sub);return false;}
            const service=language+' '+new URL(url).origin;
            if(!strong&&!finalPass&&(serviceCounts.get(service)||0)>=4){deferred.push(sub);return false;}
            const existing=pair.subtitles.filter(s=>s.language===language);
            if(existing.length===4&&sub._match.score<=(existing[3]._score||0))return false;
            scheduled.add(key);totalCount++;counts[language]++;if(!strong)generalCount[language]++;serviceCounts.set(service,(serviceCounts.get(service)||0)+1);return true;
          });
          if(entries.length){
            await loadSubtitles(http,{...candidate,subtitles:entries},target,allowHttp,
              {keepScore:true,onTrack:acceptTrack,videoDuration:video.durationSource==='tmdb'?undefined:video.duration});
            for(const sub of entries){
              if(!failedFast(safeUrl(sub.url,candidate.subtitleBase,allowHttp)))continue;
              const language=subtitleLanguage(sub.language||sub.lang||sub.lang_code);counts[language]--;if(sub._match.score<90)generalCount[language]--;
            }
          }
        };
        await discoverSubtitles(candidate,video,{onBatch:acceptBatch,languages:needed});
        if(!http.expired()&&deferred.length){for(const language of needed)releaseReserved[language]=true;await acceptBatch(deferred.splice(0),true);}
        if(!http.expired()&&!pair.subtitles.length)reject(totalCount?'subtitle_unavailable':'subtitle_no_match');
      };
      const run = async () => {
        try {
          target = await resolveIdentity(http, tmdbId, mediaType, season, episode, effectiveTmdbKey(settings, tmdbKey));
          if (!target) { report.reason = 'identity_unavailable'; return []; }
          if (lane === 'fastOnline') {
            scheduleDeadline(Math.min(started + totalBudgetMs, Date.now() + FAST_ONLINE_AFTER_IDENTITY_MS));
          }
          if (['anime','extraAnime'].includes(lane) && !target.isAnime) { report.reason = 'not_anime'; return []; }
          if (lane === 'extraAnime' && target.type !== 'tv') { report.reason = 'unsupported_media_type'; return []; }
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
                    (source.startsWith('4KHDHub / ') && settings.hdhubEnabled === false) ||
                    (pair.video.container === 'hls' && settings.includeHls === false) ||
                    (pair.video.dimensions && parseInt(qualityLabel(pair.video.dimensions)) < Number(settings.minimumQuality || 0)) ||
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
          const tmdbApiKey = effectiveTmdbKey(settings, tmdbKey);
          const translatedJobs = new Map();
          const loadTranslated = (client, languages = ['tr', 'en']) => {
            const k = languages.join(',');
            if (!translatedJobs.has(k)) translatedJobs.set(k, resolveTranslatedTitles(client, target, tmdbApiKey, languages));
            return translatedJobs.get(k);
          };
          let altTitlesJob = null;
          const loadAltTitles = client => {
            if (!altTitlesJob) altTitlesJob = resolveAlternativeTitles(client, target, tmdbApiKey);
            return altTitlesJob;
          };
          const sourceJobs = filesLane ? [...(adapters.loadCatalog ? catalogs.map(url => ({ name: 'JSON', run: () => adapters.loadCatalog(http, url, target, allowHttp) })) : []),
            ...(adapters.loadAddon ? addons.map(url => ({ name: 'Stremio', run: () => adapters.loadAddon(http, url, target, allowHttp) })) : [])] : [];
          if (settings.autoDiscover !== false && hosted === null) {
            if (filesLane && adapters.scanDirectory && settings.directoryEnabled === true) sourceJobs.push({ name: 'DahmerMovies', run: () => adapters.scanDirectory(http, target, settings) });
            if (filesLane && adapters.scanArchive && settings.archiveEnabled !== false) sourceJobs.push({ name: 'Internet Archive', run: () => adapters.scanArchive(http, target, { onCandidates: acceptArchive,
              loadTitles:()=>loadTranslated(http) }) });
            if (adapters.scanGoojara && ((lane === 'goojara' && settings.goojaraEnabled !== false) || (lane === 'all' && settings.goojaraEnabled === true)))
              sourceJobs.push({name:'Goojara',run:()=>adapters.scanGoojara(http.scope(12000),target)});
            const pushHdHub = () => {
              if (filesLane && adapters.scanHdHub && settings.hdhubEnabled !== false && !sourceFactories.some(s => s.name === '4KHDHub / HubCloud')) sourceJobs.push({ name: '4KHDHub / HubCloud', run: async () => {
                // Films need a 10 s window when multiple HubCloud releases resolve
                // concurrently; TV keeps its 8 s scope in the first slot group.
                const sourceHttp = http.scope(target.type === 'movie' ? 10000 : 8000);
                return adapters.scanHdHub(sourceHttp, target, { allowExtensionless: settings.useDownloadBridge !== false, onCandidates: candidates => acceptCandidates(candidates, true),
                  loadPosters: () => resolvePosterPaths(sourceHttp, target, tmdbApiKey) });
              } });
            };
            if (target.type === 'tv') {
              pushHdHub();
              if (filesLane && adapters.scanFzTvSeries && settings.fztvseriesEnabled !== false && !target.isAnime)
                sourceJobs.push({name:'FzTvSeries',run:()=>adapters.scanFzTvSeries(http.scope(12000),target)});
            }
            // HDRezka's entry host 302s each file to a fixed CDN node. Some nodes
            // drop the TCP connect silently; iOS follows the redirect natively
            // and waits 60 s, which used to cut every row of the main scraper.
            // It runs in its own scraper; a saved hdrezkaEnabled in main is ignored.
            if (adapters.scanHdRezka && ['hdrezka','all'].includes(lane) && settings.hdrezkaEnabled !== false) sourceJobs.push({name:'HDRezka',run:()=>{
              const sourceHttp=http.scope(10000);
              return adapters.scanHdRezka(sourceHttp,target,{loadTitles:()=>loadAltTitles(sourceHttp)});
            }});
            if(filesLane&&adapters.scanMoviesDrive&&settings.moviesdriveEnabled!==false&&(target.type==='movie'||target.type==='tv'&&target.imdbId))
              sourceJobs.push({name:'MoviesDrive / Pixeldrain',run:()=>{
                const sourceHttp=http.scope(10000);
                return adapters.scanMoviesDrive(sourceHttp,target,{onCandidates:acceptCandidates,loadSeason:()=>resolveSeasonEpisode(sourceHttp,target,tmdbApiKey),loadTitles:()=>loadAltTitles(sourceHttp)});
              }});
            // Turkish-dubbed cartoon episodes (Drive MP4). Animated, non-anime
            // series only, so other TV searches never pay its large pages.
            if(filesLane&&adapters.scanCizgiMax&&settings.cizgimaxEnabled!==false&&target.type==='tv'&&target.isAnimation===true&&!target.isAnime)
              sourceJobs.push({name:'CizgiMax',run:()=>{
                const sourceHttp=http.scope(10000);
                return adapters.scanCizgiMax(sourceHttp,target,{loadSeason:()=>resolveSeasonEpisodes(sourceHttp,target,tmdbApiKey)});
              }});
            if (filesLane && adapters.scanFzMovies && settings.fzmoviesEnabled !== false && target.type === 'movie')
              sourceJobs.push({name:'FzMovies',run:()=>adapters.scanFzMovies(http.scope(10000),target)});
            // Films: start 4KHDHub right after FzMovies (before online fallbacks)
            // now that Goojara is isolated in its own scraper.
            if (target.type !== 'tv') pushHdHub();
            if (filesLane && adapters.scanJetFilmizle && settings.jetfilmizleEnabled !== false && target.type === 'movie' && !target.isAnime)
              sourceJobs.push({name:'JetFilmizle',run:()=>{
                const sourceHttp=http.scope(10000);
                return adapters.scanJetFilmizle(sourceHttp,target,{loadTitles:()=>loadTranslated(sourceHttp)});
              }});
            if (onlineLane && adapters.scanVixDirect && settings.vixsrcEnabled !== false && settings.includeHls !== false && !sourceFactories.some(s => s.name === 'VixSrc'))
              sourceJobs.push({ name: 'VixSrc', run: () => adapters.scanVixDirect(http.scope(5000), target) });
            if (animeLane && adapters.scanAnimecix && settings.animecixEnabled !== false && target.isAnime) sourceJobs.push({ name: 'Animecix', run: () => adapters.scanAnimecix(http, target) });
            if (animeLane && adapters.scanSonAnime && settings.sonanimeEnabled !== false && target.isAnime) sourceJobs.push({ name: 'SonAnime', run: () => adapters.scanSonAnime(http, target) });
            // Anizone's origin can accept a request and never answer, and
            // AniMOM's hosts can drop the connection silently (Nov 2026). On
            // iOS such a native request runs to the 60 s plugin limit and
            // drops every row of its scraper, so both are opt-in (new keys:
            // a saved old `true` must not re-enable them) and never run in
            // the Anime scraper that carries Animecix/SonAnime files.
            if(adapters.scanAnizone&&['extraAnime','all'].includes(lane)&&settings.includeHls!==false&&settings.anizoneOptInEnabled===true&&target.isAnime)
              sourceJobs.push({name:'Anizone',run:()=>adapters.scanAnizone(http.scope(6500),target)});
            if (adapters.scanAniMom && ['extraAnime','all'].includes(lane) && settings.animomOptInEnabled === true && target.isAnime)
              sourceJobs.push({ name: 'AniMOM', run: () => adapters.scanAniMom(http, target) });
            if (adapters.scanSeiCode && (lane === 'extraAnime' && settings.seicodeEnabled !== false || lane === 'all' && settings.seicodeEnabled === true) && target.isAnime)
              sourceJobs.push({ name: 'SeiCode', run: () => adapters.scanSeiCode(http, target) });
            if (onlineLane && adapters.scanDiziYou && settings.diziyouOptInEnabled === true && target.type === 'tv' && !target.isAnime)
              sourceJobs.push({ name: 'DiziYou', run: () => adapters.scanDiziYou(http, target) });
            if (onlineLane && adapters.scanDiziBak && settings.includeHls !== false && settings.dizibakEnabled !== false && target.type === 'tv' && !target.isAnime)
              sourceJobs.push({ name: 'DiziBak', run: () => adapters.scanDiziBak(http, target) });
            if (onlineLane && adapters.scanFilmModu && settings.filmmoduEnabled !== false && target.type === 'movie' && !target.isAnime)
              sourceJobs.push({ name: 'FilmModu', run: () => adapters.scanFilmModu(http, target) });
            if (onlineLane && adapters.scanPlayImdb && settings.playImdbEnabled !== false)
              sourceJobs.push({ name: 'PlayIMDb', run: () => adapters.scanPlayImdb(http.scope(4000), target) });
            if (['all','online','fastOnline'].includes(lane) && adapters.scanHdFilmDelisi && settings.includeHls !== false && settings.hdfilmdelisiEnabled !== false && target.type === 'movie' && !target.isAnime)
              sourceJobs.push({ name:'HDFilmDelisi',run:()=>adapters.scanHdFilmDelisi(http,target) });
            if (['all','fastOnline'].includes(lane) && adapters.scanDiziBal && settings.includeHls !== false && settings.dizibalEnabled !== false)
              sourceJobs.push({name:'DiziBal',run:()=>{
                const sourceHttp=http.scope(7000);
                return adapters.scanDiziBal(sourceHttp,target,{loadTitles:()=>resolveTranslatedTitles(sourceHttp,target,effectiveTmdbKey(settings,tmdbKey))});
              }});
            if (['all','online','fastOnline'].includes(lane) && adapters.scanPurstream && settings.includeHls !== false && settings.purstreamEnabled !== false)
              sourceJobs.push({name:'Purstream',run:()=>{
                const sourceHttp=http.scope(5500);
                return adapters.scanPurstream(sourceHttp,target,{loadTitles:()=>resolveTranslatedTitles(sourceHttp,target,effectiveTmdbKey(settings,tmdbKey),['fr','en','tr'])});
              }});
            if(['all','online','fastOnline'].includes(lane)&&adapters.scanFilmEkseni&&settings.includeHls!==false&&settings.filmekseniEnabled!==false&&target.type==='movie')
              sourceJobs.push({name:'FilmEkseni',run:()=>adapters.scanFilmEkseni(http.scope(5000),target)});
            if(['all','online','fastOnline'].includes(lane)&&adapters.scanKultFilmler&&settings.includeHls!==false&&settings.kultfilmlerEnabled!==false&&target.type==='movie')
              sourceJobs.push({name:'KultFilmler',run:()=>adapters.scanKultFilmler(http.scope(6000),target)});
            if(['all','online','fastOnline'].includes(lane)&&adapters.scanDiziBox&&settings.includeHls!==false&&settings.diziboxEnabled!==false&&target.type==='tv'&&!target.isAnime)
              sourceJobs.push({name:'DiziBox',run:()=>adapters.scanDiziBox(http.scope(7000),target)});
            if (filesLane && adapters.scanWaploaded && settings.waploadedEnabled !== false && !target.isAnime) sourceJobs.push({ name: 'Waploaded', run: () => adapters.scanWaploaded(http, target) });
            if (filesLane && adapters.scanRareFilmm && settings.rarefilmmEnabled !== false && target.type === 'movie' && !target.isAnime)
              sourceJobs.push({name:'RareFilmm',run:()=>adapters.scanRareFilmm(http.scope(5000),target)});
          }
          for (const source of sourceFactories) sourceJobs.push({ name: source.name, run: () => source.run(http, target) });
          const quota = 10;
          await mapLimit(sourceJobs, 4, async job => {
            const sourceStarted = Date.now();
            let candidates;
            try { candidates = await job.run(); } catch { candidates = []; }
            const timing = { startedMs:sourceStarted-started, discoveryMs:Date.now()-sourceStarted };
            report.sources.push({ name: job.name, candidates: candidates.length, ...timing });
            emit({ stage: 'source', source: job.name, candidates: candidates.length, ...timing });
            if (!candidates.length || http.expired()) return;
            if (['4KHDHub / HubCloud','Internet Archive','MoviesDrive / Pixeldrain'].includes(job.name) && !sourceFactories.some(s => s.name === job.name)) return;
            if (!ISOLATED_LANES.includes(lane)) void discoverSubtitles.prefetch();
            pending.push(mapLimit(candidates.slice(0, quota), lane === 'extraAnime' ? 1 : 3,
              candidate => processCandidate(candidate).catch(() => reject('candidate_error'))));
          });
          await Promise.all(pending);
          return formatResults(availablePairs(), renderSettings(), target);
        } catch { report.reason = 'internal_error'; return target ? formatResults(availablePairs(), renderSettings(), target) : []; }
      };
      try {
        const results = await Promise.race([run(), searchTimeout]);
        report.results = results.length;
        if (report.reason === 'searching') report.reason = http.expired() ? 'deadline' : results.length ? 'ok' : 'no_eligible_sources';
        return results;
      } finally {
        http.close(); scheduler.cancel(timer); scheduler.close();
        report.elapsedMs = Date.now() - started;
        lastReport = JSON.parse(JSON.stringify(report));
        lastPairs = availablePairs();
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
    { type: 'info', label: 'Kart sırası: p ve piksel · GB · ses · altyazı. Bilgiler dosya, oynatma listesi ve kaynak ipuçlarından seçilir. Diller TR/EN öncelikli; ilk beş dil ve kalan sayı gösterilir. En fazla 20 sonuç; tüm çözünürlükler. Nuvio altyazı dilini Türkçe seçebilirsiniz.' },
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
    { type: 'toggle', key: 'hdhubEnabled', label: '4KHDHub / HubCloud doğrudan dosya araması', defaultValue: true, description: 'Ek film/bölüm indirmeleri ve uygun kayıtlarda 4K. FSL/Pixeldrain dosyalarının gerçek boyutu ve pikseli okunur; TR/EN altyazı aranır.' },
    { type: 'toggle', key: 'rarefilmmEnabled', label: 'RareFilmm ek film arşivi', defaultValue: true, description: 'Eski ve az bulunan filmlerde küçük MP4 seçenekleri. Bazılarında İngilizce altyazı görüntüye işlenmiştir; 4K veya TR dublaj garantisi yoktur.' },
    { type: 'toggle', key: 'goojaraEnabled', label: 'Goojara film ve bölüm dosyaları', defaultValue: true, description: 'Bağımsız tarama: küçük MP4 alternatifleri; tam başlık/yıl/film IMDb ve bölüm kontrolü. Dönen CDN düğümü yanıt vermezse ana sağlayıcıdaki diğer sonuçlar etkilenmez.' },
    { type: 'toggle', key: 'fzmoviesEnabled', label: 'FzMovies film dosyaları', defaultValue: true, description: 'Küçük film dosyaları (genelde 360p MP4 ve 720p MKV). Film sayfasındaki IMDb kimliği ve dosya adı/yıl denetlenir; çözünürlük ve süre dosyadan okunur. Dizi aramaz.' },
    { type: 'toggle', key: 'jetfilmizleEnabled', label: 'JetFilmizle Türkçe dublajlı film dosyaları', defaultValue: true, description: 'Yalnız filmler (Gold MP4). Film sayfasındaki IMDb kimliği ve Range 206 ön kontrolü gerekir; çözünürlük, süre ve okunabilen ses dili dosyadan doğrulanır.' },
    { type: 'toggle', key: 'fztvseriesEnabled', label: 'FzTvSeries dizi bölüm dosyaları', defaultValue: true, description: 'Küçük MP4 bölümler (çoğunlukla 360p–480p). Dizi sayfasındaki IMDb kimliği, tam sezon/bölüm ve dosya adı denetlenir; çözünürlük dosyadan okunur. Film aramaz.' },
    { type: 'toggle', key: 'hdrezkaEnabled', label: 'HDRezka farklı boyutlarda film/dizi dosyaları', defaultValue: true, description: 'Bağımsız tarama: ücretsiz özgün sesli MP4 seçenekleri ve mevcut TR/EN altyazılar. IMDb, başlık/yıl ve tam bölüm denetlenir; ücretli kalite ve örnek videolar eklenmez. Bir CDN düğümü yanıt vermezse ana sağlayıcıdaki sonuçlar etkilenmez.' },
    {type:'toggle',key:'hdfilmdelisiEnabled',label:'HDFilmDelisi Türkçe dublaj ve çoklu ses',defaultValue:true,description:'Public film kataloğu ve gerçek HLS listesi. Ses/altyazı dilleri yayıncıdan okunur; bu kaynak online izleme içindir.'},
    {type:'toggle',key:'dizibalEnabled',label:'DiziBal film, dizi ve anime',defaultValue:true,description:'Türkçe dublaj ve altyazılı online alternatifler. Özgün veya TMDB çeviri adı, yıl ve tam bölüm denetlenir.'},
    { type: 'toggle', key: 'waploadedEnabled', label: 'Waploaded güncel film/dizi dosyaları', defaultValue: true, description: 'Kısmi kapsam: kaynağın son güncellenen listesi taranır; tüm arşivi kapsamaz. Gerçek dosya, yıl ve bölüm doğrulanır. Mevcut TR/EN araması uygulanır.' },
    { type: 'toggle', key: 'directoryEnabled', label: 'DahmerMovies dizin taraması (deneysel yerel yedek)', defaultValue: false, description: 'Dosya CDN’i sık 403/429 döndürdüğünden varsayılan kapalıdır.' },
    { type: 'toggle', key: 'archiveEnabled', label: 'Internet Archive film araması', defaultValue: true },
    { type: 'toggle', key: 'playImdbEnabled', label: 'PlayIMDb API araması', defaultValue: true, description: 'Bazı sonuçlar HLS olabilir; dosya indirmesi olarak gösterilmez.' },
    { type: 'toggle', key: 'animecixEnabled', label: 'Animecix anime MP4 araması', defaultValue: true, description: 'TMDB kimliği, özgün başlık, yıl ve tam sezon/bölüm doğrulanır. TR kaynak bilgisi tek başına altyazı kanıtı değildir.' },
    { type: 'toggle', key: 'sonanimeEnabled', label: 'SonAnime anime dosyası araması', defaultValue: true, description: 'Tam TMDB/yıl/bölüm bağı ve gerçek dosya kontrolü. Aynı dosyanın aynası ek kalite sayılmaz.' },
    { type: 'toggle', key: 'diziyouOptInEnabled', label: 'DiziYou dizi alternatifi (deneysel · varsayılan kapalı)', defaultValue: false, description: 'Bazı TR İSS ağlarında alan adı yanıt vermeyip iPhone’da 60 sn sınırıyla tüm dizi sonuçlarını düşürebildiği için varsayılan kapalıdır. Yalnız erişilebilir ağlarda açın.' },
    { type: 'toggle', key: 'dizibakEnabled', label: 'DiziBak dizi alternatifi', defaultValue: true, description: 'Küçük public metadata yanıtları kullanılır. İlk bölüm tarihi ve dizi kategorisi uyuşmazsa sonuç eklenmez.' },
    { type: 'toggle', key: 'filmmoduEnabled', label: 'FilmModu online film ve kaynak ses seçenekleri', defaultValue: true },
    { type: 'toggle', key: 'purstreamEnabled', label: 'Purstream ek online film ve dizi seçenekleri', defaultValue: true },
    {type:'toggle',key:'filmekseniEnabled',label:'FilmEkseni Türkçe dublaj ve altyazılı online film',defaultValue:true,description:'Özgün başlık/yıl ve IMDb birlikte doğrulanır. Sesler gerçek HLS listesinden, eşlenmiş TR/EN altyazılar oynatıcıdan okunur. Dosya indirmesi sunmaz.'},
    {type:'toggle',key:'kultfilmlerEnabled',label:'KultFilmler Türkçe dublaj ve altyazılı online film',defaultValue:true,description:'Özgün başlık/yıl eşleşir ve oynatıcının bildirdiği IMDb kimliği doğrulanır. Dublaj sitenin beyanıdır (tek ses izi). Eşlenmiş TR altyazı oynatıcıdan okunur. Dosya indirmesi sunmaz.'},
    {type:'toggle',key:'diziboxEnabled',label:'DiziBox Türkçe altyazılı online dizi',defaultValue:true,description:'Dizi adı, sezon/bölüm başlığı ve dizi sayfasındaki ilk yayın yılı birlikte doğrulanır. Türkçe altyazı sitenin etiketidir; akışta ayrı altyazı izi yoktur, görüntüye işlenmiş olabilir (doğrulanmadı). Dosya indirmesi sunmaz.'},
    { type: 'toggle', key: 'moviesdriveEnabled', label: 'MoviesDrive ek film ve bölüm indirmeleri', defaultValue: true, description: 'Film/anime filmi ve bölüm dosyaları aranır. Sonraki sezonların yılı ve bölüm süresi aynı TMDB kaydından doğrulanır; ad, IMDb, bölüm ve gerçek medya denetlenir. Uzantısız MKV dosyaları Nuvio’da .mp4 adıyla kaydedilebilir; dahili MPV gerçek formatı içerikten okur. Harici oynatıcıda .mkv olarak yeniden adlandırmak gerekebilir.' },
    { type: 'toggle', key: 'cizgimaxEnabled', label: 'CizgiMax Türkçe dublajlı çizgi dizi bölüm dosyaları', defaultValue: true, description: 'Yalnız animasyon diziler (anime hariç); sitenin Drive sunucusundaki MP4 bölümler. Ad, ilk yayın yılı ve sezon/bölüm denetlenir; sitenin sezon bölüm sayısı TMDB ile birebir aynı olmalıdır (parça numaralı diziler eklenmez). Çözünürlük ve süre dosyadan okunur; dublaj sitenin beyanıdır. Kapsam kısmidir.' },
    { type: 'info', label: 'Ses kodları: EN İngilizce, TR Türkçe, JA Japonca, HI Hintçe. EN/ES görüntüde, görüntüye işlenmiş altyazıdır; ses dili değildir.' },
    { type: 'toggle', key: 'autoSubtitles', label: 'TR ve EN altyazıları otomatik ara', defaultValue: true },
    { type: 'toggle', key: 'seicodeEnabled', label: 'SeiCode ek anime dosyaları', defaultValue: true, description: 'Kısmi katalog (çoğunlukla son sezonlar): tam TMDB/ad/yıl ve açık sezon/bölüm bağı gerekir. Yalnız oynatıcının aynı sezon/bölüm olarak bildirdiği gerçek MP4 dosyası sunulur; eksik bölümde başka bölüm seçilmez.' },
    { type: 'toggle', key: 'animomOptInEnabled', label: 'AniMOM anime dosyaları (deneysel · varsayılan kapalı)', defaultValue: false, description: 'Bazı ağlarda sunucu bağlantıya hiç yanıt vermiyor; iPhone’da 60 sn sınırıyla Ek Anime sonuçlarının tamamı düşebildiği için varsayılan kapalıdır. Yalnız erişilebilir ağlarda açın.' },
    { type: 'toggle', key: 'anizoneOptInEnabled', label: 'Anizone çok sesli online anime (deneysel · varsayılan kapalı)', defaultValue: false, description: 'Sunucu bazı aramaları yanıtsız bekletiyor; iPhone’da 60 sn sınırıyla Ek Anime sonuçlarının tamamı düşebildiği için varsayılan kapalıdır. Yalnız dizilerin ilk sezonu; HLS, dosya indirmesi sunmaz.' },
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
    { type: 'toggle', key: 'downloadFirst', label: 'İndirilebilir kaynakları önce göster', defaultValue: true, description: 'Dosyalar önce, online HLS sonra listelenir. Boyut/kalite sırası ve gruplama her bölümün içinde uygulanır; yüksek boyutlu dosyalar da korunur.' },
    { type: 'toggle', key: 'includeHls', label: 'HLS çevrimiçi izleme alternatiflerini göster', defaultValue: true, description: 'HLS yalnız oynatma içindir; Nuvio üzerinden dosya olarak indirilemez.' },
    { type: 'toggle', key: 'debug', label: 'Hata ayıklama özeti', defaultValue: false, description: 'Boş sonuçlarda tanı zaten yazılır; açıkken başarılı aramaları da yazar. Günlükte ayar/kimlik/kaynak/adet/HTTP durumları vardır; anahtar ve video adresi yoktur.' },
    { type: 'toggle', key: 'allowHttp', label: 'Kişisel HTTP kaynaklarına izin ver', defaultValue: false }
  ];
}

function createEntry(lane, adapters = {}) {
  const titles = { main: 'Film/dizi · online ve dosyalar', files: 'Dosyalar', online: 'Hızlı kaynaklar', anime: 'Anime', extraAnime:'Ek Anime',fastOnline:'Hızlı İzle',goojara:'Goojara',hdrezka:'HDRezka' };
  const only = { files: ['hdhubEnabled','directoryEnabled','archiveEnabled','waploadedEnabled','rarefilmmEnabled','fzmoviesEnabled','jetfilmizleEnabled','fztvseriesEnabled','moviesdriveEnabled','cizgimaxEnabled','catalogUrls','addonUrls'], hdrezka:['hdrezkaEnabled'], online: ['playImdbEnabled','vixsrcEnabled','diziyouOptInEnabled','dizibakEnabled','filmmoduEnabled','hdfilmdelisiEnabled','purstreamEnabled','filmekseniEnabled','kultfilmlerEnabled','diziboxEnabled','hlsView'], anime: ['animecixEnabled','sonanimeEnabled'],extraAnime:['seicodeEnabled','animomOptInEnabled','anizoneOptInEnabled'],fastOnline:['hdfilmdelisiEnabled','dizibalEnabled','purstreamEnabled','filmekseniEnabled','kultfilmlerEnabled','diziboxEnabled','hlsView'],goojara:['goojaraEnabled'] };
  only.main = [...only.files, ...only.online.filter(key=>!['hdfilmdelisiEnabled','purstreamEnabled','filmekseniEnabled','kultfilmlerEnabled','diziboxEnabled'].includes(key))];
  const sourceFields = Object.values(only).flat();
  return {
    async getStreams(...args) {
      const settings = typeof globalThis.SCRAPER_SETTINGS === 'object' && globalThis.SCRAPER_SETTINGS || {};
      const tmdbKey = typeof globalThis.TMDB_API_KEY === 'string' ? globalThis.TMDB_API_KEY : '';
      const budgetMs = { online: 16000, anime: 20000, all: 28000 }[lane];
      return createProvider({ settings, tmdbKey, lane, budgetMs, adapters }).getStreams(...args);
    },
    onSettings: () => [{ type: 'info', label: lane === 'main' ? 'Film/dizi araması online HLS ile gerçek MP4/MKV dosyalarını aynı listede sunar. Dosya araması boşsa online alternatifler korunur. Goojara, HDRezka ve Anime ayrı taramalardır.' : lane==='fastOnline'?'Hızlı İzle, HDFilmDelisi, DiziBal, Purstream, FilmEkseni, KultFilmler ve DiziBox online kaynaklarını bağımsız arar. Ana dosya aramasının bitmesini beklemez. HLS kaynakları izleme içindir; dosya indirmesi sunmaz.':lane==='goojara'?'Goojara dönen CDN düğümleri yüzünden ana listeden ayrı taranır. Bir düğüm yanıt vermezse yalnız bu tarama zaman aşımına uğrar; ana Nuvio TR HD sonuçları korunur.':lane==='hdrezka'?'HDRezka her dosyayı sabit bir CDN düğümüne yönlendirir; bazı düğümler bağlantıya yanıt vermez. Bu yüzden ana listeden ayrı taranır. Bir düğüm yanıt vermezse bu taramanın sonuçları gelmeyebilir; ana Nuvio TR HD sonuçları korunur.':lane==='extraAnime'?'Kısmi kapsama sahip ek anime dosyaları bağımsız taranır. Her bölümde sonuç garantisi yoktur; boş sonuç diğer sağlayıcıların sonuçlarını silmez. Aynı anda tek dosya kontrol edilir.':`Bu ayarlar yalnız ${titles[lane]} taramasına aittir. En fazla kaynak sınırı bu tarama içindir.` },
      ...onSettings().filter(field => (!sourceFields.includes(field.key) || only[lane].includes(field.key)) && (!ISOLATED_LANES.includes(lane)||!['includeHls','useDownloadBridge','allowHttp','detailedHlsMetadata'].includes(field.key)))
        .map(field=>ISOLATED_LANES.includes(lane)&&field.type==='info'&&field.label.startsWith('Tanı ·')?{...field,label:field.label.split(' · ').slice(0,3).join(' · ')+' · Bağımsız '+titles[lane]}:field)]
  };
}
module.exports = { createProvider, formatResults, onSettings, createEntry };
