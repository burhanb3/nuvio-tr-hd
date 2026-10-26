import{test}from'node:test';import assert from'node:assert/strict';
import{fingerprintFrames,compareSequences,compareSamples}from'../scripts/content-fingerprint.mjs';
function sequence(count,seed=0){let state=seed+1;return Array.from({length:count},()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;const low=state;state=(Math.imul(state,1664525)+1013904223)>>>0;return{bits:BigInt(state)<<32n|BigInt(low),contrast:40};});}
test('İçerik kontrolü gerçek sıralı örnek ve offset bulur; farklı/karıştırılmış görüntüyü kabul etmez',()=>{
 const a=sequence(40),b=[...sequence(120,100),...a,...sequence(120,200)];
 const found=compareSequences(a,b);assert.equal(found.matched,true);assert.equal(found.alignments[0].offsetSeconds,0);assert.equal(found.alignments[0].closeFrames,40);
 assert.equal(compareSequences(sequence(40,555),b).matched,false);
 assert.equal(compareSequences(a.slice().reverse(),b).matched,false);
});
test('Siyah, sabit logo veya kısa örnek kimlik kanıtı olmaz; tam gri frame gerekir',()=>{
 const black=Array.from({length:40},()=>({bits:0n,contrast:0})),logo=Array.from({length:40},()=>({bits:1234n,contrast:40}));
 assert.equal(compareSequences(black,black).matched,false);assert.equal(compareSequences(logo,logo).matched,false);
 assert.equal(compareSequences(sequence(20),sequence(80)).matched,false);
 assert.throws(()=>fingerprintFrames(Buffer.alloc(73)),/Incomplete/);
 assert.equal(fingerprintFrames(Buffer.alloc(72)).frames[0].contrast,0);
});
test('Tek veya komşu örnek yeterli değildir; zaman farkı altyazıya otomatik uygulanmaz',()=>{
 const s=startSeconds=>({startSeconds,comparison:{matched:true,alignments:[{offsetSeconds:-1}]}});
 assert.equal(compareSamples([s(180)]).matched,false);assert.equal(compareSamples([s(180),s(190)]).matched,false);
 assert.equal(compareSamples([s(180),s(900)]).matched,true);
 assert.equal(compareSamples([s(180),{...s(900),comparison:{matched:false}}]).matched,false);
 assert.equal(compareSamples([s(180),{...s(900),comparison:{matched:true,alignments:[{offsetSeconds:300}]}}]).matched,false);
});
test('Referansta daha sık örnek yarım saniyeye yuvarlamadan zaman eşleştirir',()=>{
 const a=sequence(40),prefix=sequence(483,300),b=[...prefix,...a.flatMap(f=>Array.from({length:4},()=>f)),...sequence(100,500)];
 const result=compareSequences(a,b,{fps:2,referenceFps:8});assert.equal(result.matched,true);
 assert.equal(result.alignments[0].offsetSeconds,.375);assert.equal(result.alignments[0].closeFrames,40);
});
