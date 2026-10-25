# Sonraki işler

## 1.5.0 güncel öncelik

1. **Tamamlandı:** GitHub Pages 1.5.0, 92/92 yerel check, Windows/Linux testleri ve Pages başarılı. Oturumsuz manifest/provider/sayfa SHA eşitliği compatibility/github-publication.json'da; kod commit'i 62bf0b31ae1a767cd63b442c3bbde113a4601dfb. Yeni Sites HLS servisi bu yayına dahil değildir.
2. Kullanıcı iPhone'da GOT/Fleabag bölüm taramasını ve kısa sıralı listeyi deneyecek. GOT 4,41 GiB ve Spider-Man küçük MP4/MKV için video+TR tam indirme/sonrasında uçak modu gerekiyor. Kaynak/QuickJS testini cihaz testi saymayın.
3. Fleabag indirilebilir dosya yok; Pixel404/link-generator HTML elendi. Dune'da en küçük yeni dosya 18,24 GiB; daha küçük ücretsiz doğrudan aynalar ana kapsam eksiği.
4. **Sites bekleyen iş:** kullanıcı şu an önceki çalışma alanına dönemiyor. appgprj_6ade5021d6b88191818ece53a5d5f1e0 aynı kimlikte korunur; yeni Site açmayın. Erişim geldiğinde source helper ile açın, src/ + hosting/worker.mjs 1.5 kodunu mevcut checkout'a aktarın, Worker ESM doğrula/paketle/yayımla. /hls/profile.m3u8 ses/altyazı grupları korunarak canlı test edilmeli. O zamana kadar capability gate kapalı; ayrı sesli HLS otomatik master olarak kalır.
5. Kaynak envanteri/araştırma raporu üzerinden yalnız gerçek erişilebilir ücretsiz/hesapsız kaynakları genişletin. Kopya sağlayıcı sayısını başarı sanmayın. Otomatik zaman senkronu hâlâ uygulanmadı; güvenilir referans/ses ölçümü gerekir.

Aşağıdaki 1.4.0 notları tarihsel bağlamdır.

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
