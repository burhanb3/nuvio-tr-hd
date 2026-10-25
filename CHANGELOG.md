# Değişiklik günlüğü

## 1.3.0 — 25 Ekim 2026

- Dağıtım: Kullanıcı yeni `burhanb3/nuvio-tr-hd` GitHub deposunu istedi; sa deposuna yazılmadı. Eski Sites hesabına erişim kaybolduğundan Worker üretime yayımlanmadı. GitHub Pages sürümü kaynakları doğrudan arar; ortak servis kapalıdır. Aşağıdaki Worker/cache maddeleri hazırlanmış isteğe bağlı koddur, canlı özellik değildir.
- Doğrudan VixSrc master'ı gerçek HLS gövdesiyle doğrulanır. Format son eki Nuvio'nun native indirme filtresinin URL'yi HLS tanımasını sağlar; tek master içinde kalite/ses/altyazı grupları korunur. Ayrı profil sonuçları yalnız isteğe bağlı Worker yolundadır.
- Kullanıcının isteğiyle varsayılan çözünürlük filtresi Tümü, sonuç üst sınırı 20 oldu; 6/10 seçenekleri korunur. 40 aday için kota ayrılır.
- Her sonuç Online izlenebilir etiketli; doğrulanmış MP4/MKV ayrıca İndirilebilir, HLS İndirilemez olarak gösterilir. HLS kalite beyanı gerçek piksel doğrulamasıyla karıştırılmaz.
- Türkçe altyazı varsayılan olarak tercih edilir; altyazı servisi aksadığında doğrulanmış video gizlenmez. İsteğe bağlı sıkı politika ayrıca seçilebilir. Eski requireTurkishSubtitles anahtarı yerine subtitlePolicy kullanılır.
- Aynı Sites adresinde 13 saniye bütçeli public kaynak servisi, başarılı sonuçlar için en çok üç dakika önbellek, eşzamanlı sorgu birleştirme ve 24 saniyelik telefon bütçesi. Kişisel kaynaklar ve erişim bilgileri telefonda kalır. Boş yanıtlar önbelleğe alınmaz.
- VixSrc film adaptörü, videoyla eşlenmiş Türkçe VTT ve gerçek HLS çözünürlük profilleri eklendi. Küçük master playlist sunulur, video/audio segmentleri kaynakta kalır. Engelli DahmerMovies yerel yedeği varsayılan kapalı.
- Video kontrolü slotları altyazı beklemesinden ayrıldı; tamamlanan videolar süre sonunda korunur. Önceden eşlenmiş altyazı varsa önce o doğrulanır. Ortak hızlı taramada ek hash sorgusu seri bekleme oluşturmaz.
- Altyazı adlarında numara/sürüm/fps ipuçları; aynı gövdeli aynaların elenmesi. Yalnız başlık+yıl tam sürüm eşleşmesi sayılmaz.
- Kullanıcı iPhone'da küçük Spider-Man MP4'ünün üç Türkçe altyazıyla açıldığını, senkronun uygun göründüğünü bildirdi. Bu, geliştiricinin tam indirme/çevrimdışı veya yeni sürüm cihaz testi olarak işaretlenmedi.

## 1.2.0 — 25 Ekim 2026

- Kullanıcının iPhone'da Dune (2021) ve Spider-Man: Brand New Day aramasında uzun bekleme/boş liste bildirmesi üzerine gerçek kaynaklar yeniden sınandı.
- Nuvio `clearTimeout` çağrısının native beklemeyi iptal etmemesi ve quickjs-kt'nin bekleyen işleri tüketmesi nedeniyle oluşan uzun bekleme, en çok 100 ms native uyku bırakan ortak zamanlayıcıyla düzeltildi. QuickJS regresyon testi eklendi.
- Kaynaklar sonuç buldukça video kontrolü başlar; yavaş bir kaynağın diğer tüm çiftleri engellemesi giderildi. Toplam mantıksal bütçe 30 saniye; native ağ iptali hâlâ uygulamaya bağlı.
- Yanıt gövdelerine de zaman sınırı, 429 sonrasında köken bazlı geri çekilme, HEAD erişim reddi sonrasında gereksiz GET'i önleme eklendi.
- Türkçe sorgu video kontrolüyle örtüşür, servis JSON'una 9 saniye tanınır; başlık/hash sorgularının seri beklemesi giderildi.
- HLS çevrimiçi alternatifleri varsayılan açık; sıkıştırılmış oynatma listeleri metinden doğrulanır. Her HLS sonucu **Yalnızca oynatma** etiketlidir, dosya indirmesi sayılmaz. Eski kayıtlı kapalı ayar korunur.
- Kaynak/adet/HTTP durumlarından oluşan, URL/anahtar içermeyen isteğe bağlı tanı özeti ve film seçilebilen canlı test komutu eklendi. Kaynak kapsamı ve fiziksel iPhone testi sınırlamaları korunur.

## 1.1.1 — 25 Ekim 2026

- Sağlayıcı ayarına 6/10 alternatif seçimi eklendi; sonuç sayısının Nuvio sınırı olmadığı açıklandı.
- Doğrudan manifest bağlantısıyla kurulum ve adım adım geliştirme rehberi hazırlandı.
- GitHub girişi gerektirmeyen herkese açık Sites yayını tamamlandı; manifest, sağlayıcı ve kaynak ZIP'i oturumsuz erişim ve içerik eşitliğiyle doğrulandı.

## 1.1.0 — 25 Ekim 2026

- JSON/Stremio mimarisi korunarak otomatik DahmerMovies, Internet Archive ve PlayIMDb adaptörleri eklendi.
- Yerleşik Türkçe OpenSubtitles araması, gerçek dosya hash'i, sürüm ve süreye göre eşleştirme; en iyi altı video–altyazı alternatifi.
- Nuvio otomatik seçim/çevrimdışı kayıt yolu için `tr` ISO dil kodu; uzantısız ve `/sub.vtt/` uçları.
- Başlık/yılı aynı fragmanları süreyle eleme, kısmi büyük MP4 moov/track başlıklarından kalite okuma ve farklı CDN'lerde ETag kontrolü.
- Canlı sınırlı range/altyazı doğrulaması ve ayrı manuel GitHub Actions akışı. Fiziksel cihaz testi bekliyor.

## 1.0.0 — 25 Ekim 2026

- Nuvio KMP `scrapers` manifesti, tek dosya JavaScript paketi ve uygulama içi ayarlar.
- Kişisel JSON ve Stremio kaynak adaptörleri; TMDB/orijinal başlık/yıl ve dizi bölümü eşleştirmesi.
- MP4/MKV imza ve video boyutu incelemesi, HLS oynatma ayrımı.
- Türkçe harici SRT/VTT erişim ve gövde kontrolü; bozuk kaynak, redirect ve süre sınırları.
- Örnek veriler, Node/QuickJS testleri, GitHub Actions, Türkçe kurulum/uyumluluk rehberleri ve proje hafızası.
