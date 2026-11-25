'use strict';
const { createEntry } = require('./core.cjs');
module.exports = createEntry('extraAnime', {
  scanAniMom: require('./providers/animom.cjs').scanAniMom,
  scanSeiCode: require('./providers/seicode.cjs').scanSeiCode,
  // Opt-in only (anizoneOptInEnabled): its origin can hang a request.
  scanAnizone: require('./providers/anizone.cjs').scanAnizone
});
