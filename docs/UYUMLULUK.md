# Nuvio uyumluluğu

Nuvio TR HD, Nuvio Mobile'ın Kotlin Multiplatform **Full** sürümündeki JavaScript plugin arayüzünü kullanır. Manifestte dört scraper vardır; önceki kimlikler güncellemelerde korunur.

## Doğrulanan sözleşme

- `getStreams` ve `onSettings` girişleri; mevcut sonuç, erişim başlığı ve altyazı alanları.
- Native parser'ın kalite, boyut ve dil alanlarını sıralaması; boş alanları atlaması.
- HLS/DASH URL'lerinin dosya indirme yolundan dışlanması.
- iOS ağ/timer köprüsünün iptal sınırları; uzun native bekleme oluşturmayan zamanlayıcı.

Resmî release ve geliştirme dalındaki ilgili dosyaların SHA'ları `compatibility/upstream-lock.json` içinde tutulur. `npm run verify:upstream` bunları ve kritik ABI parçalarını karşılaştırır. Fark varsa kilit otomatik yenilenmez; değişiklik incelenir.

## Güncel kontrol

1.8.0: 248 fixture/gerçek QuickJS testi. En son doğrulanan Nuvio sürümü **0.6.5-beta**; kilitli 20 dosyada drift yok. [Upstream raporu](../compatibility/upstream-180-check.json) ve [indirme/kaynak kontrolü](../compatibility/download-expansion-180.json).

Üretilmiş JavaScript QuickJS WASM motorunda, Nuvio'nun API yüzeyine benzeyen köprüyle çalıştırılır. Bu test quickjs-kt JNI/Native köprüsünü veya fiziksel iPhone taşımasını çalıştırmaz. Fiziksel iPhone/Android, Kotlin derlemesi, tam film oynatma/indirme, offline altyazı ve sahne senkronu henüz sınanmadı.

Goojara için anonim public katalog çerezi yalnız kaynak keşfinde kullanılır. JavaScript elle yönlendirme yolunda farklı kökene geçmeden silinir; iOS otomatik yönlendirmesinin fiziksel başlık aktarımı sınanmadı. Video sonuçları katalog oturumu taşımaz.

Kaynak kontrolleri sabit kanonik metadata referanslarıyla gerçek public HTTP/Range ve altyazı yanıtlarını sınar; telefonun TMDB API anahtarı bu yöntemle sınanmaz. Tam katalog veya her kalitede dosya başarısı iddiası değildir.

[Yayın doğrulaması](../compatibility/github-publication.json) · [Önceki uyumluluk kayıtları](arsiv/UYUMLULUK_GECMISI.md).

1.8.0 yayın kodu `7ea52b8609fa1e236147bff1d359753b37be1be2`: Windows/Linux [CI](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40522695904) ve [Pages](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40522696038) başarılı; yedi public varlık HTTP200 ve yerel SHA eşit.
