'use strict';
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

function box(type, ...parts) {
  const body = Buffer.concat(parts.map(x => Buffer.from(x)));
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length + 8);
  header.write(type, 4, 'ascii');
  return Buffer.concat([header, body]);
}
function moov(width = 1920, height = 1080, audio = false) {
  const tkhd = Buffer.alloc(84);
  tkhd.writeUInt32BE(width * 65536, 76);
  tkhd.writeUInt32BE(height * 65536, 80);
  const handler = Buffer.alloc(24);
  handler.write(audio ? 'soun' : 'vide', 8, 'ascii');
  return box('moov', box('trak', box('tkhd', tkhd), box('mdia', box('hdlr', handler))));
}
function mp4({ width = 1920, height = 1080, tail = false, audio = false } = {}) {
  const ftyp = box('ftyp', Buffer.from('isom\0\0\0\0isommp42', 'binary'));
  const mdat = box('mdat', Buffer.alloc(tail ? 150000 : 32));
  return Buffer.concat(tail ? [ftyp, mdat, moov(width, height, audio)] : [ftyp, moov(width, height, audio), mdat]);
}
function ebml(id, body) {
  const data = Buffer.from(body);
  if (data.length >= 127) throw new Error('Test EBML helper only supports short values');
  return Buffer.concat([Buffer.from(id, 'hex'), Buffer.from([0x80 | data.length]), data]);
}
function mkv(width = 1280, height = 720, docType = 'matroska') {
  const size = n => Buffer.from([n >> 8, n & 255]);
  const header = ebml('1a45dfa3', ebml('4282', Buffer.from(docType)));
  const video = ebml('e0', Buffer.concat([ebml('b0', size(width)), ebml('ba', size(height))]));
  const track = ebml('ae', Buffer.concat([ebml('83', [1]), video]));
  return Buffer.concat([header, ebml('18538067', ebml('1654ae6b', track))]);
}

const identity = { tmdbId: 603, type: 'movie', originalTitle: 'The Matrix', year: 1999 };
const tmdb = { id: 603, original_title: 'The Matrix', release_date: '1999-03-31', imdb_id: 'tt0133093' };
const target = { ...identity, season: null, episode: null, imdbId: 'tt0133093' };
const srt = readFileSync(resolve(__dirname, '../examples/turkce.tr.srt'), 'utf8');
const vtt = readFileSync(resolve(__dirname, '../examples/turkce.tr.vtt'), 'utf8');

function makeFixture({ items, files = {}, addonManifest, addonMeta, addonStreams, addonSubs, extra = {} } = {}) {
  return {
    'https://api.themoviedb.org/3/movie/603?api_key=test&append_to_response=external_ids': { json: tmdb },
    'https://library.test/catalog.json': { json: { version: 1, items: items || [{ ...identity, streams: [{ url: 'https://media.test/movie.mp4' }] }] } },
    'https://media.test/movie.mp4': { body: mp4(), mime: 'video/mp4' },
    'https://media.test/movie.mkv': { body: mkv(), mime: 'video/x-matroska' },
    'https://media.test/tr.srt': { body: srt, mime: 'text/plain' },
    'https://media.test/tr.vtt': { body: vtt, mime: 'text/vtt' },
    ...(addonManifest ? { 'https://addon.test/manifest.json': { json: addonManifest } } : {}),
    ...(addonMeta ? { 'https://addon.test/meta/movie/tmdb%3A603.json': { json: { meta: addonMeta } } } : {}),
    ...(addonStreams ? { 'https://addon.test/stream/movie/tmdb%3A603.json': { json: { streams: addonStreams } } } : {}),
    ...(addonSubs ? { 'https://addon.test/subtitles/movie/tmdb%3A603.json': { json: { subtitles: addonSubs } } } : {}),
    ...files, ...extra
  };
}

function responseFor(fixture, url, options = {}) {
  const item = fixture[url];
  if (item?.throw) throw new Error('fixture network failure');
  if (!item) return { status: 404, url, headers: {}, body: [] };
  if (item.status && item.status !== 200) return { status: item.status, url, headers: item.headers || {}, body: [] };
  const full = item.json !== undefined ? Buffer.from(JSON.stringify(item.json)) : Buffer.from(item.body || '');
  const headers = { 'content-type': item.mime || (item.json !== undefined ? 'application/json' : 'application/octet-stream'), 'content-length': String(full.length), ...item.headers };
  if (options.method === 'HEAD') return { status: item.headStatus || 200, url, headers, body: [] };
  const range = options.headers?.Range?.match(/^bytes=(\d+)-(\d+)$/);
  if (range && !item.ignoreRange) {
    const start = Number(range[1]), end = Math.min(Number(range[2]), full.length - 1);
    if (start > end) return { status: 416, url, headers, body: [] };
    const bytes = full.subarray(start, end + 1);
    return { status: 206, url, headers: { ...headers, 'content-length': String(bytes.length), 'content-range': `bytes ${start}-${end}/${full.length}` }, body: [...bytes] };
  }
  return { status: 200, url, headers, body: [...full] };
}
function fixtureFetch(fixture, calls = []) {
  return async (url, options = {}) => {
    calls.push({ url, ...options });
    const result = responseFor(fixture, url, options);
    return { ok: result.status >= 200 && result.status < 300, status: result.status, url: result.url,
      headers: { get: name => result.headers[name.toLowerCase()] || null },
      text: async () => Buffer.from(result.body).toString('utf8'),
      arrayBuffer: async () => Uint8Array.from(result.body).buffer };
  };
}
module.exports = { box, moov, mp4, mkv, ebml, identity, tmdb, target, srt, vtt, makeFixture, fixtureFetch, responseFor };
