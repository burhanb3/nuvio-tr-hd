'use strict';
const { createEntry } = require('./core.cjs');
module.exports = createEntry('extraAnime', {
  scanAniMom: require('./providers/animom.cjs').scanAniMom,
  scanSeiCode: require('./providers/seicode.cjs').scanSeiCode
});
