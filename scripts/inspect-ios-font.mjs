import{readFile,writeFile,mkdir}from'node:fs/promises';
const root=new URL('../',import.meta.url),lock=JSON.parse(await readFile(new URL('compatibility/upstream-lock.json',root),'utf8'));
const url=`https://raw.githubusercontent.com/${lock.repository}/${lock.release}/iosApp/iosApp/Resources/Fonts/NotoSansCJKsc-Regular.otf`;
async function range(start,end){const r=await fetch(url,{headers:{Range:`bytes=${start}-${end}`},signal:AbortSignal.timeout(12000)});const actual=r.headers.get('content-range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);if(r.status!==206||!actual||Number(actual[1])!==start||Number(actual[2])!==end){await r.body?.cancel();throw new Error('Font range unavailable: '+r.status);}const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length!==end-start+1)throw new Error('Incomplete font range');return bytes;}
const head=await range(0,4095);let table;
for(let at=12;at<12+head.readUInt16BE(4)*16;at+=16)if(head.toString('ascii',at,at+4)==='cmap')table={offset:head.readUInt32BE(at+8),length:head.readUInt32BE(at+12)};
if(!table||table.length>300000)throw new Error('unsupported cmap');const cmap=await range(table.offset,table.offset+table.length-1);
const glyph=cp=>{for(let at=4;at<4+cmap.readUInt16BE(2)*8;at+=8){const off=cmap.readUInt32BE(at+4),format=cmap.readUInt16BE(off);
 if(format===12){const groups=cmap.readUInt32BE(off+12);for(let i=0;i<groups;i++){const p=off+16+i*12,a=cmap.readUInt32BE(p),b=cmap.readUInt32BE(p+4);if(cp>=a&&cp<=b)return cmap.readUInt32BE(p+8)+(cp-a);}}
 if(format===4&&cp<=65535){const n=cmap.readUInt16BE(off+6)/2,ends=off+14,starts=ends+n*2+2,deltas=starts+n*2,ranges=deltas+n*2;
  for(let i=0;i<n;i++){const end=cmap.readUInt16BE(ends+i*2),start=cmap.readUInt16BE(starts+i*2);if(cp<start||cp>end)continue;const delta=cmap.readInt16BE(deltas+i*2),r=cmap.readUInt16BE(ranges+i*2);if(!r)return(cp+delta)&65535;const p=ranges+i*2+r+(cp-start)*2;const value=cmap.readUInt16BE(p);return value?(value+delta)&65535:0;}
 }
}return 0;};
const result={checkedAt:new Date().toISOString(),source:url,rangeOnly:true,bytes:head.length+cmap.length,table,turkish:Object.fromEntries([... 'şŞğĞıİçÇöÖüÜ'].map(c=>[c,{codepoint:c.codePointAt(0).toString(16),glyph:glyph(c.codePointAt(0))}]))};
await mkdir(new URL('.cache/',root),{recursive:true});await writeFile(new URL('.cache/ios-font-report.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
