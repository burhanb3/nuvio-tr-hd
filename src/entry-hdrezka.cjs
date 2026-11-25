'use strict';
// HDRezka runs in its own scraper: a silent CDN node must not cut the main list.
const { createEntry } = require('./core.cjs');
module.exports = createEntry('hdrezka', {
  scanHdRezka: require('./providers/hdrezka.cjs').scanHdRezka
});
