'use strict';
const { decodeUtf8 } = require('../subtitles.cjs');
// Decrypts a CryptoJS passphrase envelope ("Salted__" + salt + AES-256-CBC,
// key/IV from OpenSSL EVP_BytesToKey with MD5). A player page ships the
// envelope together with its passphrase; nothing secret is embedded here.
// The result is plain text for regex extraction and is never executed.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX = new Int16Array(128).fill(-1);
for (let i = 0; i < 64; i++) B64_INDEX[B64.charCodeAt(i)] = i;
function base64Bytes(text, maxBytes = 262144) {
  const clean = String(text).replace(/\s+/g, '');
  if (!clean || clean.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) return null;
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0, length = clean.length / 4 * 3 - pad;
  if (length > maxBytes) return null;
  const out = new Uint8Array(length);
  for (let i = 0, o = 0; i < clean.length; i += 4) {
    const n = (B64_INDEX[clean.charCodeAt(i)] << 18) | (B64_INDEX[clean.charCodeAt(i + 1)] << 12) |
      (Math.max(0, B64_INDEX[clean.charCodeAt(i + 2)]) << 6) | Math.max(0, B64_INDEX[clean.charCodeAt(i + 3)]);
    if (o < length) out[o++] = (n >> 16) & 255;
    if (o < length) out[o++] = (n >> 8) & 255;
    if (o < length) out[o++] = n & 255;
  }
  return out;
}
// RFC 1321 sine table and shifts (algorithm constants).
const MD5_K = [0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
  0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
  0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
  0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391];
const MD5_S = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
function md5(input) {
  const length = input.length, blocks = ((length + 8) >> 6) + 1, words = new Int32Array(blocks * 16);
  for (let i = 0; i < length; i++) words[i >> 2] |= input[i] << ((i % 4) * 8);
  words[length >> 2] |= 0x80 << ((length % 4) * 8);
  words[blocks * 16 - 2] = length * 8;
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  for (let block = 0; block < words.length; block += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const shift = MD5_S[(i >> 4) * 4 + (i % 4)], sum = (a + f + MD5_K[i] + words[block + g]) | 0;
      a = d; d = c; c = b; b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  const out = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((word, i) => { for (let j = 0; j < 4; j++) out[i * 4 + j] = (word >>> (j * 8)) & 255; });
  return out;
}
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function utf8Bytes(text) {
  const out = [];
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}
// FIPS-197 tables, generated once instead of shipped as literals.
let SBOX = null, INV_SBOX = null, MUL = null;
const xtime = x => ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 255;
function tables() {
  if (SBOX) return;
  SBOX = new Uint8Array(256); INV_SBOX = new Uint8Array(256);
  const rotl = (x, s) => ((x << s) | (x >> (8 - s))) & 255;
  let p = 1, q = 1;
  do {
    p = (p ^ (p << 1) ^ (p & 0x80 ? 0x1b : 0)) & 255;
    q = (q ^ (q << 1)) & 255; q = (q ^ (q << 2)) & 255; q = (q ^ (q << 4)) & 255;
    if (q & 0x80) q ^= 0x09;
    const value = q ^ rotl(q, 1) ^ rotl(q, 2) ^ rotl(q, 3) ^ rotl(q, 4) ^ 0x63;
    SBOX[p] = value; INV_SBOX[value] = p;
  } while (p !== 1);
  SBOX[0] = 0x63; INV_SBOX[0x63] = 0;
  MUL = {};
  for (const factor of [9, 11, 13, 14]) {
    const row = new Uint8Array(256);
    for (let x = 0; x < 256; x++) { let a = x, b = factor, product = 0; while (b) { if (b & 1) product ^= a; a = xtime(a); b >>= 1; } row[x] = product; }
    MUL[factor] = row;
  }
}
function expandKey(key) {
  const nk = key.length / 4, rounds = nk + 6, out = new Uint8Array(16 * (rounds + 1));
  out.set(key);
  let rcon = 1;
  for (let i = nk; i < 4 * (rounds + 1); i++) {
    let t0 = out[(i - 1) * 4], t1 = out[(i - 1) * 4 + 1], t2 = out[(i - 1) * 4 + 2], t3 = out[(i - 1) * 4 + 3];
    if (i % nk === 0) { const first = t0; t0 = SBOX[t1] ^ rcon; t1 = SBOX[t2]; t2 = SBOX[t3]; t3 = SBOX[first]; rcon = xtime(rcon); }
    else if (nk > 6 && i % nk === 4) { t0 = SBOX[t0]; t1 = SBOX[t1]; t2 = SBOX[t2]; t3 = SBOX[t3]; }
    out[i * 4] = out[(i - nk) * 4] ^ t0; out[i * 4 + 1] = out[(i - nk) * 4 + 1] ^ t1;
    out[i * 4 + 2] = out[(i - nk) * 4 + 2] ^ t2; out[i * 4 + 3] = out[(i - nk) * 4 + 3] ^ t3;
  }
  return { keys: out, rounds };
}
function decryptBlock(input, offset, { keys, rounds }, out, outOffset) {
  const s = new Uint8Array(16), t = new Uint8Array(16);
  for (let i = 0; i < 16; i++) s[i] = input[offset + i] ^ keys[rounds * 16 + i];
  for (let round = rounds - 1; round >= 0; round--) {
    // Inverse ShiftRows + SubBytes (state is column-major: index = row + 4*column).
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) t[row + 4 * ((col + row) % 4)] = INV_SBOX[s[row + 4 * col]];
    for (let i = 0; i < 16; i++) s[i] = t[i] ^ keys[round * 16 + i];
    if (round === 0) break;
    for (let col = 0; col < 16; col += 4) {
      const a0 = s[col], a1 = s[col + 1], a2 = s[col + 2], a3 = s[col + 3];
      s[col] = MUL[14][a0] ^ MUL[11][a1] ^ MUL[13][a2] ^ MUL[9][a3];
      s[col + 1] = MUL[9][a0] ^ MUL[14][a1] ^ MUL[11][a2] ^ MUL[13][a3];
      s[col + 2] = MUL[13][a0] ^ MUL[9][a1] ^ MUL[14][a2] ^ MUL[11][a3];
      s[col + 3] = MUL[11][a0] ^ MUL[13][a1] ^ MUL[9][a2] ^ MUL[14][a3];
    }
  }
  out.set(s, outOffset);
}
function decryptCryptoJsAes(envelope, passphrase, { maxBytes = 262144 } = {}) {
  if (typeof passphrase !== 'string' || passphrase.length < 1 || passphrase.length > 512) return null;
  const raw = base64Bytes(envelope, maxBytes + 16);
  // "Salted__" magic, 8-byte salt, then whole AES blocks.
  if (!raw || raw.length < 32 || (raw.length - 16) % 16 !== 0 || String.fromCharCode(...raw.subarray(0, 8)) !== 'Salted__') return null;
  tables();
  const salt = raw.subarray(8, 16), pass = utf8Bytes(passphrase);
  let derived = new Uint8Array(0), previous = new Uint8Array(0);
  while (derived.length < 48) { previous = md5(concat(previous, pass, salt)); derived = concat(derived, previous); }
  const schedule = expandKey(derived.subarray(0, 32)), cipher = raw.subarray(16), plain = new Uint8Array(cipher.length);
  let chain = derived.subarray(32, 48);
  for (let offset = 0; offset < cipher.length; offset += 16) {
    decryptBlock(cipher, offset, schedule, plain, offset);
    for (let i = 0; i < 16; i++) plain[offset + i] ^= chain[i];
    chain = cipher.subarray(offset, offset + 16);
  }
  // PKCS#7: a wrong passphrase almost always fails here.
  const pad = plain[plain.length - 1];
  if (pad < 1 || pad > 16) return null;
  for (let i = plain.length - pad; i < plain.length; i++) if (plain[i] !== pad) return null;
  return decodeUtf8(plain.subarray(0, plain.length - pad));
}
module.exports = { decryptCryptoJsAes, md5, base64Bytes };
