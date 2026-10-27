# Sürüm notları

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
