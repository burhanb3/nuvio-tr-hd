# Değişiklik günlüğü

## 1.7.6 — 2026-10-27

- Sade kartlar: bilinmiyor/tahmini/? işaretleri ve geniş aralıklar yerine kanıta dayalı tek değer; tamamen dayanağı olmayan alan gizlenir. Ölçülen pikselin yanında nominal p; gerçek byte ölçümü öncelikli.
- TR/EN/FR/ES/DE öncelikli ses ve altyazı kodları, en fazla beş dil ve +N; HI en son. Gerçek HI-only sese EN eklenmez. TR altyazı yok açıklaması korunur.
- HDFilmDelisi public film adaptörü varsayılan açık; tam özgün başlık/yıl/IMDb ve sayfa kimliği. Dune/Matrix/No Way Home gerçek HLS listelerinde TR/EN ses ve TR altyazı izleri. Bu online katkıdır, yeni indirme kaynağı değildir.
- HDHub MB/MiB/GB/GiB sıralaması düzeltildi; aynı 12 sürümlük bütçede küçük/yüksek kalite/büyük adaylar birlikte incelenir. Yeni dosya boyut üst sınırı yok.
- 210 test/gerçek QuickJS; Nuvio 0.6.4-beta üzerinde 20 kilitli dosyada drift yok. Dune/Fleabag dosyaları korundu; Shameless S1E1 indirme0. Fiziksel cihaz/tam indirme/offline/senkron testi yok. [Ayrıntılar](docs/KARTLAR_VE_DUBLAJ_176.md).

- Aynı GitHub Pages adresinde yayımlandı; Windows/Linux CI ve altı public varlık HTTP200/yerelSHA kontrolü başarılı. Üç mevcut scraper kimliği korunur.

## 1.7.5 — 2026-10-27

- Yeni Waploaded film/dizi dosya adaptörü, ana sağlayıcıda varsayılan açık. Kapsam son güncellenen public listeyle sınırlı; tüm arşiv taranmış veya her yapım desteklenmiş sayılmaz.
- Tam ad/yıl, varsa açık IMDb, dizi üst kaydı ve tam sezon/bölüm denetimi. Alternatif film yılı yalnız kanonik release_dates ve aynı açık IMDb ile kullanılabilir.
- Public indirme düğmesinin geçici biletiyle gerçek MP4/MKV bağlantısı; doğru uzantılı adresin kendisi Range, konteyner, byte, piksel ve süreyle denetlenir. Yeni sunucu/hesap veya film başına pin yok.
- İkili bağlantı verisini native atob üzerinden geçirmeden JavaScript içinde çözme; QuickJS testindeki NUL kesilmesi giderildi. Yayıncının dosya sayacı bölüm aralığıyla karıştırılmaz.
- Southland Tales: 421.697.346 byte / 1024×512; TR ve EN SRT bulundu, senkron belirsiz. Heartland S20E04: 169.427.901 byte / 1024×512 / EN ses ve altyazı; TR yok. S20E01 ağ hatası verdi.
- 199 test/QuickJS ve güncel Nuvio 0.6.4-beta üzerinde kilitli 20 dosyada drift yok. Fiziksel iPhone, tam oynatma/indirme/offline/senkron testi yapılmadı. Film/dizi indirme açığı sürüyor.

- Aynı GitHub Pages adresine yayımlandı; Windows/Linux CI ve altı public varlığın HTTP200/SHA doğrulaması başarılı. Manifestte üç mevcut scraper kimliği korunur.

## 1.7.4 — 2026-10-27

- Çalışan birkaç seri/bölümü de değerlendiren kısmi kaynak yaklaşımı. AniMOM yeni bağımsız Ek Anime sağlayıcısında varsayılan açık; önceki iki kimlik/ayar korunur.
- Yeni SeiCode/MP4Upload adaptörü; tam TMDB/ad/yıl/ilk tarih, açık sezon/bölüm ve gerçek MP4. Yanlış bölüm/ilk bölüm fallback’i yok.
- Ek dosya kontrolleri tekli; başarısız dosya gereksiz altyazı isteği açmaz. Sağlam MP4’ün isteğe bağlı metadata hatasında korunması, bilinmeyen kalite/hash’i uydurmama.
- HLS kapalıyken DiziYou/FilmModu’nun gerçek MP4 seçenekleri yine taranır; HLS dosya sayılmaz.
- 189 test/QuickJS; canlı ek1080p/0,29GB ve EN altyazı örnekleri. Bazı bölüm/düğümler hâlâ başarısız; yeni canlı film/dizi dosya sağlayıcısı0. Fiziksel cihaz/tam indirme/offline/senkron yok.
- Aynı GitHub Pages adresinde üç scraper yayımlandı; Windows/Linux CI ve altı public varlığın HTTP200/SHA kontrolü başarılı.

## 1.7.3 — 2026-10-26

- Büyük MP4 metadata kutusunda gerçek kutu sınırına en fazla1ek256KiBRange ile piksel/süre okuma; isimden kalite doğrulaması yok.
- Sonraki metadata/hash aralıkları ilk byte’ı veren gerçek CDN adresinde kalır; boyut/URL/ETag denetimi sürer.
- İsteğe bağlı AniMOM/YourUpload anime adaptörü; kanonik ad/yıl/bölüm ve gerçek MP4/süre kontrolü. Tekil dosya+TR doğrulandı, birleşik kararsızlık nedeniyle varsayılan kapalı.
- 178 test/QuickJS; 20 upstream dosyada drift yok. Yeni varsayılan kararlı film/dizi kaynağı0; hesap/sunucu/pin eklenmedi. Fiziksel cihaz/tam indirme/offline/senkron yok.
- Aynı GitHub Pages adresinde yayımlandı; Windows/Linux CI ve beş public varlığın HTTP200/SHA kontrolü başarılı.

## 1.7.2 — 2026-10-26

- Her kartta kalite, GB, ses ve altyazı alanları; eksik bilgi için tutarlı yer tutucular. Türkçe virgüllü decimal GB; kısa ses kodları ve açık kaynak iddiası/tahmin etiketleri.
- TR yok → TR altyazı yok. TR/EN dış/gömülü altyazı dilleri, ses dillerinden ayrı gösterilir.
- EN OpenSubtitles v3+ ve eşlenmiş EN SRT/VTT; aynı kimlik/kurgu/yıl/bölüm/hash/release/süre ve gövde kontrolleri. Dil başına4 seçenek; Türkçe zorunluyu EN karşılamaz.
- Ortak altyazı native fetch limiti4, EN en fazla1; mevcut TR çiftini EN beklemesi silmez. Aynı URL için farklı açık altyazı başlıklarıyla iki dil desteklenir.
- 168 test/QuickJS; canlı TR+EN gövdeleri ve native alan sırası kontrolü. Fleabag Archive ağ arızası saklanmadı; fiziksel cihaz/tam indirme/offline/senkron yok.
- Aynı GitHub Pages adresinde yayımlandı; Windows/Linux CI ve beş public dosyanın HTTP200/SHA kontrolü başarılı.


## 1.7.1 — 2026-10-26

- Dosya kontrolünde ayrı HEAD kaldırıldı; Range GET gerçek format/boyut/piksel kontrolü sürer. Native bitmemiş dosya fetch kotası3; altyazı kotası ayrı4.
- Kaynak dosya adı MP4 ise uzantısız aday opsiyonel MKV köprüsünü beklemez; gerçek MKV/HTML/HLS reddi sürer.
- Genel indirme sağlayıcısı araştırma raporu: bu tur yeni çalışan sağlayıcı doğrulanmadı. Hesap, yardımcı servis, anahtar kopyalama veya yeni manuel video pini yok.
- Mevcut Nuvio iOS VLC/font seçimi rehberi; dahili Nuvio fontu değişmedi, telefon/offline aktarım testi yok.
- 156 test/gerçek QuickJS; upstream20kilitli dosya kontrolü; sınırlı canlı dosya/altyazı kontrolleri ayrı kanıtlanır.


## 1.7.0 — 2026-10-26

- DiziYou/DiziBak/FilmModu/SonAnime genel kaynak taramaları; kanonik anime ad karşılıkları ve genel Archive TV dosya araması. Yeni manuel video pini veya yardımcı sunucu yok.
- EN/TR/JA ses kodları ve kaynak iddiasında ?; önerilen seste özgün/TR/EN tercihi, kullanıcı boyut/kalite sırası korunur. Aynı hash/boyut dosyalar tek satırdır.
- Reklam MP4 ve HTML .mp4 oynatıcıları video sayılmaz; çelişen aynı HLS URL kaliteleri tek Auto; sınırlı uzun HLS listeleri desteklenir.
- Yılsız tam TV release eşlemesi, yakın süre tahmin sırası ve bozuk Türkçe kodlamalı altyazıyı eleme. Aynı aramada kesin 401/403/404/410 tekrar zorlanmaz; geçerli sonuçlar korunur.
- 153 test/QuickJS; iOS font yaması uygulanabilirlik kontrolü, cihaz derleme/kurulum yok. Normal film/dizi indirme ve fiziksel offline/senkron hedefi açık.


## 1.6.4 — 26 Ekim 2026

- Breaking Bad S01E01, Inception ve Fleabag S01E01 MP4 türevi için dar içerik pinleri; gerçek metadata/hash/boyut/piksel/süre şart. Diğer bölümlere taşınmaz.
- Fleabag S02E01 küçük MP4/MKV: görüntüye işlenmiş İspanyolca altyazı açık etiketli, temiz TR hedefine sayılmaz; önerilende temiz online önce.
- Geçerli hızlı altyazı yavaş servis veya takılan komşu gövdeyi beklemeden korunur; daha güçlü sonuçlar sonradan birleşir, aynı içerik tekrarlanmaz. Dört altyazı gövdesi/native fetch sınırı mantıksal timeout ile erken bırakılmaz.
- 14 vaka: 11 küçük indirme+TR, 10 bilinen yabancı sabit altyazısız küçük indirme+TR; 6 kaynak ölçütü. Matrix/GoT/Shameless ve ek kaliteler eksik.
- Tekrarlanabilir görüntü karşılaştırma aracı, örnek izolasyonu, sabit/karanlık görüntü reddi ve hassas zaman/letterbox normalizasyonu; 140 test/QuickJS. Fiziksel cihaz/tam indirme/çevrimdışı/senkron çalıştırılmadı.

## 1.6.3 — 26 Ekim 2026

- 14 film/dizi vakası için sabit kanonik metadata + canlı kaynak/altyazı kapsam ölçümü. Küçük indirme+TR 3/14’ten 8/14’e çıktı; bütün kaynak ölçütleri 5/14. Hedef tamamlanmadı; diğer normal diziler, Matrix/Inception ve ek Spider-Man kaliteleri eksik.
- Dune tarih çelişkisi ve Fleabag S01E01 eksik metadata’sı, bağımsız görüntü örnekleriyle dar dosya eşlemesine bağlandı. Her kullanımda metadata SHA-1/boyut, gerçek Range hash’i/piksel/süre şart; başka bölüm/kimliğe taşınmaz. Görüntü kimliği altyazı senkronu sayılmaz.
- Archive eksik yıl alanında kesin başlık/yıl, dosya adı/yıl ve gerçek süre doğrulaması; daha ilgili kayıtlar, aşamalı adaylar ve resmi doğrudan dosya kopyaları. Açık kimlik/yıl çelişkisi, 401/403/429 ve yanlış Range/format kontrolleri korunur.
- HDHub uzantısız gösterim başlığı, bilinen koleksiyon etiketi ve TMDB’de doğrulanmış gösterim yılı desteği. Host uzantısı gerçek format doğrulaması sayılmaz.
- MP4/MKV ses track dilleri; yalnız dosya adı ses ipucu tahmini. Mevcut sıralama korunur. Farklı ses, senkron veya fiziksel cihaz başarısı gizlenmez.
- 128 test/QuickJS; kapsam JSON ve Türkçe rehber. HLS doğrudan indirme yapılmadı; yeni servis yayımlanmadı. Tam film/telefon/çevrimdışı/senkron testleri çalıştırılmadı.


## 1.6.2 — 26 Ekim 2026

- Obsession’da TMDB genel gösterim yılı ile doğru IMDb’ye bağlı dosyanın festival yılı farkından kaynaklanan yanlış eleme giderildi. Yalnız TMDB’nin aynı film için doğruladığı yakın gösterim yılları kabul edilir; farklı kimlik/başlık/yıl reddi korunur. Altyazıda ek kimlik kontrolü vardır.
- PlayIMDb/VixSrc HLS aramasında ek profil/parça ölçümleri varsayılan kapalı; doğrulanan master korunur ve VixSrc master tekrar indirilmez. Ses/altyazı grupları korunur. Bitrate × TMDB süre tahmini gerçek dosya ölçümü veya altyazı süre uyumu sayılmaz. MP4/MKV doğrulaması gevşetilmedi.
- HDHub erken ayna sayacı sonraki release’leri durdurmaz; en çok 12 release, ikili çözümleme. Büyük dosyaya boyut tavanı yoktur; küçük Dune indirmesi hâlâ doğrulanmadı.
- Kimlik sorgusuna en çok 10 saniye mantıksal süre; ağ gerektirmeyen sürüm/ayar/anahtar varlığı Tanı satırı ve anahtar/URL içermeyen boş sonuç tanısı. Telefonda ortak boş sonuç kök nedeni henüz kesinleşmedi.
- HTTP ve arama zamanlayıcıları aynı anda dolarsa tamamlanan videolar korunurken süre sonu nedeni doğru raporlanır. Linux CI bu tanı yarışını yakaladı; sonuçlar başarılı diye yanlış sayılmaz.
- Kullanıcı 1.6.1’i iPhone’da gördüğünü doğruladı. Sabit TMDB referanslı canlı kaynak kontrolü telefonun TMDB API çağrısını sınamaz; fiziksel iPhone/tam oynatma/indirme/senkron testi yapılmadı.


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
