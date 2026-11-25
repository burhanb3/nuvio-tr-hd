'use strict';
const { createEntry } = require('./core.cjs');
module.exports = createEntry('goojara', {
  scanGoojara: require('./providers/goojara.cjs').scanGoojara
});
