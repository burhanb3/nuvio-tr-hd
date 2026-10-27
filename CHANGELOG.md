# Sürüm notları

## 1.8.6 — 28 Ekim 2026

- Archive, yıl alanı eksik kayıtları tam kanonik ad/yıl içeren arşiv kimliğinden de arar. Kayıt kimliği, gerçek dosya adı ve süre birlikte eşleşir; yanlış yıl, film ve koleksiyon kabul edilmez. Sorgu sayısı artırılmadı.
- Fury için 2,23 GB/1920×808 MKV'de TR/EN ses ve 838 MB/1141×480 küçük MP4 bulundu. Küçük dosyanın ses dili ayrıca doğrulanmadı. Her ikisinde mevcut Türkçe altyazı alternatifleri var.
- MoviesDrive'ın uygun ilk sezon sayfalarına bölüm desteği: arama ve sayfada aynı IMDb, kanonik ad/ilk yıl, sezon ve tam bölüm kontrol edilir. Stranger Things S1E1 için 1,03 GB 1080p; S1E2 için 469 MB 720p ve 905 MB 1080p MKV doğrulandı. Üçü de EN sesli ve harici TR altyazı seçenekli; Türkçe dublaj sayılmaz.
- 297 fixture/QuickJS testi ve Nuvio 0.6.5-beta/23 dosya kontrolü geçti. Önceki 4K ve dublaj örnekleri korundu; bu tur yeni 4K veya anime dosyası doğrulanmadı. Bazı dizi tekrarları kaynak sunucularında zaman aşımı verdi. Fiziksel telefon, tam indirme/oynatma ve senkron testi yapılmadı.


## 1.8.5 — 28 Ekim 2026

- Archive aramasında aynı TMDB kaydının özgün ve gösterim başlıkları birlikte kullanılır. Japonca özgün adla İngilizce kaynak adı arasındaki arama açığı giderildi; sorgu sayısı artırılmadı.
- Önceki sürümle karşılaştırılan üç anime filminde 12 ek MP4/MKV ve mevcut Türkçe altyazı alternatifleri; sekiz eski Archive dosyası da korundu. Your Name için 3,01 GB/3840×2160 ve 1,45 GB/1920×1080, Totoro için 0,91 GB/1920×1038, Spirited Away için 1,60 GB/1920×1080 MKV bulundu. Bu dört MKV'de Japonca ve İngilizce ses var.
- Sekiz ek MP4 farklı küçük/orta boyut seçenekleri sağlar; bunların ses dili ayrıca doğrulanmış sayılmaz. Dosya adındaki 1080p, gerçek 480p'nin yerine geçmez.
- Matroska'nın eksik Language alanındaki İngilizce varsayılanı ve BCP47 önceliği doğru okunur. Açık bilinmeyen veya kesilmiş dil bilgisi İngilizceye çevrilmez.
- Yalnız Hintçe ses taşıdığı dosyadan doğrulanan Archive kaynakları ve açıkça onlardan türetilmiş, sesi okunamayan dosyalar listeden çıkarılır. Gerçek EN/JA gibi başka sesi ölçülen türevler korunur.
- 288 fixture/QuickJS testi; Nuvio 0.6.5-beta ve 23 ilgili kaynak dosyası kontrolü geçti. Yeni Türkçe dublaj veya anime bölümü doğrulanmadı. Fiziksel cihaz, tam indirme/oynatma ve sahne senkronu test edilmedi.

## 1.8.4 — 27 Ekim 2026

- 4KHDHub'ın yayımladığı Pixeldrain bağlantıları film ve tam dizi bölümleri için aramaya alındı. Önceki FSL yolları korunur; yeni dosyalar için adlandırma servisi veya hesap gerekmez.
- Canlı kontrolde 15 ek MKV: Fleabag S01E01/S01E02/S02E01 için dokuz, Severance S01E01 için iki, Oppenheimer/The Dark Knight/John Wick için dört dosya. Bunların altısı gerçek 4K, 11'inde dosya içinde Türkçe metin altyazısı var; tümünde mevcut TR alternatifleri bulundu.
- Fleabag için yaklaşık 1,59–1,69 GB 1080p ve 2,92–3,89 GB 4K seçenekler. Kaynağın kalite adı yerine gerçek piksel gösterilir; başka bölüm, yanlış dosya ve yalnız HI sesli kayıtlar elenir.
- Hazır dosya kontrolü eski aynanın yanıtını beklemez. Kaynak/arama bütçeleri ve native iş kotaları artırılmadı. Nuvio'nun sonuçları scraper tamamlandığında göstermesi değişmedi.
- 276 fixture/QuickJS testi; Nuvio 0.6.5-beta ve 23 kilitli kaynak dosyasında değişiklik yok. Bir Fleabag 4K örneği masaüstü MPV'de bir kareyle açıldı ve gömülü TR izi seçildi.
- Bu tur yeni Türkçe dublaj veya anime dosyası doğrulanmadı. Fiziksel cihaz, tam indirme/oynatma ve bölüm boyunca altyazı senkronu test edilmedi.

## 1.8.3 — 27 Ekim 2026

- Archive aramasında Türkçe ve özgün adı birlikte taşıyan film sürümleri için daha iyi eşleştirme. Ayrı yıl alanı eksik olan HD kayıtlar, başlık/dosya yılı ve gerçek süreyle doğrulanır; yanlış kimlik ve yıl kabul edilmez.
- Canlı kontrolde dört filmde 12 ek MP4/MKV ve mevcut Türkçe altyazı alternatifleri. Altı MKV'de TR/EN ses izleri okundu. The Crow, The Eye ve Hotel Rwanda için yaklaşık 1,72–2,12 GB 1080p; The Bridge at Remagen için 720p/1080p büyük dosyalar bulundu.
- Yaklaşık 0,58–0,72 GB boyutunda altı küçük MP4 de bulundu. Bu dosyalarda ses dili ölçülemedi; doğrulanmış Türkçe dublaj sayısına dahil değiller. Dosya adındaki 1080p yerine gerçek 480p gösterilir.
- Önceki Inception 4K dosyası ve film/dizi/anime yolları korundu. Yeni sağlayıcı, sunucu, hesap veya kaynak başına video sabitlemesi eklenmedi; arama ve native iş kotaları artırılmadı.
- 269 fixture/QuickJS testi ve Nuvio 0.6.5-beta kaynak kontrolü geçti. Bazı tekrarlar ağ nedeniyle boş döndü. Bu tur yeni 4K veya bölüm dosyası doğrulanmadı; fiziksel cihaz, tam indirme ve altyazı senkronu test edilmedi.

## 1.8.2 — 27 Ekim 2026

- MoviesDrive/Pixeldrain üzerinden ek film ve anime filmi indirmeleri. Tam başlık/yıl, varsa IMDb, dosya adı, gerçek boyut, piksel, süre ve ses birlikte denetlenir; yalnız HI sesli dosyalar atlanır.
- Uzantısız MKV'ler için kontrollü MPV desteği. Nuvio `.mp4` adıyla kaydedebilir; gerçek format MKV olarak korunur. Önceki sürümde ad nedeniyle elenen bazı çalışan dosyalar artık değerlendirilebilir. Yeni sunucu veya hesap gerekmez.
- Canlı aramada altı yapımda dokuz ek MKV ve mevcut TR altyazılar. Inception için 3840×1598/7,59 GB ve 1920×800/2,50 GB; Dune için 0,57/0,95/2,07 GB alternatifler. No Way Home, Spider-Verse, Interstellar ve Your Name için de ek dosyalar bulundu.
- Kaynağın yüksek/düşük kalite seçenekleri aynı sınırlı bütçede aranır; aynı dosya iki kalite olarak sayılmaz. 4K ve 1080p MKV örnekleri `.mp4` adıyla masaüstü MPV'de bir kareyle sınandı.
- 261 fixture/QuickJS testi; Nuvio 0.6.5-beta ve incelenen 23 dosyada drift yok. Bir taramada eski dizi/anime kaynaklarında zaman aşımı oldu; sonraki kontrolde Fleabag ve Death Note dosyaları tekrar bulundu.
- Yeni Türkçe dublaj ve dizi bölümü dosyası bu tur doğrulanmadı. Fiziksel cihaz, tam indirme, offline altyazı ve sahne senkronu test edilmedi.

## 1.8.1 — 27 Ekim 2026

- Hızlı İzle grubuna Purstream online film/dizi alternatifi. Tam TMDB kimliği, tür, yıl ve resmi başlık; dizide istenen sezon/bölüm ve video yolu birlikte denetlenir.
- Kaynağın kalite etiketi yerine HLS içindeki gerçek çözünürlük ve dil izleri kullanılır. Mevcut TR/EN altyazı araması aynı akışla devam eder; HLS indirilebilir gösterilmez.
- Yeni kaynak ana dosya aramasına iş eklemez. Kaynak keşfi 5,5 saniye, Hızlı İzle toplamı 8 saniye mantıksal bütçeyle sınırlıdır; iPhone için fiziksel süre garantisi değildir.
- Canlı kontrolde No Way Home, Matrix, Fleabag S01E01/S02E01 ve Shameless S01E01 için beş ek 720p online seçenek ve mevcut TR altyazılar. Sesler EN/FR; altyazı bulunması tam senkron kanıtı değildir.
- 254 fixture/QuickJS testi ve Nuvio 0.6.5-beta sözleşme kontrolü geçti. Bu tur yeni indirilebilir 4K veya Türkçe dublaj dosyası eklenmedi. Çalışan bir 1080p MKV, Nuvio'nun uzantısız dosya adı sınırı nedeniyle entegrasyona alınmadı. Fiziksel cihaz, tam indirme ve senkron testi yapılmadı.

## 1.8.0 — 27 Ekim 2026

- Film ve dizi indirmeleri için HDRezka araması. Aynı IMDb, başlık/yıl ve tam bölüm denetlenir; ücretsiz özgün sesli MP4 seçenekleri mevcut TR/EN altyazılarla eşleştirilir.
- Gerekli olduğunda aynı TMDB kaydından alternatif başlık doğrulaması. Kaynak başlığı farklı diye benzer bir yapıma veya başka bölüme geçilmez.
- Ücretli kalite, reklamlı/camrip çeviri ve kısa örnek videolar atlanır. Kaynağın 1080p/4K etiketi gerçek piksel doğrulaması sayılmaz.
- Kapsam kontrolünde iki farklı kırpılmış 480p dosya artık iki ayrı kalite sayılmaz. Harici TR ve toplam altyazı sayıları ayrı tutulur.
- Canlı kontrolde sekiz film/bölümde 31 yeni MP4 varyantı ve mevcut TR altyazılar; yaklaşık 59 MB–3,07 GB, gerçek 240p–720p. Bir Dune tekrarı boş döndü; sonraki kontrolde eski ve yeni dosyalar yeniden bulundu.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 248 fixture/QuickJS testi geçti. Yeni indirilebilir 4K/TR dublaj bu tur doğrulanmadı; fiziksel cihaz, tam indirme ve senkron testi yapılmadı.

## 1.7.9 — 27 Ekim 2026

- Goojara genel film/dizi dosya araması. Tam başlık/yıl, film IMDb kimliği, seçilen sezon ve bölüm, oynatıcı dosya adı ve gerçek video süresi denetlenir. Yeni sunucu veya hesap gerekmez.
- Canlı taramada Dune, Into the Spider-Verse, Fleabag S01E01/S02E01, Game of Thrones S01E01 ve Breaking Bad S01E01 için ek MP4 ve mevcut Türkçe altyazılar. Dosyalar yaklaşık 94 MB–1,18 GB; kaynak değişkenliği sürüyor.
- Dosya adındaki 720p/1080p yerine gerçek piksel gösterilir. HCSubs gibi sabit altyazı işareti gizlenmez; dili uydurulmaz.
- Arama kaynağın public oturumuyla yapılır; kullanıcı hesabı veya çerezi istenmez. Katalog oturumu video bağlantısına eklenmez.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 238 fixture/QuickJS testi geçti.
- Yeni indirilebilir 4K veya TR dublaj kaynağı bu sürümde doğrulanmadı. Matrix/Shameless indirme açığı, fiziksel cihazda tam indirme/offline ve senkron kontrolleri açık.

## 1.7.8 — 27 Ekim 2026

- Eski ve az bulunan filmlerde küçük MP4 seçenekleri için RareFilmm araması. Tam başlık/yıl, makale ve oynatıcı kimliği/süre kontrolü; mevcut TR/EN altyazılarla aynı eşleştirme akışı.
- İndirme önceliği ayarı varsayılan açık. Küçük HLS satırları büyük dosyaları liste sınırının dışına itmez; boyut/kalite sırası her bölümün içinde korunur.
- Nuvio'nun gerçek dosya adı kuralıyla uzantı kontrolü. Query içine yazılan `.mkv` veya `.mp4`, yanlış kaydetme uzantısını gizleyemez.
- Görüntüye işlenmiş İngilizce altyazı için EN görüntüde etiketi. Bu yazılar harici altyazı gibi kapatılamaz.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 229 fixture/QuickJS testi geçti.
- Canlı kaynak kontrolünde üç filmde dokuz MP4; 0,15–0,98 GB. Genel dizi/anime, indirilebilir 4K ve TR dublaj açığı kapanmadı. Fiziksel cihaz, tam indirme ve senkron testi yapılmadı.

## 1.7.7 — 27 Ekim 2026

- Bağımsız **Hızlı İzle** sağlayıcısı. HDFilmDelisi buraya taşındı; yeni DiziBal film/dizi/anime desteği eklendi. Önceki üç sağlayıcı kimliği korunur, aynı kaynak iki grupta tekrar aranmaz.
- DiziBal'da gerçek TR/EN altyazılar ve uygun kaynaklarda TR/EN ses. Yerelleştirilmiş katalog adları, aynı TMDB kimliğinin çevirileriyle eşleştirilir.
- Kaynak keşfi dosya/altyazı kontrollerini beklemeden devam eder. Yanıt vermeyen altyazı kataloğuna ek hash sorgusu açılmaz; katalog isteği daha kısa bekler.
- HDHub zincirinde kaynak bütçesi; diğer sağlayıcıların ve devam eden gerçek dosya kontrollerinin bütçesi korunur.
- Hafif HLS okumasındaki ilk beş kalite sınırı kaldırıldı. Listenin devamındaki mevcut 4K seçenekler kaybolmaz; olmayan kalite üretilmez.
- README, kurulum, ayarlar ve sorun giderme belgeleri yenilendi; eski ayrıntılı kayıtlar arşive taşındı. Hata/kaynak önerisi formları ve katkı rehberi eklendi.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 222 fixture/QuickJS testi. Fiziksel cihaz, tam indirme/offline/senkron testi yapılmadı. Genel film/dizi indirme açığı sürüyor; bu sürümde yeni MP4/MKV sağlayıcısı doğrulanmadı.

## 1.7.6 — 27 Ekim 2026

- Daha sade kartlar; p ve piksel birlikte, destekli tek GB değeri, TR/EN öncelikli dil kodları ve beş dil/+N gösterimi.
- HDFilmDelisi Türkçe dublaj/çoklu ses kaynağı; HDHub MB/MiB sıralaması ve küçük/yüksek kalite/büyük sürüm seçimi.

## 1.7.5 — 27 Ekim 2026

- Waploaded'ın kısmi güncel film/dizi kataloğu ve public MP4/MKV dosya yolu eklendi.

## 1.7.4 — 27 Ekim 2026

- Bağımsız Ek Anime grubu; AniMOM ve SeiCode/MP4Upload kaynakları.
- Kısmi kataloglar, yanlış bölüme geçmeden mevcut dosyaları sunabilir.

## 1.7.3 — 26 Ekim 2026

- Büyük MP4 metadata kutuları ve ilk CDN adresinde kalan Range kontrolleri iyileştirildi.

## 1.7.2 — 26 Ekim 2026

- TR ile aynı kimlik/sürüm/gövde kontrollerinden geçen İngilizce altyazı desteği.
- Aynı gövdeli altyazı aynalarının birleştirilmesi ve dil başına alternatif sınırı.

## 1.7.0–1.7.1 — 26 Ekim 2026

- DiziYou, DiziBak, FilmModu ve SonAnime kaynakları; genel Archive bölüm araması.
- Gerçek dosya kontrolleri, ses kodları ve iPhone harici oynatıcı rehberi.

## Önceki sürümler

[Ayrıntılı sürüm ve araştırma kayıtları](docs/arsiv/SURUM_NOTLARI.md).
