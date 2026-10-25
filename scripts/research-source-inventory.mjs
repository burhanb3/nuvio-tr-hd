import {mkdir,writeFile} from 'node:fs/promises';
// Inventory only. A manifest entry is a provider claim, not a live success.
// Remote JavaScript is never imported, executed or copied into our provider.
const repos=['NuvioPlugin/All-in-One-Nuvio','phisher98/phisher-nuvio-providers','michat88/nuvio-providers','yoruix/nuvio-providers','mooncrown04/nuviotr','fmustafayaman/turkish-nuvio','manitux-app/nuvio-plugins','itsmeadarsh2008/Streamline','niakw/NiakVIO'];
const results=await Promise.all(repos.map(async repo=>{
 const url=`https://raw.githubusercontent.com/${repo}/refs/heads/main/manifest.json`;
 try{const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)return{repo,url,status:r.status,providers:[]};
  const j=await r.json(),providers=Array.isArray(j.scrapers)?j.scrapers:Array.isArray(j.providers)?j.providers:[];
  return{repo,url,status:r.status,manifestName:j.name,manifestVersion:j.version,
   providers:providers.map(p=>({id:p.id,name:p.name,types:p.supportedTypes||[],formats:p.formats||p.supportedFormats||[],file:p.filename,enabled:p.enabled!==false}))};
 }catch(e){return{repo,url,error:e.name,providers:[]};}
}));
const ids=[...new Set(results.flatMap(r=>r.providers.map(p=>(p.id||p.name||'').toLowerCase().replace(/[^a-z0-9]/g,''))))];
const report={checkedAt:new Date().toISOString(),method:'Public manifest inventory across selected maintained/community repos; selected implementations and actual HTTP responses inspected separately. No remote code executed.',
 exhaustive:false,scope:'free and accountless only; no personal/debrid keys copied; torrent-only entries are not MP4/MKV files',
 definitions:results.reduce((s,r)=>s+r.providers.length,0),normalizedIds:ids.length,
 caution:'Counts include forks, wrappers and mirrors; these are not independent verified working sources.',repositories:results};
await mkdir('.cache',{recursive:true});await writeFile('.cache/source-inventory-150.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({definitions:report.definitions,normalizedIds:ids.length,repositories:results.map(r=>({repo:r.repo,status:r.status,error:r.error,count:r.providers.length}))},null,2));
