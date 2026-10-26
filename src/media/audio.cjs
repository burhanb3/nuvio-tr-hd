'use strict';
const { normalizeTitle } = require('../util.cjs');
const {languageCode,orderedLanguages,languageSummary}=require('./languages.cjs');
const audioCode=languageCode;
function describeAudio(video, candidate) {
  const result=(codes,evidence)=>({codes:orderedLanguages(codes),evidence,text:languageSummary(codes)});
  const codes=orderedLanguages(video.audioLanguages||[]);
  if(codes.length)return result(codes,video.container==='hls'?'playlist':'container');
  const declared=orderedLanguages(candidate.claimedAudioLanguages||[]);
  if(declared.length)return result(declared,'source');
  const file=normalizeTitle(candidate.filename||'').replace(normalizeTitle(candidate.identity?.originalTitle||''),'');
  const hints=[['en',/\b(english|eng)\b/i],['hi',/\b(hindi|hin)\b/i],['fr',/\b(french|fra)\b/i],['tr',/\b(turkish|tur)\b/i]].filter(([,re])=>re.test(file)).map(([code])=>code);
  if(hints.length)return result(hints,'filename');
  const original=audioCode(candidate.identity?.originalLanguage);
  return original?result([original],'original-language'):null;
}
module.exports={audioCode,describeAudio};
