'use strict';

function ascii(bytes, start, length) {
  let out = '';
  for (let i = start; i < Math.min(bytes.length, start + length); i++) out += String.fromCharCode(bytes[i]);
  return out;
}
function u32(bytes, offset) {
  if (offset < 0 || offset + 4 > bytes.length) return null;
  return bytes[offset] * 16777216 + bytes[offset + 1] * 65536 + bytes[offset + 2] * 256 + bytes[offset + 3];
}
function boxes(bytes, from = 0, to = bytes.length) {
  const result = [];
  for (let offset = from, count = 0; offset + 8 <= to && count++ < 4096;) {
    let size = u32(bytes, offset);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > to) break;
      size = u32(bytes, offset + 8) * 4294967296 + u32(bytes, offset + 12);
      header = 16;
    } else if (size === 0) size = to - offset;
    if (!Number.isSafeInteger(size) || size < header) break;
    result.push({ type: ascii(bytes, offset + 4, 4), start: offset, data: offset + header, end: offset + size, complete: offset + size <= to });
    if (offset + size > to) break;
    offset += size;
  }
  return result;
}

function mp4Dimensions(bytes) {
  for (const moov of boxes(bytes).filter(x => x.type === 'moov')) {
    for (const trak of boxes(bytes, moov.data, Math.min(moov.end, bytes.length)).filter(x => x.type === 'trak')) {
      const track = boxes(bytes, trak.data, Math.min(trak.end, bytes.length));
      const mdia = track.find(x => x.type === 'mdia');
      const tkhd = track.find(x => x.type === 'tkhd' && x.complete);
      if (!mdia || !tkhd) continue;
      const hdlr = boxes(bytes, mdia.data, Math.min(mdia.end, bytes.length)).find(x => x.type === 'hdlr' && x.complete);
      if (!hdlr || ascii(bytes, hdlr.data + 8, 4) !== 'vide') continue;
      const version = bytes[tkhd.data];
      const widthOffset = tkhd.data + (version === 1 ? 88 : version === 0 ? 76 : 1000000);
      if (widthOffset + 8 > tkhd.end) continue;
      const width = Math.round(u32(bytes, widthOffset) / 65536);
      const height = Math.round(u32(bytes, widthOffset + 4) / 65536);
      if (width > 0 && height > 0 && width <= 16384 && height <= 16384) return { width, height };
    }
  }
  return null;
}

function mp4Duration(bytes) {
  for (const moov of boxes(bytes).filter(x => x.type === 'moov')) {
    const mvhd = boxes(bytes, moov.data, Math.min(moov.end, bytes.length)).find(x => x.type === 'mvhd' && x.complete);
    if (!mvhd) continue;
    const version = bytes[mvhd.data];
    const scaleOffset = mvhd.data + (version === 1 ? 20 : 12);
    if (![0, 1].includes(version) || scaleOffset + (version === 1 ? 12 : 8) > mvhd.end) continue;
    const scale = u32(bytes, scaleOffset);
    const units = version === 1 ? u32(bytes, scaleOffset + 4) * 4294967296 + u32(bytes, scaleOffset + 8) : u32(bytes, scaleOffset + 4);
    const duration = units / scale;
    if (Number.isFinite(duration) && duration > 0 && duration < 86400) return duration;
  }
  return null;
}

function mp4AudioLanguages(bytes) {
  const languages = new Set();
  for (const movie of boxes(bytes).filter(x => x.type === 'moov')) {
    for (const track of boxes(bytes, movie.data, Math.min(movie.end, bytes.length)).filter(x => x.type === 'trak')) {
      const media = boxes(bytes, track.data, Math.min(track.end, bytes.length)).find(x => x.type === 'mdia');
      if (!media) continue;
      const children = boxes(bytes, media.data, Math.min(media.end, bytes.length));
      const handler = children.find(x => x.type === 'hdlr' && x.complete);
      const mdhd = children.find(x => x.type === 'mdhd' && x.complete);
      if (!handler || ascii(bytes, handler.data + 8, 4) !== 'soun' || !mdhd) continue;
      const version = bytes[mdhd.data], at = mdhd.data + (version === 0 ? 20 : version === 1 ? 32 : 1000000);
      if (at + 2 > mdhd.end) continue;
      const code = bytes[at] * 256 + bytes[at + 1];
      const language = [10,5,0].map(shift => String.fromCharCode(((code >> shift) & 31) + 96)).join('');
      if (/^[a-z]{3}$/.test(language) && !['und','mis','zxx'].includes(language)) languages.add(language);
    }
  }
  return [...languages];
}

function mp4HasVideo(bytes, movie) {
  return boxes(bytes, movie.data, movie.end).filter(x => x.type === 'trak' && x.complete).some(track => {
    const media = boxes(bytes, track.data, track.end).find(x => x.type === 'mdia' && x.complete);
    if (!media) return false;
    const handler = boxes(bytes, media.data, media.end).find(x => x.type === 'hdlr' && x.complete);
    return handler && ascii(bytes, handler.data + 8, 4) === 'vide';
  });
}
function mp4Info(bytes) {
  if (!boxes(bytes).some(x => ['moov', 'mdat'].includes(x.type) && x.end > x.data)) return null;
  const movie = boxes(bytes).find(x => x.type === 'moov' && x.complete);
  if (movie) {
    if (!mp4HasVideo(bytes, movie)) return null;
  }
  const ftyp = boxes(bytes, 0, Math.min(bytes.length, 128)).find(x => x.type === 'ftyp' && x.complete);
  if (!ftyp || ftyp.end - ftyp.data < 8) return null;
  const brands = [ascii(bytes, ftyp.data, 4)];
  for (let at = ftyp.data + 8; at + 4 <= ftyp.end; at += 4) brands.push(ascii(bytes, at, 4));
  if (brands.some(x => /^(avif|avis|heic|heix|mif1|msf1)$/.test(x))) return null;
  if (!brands.some(x => /^(isom|iso[2-9]|mp4[12]|avc1|dash|M4V |MSNV)$/.test(x))) return null;
  const duration = mp4Duration(bytes);
  const audioLanguages = mp4AudioLanguages(bytes);
  return { container: 'mp4', dimensions: mp4Dimensions(bytes), ...(duration ? { duration } : {}), ...(audioLanguages.length ? { audioLanguages } : {}) };
}

function vint(bytes, offset, isId) {
  const first = bytes[offset];
  if (first == null || first === 0) return null;
  let length = 1, mask = 128;
  while (!(first & mask) && length <= 8) { length++; mask >>= 1; }
  if (length > (isId ? 4 : 8) || offset + length > bytes.length) return null;
  let value = isId ? first : first & (mask - 1);
  let unknown = !isId && value === mask - 1;
  for (let i = 1; i < length; i++) {
    value = value * 256 + bytes[offset + i];
    unknown = unknown && bytes[offset + i] === 255;
  }
  return { value, length, unknown };
}
function elements(bytes, from, to) {
  const out = [];
  for (let at = from, count = 0; at < to && count++ < 4096;) {
    const id = vint(bytes, at, true);
    if (!id) break;
    const size = vint(bytes, at + id.length, false);
    if (!size) break;
    const data = at + id.length + size.length;
    const end = size.unknown ? to : data + size.value;
    if (!Number.isSafeInteger(end) || end < data) break;
    out.push({ id: id.value, data, end: Math.min(end, to), complete: end <= to });
    if (end > to || size.unknown) break;
    at = end;
  }
  return out;
}
function ebmlNumber(bytes, element) {
  if (!element || !element.complete || element.end - element.data > 4) return null;
  let value = 0;
  for (let at = element.data; at < element.end; at++) value = value * 256 + bytes[at];
  return value;
}
function mkvInfo(bytes) {
  const top = elements(bytes, 0, bytes.length);
  if (top[0]?.id !== 0x1a45dfa3 || !top[0].complete) return null;
  const doc = elements(bytes, top[0].data, top[0].end).find(x => x.id === 0x4282 && x.complete);
  if (!doc || ascii(bytes, doc.data, doc.end - doc.data) !== 'matroska') return null;
  const segment = top.find(x => x.id === 0x18538067);
  if (!segment) return null;
  let duration = null;
  const infoElement = elements(bytes, segment.data, segment.end).find(x => x.id === 0x1549a966 && x.complete);
  if (infoElement) {
    const info = elements(bytes, infoElement.data, infoElement.end);
    const scale = ebmlNumber(bytes, info.find(x => x.id === 0x2ad7b1)) || 1000000;
    const time = info.find(x => x.id === 0x4489 && x.complete);
    if (time && [4, 8].includes(time.end - time.data)) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + time.data, time.end - time.data);
      const value = time.end - time.data === 4 ? view.getFloat32(0) : view.getFloat64(0);
      const seconds = value * scale / 1000000000;
      if (Number.isFinite(seconds) && seconds > 0 && seconds < 86400) duration = seconds;
    }
  }
  let dimensions = null;
  const subtitleTracks = [];
  const audioLanguages = new Set();
  if (segment) {
    const tracks = elements(bytes, segment.data, segment.end).find(x => x.id === 0x1654ae6b);
    if (tracks) for (const entry of elements(bytes, tracks.data, tracks.end).filter(x => x.id === 0xae)) {
      const children = elements(bytes, entry.data, entry.end);
      if (ebmlNumber(bytes, children.find(x => x.id === 0x83)) === 2) {
        const field = children.find(x => x.id === 0x22b59d && x.complete) || children.find(x => x.id === 0x22b59c && x.complete);
        const language = field && ascii(bytes, field.data, field.end - field.data);
        if (/^[a-z]{2,3}(?:-[a-z0-9]+)*$/i.test(language || '') && !/^(und|mis|zxx)$/i.test(language)) audioLanguages.add(language.toLowerCase());
      }
      if (ebmlNumber(bytes, children.find(x => x.id === 0x83)) === 17) {
        const field = id => { const item = children.find(x => x.id === id && x.complete); return item ? ascii(bytes, item.data, item.end - item.data) : ''; };
        const language = field(0x22b59d) || field(0x22b59c);
        const codec = field(0x86);
        const code=/^(tr|tur)(?:-|$)/i.test(language)?'tr':/^(en|eng)(?:-|$)/i.test(language)?'en':null;
        if (code && /^S_(TEXT\/(UTF8|WEBVTT|ASS|SSA)|VOBSUB|HDMV\/PGS)$/.test(codec))
          subtitleTracks.push({ language:code, codec });
      }
      if (ebmlNumber(bytes, children.find(x => x.id === 0x83)) !== 1) continue;
      const video = children.find(x => x.id === 0xe0 && x.complete);
      if (!video) continue;
      const fields = elements(bytes, video.data, video.end);
      const width = ebmlNumber(bytes, fields.find(x => x.id === 0xb0));
      const height = ebmlNumber(bytes, fields.find(x => x.id === 0xba));
      if (!dimensions && width > 0 && height > 0 && width <= 16384 && height <= 16384) dimensions = { width, height };
    }
  }
  return { container: 'mkv', dimensions, ...(audioLanguages.size ? { audioLanguages: [...audioLanguages] } : {}),
    ...(subtitleTracks.length ? { subtitleTracks, ...(subtitleTracks.some(t=>t.language==='tr')?{embeddedTurkish:true}:{}),...(subtitleTracks.some(t=>t.language==='en')?{embeddedEnglish:true}:{}) } : {}), ...(duration ? { duration } : {}) };
}

// For a tail range, moov need not be aligned at byte zero. Validate its complete
// box size and video track hierarchy before accepting any dimensions.
function mp4TailInfo(bytes) {
  for (let at = 4; at + 4 < bytes.length; at++) {
    if (ascii(bytes, at, 4) !== 'moov') continue;
    const start = at - 4, size = u32(bytes, start);
    if (size >= 8 && start + size <= bytes.length) {
      const movie = bytes.subarray(start, start + size), dimensions = mp4Dimensions(movie), duration = mp4Duration(movie);
      if (!mp4HasVideo(movie, boxes(movie)[0])) return { invalidVideo: true };
      const audioLanguages = mp4AudioLanguages(movie);
      if (dimensions || duration) return { dimensions, duration, ...(audioLanguages.length ? { audioLanguages } : {}) };
    }
  }
  return null;
}
function mp4TailDimensions(bytes) { return mp4TailInfo(bytes)?.dimensions || null; }
function mp4MetadataOffset(prefix, total) {
  if (!Number.isSafeInteger(total) || total <= prefix.length) return null;
  // Follow an actual top-level box boundary, never scan arbitrary video bytes
  // for the word moov. A large mdat can put metadata well before the tail range.
  const last = boxes(prefix).find(b => !b.complete);
  if (!last || !['mdat','free','skip','wide'].includes(last.type) ||
      !Number.isSafeInteger(last.end) || last.end < prefix.length || last.end > total - 8) return null;
  return last.end;
}
function mp4MetadataInfo(bytes, remaining) {
  const movie = boxes(bytes)[0];
  if (!movie || movie.type !== 'moov' || movie.end > remaining) return null;
  if (movie.complete && !mp4HasVideo(bytes, movie)) return { invalidVideo: true };
  const dimensions = mp4Dimensions(bytes);
  // An incomplete moov is useful only when the complete video handler and
  // tkhd are present. Do not accept a duration from an audio-only prefix.
  if (!movie.complete && !dimensions) return null;
  const duration = mp4Duration(bytes), audioLanguages = mp4AudioLanguages(bytes);
  return { dimensions, duration, ...(audioLanguages.length ? { audioLanguages } : {}) };
}
function inspectContainer(bytes) { return mp4Info(bytes) || mkvInfo(bytes); }
module.exports = { inspectContainer, mp4Dimensions, mp4Duration, mp4TailDimensions, mp4TailInfo, mp4MetadataOffset, mp4MetadataInfo, ascii };
