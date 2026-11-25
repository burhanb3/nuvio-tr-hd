'use strict';
const { createEntry } = require('./core.cjs');
module.exports = createEntry('fastOnline', {
  scanHdFilmDelisi: require('./providers/hdfilmdelisi.cjs').scanHdFilmDelisi,
  scanDiziBal: require('./providers/dizibal.cjs').scanDiziBal,
  scanPurstream: require('./providers/purstream.cjs').scanPurstream,
  scanFilmEkseni: require('./providers/filmekseni.cjs').scanFilmEkseni,
  scanKultFilmler: require('./providers/kultfilmler.cjs').scanKultFilmler
});
