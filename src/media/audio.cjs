'use strict';
const { normalizeTitle } = require('../util.cjs');
const aliases = { eng:'en',english:'en',tur:'tr',turkish:'tr',türkçe:'tr',turkce:'tr',hin:'hi',hindi:'hi',fra:'fr',fre:'fr',french:'fr',jpn:'ja',japanese:'ja',rus:'ru',deu:'de',ger:'de',spa:'es',spanish:'es',por:'pt',ita:'it',kor:'ko' };
function audioCode(value) { const code=String(value||'').trim().toLowerCase().split(/[-_]/)[0];return aliases[code]||code; }
function describeAudio(video, candidate) {
  const codes=[...new Set((video.audioLanguages||[]).map(audioCode))].filter(c=>/^[a-z]{2}$/.test(c));
  if(codes.length)return{codes,evidence:video.container==='hls'?'playlist':'container',text:codes.slice(0,6).map(c=>c.toUpperCase()).join('/')};
  const declared=[...new Set((candidate.claimedAudioLanguages||[]).map(audioCode))].filter(c=>/^[a-z]{2}$/.test(c));
  if(declared.length)return{codes:declared,evidence:'source',text:declared.slice(0,6).map(c=>c.toUpperCase()+'?').join('/')};
  const file=normalizeTitle(candidate.filename||'').replace(normalizeTitle(candidate.identity?.originalTitle||''),'');
  const hints=[['en',/\b(english|eng)\b/i],['hi',/\b(hindi|hin)\b/i],['fr',/\b(french|fra)\b/i],['tr',/\b(turkish|tur)\b/i]].filter(([,re])=>re.test(file)).map(([code])=>code);
  return hints.length?{codes:hints,evidence:'filename',text:hints.map(c=>c.toUpperCase()+'?').join('/')}:null;
}
module.exports={audioCode,describeAudio};
