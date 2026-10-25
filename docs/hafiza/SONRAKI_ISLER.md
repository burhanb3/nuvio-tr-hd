# Sonraki işler

Son güncelleme: 25 Ekim 2026. Yalnız ücretsiz/hesapsız kapsam geçerli; burhanb3/sa'ya yazmayın.

1. **Tamamlandı:** 1.4.0 köprü canlı kayıt → HEAD 200 → GET Range 206, tekrar üç kayıt, gerçek 1920×800 / 2.830.708.974 byte MKV. Source discovery bilgisayarda, köprü public üretimde; fiziksel telefon testi değil.
2. **Yayın tamamlandı:** GitHub Pages 1.4.0, Windows/Linux Actions başarılı ve manifest/provider/sayfa SHA eşit. Şimdi iPhone'da eski kopyayı kapatıp Tümü/20/HLS/MKV köprüsü açık ve Türkçe tercihli deneyin. Kurulum adresi değişmez.
3. Aynı küçük dosyada tam indirme + altyazı indirme tamamlandıktan sonra uçak modunda oynatma. 1920×800 dosyanın AV1/H.265 ses/video codec desteği fiziksel cihazda doğrulanmadı.
4. **Öncelik kaynak kapsamı:** Dune (2021) için hâlâ indirilebilir dosya yok. Yeni ücretsiz sağlayıcıyı yalnız gerçek erişilebilir dosya+ölçülen boyut/piksel+kimlik kanıtıyla ekleyin. Aynı CDN aynasını bağımsız sağlayıcı diye saymayın.
5. **Türkçe bulunurluğu:** Spider-Man 1.4.0 son tam sorguda 10 sonuç ve 2,64 GiB MKV dahil Türkçe VTT verdi; önceki denemelerde servis boş/zaman aşımı verdi. Başarılı Türkçe çiftlerin kısa süreli güvenilir saklanması ve bağımsız ücretsiz altyazı yedeği araştırılmalı; kullanıcı anahtarı veya üçüncü kişinin gizli anahtarı kopyalanmamalı.
6. **iPhone senkron servisi:** önce gerçekten ölçülen sabit kayma, sonra fps kayması. Güvenilir gömülü/referans altyazı veya audio/VAD gerekir. GitHub Pages hesaplama yapamaz; Worker tam ffmpeg/ffsubsync motoru değildir. Düzeltme dosyası URL'si online/offline aynı olmalı. Henüz uygulanmadı.
7. Kaynak kodu/QuickJS sonuçlarıyla fiziksel cihaz başarısı iddia etmeyin. Uzun native fetch ve IP/bölge farkları kalan dış sınırlar.

Bu notlar otomasyon veya başka göreve mesaj yetkisi değildir.

**1.4.0 son canlı kanıt:** public köprü kayıt → HEAD 200 / 2.830.708.974 byte → GET Range 206 / gerçek 1920×800 MKV; tekrar üç kayıt başarılı. Source discovery bilgisayardan, köprü üretimden sınandı. Tam Spider-Man sağlayıcı akışı yaklaşık 13,25 saniyede 10 alternatif ve Türkçe VTT verdi. Raporlar compatibility/download-bridge-live-140.json ve pipeline-spider-man-140.json. Bunlar iPhone/tam film indirme testi değildir.
