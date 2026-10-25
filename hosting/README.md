# Ortak kaynak servisi

**Yayın durumu (1.3.0):** Bu Worker hazırlanmış ve yerelde sınanmıştır; eski Sites çalışma alanına erişim kaybolduğu için üretime yayımlanmadı. GitHub Pages sürümü kaynakları telefondan doğrudan arar; `hostedDiscovery` varsayılan kapalıdır. Aşağıdaki akış isteğe bağlı Worker kurulumu içindir. Doğrudan VixSrc, master adresine gerçek HLS gövdesi doğrulanmış `nuvio_format=master.m3u8` son eki ekler; Nuvio'nun native URL filtresi bu HLS'yi dosya indirmesine kapatır. Tek master, kalite ve ses/altyazı gruplarını korur.


1.3.0, aynı Sites kimliğini statik yayından Worker ESM servisine geçirir. Kurulum adresi değişmez. `worker.mjs` Node bağımlılığı olmayan sağlayıcı çekirdeğini çalıştırır; `page.html` kurulum sayfasının kaynak kopyasıdır. Yayın checkout'u `plugin-host/`, kimlik `plugin-host/.openai/hosting.json` içindedir.

## Akış

1. Telefon, kendi Nuvio TMDB anahtarıyla özgün başlığı/yılı/IMDb kimliğini çözer.
2. Ortak tarama açıkken `/api/discover` POST gövdesine yalnız bu kanonik metadata yazılır. Katalog/addon adresleri, TMDB anahtarı, Cookie veya Authorization gönderilmez.
3. Servis PlayIMDb, Internet Archive ve VixSrc'yi sınırlı süreyle sorgular; dosya/kalite/altyazı kontrolleri sunucuda yapılır. Metadata burada istemcinin kanonik referansıdır; ikinci bir canlı TMDB doğrulaması yapıldığı iddia edilmez.
4. Başarılı ve boş olmayan sonuçlar kanonik metadata SHA-256 anahtarıyla en çok 180 saniye Cloudflare Cache API'ye yazılır. Bilinen URL sona erme zamanı daha erkense süre kısaltılır. Boş/hatalı sonuç önbelleğe alınmaz. Eşzamanlı aynı sorgu birleştirilir. Cache kalıcı kullanıcı veritabanı değildir.
5. Telefon, dönen kimlikleri/URL türlerini tekrar kontrol eder; kişisel kaynakları kendi içinde ekler, kullanıcının filtreleriyle en iyi 20 sonucu sıralar. Ortak servis erişilemiyorsa yerel public adaptörler yedektir.

## VixSrc

Yalnız film desteği vardır. Resmî oynatıcı sayfasının kullandığı herkese açık `/api/movie/{tmdbId}` → kısa ömürlü embed → master playlist akışı okunur; HTML scriptleri çalıştırılmaz. Embed başlığı özgün başlıkla karşılaştırılır. Master'da Türkçe varsa bağlı altyazı playlisti okunur; tek parça VTT ayrıca dış altyazı olarak sunulur.

Master URL'si uzantısız olduğu için Nuvio'nun indirme filtresiyle uyumlu `/hls/vix/movie/{id}/{auto|yükseklik}.m3u8` yolu kullanılır. Servis yalnız küçük master metnini sunar. Audio/video alt playlistleri ve segmentleri kaynak sunucuda kalır; bütün video proxy'lenmez. HLS hiçbir zaman indirilebilir sayılmaz. Gerçek varyantlar seçilir; farklı çözünürlük profilleri bağımsız sağlayıcı olarak tanıtılmaz. Playlistteki çözünürlük beyanı konteynerden doğrulanmış piksel boyutu değildir.

## Derleme

Sites Worker ESM starter'ının `dist/server/index.js` + `dist/.openai/hosting.json` çıktı düzeni kullanılır. Windows için aynı deterministik çıktı Node/esbuild ile üretilir; Bash gerekmez. Statik dosyalar Worker'a base64 olarak gömülür ve aynı URL/MIME ile sunulur.

```powershell
npm run check
# plugin-host/public içine index.html, manifest, provider ve ZIP hazırlanır.
# src/ ve hosting/worker.mjs yayın checkout'una kopyalanır.
# Kimlik korunur; hosting.json içindeki static alanı kaldırılır.
npm run build:host
```

Paketleme/yayın Sites source helper ile aynı project_id üzerinde yapılmalıdır; başka Site oluşturmayın. Bu projenin barındırmasını değiştiren bir fork, `src/hosted.cjs` içindeki servis origin'ini de kendi servis adresine uyarlamalıdır. Yayın yardımcılarına erişim tokenları yalnız gizli stdin ile verilir.

## Sınırlar

Sunucu bütçesi 13 saniye, telefon iş akışının mantıksal bütçesi 24 saniyedir. Başlamış native TMDB veya kişisel kaynak isteğinin fiilî iptali hâlâ Nuvio'ya bağlıdır. Başarılı videolar altyazı başarısızlığında korunur; “TR bulunamadı” olarak etiketlenir. Fiziksel iPhone oynatımı, arka plan indirme ve çevrimdışı altyazı kabul testi kullanıcıyla ayrıca doğrulanmalıdır.
