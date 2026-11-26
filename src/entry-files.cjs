'use strict';
// Keep the original installed scraper ID complete during upgrades, bundling only
// the providers active in the main lane.
const { createEntry } = require('./core.cjs');
module.exports = createEntry('main', {
  loadCatalog: require('./providers/catalog.cjs').loadCatalog,
  loadAddon: require('./providers/stremio.cjs').loadAddon,
  scanDirectory: require('./providers/directory.cjs').scanDirectory,
  scanArchive: require('./providers/archive.cjs').scanArchive,
  scanHdHub: require('./providers/hdhub.cjs').scanHdHub,
  scanFzTvSeries: require('./providers/fztvseries.cjs').scanFzTvSeries,
  scanMoviesDrive: require('./providers/moviesdrive.cjs').scanMoviesDrive,
  scanCizgiMax: require('./providers/cizgimax.cjs').scanCizgiMax,
  scanFzMovies: require('./providers/fzmovies.cjs').scanFzMovies,
  scanJetFilmizle: require('./providers/jetfilmizle.cjs').scanJetFilmizle,
  scanPlayImdb: require('./providers/playimdb.cjs').scanPlayImdb,
  scanVixDirect: require('./providers/vixsrc.cjs').scanVixDirect,
  scanDiziYou: require('./providers/diziyou.cjs').scanDiziYou,
  scanDiziBak: require('./providers/dizibak.cjs').scanDiziBak,
  scanFilmModu: require('./providers/filmmodu.cjs').scanFilmModu,
  scanWaploaded: require('./providers/waploaded.cjs').scanWaploaded,
  scanRareFilmm: require('./providers/rarefilmm.cjs').scanRareFilmm
});
