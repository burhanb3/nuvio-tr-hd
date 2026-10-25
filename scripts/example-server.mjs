import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 8787);
const routes = new Map([
  ['/manifest.json', ['manifest.json', 'application/json']],
  ['/providers/nuvio-tr-hd.js', ['providers/nuvio-tr-hd.js', 'application/javascript']],
  ['/examples/catalog.example.json', ['examples/catalog.example.json', 'application/json']],
  ['/examples/turkce.tr.srt', ['examples/turkce.tr.srt', 'application/x-subrip; charset=utf-8']],
  ['/examples/turkce.tr.vtt', ['examples/turkce.tr.vtt', 'text/vtt; charset=utf-8']],
  ['/catalog.local.json', ['catalog.local.json', 'application/json']]
]);
const server = createServer(async (request, response) => {
  const route = routes.get((request.url || '').split('?')[0]);
  if (!route || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(404).end(); return; }
  try {
    const body = await readFile(resolve(root, route[0]));
    response.writeHead(200, { 'Content-Type': route[1], 'Content-Length': body.length, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404).end('Dosya bulunamadı'); }
});
server.listen(port, '0.0.0.0', () => {
  console.log(`Manifest: http://BILGISAYARIN_YEREL_IP_ADRESI:${port}/manifest.json`);
  console.log('Telefonla aynı Wi-Fi ağını kullanın. Örnek katalog .invalid adresler içerir; gerçek kişisel URL’lerinizi catalog.local.json dosyasına yazın.');
});
