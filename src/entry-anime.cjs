'use strict';
const { createEntry } = require('./core.cjs');
module.exports = createEntry('anime', {
  scanAnimecix: require('./providers/animecix.cjs').scanAnimecix,
  scanSonAnime: require('./providers/sonanime.cjs').scanSonAnime,
  scanAnizone: require('./providers/anizone.cjs').scanAnizone
});
