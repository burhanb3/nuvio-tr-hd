# Geliştirme

Önce [proje hafızasını](hafiza/PROJE.md) ve [kararları](hafiza/KARARLAR.md) okuyun.

```text
manifest.json                 Nuvio scrapers manifesti
src/index.cjs                 ABI, ayarlar, iş akışı, süre ve aday sınırları
src/providers/catalog.cjs     Kişisel JSON adaptörü
src/providers/stremio.cjs     Stremio HTTP adaptörü
src/providers/directory.cjs   Otomatik gerçek dosya dizin taraması
src/providers/archive.cjs     Internet Archive araması ve fragman filtresi
src/providers/playimdb.cjs    TMDB ID ile PlayIMDb sorgusu
src/providers/vixsrc.cjs      VixSrc public oynatıcı/playlist okuma
src/hosted.cjs                Telefonda ortak servis istemcisi ve kimlik denetimi
hosting/worker.mjs            Sınırlı public tarama, kısa cache ve HLS master yolu
scripts/build-host.mjs        Sites Worker ESM deterministik Windows derlemesi
src/matching.cjs              TMDB kimliği ve sıkı eşleştirme
src/http.cjs                  Redirect, gövde süresi, 429 geri çekilmesi, JSON/range
src/scheduler.cjs             Nuvio için en çok 100 ms native beklemeli zamanlayıcı
src/media/containers.cjs      MP4/MKV başlık ve video boyutu okuma
src/media/probe.cjs           Dosya/HLS sınıflandırma ve kuyruk kontrolü
src/subtitles.cjs             Türkçe dil, UTF-8 SRT/VTT ve erişim doğrulama
src/subtitle-discovery.cjs     Yerleşik servisler ve dosyaya göre sürüm eşleştirmesi
src/ranking.cjs                Dengeli aday seçimi ve en iyi çiftleri sıralama
src/media/hash.cjs             Gerçek OpenSubtitles dosya hash'i
providers/nuvio-tr-hd.js       Uygulamaya yüklenen üretilmiş tek dosya
tests/                       Birim, adaptör, sözleşme ve QuickJS testleri
compatibility/               İncelenen upstream sürüm ve Git blob SHA'ları
```

Çalıştırma: `npm ci --ignore-scripts`, `npm run check`. Modülleri düzenleyin, `npm run build` ile sağlayıcıyı yeniden üretin. Manifest, paket ve scraper sürümleri aynı olmalıdır. Native `require`, Node `Buffer`, `process`, dosya sistemi, DOM veya fetch streaming API'sini sağlayıcı kaynaklarına eklemeyin. Nuvio'nun URL nesnesi tarayıcı URL nesnesinin tüm davranışlarını sunmaz.

Testlerdeki MP4/MKV örnekleri test sırasında üretilen küçük, yapısal konteyner parçalarıdır; oynatılabilir film değildir. Boyutlar, bozuk veri, HLS, yanlış kimlik/yıl, altyazı ve ağ durumlarını sınamak içindir. QuickJS testi üretilmiş dosyayı WASM motorunda, Nuvio'nun kullandığı API yüzeyini taklit eden minimal köprüyle çalıştırır. Nuvio'nun `quickjs-kt` JNI/Native köprüsünü ve cihaz indirme yöneticisini çalıştırmaz.

`npm run test:live` gerçek kaynakları ve genel erişimli Türkçe altyazıları sınırlı okumayla sınar. Tam film indirmez. Kaynak bazında başarısızlıkları ve gerçek dosya/altyazı çiftlerini ayrı kaydeder; cihaz testi sayılmaz. Kaynak engellendiğinde fixture testini gevşeterek canlı başarı uydurmayın.

`npm run verify:upstream` güncel resmî release ve `cmp-rewrite` kaynaklarını inceler. Bilinen Git blob SHA'ları veya kritik ABI parçaları değişirse başarısız olur; bu, otomatik uyumsuzluk hükmü değil yeniden inceleme gereğidir. Kilit dosyası kendiliğinden yenilenmez. Ağ/API erişimi yoksa sonuç doğrulanmış sayılmaz.

Yeni adaptör eklerken kendi dosyasında `load...(http, url, target, allowHttp)` biçiminde adaylar döndürün. Kimlik doğrulaması ve URL/başlık temizleme zorunludur. Yanlış kimliğin elendiği, bir kaynak bozulduğunda diğerinin kaldığı ve yeni formata ait en az bir anlamlı test ekleyin. Kaliteyi kaynak etiketiyle doğrulanmış saymayın. Yalnız yeni davranışın gerektirdiği testleri çalıştırın; son paket için `npm run check` tamamlanmalıdır.

Hata raporlarında token, Cookie, Authorization veya tam imzalı URL paylaşmayın. İsteğe bağlı `debug` ayarı yalnız kaynak/adet/HTTP durum özeti yazar; URL/anahtar yazmaz; Nuvio'nun yerel köprüsünün kendi günlükleme davranışı ayrıca geçerlidir. Kişisel kataloglar `.gitignore` içindeki `catalog.local.json` veya depo dışında tutulmalıdır.

## Sonuç görünürlüğü ve hatalar

Sağlayıcı bilinçli olarak hatalı adayları atlar. Boş liste, her zaman kod çökmesi anlamına gelmez: erişim yokluğu, TMDB isteği başarısızlığı, yanlış metadata, range desteği yokluğu veya desteklenmeyen altyazı biçimi olabilir. UI'ya yığın izi veya kişisel URL taşıyan hata metni döndürülmez. Üç eşzamanlı kaynak işi ve toplam üç video incelemesi, her videoda iki eşzamanlı altyazı kontrolü sınırı kullanılır. Kaynak işi adaylarını bulunca diğer kaynakları beklemeden doğrulamaya geçer. `createProvider().getReport()` son çağrının temizlenmiş tanı özetini verir.

Zamanlayıcı regresyonunun kaynağı ve canlı yeniden üretme komutları [sorun giderme rehberindedir](SORUN_GIDERME.md). QuickJS testinde Nuvio gibi iptal edilmeyen native timer işleri çağrı tamamlandıktan sonra ayrıca tüketilir; uzun toplam bütçe kadar bekleme oluşmamalıdır.

Sürüm değişikliğinde `CHANGELOG.md`, `docs/hafiza/PROJE.md` ve ilgili karar notlarını güncelleyin. Cihazda yapılmayan testi yapılmış olarak işaretlemeyin.
