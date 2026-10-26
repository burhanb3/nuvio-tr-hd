'use strict';
const { safeUrl, normalizeTitle } = require('../util.cjs');
const { decodeUtf8 } = require('../subtitles.cjs');
const VIX_ORIGIN = 'https://vixsrc.to';
const headers = { Referer: VIX_ORIGIN + '/' };

function parseMaster(text) {
  const variants = [];
  const lines = text.split(/\r?\n/);
  let turkish = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-MEDIA:') && /TYPE=SUBTITLES/.test(line) && /LANGUAGE="(?:tur|tr)"/.test(line))
      turkish = safeUrl(line.match(/URI="([^"]+)"/)?.[1]);
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const resolution = line.match(/RESOLUTION=(\d+)x(\d+)/);
      const url = safeUrl(lines[i + 1]?.trim());
      if (url && resolution) variants.push({ height: Number(resolution[2]), url });
    }
  }
  return { variants, turkish };
}

async function loadVixBundle(http, tmdbId, target) {
  const route = target?.type === 'tv' ? `tv/${tmdbId}/${target.season}/${target.episode}` : `movie/${tmdbId}`;
  const data = await http.json(`${VIX_ORIGIN}/api/${route}`);
  const embed = safeUrl(data?.src, VIX_ORIGIN + '/');
  if (!embed || !embed.startsWith(VIX_ORIGIN + '/embed/')) return null;
  let embedTitle;
  try { embedTitle = decodeUtf8(Uint8Array.from(atob(new URL(embed).searchParams.get('t') || ''), c => c.charCodeAt(0))); } catch { return null; }
  const page = await http.text(embed, { headers });
  if (!page) return null;
  // Parse the small literal data block; never execute scripts from a provider.
  const block = page.text.match(/window\.masterPlaylist\s*=\s*\{([\s\S]{0,4000}?)\n\s*\}/)?.[1];
  const token = block?.match(/['"]token['"]\s*:\s*['"]([A-Za-z0-9_-]+)['"]/)?.[1];
  const expires = block?.match(/['"]expires['"]\s*:\s*['"](\d+)['"]/)?.[1];
  const path = page.text.match(/url:\s*['"](https:\/\/vixsrc\.to\/playlist\/\d+)['"]/)?.[1];
  if (!token || !expires || !path || Number(expires) * 1000 < Date.now() + 60000) return null;
  const masterUrl = `${path}?token=${encodeURIComponent(token)}&expires=${expires}&h=1`;
  const master = await http.text(masterUrl, { headers });
  if (!master?.text.startsWith('#EXTM3U')) return null;
  const parsed = parseMaster(master.text);
  if (!parsed.variants.length) return null;
  let subtitleUrl = null;
  if (parsed.turkish?.startsWith(VIX_ORIGIN + '/playlist/')) {
    const track = await http.text(parsed.turkish, { headers });
    if (track?.text.startsWith('#EXTM3U')) {
      const urls = track.text.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
      // A segmented subtitle playlist is kept in the HLS master. Only a whole
      // single VTT is also exported as an external subtitle track.
      if (urls.length === 1 && /\.vtt(?:$|[?#])/i.test(urls[0])) subtitleUrl = safeUrl(urls[0], parsed.turkish);
    }
  }
  return { embedTitle, master: master.text, masterUrl, variants: parsed.variants, subtitleUrl,
    embeddedTurkish: !!parsed.turkish, expiresAt: Math.min(Number(expires) * 1000, Date.now() + 300000) };
}

function vixCandidates(bundle, target, origin) {
  if (!bundle || normalizeTitle(bundle.embedTitle) !== normalizeTitle(target.originalTitle)) return [];
  const qualities = [...new Set(bundle.variants.map(v => v.height))].slice(0, 4);
  return ['auto', ...qualities].map(quality => ({
    url: `${origin}/hls/vix/movie/${target.tmdbId}/${quality}.m3u8`,
    filename: `${target.originalTitle}.${target.year}.VixSrc`, headers,
    subtitles: bundle.subtitleUrl ? [{ url: bundle.subtitleUrl, language: 'tr', releaseName: 'VixSrc Türkçe', _scope: 'paired' }] : [],
    embeddedTurkish: bundle.embeddedTurkish, claimedQuality: quality === 'auto' ? 'Otomatik' : quality + 'p',
    subtitleBase: VIX_ORIGIN + '/', source: 'VixSrc', identity: target, identityConfidence: 95
  }));
}

function selectMaster(text, quality) {
  if (quality === 'auto') return text;
  const lines = text.split(/\r?\n/), result = [];
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXT-X-STREAM-INF:')) {
      if (Number(lines[i].match(/RESOLUTION=\d+x(\d+)/)?.[1]) === Number(quality)) { result.push(lines[i], lines[i + 1]); found = true; }
      i++;
    } else result.push(lines[i]);
  }
  return found ? result.join('\n') : null;
}

async function scanVixDirect(http, target) {
  if (target.type === 'tv' && !(target.season > 0 && target.episode > 0)) return [];
  const bundle = await loadVixBundle(http, target.tmdbId, target);
  if (!bundle || normalizeTitle(bundle.embedTitle) !== normalizeTitle(target.originalTitle)) return [];
  // Nuvio's native download filter examines the URL string's .m3u8 suffix.
  // VixSrc accepts this inert format hint and still returns the actual HLS
  // master. Keep the hint last so Nuvio cannot offer it as an MP4 download.
  const url = bundle.masterUrl + '&nuvio_format=master.m3u8';
  return [{ url, filename: `${target.originalTitle}.${target.year}.VixSrc`, headers,
    hlsMaster: { url, text: bundle.master },
    subtitles: bundle.subtitleUrl ? [{ url: bundle.subtitleUrl, language: 'tr', releaseName: 'VixSrc Türkçe', _scope: 'paired' }] : [],
    embeddedTurkish: bundle.embeddedTurkish, claimedQuality: 'Otomatik HLS',
    subtitleBase: VIX_ORIGIN + '/', source: 'VixSrc', identity: target, identityConfidence: 95 }];
}
module.exports = { loadVixBundle, vixCandidates, scanVixDirect, selectMaster, parseMaster };
