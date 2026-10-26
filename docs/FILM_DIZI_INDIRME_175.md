# 1.7.5 — film/dizi indirme kapsamı

Bu tur anime yerine ücretsiz ve hesapsız film/dizi MP4/MKV dosyalarına odaklanıldı. Yeni Waploaded adaptörü gerçek dosya alternatifleri ekler; genel kapsam hedefi tamamlanmadı.

## Yeni yol nasıl çalışır?

1. [Film](https://films.waploaded.com/sitemap/movie) veya [dizi](https://shows.waploaded.com/sitemap/series) için yayıncının küçük güncel listesi okunur. Normal arama denemeleri boş döndüğü için uygulama onları tekrar tekrar çağırmaz. Liste bir arşiv indeksi değildir; yalnız o listede olan yapımlar aranabilir.
2. URL başlığı yalnız ipucudur. Tam sayfada kanonik özgün ad ve yıl gerekir; açık IMDb çelişkisi reddedilir. Alternatif festival yılı yalnız TMDB `release_dates` içinden gelen yıl ve aynı açık IMDb ile kabul edilir. Dizi için üst kayıt, istenen sezon ve açık bölüm zinciri ayrı ayrı denetlenir.
3. Normal **Download Video** bağlantısı izlenir. Sayfanın verdiği kısa ömürlü bilet kendi indirme API'sine gönderilir; yanıt kendi kodlama anahtarını içerir. Hesap, sabit özel anahtar, challenge çözümü veya uzak kod çalıştırma kullanılmaz.
4. Yayıncı dosya adının son bölümünde gerçek `.mkv`/`.mp4` nokta uzantısını da kabul ediyor. Kaynak/imza yolu değiştirilmez. **Bu doğru adlı URL'nin kendisinden** sınırlı Range alınarak konteyner, toplam byte, gerçek piksel, süre ve mümkünse hash okunur. HTML, HLS, bozuk Range veya ağ hatası dosya sayılmaz. Yeni yol mevcut ad köprüsüne ihtiyaç duymaz.
5. Mevcut TR/EN keşfi ve sıralaması çalışır. Açık dilli kaynak SRT/VTT'si de aynı kimlik, biçim, süre ve tekilleştirme kontrollerinden geçer. Kaynakta SRT bulunması tek başına Türkçe veya senkron olduğu anlamına gelmez.

İndeks başarılı yanıtları aynı JS çalışma ömründe beş dakika tutulur; imzalı dosya adresleri bu önbelleğe konmaz. En fazla iki ilgili liste kaydı incelenir. Bulunmayan film/bölüm için tüm katalog gezilmez. Diğer sağlayıcıların kotaları ve online HLS davranışı korunur.

## Ölçülen örnekler

| Yapım | Gerçek dosya | Altyazı durumu |
| --- | --- | --- |
| Southland Tales | 421.697.346 byte, MKV, 1024×512, 8.682,751 saniye; hash `0a6c46f98bbaf195` | Dört TR SRT ve bir EN SRT; 35 puan, aynı film düzeyi. Senkron belirsiz. |
| Heartland S20E04 | 169.427.901 byte, MKV, 1024×512, 2.651,044 saniye; hash `d0ea16b14bb14ea3`; konteynerde EN ses | EN gömülü altyazı ve harici EN SRT; harici 69 puan/süre uyumu. TR bulunmadı. |

Southland Tales kaynakta 2006 olarak yazılmıştır; kanonik ana yıl 2007'dir. Canlı sağlayıcı denemesinde **sabit referans metadata** ve verilmiş 2006 festival tarihi kullanıldı. Bu test, telefonun güncel TMDB API yanıtında aynı festival tarihinin bulunduğunu doğrulamaz. Üretim kodu, kullanıcıdaki gerçek TMDB yanıtı bu yılı vermiyorsa alternatifi kabul etmez. Film dosyası, altyazı gövdeleri ve dizi dosyası gerçek HTTP ile kontrol edildi.

İzole ana sağlayıcı denemeleri yaklaşık 8,6 saniyede dosya/altyazı döndürdü. Bu ölçüm Node ağ taşımasıyladır; iPhone dönüş süresi garantisi değildir. Heartland S20E01'de dosya isteği zaman aşımına uğradı. Tekrarlı film kontrollerinde aynı dosya boyut/hash'i okundu; bu bütün hostların veya sezonun kararlı olduğu anlamına gelmez.

Diğer varsayılan ana sağlayıcılar açıkken de yeni dosya korundu: Southland denemesi 10,1 saniye, Heartland denemesi 11,2 saniye sürdü. İkisinde de online HLS alternatifleri vardı. Southland'da eski Archive dosyaları da kaldı; yeni 0,42 GB dosya daha küçük bir alternatif sağladı. Bu birleşik denemelerde dosya köprüsü kapalıydı. İndekslerin her biri 50 güncel kayıt içeriyordu; tam katalog taranmadı.

Mevcut genel ana sağlayıcı regresyonunda Dune: iki dosya ve TR; Fleabag S01E01: iki dosya ve TR fakat tek doğrulanmış piksel grubu; Shameless S01E01: indirme sıfır. Bu üç sonuç yeni Waploaded kapsamı olarak sayılmaz. Yeni kaynak Dune/Fleabag/Shameless açıklarını kapatmış sayılmamalıdır.

## Uyumluluk ve araştırmada elenen yollar

199 yerel test, üretilmiş sağlayıcının gerçek QuickJS testi dahil geçti. İkili bağlantı verisindeki NUL karakterinin testteki native `atob` aktarımında kesilmesi yakalandı; base64/XOR çözümü tamamen JS içinde tutuldu. Bu gözlem, fiziksel iPhone'da aynı hatanın ölçüldüğü anlamına gelmez. Tam ABI denetimi `upstream-175-check.json`: Nuvio 0.6.4-beta, güncel dalda kilitli 20 dosyada drift yok. Kilit değiştirilmedi.

- [PrimeSrc](https://github.com/itsmeadarsh2008/Streamline/blob/main/src/_shared/sources/misc.js): doğru film/dizi metadata ve host listeleri verdi, normal dosya-link çağrısı 403 verdi. Entegre edilmedi.
- [RogMovies yöntemi](https://github.com/itsmeadarsh2008/Streamline/blob/main/src/_shared/sources/indian.js): IMDb sorgusu başka IMDb'leri yaklaşık eşleştirdi; yanlış sonuçlar reddedildi.
- [Pixeldrain API](https://pixeldrain.com/api): public dosya uçları olsa da uzantısız MKV adlandırması mevcut köprüye ek destek gerektiriyor; üretime eklenmedi. Resmî API'nin izin/limit koşulları aşılmadı.
- FilmGo katalogları farklı boyutlar ilan etti, incelenen Firefiles dosyaları silinmişti; başka host bağlantısı ağ hatası verdi. TVShows örneği ücretli hostlara gitti. CTG public API yanıt vermedi. Bunlar çalışan kaynak artışı sayılmadı.
- Archive geniş başlık/IMDb araştırması yeni bağımsız kimlikli dosya sağlamadı; metadata ve Range kuralları gevşetilmedi.

Kanıtlar: [yeni kaynak ve araştırma](../compatibility/download-research-175.json), [mevcut kapsam kontrolü](../compatibility/coverage-175.json), [upstream](../compatibility/upstream-175-check.json).

**Fiziksel iPhone, tam oynatma, tam indirme, uçak modu, otomatik altyazı seçimi ve sahne senkronu test edilmedi.** Yeni sunucu/hesap veya manuel film/bölüm video pini eklenmedi. Ücretsiz dosya kaynağı kapsamını genişletme işi sürüyor.
