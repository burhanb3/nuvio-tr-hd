# Sonraki işler

## 1.6.3 ve aktif kapsam hedefi

1. 1.6.3 gerçek küçük Dune/Spider-Verse/No Way Home ve geniş Archive/HDHub düzeltmeleri hazırlanıyor. Yerel128 test geçti. Son check, upstream, GitHub Windows/Linux ve Pages/public SHA tamamlanıp hafıza/yayın kanıtı güncellenmeli.
2. Hedef hâlâ açık: Matrix, Inception ve Fleabag S02E01/Shameless/GoT/Breaking Bad vakalarında indirilebilir dosya sıfır; Fleabag S01E01 99 MiB MKV+TR ile eklendi. No Way Home ve Spider-Verse’de ikinci kaliteli seçenek eksik. 14/14 online+TR olması hedefi tamamlamaz. Kapsam JSON’u gerçek eksikleri tutuyor.
3. Ses tercihi sorusuna yanıt gelirse uygula. Küçük Dune MKV Hintçe, No Way Home dosya adı Fransızca; özgün ses bilinmiyorsa varsayma. Şimdilik tüm seçenekler etiketli, mevcut boyut sırası korunuyor.
4. PC’de HLS’yi tamamlanmış gerçek MP4’e hazırlama prototipini araştır/test et. Portable FFmpeg resmi zip+SHA ile LocalAppData/NuvioTrHdTools/media-prototype altında; .cache/media-tools163.json sonucunu kontrol et. Dışarıdan erişim veya kalıcı servis kurulmadı. Public servis öncesi PC açık kalması, alan/bant kullanımı ve erişim tasarımı somutlaştırılmalı; kaynaklar/anahtarlar commit edilmemeli.
5. Archive TV’de kimlik/yıl eksikliğini zayıf ad eşleşmesiyle aşma. OpenSubtitles anonim hash araştırması örnek Fleabag’de sonuçsuz; arama sonucunu hash kanıtına dönüştürme. HDRezka challenge, StreamFlix izin reddi/dosya hatası, Pixel uzantısız MKV sınırları korunur.
6. Son aşama iPhone’da tam video + TR indirme, uçak modu ve senkron. Bu yapılmadan goal tamamlanamaz. Aynı Sites hesap sorusunu tekrarlama; köprü1.4 sürer.


7. Dar içerik pinlerini genişletmek için her yeni dosya/bölümde bağımsız kanonik örnek karşılaştırması ve gerçek Range/hash gerekir. Dune örneklerinde hız farkı var; yalnız başlangıç offset’iyle altyazı düzeldi deme. Fleabag S01E01 pinini tüm sezonun kimlik onayı sayma. compatibility/content-163.json ve tests/archive-pins.test.cjs kanıtları korunmalı.


## 1.6.2 öncelik

1. **Tamamlandı:** 1.6.2 5b298cd yayımlandı; yerel 114 test/QuickJS, Windows/Linux 40309193725 ve Pages 40309193727 başarılı. Beş public varlık HTTP 200 + yerel SHA eşit. Ana/anime kimlikleri ve ayarlar korunur; kaynak sorunu telefonda çözüldü sayılmaz.
2. iPhone’da yeni Tanı satırıyla gerçek ayarlar/anahtar varlığı ve sonuç alınmalı. Fleabag S01E01/Dune/Obsession telefon kontrolünden önce çözüldü deme. Sabit metadata testi gerçek TMDB API değildir; gerekirse yalnız online için HDHub/Archive geçici izolasyonu dene, varsayılanları sıfırlama.
3. Native iOS 60 saniye/iptal eksikliği/bekleyen işler kalan risktir. Plugin mantıksal bütçesi fiziksel garanti değildir. API erişimi ve HTTP durumları gizli veri içermeyen özetle ayrılmalı.
4. Küçük Dune dosyası, fiziksel tam oynatma/indirme, çevrimdışı altyazı ve senkron çözülmedi. Canlı Dune dosya CDN’i ağ hatası verdi; kimlik/konteyner/Range kontrollerini kaldırma. Büyük dosyalar kalsın.
5. Sites erişimi yok; aynı hesap sorusunu tekrarlama/yeni Site ile etrafından dolanma. Köprü 1.4 korunur.


## 1.6.1 öncelik

1. **Tamamlandı:** 1.6.1 e5824c9 yayımlandı; 107 test/QuickJS, Windows/Linux ve Pages başarılı. Manifest/sürümlü JS/legacy JS/sayfa HTTP200+yerel SHA eşit. Depoyu yenileyince ana+anime iki kayıt; kimlik/ayarlar korunur.
2. iPhone’da Dune online satırları, Shameless ABD/Fleabag kullanıcının gerçek S/E’si kontrol edilmeli; kullanıcıya üç scraper açık mı ve S/E soruldu, yanıt bekleniyor.
3. Küçük Dune indirmesi hâlâ çözülmedi. MoviesDrive/HubCloud küçük sayfalar TLS hatalı Worker/Pixel uçları verdi; metadata/büyük Range200 koşullarını gevşeterek ekleme. Büyük HDHub desteklenir.
4. Sites köprüsü get_site yineNOT_FOUND; mevcut kimlik korunur, yeni Site ile erişim engeli aşılmaz, kullanıcıya aynı hesap sorusu tekrarlanmaz.
5. Fiziksel iPhone/tam indirme/çevrimdışı/senkron, anime sezon mapping ve native Türkçe font düzeltmesi bekleyen işlerdir.

## 1.6.0 güncel öncelik

1. **Tamamlandı:** GitHub1.6.0 af89eda, Windows/Linux100 test ve Pages başarılı; manifest/üç scraper/sayfa HTTP200+yerel SHA eşit. Kanıt compatibility/github-publication.json. Mevcut eski scraper ayarları Dosyalar’da; yeni iki scraper varsayılan.
2. iPhone’da hızlı grup diğer taramalar sürerken gerçekten görünüyor mu, Death Note/AoT S01E01 MP4+TR tam indirme ve uçak modunu doğrula. Sabit referans metadata/QuickJS telefon testi değildir.
3. Küçük film/dizi dosyaları hâlâ eksik; Dune/GOT dosya aynaları26Ekim ağ hatası verdi. MoviesMod/DriveSeed uzantısız+Range200 MKV’yi korumayı kaldırarak ekleme. Yeni kaynakları gerçek dosya ile doğrula.
4. Anime sonraki sezon/mutlak bölüm eşlemesi yapılmadı; kanonik episode mapping olmadan tahmin ekleme. Yakılmış altyazı otomatik tanınmıyor; harici metin üst üste binebilir.
5. Nuvio iOS Türkçe font kapsamı uygulama tarafında çözülmeli; plugin font alanı yok. Gerçek OTF cmap ş/ğ/ı/İ ve büyüklerinde eksik glif doğruladı. Kullanıcının kurulu sürümü/görüntüsü doğrulanmadı; mevcut plugin font düzeltmesi diye sunma.
6. Sites çalışma alanına erişim gelmedi; mevcut köprü1.4 sürer, ayrı sesli HLS master korunur. Kullanıcıdan aynı hesap geçişini yeniden isteme.

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
