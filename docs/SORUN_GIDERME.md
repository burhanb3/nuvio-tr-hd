# Uzun bekleme, boş kaynak veya eksik bilgi

## Güncelleme

1. Nuvio Pluginler bölümünde https://burhanb3.github.io/nuvio-tr-hd/manifest.json deposunu yenileyin; sağlayıcı 1.4.0 olmalı. Eski hayatimbitmiss Sites kopyasını kapatın.
2. Çözünürlük Tümü, sonuç sınırı 20, HLS açık, MKV dosya köprüsü açık, altyazı eşleştirme Dengeli, Türkçe bulunamazsa Videoyu göster seçin. Nuvio'nun altyazı dili Türkçe olmalı.
3. Filmi ve kaynak ekranını kapatıp yeniden arayın. Önceden kaydedilmiş ayarlar güncellemede korunabilir. Depoyu kaldırıp eklemek ayarları sıfırlayabilir.

## 1.4.0 neleri düzeltir?

- Public imzalı GET dosyasında HEAD 403 nedeniyle yanlış eleme giderildi. Normal engelli dosyalarda erişim zorlanmaz.
- Uzantısız gerçek R2 MKV, köprüyle .mkv adı alır. Köprü yoksa yanlış adla indirme vaat etmek yerine aday elenir.
- HLS'de gerçek liste profili ve bitrate × süre tahmini görünür. Dosya/konteyner bilgisi okunamazsa dosya adı yalnız tahmin diye sunulur; eksik bilgi uydurulmaz.
- Dengeli altyazı modunda aynı filme ait belirsiz alternatifler sunulur; bozuk bir altyazı geçerli diğerlerini düşürmez.
- Bulut IP'sinde kaynak sayfaları 403 verdiğinden arama varsayılan telefonda yapılır. Ortak tarama açılması önerilmez. Dosya köprüsü yalnız bulunan public dosyaya erişir.

## Sonucun anlamı

Online izlenebilir / İndirilebilir: gerçek MP4/MKV yapı ve erişim kontrolünden geçti. Tam film ve codec testi değildir. HLS / İndirilemez: yalnız online. TR bulunamadı: çalışan video var, doğrulanmış mevcut Türkçe SRT/VTT yok. Film düzeyi / senkron belirsiz: doğru film, sürüm zamanlaması kanıtlanmadı. Köprü 410: geçici kayıt/imza eskidi; yeniden kaynak arayın.

Dune (2021) için son bilgisayar taramasında TR HLS, indirilebilir dosya yok. Spider-Man 1.4.0 son tam sorguda 10 sonuç verdi; 2,64 GiB MKV dahil dosyalara Türkçe VTT bağlandı. Önceki Türkçe çağrıları boş/zaman aşımı verebildi. Bunlar kalıcı kaynak sözü veya fiziksel iPhone testi değildir.

## Bekleme sınırı

Ortak scheduler en çok 100 ms native uyku bırakır; Nuvio clearTimeout native sleep'i iptal etmez. Telefon JS mantıksal bütçesi 24 saniye. Başlamış native fetch/gövde okuması bu süreden uzun sürebilir; fiziksel iPhone süresi garanti edilmez. Tamamlanan videolar, altyazı takılırsa korunur.

Hata ayıklama özeti ayarı kaynak/adet/HTTP durumlarını URL veya anahtar olmadan günlüğe yazar. identity_unavailable: metadata; video_unavailable: dosya/playlist; subtitle_no_match: uygun eşleşme yok; subtitle_unavailable: SRT/VTT gövdesi alınamadı; deadline: süre doldu. Tam uygulama günlükleri hassas URL içerebilir, public paylaşmayın.

```powershell
npm run check
npm run verify:upstream
npm run test:live:bridge
npm run test:live:pipeline -- --film=dune
npm run test:live:pipeline -- --film=spider-man
```

Bu testler sınırlı video aralığı ve altyazı gövdesini okur; tam film indirmez. Sabit TMDB referansı kullanılan canlı test, canlı TMDB servisini doğrulamaz. iPhone'da tam indirme ve uçak modunda altyazı ayrıca sınanmalıdır.

**1.4.0 son canlı kanıt:** public köprü kayıt → HEAD 200 / 2.830.708.974 byte → GET Range 206 / gerçek 1920×800 MKV; tekrar üç kayıt başarılı. Source discovery bilgisayardan, köprü üretimden sınandı. Tam Spider-Man sağlayıcı akışı yaklaşık 13,25 saniyede 10 alternatif ve Türkçe VTT verdi. Raporlar compatibility/download-bridge-live-140.json ve pipeline-spider-man-140.json. Bunlar iPhone/tam film indirme testi değildir.
