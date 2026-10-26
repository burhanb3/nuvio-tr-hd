# Değişiklik günlüğü

## 1.6.1 — 26 Ekim 2026

- Yayın tamamlandı: e5824c9, yerel 107/107, Windows/Linux ve Pages başarılı; manifest/sürümlü JS/legacy JS/sayfa HTTP200 ve yerel SHA eşit. Kod URL’sindeki sürüm parametresi eski JS önbelleğini azaltır; ana scraper kimliği değişmez.

- 1.6.0 geçiş sorunu giderildi: eski ana scraper ID yeniden online HLS+doğrulanmış MP4/MKV’yi birlikte getirir. Yeni online scraper’a/ayrı filtreye bağımlılık kaldırıldı; manifest ana+anime olarak iki kayıt. Eski online JS yolu uyumluluk için korunur.
- Shameless doğru IMDb/S01E01 olsa da untouchables- gibi grup öneki nedeniyle eleniyordu. Kanonik seri klasörü+dosyada tam başlık+kesin bölüm bağı korunarak düzeltildi; farklı başlık/bölüm ve sample reddi.
- Archive daha çok arama sonucu, küçük türevler ve HD asıllar birlikte; metadatası eksik sürenin gerçek konteynerde doğrulanması. MP4 kuyruk moov süresi, yalnız ses ve kısa video reddi, IMDb önek eşleşmesi hatasının giderilmesi.
- Büyük dosya desteği korunur. Küçük Dune sayfaları bulundu; çalışan yeni dosya doğrulanmadı, varsayılan kaynağa eklendi diye sunulmadı. Mevcut Sites köprüsü erişimi hâlâ NOT_FOUND; kimlik korunur.
- Canlı sabit referans kontrolü: Dune: 10, Fleabag S01E01 10, Shameless ABD S01E01 7 online/TR. Fixture/QuickJS107 test. Fiziksel cihaz/tam oynatma/indirme/senkron yok.

## 1.6.0 — 26 Ekim 2026

- Tek manifestte üç bağımsız scraper: Hızlı kaynaklar, Dosyalar, Anime. Native tamamlanma birleştirmesiyle erken grup sonucu; aynı scraper içinde satır akışı iddiası yok. Eski kimlik/kişisel ayarlar Dosyalar için korunur; yeni scraper ayarları ayrıdır.
- Animecix/Tau MP4: TMDB+özgün başlık+yıl, doğru title ID ve tam sezon/bölüm bağı; çelişkili kimlik ve tahmini mutlak bölüm reddi. Gerçek konteyner/byte/piksel kontrolü, mevcut TR SRT/VTT eşleştirme.
- HDHub bağlantısı çözülürken dosya doğrulaması; bozuk küçük aynalar sonrası en çok 12 release; dosya sayfasında 120 release’e kadar küçükten büyüğe önseçim.
- MKV gerçek Türkçe altyazı track dili/codec algılama; TR içi etiketi, sıkı altyazı filtresinde koruma ve önerilen sırada puan.
- Altyazı gövdesi arama başına bir kez UTF-8 çözülür; ilk üç farklı hash sorgusuyla istek patlaması sınırlanır. Metinsiz/adressiz karakter tanısı sayaçları.
- iOS 0.6.4-beta font seçimi CJK olarak doğrulandı; gerçek font cmap tablosunda ş/Ş/ğ/Ğ/ı/İ glifleri eksik. Plugin font/offset alanı yok; font sorunu giderilmiş sayılmadı. MoviesMod/DriveSeed/MoviesDrive araştırması; uygun olmayan Range/kimlik/ad koşulları üretime alınmadı.
- 20 dosyalık upstream kilidi gözle incelenerek genişletildi; StreamsRepository bağımsız tamamlama kanıtı eklendi. Üç paket gerçek QuickJS’te sınanır. Fiziksel cihaz/tam oynatma/indirme/senkron testi yapılmadı.
- Yayın tamamlandı: af89eda kodu, yerel100/100, Windows/Linux Actions ve Pages başarılı; manifest/üç sağlayıcı/sayfa HTTP200 ve yerel SHA eşit.

## 1.5.0 — 25 Ekim 2026

- TV kapsamı düzeltildi: VixSrc bölüm rotası, PlayIMDb doğru IMDb+tam bölüm ile yıl içermeyen dizi release'leri. Native desteklenen show/other türleri güvenli TV normalizasyonuna eklendi.
- HDHub TV JSON-LD adı/yılı + TMDB posteriyle bağlama, tek bölüm seçimi, paket eleme. Büyük bölüm sayfası için en çok 1.000.000 karakter; native 1 MiB sınırı büyütülmedi.
- Public .mkv/.mp4 Worker dosya terminalleri ve GET-only erişim; literal dosya adı boşlukları güvenli kodlanır. İlk küçük aynalar ölüyse sonraki sınırlı grup denenir.
- Hesapsız AltyazıDB Türkçe SRT eklendi; dizi S/E kontrolü, sürüm notunu tam sürüm kanıtı saymama, bozuk ilk dosyalardan sonra geçerli alternatifleri deneme.
- Kısa native kart başlığı, ayrı piksel/boyut/TR alanları; varsayılan küçükten büyüğe, kalite/önerilen sıralama ve tür/sağlayıcı/kalite gruplaması ayarları.
- Sesi birlikte gelen HLS her kaliteye ayrı satır ve ayrı boyut tahmini; ortalama bitrate veya üç geçerli HEAD parça örneği, yoksa açık tepe bitrate üst tahmini. Geniş otomatik kalite aralıkları gösterilmez.
- Ayrı ses/altyazı gruplarını koruyan stateless HLS master servisi hazır, **yayımlanmadı**. Mevcut Sites projesi hesap/çalışma alanı değişiminden sonra NOT_FOUND; kullanıcı şu an dönemiyor. Yetenek kontrolü yeni yolu kapalı tutar; ayrı sesli master otomatik kalır. Var olan dosya köprüsü değiştirilmedi.
- Dokuz depo/221 tanım/134 normalize kimlik envanteri, seçilmiş kod ve canlı endpoint incelemesi. Her kayıt çalışan bağımsız sağlayıcı sayılmadı. Fiziksel cihaz/tam video testleri yapılmadı.


## 1.4.0 — 25 Ekim 2026

- Yalnız ücretsiz/hesapsız kapsam. HDHub/HubCloud public FSL → R2 adaptörü, TMDB/özgün başlık/yıl doğrulaması ve üç küçük aday önceliği.
- Presigned GET bağlantısında HEAD 403 yüzünden yanlış eleme giderildi; sınırlı GET Range ile gerçek konteyner/boyut/piksel okunur.
- Ayrı public dosya köprüsü, uzantısız doğrulanmış MKV/MP4 için doğru adlı yönlendirme, yerel HEAD metadata ve süreli kayıt. Tam video barındırılmaz.
- Bulut sağlayıcı sayfalarında 403 görüldü; arama telefonda kalır. Public dosya URL’si ve kanonik metadata köprüye gider; kişisel katalog/anahtar gönderilmez.
- HLS çözünürlük profilleri ve bitrate × süre yaklaşık aktarım boyutu; açık kanıt/tahmin ayrımı, HLS indirilemez.
- Dengeli altyazı varsayılanı aynı filmden belirsiz alternatifleri de sunar; yanlış film/yıl/kurgu korunur. Bozuk altyazı diğer geçerli seçenekleri çökertmez.
- Otomatik zaman kaydırması uygulanmadı. iOS AutoSync ve plugin offset alanı yok; fiziksel telefon/tam film indirme testi henüz yapılmadı.
- Yeni fixture, köprü kayıt/yönlendirme, HLS metadata testleri; Türkçe rehber ve hafıza güncellemesi.


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
