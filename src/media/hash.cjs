'use strict';

function opensubtitlesHash(first, last, size) {
  const length = 65536;
  if (!Number.isSafeInteger(size) || size < length * 2 || first.length < length || last.length < length) return null;
  let sum = BigInt(size);
  const mask = (1n << 64n) - 1n;
  for (const bytes of [first.subarray(0, length), last.subarray(last.length - length)]) {
    for (let at = 0; at < length; at += 8) {
      let n = 0n;
      for (let i = 7; i >= 0; i--) n = (n << 8n) | BigInt(bytes[at + i]);
      sum = (sum + n) & mask;
    }
  }
  return sum.toString(16).padStart(16, '0');
}
module.exports = { opensubtitlesHash };
