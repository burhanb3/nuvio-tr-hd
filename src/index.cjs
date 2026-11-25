'use strict';
const core = require('./core.cjs');
const ALL_ADAPTERS = {
  loadCatalog: require('./providers/catalog.cjs').loadCatalog,
  loadAddon: require('./providers/stremio.cjs').loadAddon,
  scanDirectory: require('./providers/directory.cjs').scanDirectory,
  scanArchive: require('./providers/archive.cjs').scanArchive,
  scanPlayImdb: require('./providers/playimdb.cjs').scanPlayImdb,
  scanVixDirect: require('./providers/vixsrc.cjs').scanVixDirect,
  scanHdHub: require('./providers/hdhub.cjs').scanHdHub,
  scanWaploaded: require('./providers/waploaded.cjs').scanWaploaded,
  scanRareFilmm: require('./providers/rarefilmm.cjs').scanRareFilmm,
  scanGoojara: require('./providers/goojara.cjs').scanGoojara,
  scanFzTvSeries: require('./providers/fztvseries.cjs').scanFzTvSeries,
  scanFzMovies: require('./providers/fzmovies.cjs').scanFzMovies,
  scanJetFilmizle: require('./providers/jetfilmizle.cjs').scanJetFilmizle,
  scanHdRezka: require('./providers/hdrezka.cjs').scanHdRezka,
  scanMoviesDrive: require('./providers/moviesdrive.cjs').scanMoviesDrive,
  scanAnimecix: require('./providers/animecix.cjs').scanAnimecix,
  scanSonAnime: require('./providers/sonanime.cjs').scanSonAnime,
  scanAnizone: require('./providers/anizone.cjs').scanAnizone,
  scanFilmEkseni: require('./providers/filmekseni.cjs').scanFilmEkseni,
  scanKultFilmler: require('./providers/kultfilmler.cjs').scanKultFilmler,
  scanDiziYou: require('./providers/diziyou.cjs').scanDiziYou,
  scanFilmModu: require('./providers/filmmodu.cjs').scanFilmModu,
  scanHdFilmDelisi: require('./providers/hdfilmdelisi.cjs').scanHdFilmDelisi,
  scanDiziBal: require('./providers/dizibal.cjs').scanDiziBal,
  scanPurstream: require('./providers/purstream.cjs').scanPurstream,
  scanAniMom: require('./providers/animom.cjs').scanAniMom,
  scanSeiCode: require('./providers/seicode.cjs').scanSeiCode,
  scanDiziBak: require('./providers/dizibak.cjs').scanDiziBak
};

function createProvider(options = {}) {
  return core.createProvider({ ...options, adapters: options.adapters || ALL_ADAPTERS });
}
function createEntry(lane, adapters = ALL_ADAPTERS) {
  return core.createEntry(lane, adapters);
}
async function getStreams(tmdbId, mediaType, season, episode) {
  const settings = typeof globalThis.SCRAPER_SETTINGS === 'object' && globalThis.SCRAPER_SETTINGS || {};
  const tmdbKey = typeof globalThis.TMDB_API_KEY === 'string' ? globalThis.TMDB_API_KEY : '';
  return createProvider({ settings, tmdbKey }).getStreams(tmdbId, mediaType, season, episode);
}
module.exports = { getStreams, onSettings: core.onSettings, createProvider, formatResults: core.formatResults, createEntry };
