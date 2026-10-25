import {build} from 'esbuild';
import {readFile,writeFile,mkdir,rm,readdir,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const hostRoot=resolve(process.argv[2]||'plugin-host');
const publicRoot=resolve(hostRoot,'public'),dist=resolve(hostRoot,'dist');
const config=JSON.parse(await readFile(resolve(hostRoot,'.openai/hosting.json'),'utf8'));
if(config.static)throw new Error('Worker manifestinden static alanını kaldırın');
if(!dist.startsWith(hostRoot+sep))throw new Error('Unsafe output');
const assets={};
const mime=path=>path.endsWith('.html')?'text/html; charset=utf-8':path.endsWith('.json')?'application/json':path.endsWith('.js')?'text/javascript':path.endsWith('.zip')?'application/zip':'text/plain; charset=utf-8';
async function collect(dir,prefix=''){
 for(const name of await readdir(dir)){
  const full=resolve(dir,name),path=prefix+'/'+name;
  if((await stat(full)).isDirectory())await collect(full,path);
  else assets[path]={data:(await readFile(full)).toString('base64'),type:mime(name)};
 }
}
await collect(publicRoot);
const entry=`import service from './hosting/worker.mjs';
const assets=${JSON.stringify(assets)};
export default {async fetch(request,env,ctx){
 const path=new URL(request.url).pathname;
 if(path.startsWith('/api/')||path.startsWith('/hls/')||path.startsWith('/files/'))return service.fetch(request,env,ctx);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const asset=assets[path==='/'?'/index.html':path];
 if(!asset)return new Response('Not found',{status:404});
 const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
 return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'}});
}};`;
const result=await build({stdin:{contents:entry,resolveDir:hostRoot,sourcefile:'worker-entry.mjs',loader:'js'},bundle:true,format:'esm',platform:'browser',target:'es2022',write:false,minify:false});
// Exactly the Worker ESM artifact layout used by the Sites starter. This build
// is native Node so Windows needs no bash helper for the same deterministic output.
await rm(dist,{recursive:true,force:true});
await mkdir(resolve(dist,'server'),{recursive:true});await mkdir(resolve(dist,'.openai'),{recursive:true});
await writeFile(resolve(dist,'server/index.js'),result.outputFiles[0].text);
await writeFile(resolve(dist,'.openai/hosting.json'),JSON.stringify(config,null,2)+'\n');
console.log('Worker ESM hazır: '+dist);
