import { createHash } from 'node:crypto';

// The 9x8 gray frames are produced by FFmpeg at two frames per second.
// Compare sequences, not independently chosen best-looking frames. Reject
// dark/static samples so logos or black screens cannot validate an identity.
export function fingerprintFrames(raw) {
  if (!raw.length || raw.length % 72) throw new Error('Incomplete gray frames');
  const frames=[];
  for(let offset=0;offset<raw.length;offset+=72){
    const bytes=raw.subarray(offset,offset+72),mean=bytes.reduce((sum,b)=>sum+b,0)/72;
    const contrast=Math.sqrt(bytes.reduce((sum,b)=>sum+(b-mean)**2,0)/72);
    let bits=0n;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++)bits=bits<<1n|BigInt(bytes[y*9+x]>bytes[y*9+x+1]);
    frames.push({bits,contrast});
  }
  return {frames,sha256:createHash('sha256').update(raw).digest('hex')};
}
function distance(a,b){let bits=a^b,count=0;while(bits){count++;bits&=bits-1n;}return count;}
export function compareSequences(archive,reference,{leadSeconds=60,fps=2,referenceFps=fps}={}){
  const active=archive.filter(f=>f.contrast>=8),distinct=new Set(active.map(f=>f.bits.toString(16))).size;
  if(archive.length<30||active.length<30||distinct<8)return {matched:false,reason:'sample_dark_short_or_static',activeFrames:active.length,distinctFrames:distinct,alignments:[]};
  const alignments=[];
  const stride=referenceFps/fps,last=Math.round((archive.length-1)*stride);
  for(let shift=0;shift+last<reference.length;shift++){
    const deltas=archive.flatMap((a,i)=>{const b=reference[shift+Math.round(i*stride)];return a.contrast>=8&&b.contrast>=8?[distance(a.bits,b.bits)]:[];});
    if(deltas.length<30)continue;
    const mean=deltas.reduce((sum,d)=>sum+d,0)/deltas.length,closeFrames=deltas.filter(d=>d<=10).length;
    alignments.push({offsetSeconds:shift/referenceFps-leadSeconds,mean,closeFrames,comparedFrames:deltas.length});
  }
  alignments.sort((a,b)=>a.mean-b.mean);
  const best=alignments[0];
  return {matched:!!best&&best.mean<=10&&best.closeFrames>=20,reason:best?'sequence_compared':'reference_dark_short_or_static',activeFrames:active.length,distinctFrames:distinct,alignments:alignments.slice(0,3)};
}
export function compareSamples(samples){
  if(samples.length<2||samples.some(s=>!s.comparison.matched))return {matched:false,reason:'two_matching_independent_samples_required'};
  const ordered=samples.slice().sort((a,b)=>a.startSeconds-b.startSeconds),first=ordered[0],last=ordered.at(-1);
  if(last.startSeconds-first.startSeconds<120)return {matched:false,reason:'sample_separation_too_small'};
  const estimatedReferenceRate=1+(last.comparison.alignments[0].offsetSeconds-first.comparison.alignments[0].offsetSeconds)/(last.startSeconds-first.startSeconds);
  return {matched:estimatedReferenceRate>.95&&estimatedReferenceRate<1.05,estimatedReferenceRate,reason:'content_samples_only_not_full_playback_or_subtitle_sync'};
}
