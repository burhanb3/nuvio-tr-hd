'use strict';
const VERSION = typeof __NUVIO_TR_HD_VERSION__ === 'string' ? __NUVIO_TR_HD_VERSION__ : 'dev';

function effectiveTmdbKey(settings, injectedKey) {
  return typeof settings.tmdbApiKey === 'string' && settings.tmdbApiKey.trim() ? settings.tmdbApiKey.trim() :
    typeof injectedKey === 'string' ? injectedKey.trim() : '';
}
function configuration(settings = {}, injectedKey) {
  return { version: VERSION, tmdbKeyPresent: !!effectiveTmdbKey(settings, injectedKey),
    autoDiscover: settings.autoDiscover !== false, includeHls: settings.includeHls !== false,
    playImdbEnabled: settings.playImdbEnabled !== false, vixsrcEnabled: settings.vixsrcEnabled !== false,
    hdhubEnabled: settings.hdhubEnabled !== false, archiveEnabled: settings.archiveEnabled !== false,
    waploadedEnabled: settings.waploadedEnabled !== false,
    rarefilmmEnabled: settings.rarefilmmEnabled !== false,
    goojaraEnabled: settings.goojaraEnabled !== false,
    hdfilmdelisiEnabled:settings.hdfilmdelisiEnabled!==false,
    dizibalEnabled:settings.dizibalEnabled!==false,
    autoSubtitles: settings.autoSubtitles !== false, subtitleRequired: settings.subtitlePolicy === 'require',
    detailedHlsMetadata: settings.detailedHlsMetadata === true,
    minimumQuality: [0,480,720,1080].includes(Number(settings.minimumQuality || 0)) ? Number(settings.minimumQuality || 0) : 0,
    maxResults: Math.max(3, Math.min(20, Number(settings.maxResults) || 20)) };
}
function configurationLabel(settings, injectedKey) {
  const c = configuration(settings, injectedKey), state = value => value ? 'açık' : 'kapalı';
  return `Tanı · ${c.version} · TMDB anahtarı: ${c.tmdbKeyPresent ? 'var' : 'yok'} · Tarama: ${state(c.autoDiscover)} · HLS: ${state(c.includeHls)} · Play: ${state(c.playImdbEnabled)} · Vix: ${state(c.vixsrcEnabled)} · HDHub: ${state(c.hdhubEnabled)} · Archive: ${state(c.archiveEnabled)} · TR arama: ${state(c.autoSubtitles)} · TR zorunlu: ${c.subtitleRequired ? 'evet' : 'hayır'} · En az: ${c.minimumQuality || 'tümü'} · Liste: ${c.maxResults}`;
}
function writeDiagnostic(report, enabled) {
  if (enabled && typeof globalThis.console?.info === 'function') {
    try { globalThis.console.info('[Nuvio TR HD] ' + JSON.stringify(report)); } catch {}
  }
}
module.exports = { configuration, configurationLabel, effectiveTmdbKey, writeDiagnostic };
