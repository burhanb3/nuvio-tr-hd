# Nuvio uyumluluğu

Nuvio TR HD, Nuvio Mobile'ın Kotlin Multiplatform **Full** sürümündeki JavaScript plugin arayüzünü kullanır. Manifestte dört scraper vardır; önceki kimlikler güncellemelerde korunur.

## Doğrulanan sözleşme

- `getStreams` ve `onSettings` girişleri; mevcut sonuç, erişim başlığı ve altyazı alanları.
- Native parser'ın kalite, boyut ve dil alanlarını sıralaması; boş alanları atlaması.
- HLS/DASH URL'lerinin dosya indirme yolundan dışlanması.
- iOS ağ/timer köprüsünün iptal sınırları; uzun native bekleme oluşturmayan zamanlayıcı.

Resmî release ve geliştirme dalındaki ilgili dosyaların SHA'ları `compatibility/upstream-lock.json` içinde tutulur. `npm run verify:upstream` bunları ve kritik ABI parçalarını karşılaştırır. Fark varsa kilit otomatik yenilenmez; değişiklik incelenir.

## Güncel kontrol

1.8.4: 276 fixture/gerçek QuickJS testi. En son doğrulanan Nuvio sürümü **0.6.5-beta**; kilitli 23 dosyada drift yok, kilit değiştirilmedi. [Upstream raporu](../compatibility/upstream-184-check.json), [yeni indirme dosyaları](../compatibility/download-expansion-184.json), [kapsam ve tekrarlar](../compatibility/coverage-184.json).

Uzantısız MKV için önceki eleme kararı gözden geçirildi: Nuvio iOS dosya gövdesini doğrudan yazar ve dosyayı MPV `loadfile` yoluna iletir. Nuvio'nun `.mp4` kayıt adı, dosyayı MP4'e dönüştürmez. Boyut/format ve gerçek video/ses denetimi geçen kaynaklar bu yola sınırlı olarak alınır. Resmî MPV masaüstü CI derlemesinde 1080p ve 4K MKV örnekleri `.mp4` adıyla tanındı ve bir kare çözüldü. Bu, fiziksel Nuvio/iPhone oynatma veya tam indirme kanıtı değildir.

1.8.4'te bir Fleabag 4K dosyasının ilk 1 MiB'ı masaüstü MPV'de bir kareyle sınandı; MP4 kayıt adı altında gerçek MKV/3840×1600 tanındı, EN-US ses ve TR-TR metin altyazı izi seçildi. Önceki 4 MiB örnek isteği zaman aşımına uğradı. Bu kısa, kesilmiş örnek tam dosya veya fiziksel Nuvio/altyazı senkronu testi değildir.

Üretilmiş JavaScript QuickJS WASM motorunda, Nuvio'nun API yüzeyine benzeyen köprüyle çalıştırılır. Bu test quickjs-kt JNI/Native köprüsünü veya fiziksel iPhone taşımasını çalıştırmaz. Fiziksel iPhone/Android, Kotlin derlemesi, tam film oynatma/indirme, offline altyazı ve sahne senkronu henüz sınanmadı.

Goojara için anonim public katalog çerezi yalnız kaynak keşfinde kullanılır. JavaScript elle yönlendirme yolunda farklı kökene geçmeden silinir; iOS otomatik yönlendirmesinin fiziksel başlık aktarımı sınanmadı. Video sonuçları katalog oturumu taşımaz.

Kaynak kontrolleri sabit kanonik metadata referanslarıyla gerçek public HTTP/Range ve altyazı yanıtlarını sınar; telefonun TMDB API anahtarı bu yöntemle sınanmaz. Tam katalog veya her kalitede dosya başarısı iddiası değildir.

[Yayın doğrulaması](../compatibility/github-publication.json) · [Önceki uyumluluk kayıtları](arsiv/UYUMLULUK_GECMISI.md).

1.8.4 yayın kodu `9172166ee08173ef444fe4b636a6934053dd2485`: Windows/Linux [CI](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40578064383) ve [Pages](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40578064386) başarılı; yedi public varlık HTTP200 ve yerel SHA eşit.
