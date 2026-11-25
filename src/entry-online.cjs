'use strict';
const { createEntry } = require('./core.cjs');
module.exports = createEntry('online', {
  scanPlayImdb: require('./providers/playimdb.cjs').scanPlayImdb,
  scanVixDirect: require('./providers/vixsrc.cjs').scanVixDirect,
  scanDiziYou: require('./providers/diziyou.cjs').scanDiziYou,
  scanDiziBak: require('./providers/dizibak.cjs').scanDiziBak,
  scanFilmModu: require('./providers/filmmodu.cjs').scanFilmModu,
  scanHdFilmDelisi: require('./providers/hdfilmdelisi.cjs').scanHdFilmDelisi,
  scanPurstream: require('./providers/purstream.cjs').scanPurstream,
  scanFilmEkseni: require('./providers/filmekseni.cjs').scanFilmEkseni
});
