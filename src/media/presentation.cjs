'use strict';
const { qualityLabel } = require('../util.cjs');
const { describeAudio } = require('./audio.cjs');
const { subtitleLanguage, embeddedSubtitleLanguages } = require('../subtitles.cjs');

function filenameQuality(filename) {
  const match = String(filename || '').match(/(?:^|[^0-9])(4320|2160|1440|1080|720|576|480|360|240)p\b/i);
  if (match) return Number(match[1]) + 'p';
  return /(?:^|[ ._-])4k(?:[ ._-]|$)/i.test(String(filename)) ? '2160p' : null;
}
function describeQuality(video, candidate) {
  if (video.dimensions) return { quality: qualityLabel(video.dimensions), text: `${video.dimensions.width}×${video.dimensions.height} · dosyadan doğrulandı` };
  const options = video.resolutionOptions || [];
  if (options.length) {
    const labels = [...new Set(options.map(d => `${d.width}×${d.height}`))];
    return { quality: qualityLabel(options[options.length - 1]), text: `${labels.join(' / ')} · HLS listesi${labels.length > 1 ? '; otomatik kalite' : ''}` };
  }
  const hint = filenameQuality(candidate.filename) || filenameQuality(candidate.claimedQuality);
  if (hint) return { quality: hint, text: `${hint} tahmini · dosya adı; piksel ölçülmedi` };
  return { quality: 'Bilinmiyor', text: 'Kalite bilgisi alınamadı' };
}
function humanBytes(bytes) {
  return bytes < 10000000 ? '<0,01 GB' : `${(bytes / 1000000000).toFixed(2).replace('.',',')} GB`;
}
function describeSize(video) {
  if (video.size > 0) return { size: humanBytes(video.size), text: `${humanBytes(video.size)} · dosya boyutu` };
  if (video.sizeEstimate?.minimum > 0 && video.sizeEstimate.maximum >= video.sizeEstimate.minimum) {
    const estimate = video.sizeEstimate, range = humanBytes(estimate.minimum) + (estimate.maximum > estimate.minimum * 1.02 ? '–' + humanBytes(estimate.maximum) : '');
    if (estimate.maximum > estimate.minimum * 1.02) return { text: 'Otomatik kalite · aktarım boyutu değişken' };
    const qualifier = estimate.basis === 'peak-bitrate' ? '≤~' : '~';
    const basis = estimate.basis === 'segment-samples' ? `${estimate.samples} parça başlığı örneği` : estimate.basis === 'peak-bitrate' ? 'tepe bitrate; üst tahmin' : 'bitrate × süre tahmini';
    return { size: `${qualifier}${range}`, text: `${qualifier}${range} veri · ${basis}${estimate.durationSource === 'tmdb' ? '; film süresi' : ''}` };
  }
  return { text: video.container === 'hls' ? 'Aktarım boyutu hesaplanamadı' : 'Dosya boyutu alınamadı' };
}
function subtitleLabel(video,candidate,subtitles) {
  const languages=new Set([...embeddedSubtitleLanguages(video,candidate),...subtitles.map(s=>subtitleLanguage(s.language)).filter(Boolean)]);
  const label=['tr','en'].filter(l=>languages.has(l)).map(l=>l.toUpperCase()).join('/');
  return label ? `${label} altyazı${languages.has('tr')?'':' · TR altyazı yok'}` : 'TR altyazı yok';
}
function cardFields(video,candidate,subtitles) {
  const quality=describeQuality(video,candidate),size=describeSize(video),audio=describeAudio(video,candidate);
  const dimensions=video.dimensions||video.resolutionOptions?.length===1&&video.resolutionOptions[0];
  return {
    quality: dimensions ? `${dimensions.width}×${dimensions.height}${video.dimensions?' ✓':' HLS'}` :
      video.resolutionOptions?.length>1 ? 'Otomatik HLS' : quality.quality==='Bilinmiyor' ? 'Kalite bilinmiyor' : `${quality.quality} tahmini`,
    size: size.size || (video.sizeEstimate ? 'Boyut değişken' : 'Boyut bilinmiyor'),
    language: `Ses: ${audio?.text||'bilinmiyor'} · ${subtitleLabel(video,candidate,subtitles)}` + (candidate.burnedSubtitleLanguage==='es'?' · ES görüntüde':'')
  };
}
module.exports = { filenameQuality, describeQuality, describeSize, cardFields, subtitleLabel };
