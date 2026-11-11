# Nuvio uyumluluğu

Nuvio TR HD, Nuvio Mobile'ın Kotlin Multiplatform **Full** sürümündeki JavaScript plugin arayüzünü kullanır. Manifestte dört scraper vardır; önceki kimlikler güncellemelerde korunur.

## Doğrulanan sözleşme

- `getStreams` ve `onSettings` girişleri; mevcut sonuç, erişim başlığı ve altyazı alanları.
- Native parser'ın kalite, boyut ve dil alanlarını sıralaması; boş alanları atlaması.
- HLS/DASH URL'lerinin dosya indirme yolundan dışlanması.
- iOS ağ/timer köprüsünün iptal sınırları; uzun native bekleme oluşturmayan zamanlayıcı.

Resmî release ve geliştirme dalındaki ilgili dosyaların SHA'ları `compatibility/upstream-lock.json` içinde tutulur. `npm run verify:upstream` bunları ve kritik ABI parçalarını karşılaştırır. Fark varsa kilit otomatik yenilenmez; değişiklik incelenir.

## Güncel kontrol

1.9.0, Windows Nuvio Desktop üzerinde mevcut depo yenilenerek sınandı. Dune (2021) 1.8.9'da boş döndü, 1.9.0 ile normal yayın listesinde Türkçe altyazı etiketli bir online sonuç çıktı. Kurulu motorun ayrı işlem testinde Fleabag S1E1 dört online sonuç verdi. Ayrı MoviesDrive kaynak testinde Dune MKV seçenekleri doğrulandı, Windows uygulama denemesinde indirilebilir satır görünmedi. Tam oynatma, indirme ve fiziksel telefon sınanmadı. [Masaüstü ve kaynak ölçümü](../compatibility/desktop-190-check.json).

1.8.9: Android/iOS yanında Desktop platformu manifestte açıldı. Windows'taki Nuvio Desktop 1.1.35 depoyu 0 sağlayıcıyla gösteriyordu; yayımdan sonra aynı depoyu yenileyince dört sağlayıcı göründü. Gerçek uygulamadaki sağlayıcı testinde Matrix için 10 sonuç döndü. İlk Dune araması uygulamada boş kaldı; kurulu Desktop QuickJS motorunu kullanan ayrı işlemde Dune için 10 sonuç geldi. Bu farklı sonuçlar ağ ve uygulama durumunun değişebileceğini gösterir, sorunun tümüyle çözüldüğünü veya tam oynatım/indirmeyi kanıtlamaz. Linux ve macOS masaüstü sınanmadı. [Masaüstü kontrolü](../compatibility/desktop-189-check.json).

Nuvio Mobile 0.6.5-beta geliştirme dalında iki oynatıcı dosyasının değişikliği incelendi; eklenti ABI değişikliği saptanmadı. Ardından 23 kaynak dosyası kilidi tekrar kontrol edildi ve drift bulunmadı. [İnceleme](../compatibility/upstream-189-review.json), [kontrol](../compatibility/upstream-189-check.json), [örnek kapsam](../compatibility/coverage-189.json), [online kaynaklar](../compatibility/online-expansion-189.json).

1.8.8: 312 fixture/gerçek QuickJS testi. En son doğrulanan Nuvio sürümü **0.6.5-beta**; geliştirme dalı ilerlese de kilitli 23 dosyada drift yok. Kilit değiştirilmedi. [Upstream raporu](../compatibility/upstream-188-check.json), [yeni indirme dosyaları](../compatibility/download-expansion-188.json), [kapsam, baseline ve tekrarlar](../compatibility/coverage-188.json).

Uzantısız MKV için önceki eleme kararı gözden geçirildi: Nuvio iOS dosya gövdesini doğrudan yazar ve dosyayı MPV `loadfile` yoluna iletir. Nuvio'nun `.mp4` kayıt adı, dosyayı MP4'e dönüştürmez. Boyut/format ve gerçek video/ses denetimi geçen kaynaklar bu yola sınırlı olarak alınır. Resmî MPV masaüstü CI derlemesinde 1080p ve 4K MKV örnekleri `.mp4` adıyla tanındı ve bir kare çözüldü. Bu, fiziksel Nuvio/iPhone oynatma veya tam indirme kanıtı değildir.

1.8.4'te bir Fleabag 4K dosyasının ilk 1 MiB'ı masaüstü MPV'de bir kareyle sınandı; MP4 kayıt adı altında gerçek MKV/3840×1600 tanındı, EN-US ses ve TR-TR metin altyazı izi seçildi. Önceki 4 MiB örnek isteği zaman aşımına uğradı. Bu kısa, kesilmiş örnek tam dosya veya fiziksel Nuvio/altyazı senkronu testi değildir.

1.8.5, [Matroska dil kurallarını](https://www.matroska.org/technical/elements.html) uygular: eksik Language alanının eng varsayılanı ve BCP47 önceliği; açık bilinmeyen/boş veya kesik alanlar İngilizce sayılmaz. Masaüstü MPV küçük başlık örneklerinde ses izlerini tanıdı. Your Name 4K örneğinin ilk 1 MiB'ı Cluster'a ulaşmadığı için bir kare çözülemedi; bu, tam dosyanın bozuk olduğunu veya tam oynatımın sınandığını göstermez.

Üretilmiş JavaScript QuickJS WASM motorunda, Nuvio'nun API yüzeyine benzeyen köprüyle çalıştırılır. Bu test quickjs-kt JNI/Native köprüsünü veya fiziksel iPhone taşımasını çalıştırmaz. Fiziksel iPhone/Android, Kotlin derlemesi, tam film oynatma/indirme, offline altyazı ve sahne senkronu henüz sınanmadı.

Goojara için anonim public katalog çerezi yalnız kaynak keşfinde kullanılır. JavaScript elle yönlendirme yolunda farklı kökene geçmeden silinir; iOS otomatik yönlendirmesinin fiziksel başlık aktarımı sınanmadı. Video sonuçları katalog oturumu taşımaz.

Kaynak kontrolleri sabit kanonik metadata referanslarıyla gerçek public HTTP/Range ve altyazı yanıtlarını sınar; telefonun TMDB API anahtarı bu yöntemle sınanmaz. Tam katalog veya her kalitede dosya başarısı iddiası değildir.

[Yayın doğrulaması](../compatibility/github-publication.json) · [Önceki uyumluluk kayıtları](arsiv/UYUMLULUK_GECMISI.md).

1.8.8 yayımlandı: [Windows/Linux testleri](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40609766518) ve [Pages yayını](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40609766742) başarılı. Manifest, beş sağlayıcı dosyası ve kurulum sayfası public HTTP 200 döndü; SHA/byte karşılaştırmaları yerel paketle aynı. Kaynak commit: 4c824c1002600687eca10c88f92ce11fad15b38b.

1.8.9 yayımlandı: [Windows/Linux paket testleri](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/42894719311) ve [Pages yayını](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/42894717940) başarılı; yedi public dosya HTTP 200 ve yayındaki Git içerikleriyle eşleşti. Kaynak commit: bacb0f15723f2c080ad62f9f784ae907f1581f2c. Windows metin dosyalarındaki CRLF yalnız karşılaştırma için Git/Pages LF biçimine normalleştirildi.
