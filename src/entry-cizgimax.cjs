'use strict';
// CizgiMax runs in its own scraper: when the site's origin is down its edge
// accepts the request and never answers, and iOS waits 60 s on the native
// request. That must not cut the main list.
const { createEntry } = require('./core.cjs');
module.exports = createEntry('cizgimax', {
  scanCizgiMax: require('./providers/cizgimax.cjs').scanCizgiMax
});
