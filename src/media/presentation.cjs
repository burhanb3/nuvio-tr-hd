'use strict';
const { qualityLabel } = require('../util.cjs');
const { describeAudio } = require('./audio.cjs');
const { embeddedSubtitleLanguages } = require('../subtitles.cjs');
const {languageSummary,languageCodes}=require('./languages.cjs');

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
  return bytes < 1000000 ? '<0,001 GB' : `${(bytes / 1000000000).toFixed(bytes<10000000?3:2).replace('.',',')} GB`;
}
function qualityChoice(video,candidate={}) {
  if(video.dimensions)return {label:qualityLabel(video.dimensions),dimensions:video.dimensions,evidence:'pixels'};
  const options=video.resolutionOptions||[];
  if(options.length){const d=options.slice().sort((a,b)=>parseInt(qualityLabel(b))-parseInt(qualityLabel(a)))[0];return {label:qualityLabel(d),dimensions:options.length===1?d:null,evidence:'playlist',automatic:options.length>1};}
  const hint=filenameQuality(candidate.claimedQuality)||filenameQuality(candidate.filename)||filenameQuality(String(candidate.url||'').split(/[?#]/)[0]);
  if(hint)return {label:hint,evidence:'source-or-filename'};
  const seconds=video.duration||candidate.identity?.runtimeMinutes*60;
  const bitrate=Number(video.bitrate)||(video.size>0&&seconds>0?video.size*8/seconds:0);
  if(bitrate>0){const codec=/av1/i.test(candidate.filename||'')?0.55:/hevc|x265|h265/i.test(candidate.filename||'')?0.65:1;
    const level=[[15000000,2160],[7000000,1440],[2800000,1080],[1300000,720],[650000,480],[0,360]].find(([rate])=>bitrate>=rate*codec);
    return {label:level[1]+'p',evidence:'bitrate-model'};}
  return null;
}
function probableSize(video,candidate={}) {
  if(video.size>0)return {bytes:video.size,evidence:'bytes'};
  if(video.live)return null;
  const renditions=(video.renditions||[]).filter(r=>r.sizeEstimate?.minimum>0).slice().sort((a,b)=>parseInt(qualityLabel(b.dimensions))-parseInt(qualityLabel(a.dimensions)));
  const estimate=renditions[0]?.sizeEstimate||video.sizeEstimate;
  if(estimate?.minimum>0&&estimate.maximum>=estimate.minimum){
    let bytes=estimate.maximum>estimate.minimum*1.02?Math.sqrt(estimate.minimum*estimate.maximum):estimate.minimum;
    if(estimate.basis==='peak-bitrate'||estimate.basis==='peak-or-average-bitrate')bytes*=0.8;
    return {bytes:Math.round(bytes),evidence:estimate.basis||'bitrate',estimate};
  }
  const seconds=video.duration||candidate.identity?.runtimeMinutes*60,quality=qualityChoice(video,candidate);
  if(!(seconds>0)||!quality)return null;
  const height=parseInt(quality.label),rates=[[4320,40000000],[2160,16000000],[1440,8000000],[1080,4000000],[720,2000000],[480,900000],[0,500000]];
  const bitrate=rates.find(([p])=>height>=p)[1],codec=/av1/i.test(candidate.filename||'')?0.55:/hevc|x265|h265/i.test(candidate.filename||'')?0.65:1;
  return {bytes:Math.round((bitrate*codec+128000)*seconds/8),evidence:'resolution-duration-codec-model'};
}
function describeSize(video,candidate={}) {
  if (video.size > 0) return { size: humanBytes(video.size), text: `${humanBytes(video.size)} · dosya boyutu` };
  const probable=probableSize(video,candidate);
  if (video.sizeEstimate?.minimum > 0 && video.sizeEstimate.maximum >= video.sizeEstimate.minimum) {
    const estimate = video.sizeEstimate, range = humanBytes(estimate.minimum) + (estimate.maximum > estimate.minimum * 1.02 ? '–' + humanBytes(estimate.maximum) : '');
    if (estimate.maximum > estimate.minimum * 1.02) return {size:probable?humanBytes(probable.bytes):undefined,text:'Otomatik kalite · aktarım boyutu değişken',evidence:probable?.evidence};
    const qualifier = estimate.basis === 'peak-bitrate' ? '≤~' : '~';
    const basis = estimate.basis === 'segment-samples' ? `${estimate.samples} parça başlığı örneği` : estimate.basis === 'peak-bitrate' ? 'tepe bitrate; üst tahmin' : 'bitrate × süre tahmini';
    return { size:probable?humanBytes(probable.bytes):undefined, text: `${qualifier}${range} veri · ${basis}${estimate.durationSource === 'tmdb' ? '; film süresi' : ''}`,evidence:probable?.evidence };
  }
  if(probable)return {size:humanBytes(probable.bytes),text:humanBytes(probable.bytes),evidence:probable.evidence};
  return { text: video.container === 'hls' ? 'Aktarım boyutu hesaplanamadı' : 'Dosya boyutu alınamadı' };
}
function subtitleLabel(video,candidate,subtitles) {
  const embedded=Array.isArray(video.subtitleLanguages)?video.subtitleLanguages:[...(video.subtitleTracks||[]).map(t=>t.language),...embeddedSubtitleLanguages(video,candidate)];
  const languages=new Set(languageCodes([...embedded,...subtitles.map(s=>s.language)]));
  const label=languageSummary([...languages]);
  return label ? `${label} altyazı${languages.has('tr')?'':' · TR altyazı yok'}` : 'TR altyazı yok';
}
function cardFields(video,candidate,subtitles) {
  const quality=qualityChoice(video,candidate),size=describeSize(video,candidate),audio=describeAudio(video,candidate);
  const dimensions=quality?.dimensions;
  return {
    quality: dimensions ? `${quality.label} · ${dimensions.width}×${dimensions.height}` : quality ? quality.label+(quality.automatic?' · Otomatik':'') : '',
    size: size.size || '',
      language: [audio?.text?'Ses: '+audio.text:'',subtitleLabel(video,candidate,subtitles)].filter(Boolean).join(' · ') + (['es','en'].includes(candidate.burnedSubtitleLanguage)?' · '+candidate.burnedSubtitleLanguage.toUpperCase()+' görüntüde':'')
  };
}
module.exports = { filenameQuality, describeQuality, describeSize, cardFields, subtitleLabel, qualityChoice, probableSize };
