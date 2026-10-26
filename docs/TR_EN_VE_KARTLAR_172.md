# 1.7.2: tek kart düzeni ve TR/EN altyazılar

Her kart aynı sırayı kullanır: **kalite · boyut · ses · altyazı**. Nuvio mevcut `quality`, `size`, `language` alanlarını bu sırayla birleştirir; uygulamaya yeni bir arayüz alanı eklenmedi. Scraper kimlikleri ve kayıtlı sıralama ayarları değişmedi.

| Durum | Örnek açıklama |
| --- | --- |
| Ses ve iki altyazı dili mevcut | `1920×1080 ✓ · 1,80 GB · Ses: EN · TR/EN altyazı` |
| Türkçe altyazı mevcut | `1280×720 ✓ · 0,85 GB · Ses: EN/TR · TR altyazı` |
| Yalnız İngilizce altyazı mevcut | `1280×720 ✓ · 0,85 GB · Ses: EN · EN altyazı · TR altyazı yok` |
| Bilgiler eksik | `Kalite bilinmiyor · Boyut bilinmiyor · Ses: bilinmiyor · TR altyazı yok` |
| HLS boyut tahmini | `1280×720 HLS · ~0,95 GB · Ses: EN? · TR/EN altyazı` |

Örnekler temsilîdir. `EN/TR` ses bölümündeyse ses dilleridir; `TR/EN altyazı` bölümündeyse altyazı dilleridir. Eski **TR yok** etiketi artık **TR altyazı yok**. Kaynak adı kısadır; Animecix çeviri/redakte kredileri kart başlığını uzatmaz. Bilinmeyen ses İngilizce varsayılmaz.

## Birimler ve kanıt

- Bütün kart boyutları **GB**, iki ondalık ve Türkçe virgülle yazılır. 1 GB = 1.000.000.000 byte. Önceki MiB/GiB ile karıştırılmaz; dosyanın gerçek byte sayısı değişmez. Çok küçük pozitif değer `<0,01 GB` görünür.
- HLS tahmini `~`, tepe bitrate üst tahmini `≤~` ile ayrılır. Çoklu otomatik kalitede tek boyut çıkarılamıyorsa **Boyut değişken**; hiç bilgi yoksa **Boyut bilinmiyor** yazılır. HLS indirilebilir yapılmadı.
- Sesin yalnız kaynak/dosya adı iddiası olması `EN?` gibi belirtilir. Konteyner veya HLS ses listesi dili sade kodla gösterilir; konuşma dinlenerek doğrulandı denmez.
- Gerçek dosya pikseli `✓`, HLS listesi `HLS`, yalnız kaynak/isim tahmini `tahmini` ile ayrılır.
- `ES görüntüde` uyarısı korunur; İspanyolca ses diye yorumlanmaz.

## İngilizce altyazı nereden geliyor?

Yeni varsayılan English OpenSubtitles v3+ yolu, mevcut Türkçe servisleri ve resmî v3 yanıtıyla birlikte çalışır. Ayrıca DiziYou’nun videoya bağlı EN VTT’si, Animecix EN captions, Archive/dizin EN SRT/VTT ve kişisel JSON/Stremio EN kayıtları kabul edilir. Bulunabilen MKV/HLS gömülü TR/EN dilleri de kartta yer alabilir; her gömülü altyazı ayrı SRT dosyası demek değildir.

TR ve EN aynı eşleştirme motorunu kullanır: açık yanlış IMDb/TMDB/yıl/bölüm ve farklı kurgu reddedilir; hash, tam release, eşlenmiş kaynak, sürüm benzerliği, gerçek süre yakınlığı ve aynı film düzeyi alternatifler sıralanır. TMDB’den bilinen farklı dildeki kanonik adlar yalnız kimliği bağlı altyazı sorgusunda kullanılabilir; rastgele benzer ad kabul edilmez. Sentetik video adı tam release kanıtı değildir. Süre uyumu sahne senkronu değildir; otomatik zaman kaydırma yoktur.

Her dilde **en fazla dört** geçerli seçenek sunulur: toplam en fazla sekiz. TR önce gelir; EN, TR kontenjanını dolduramaz. Aynı gövdenin aynaları iki farklı dil seçeneği sayılmaz. Aynı URL açık farklı altyazı başlıklarıyla farklı dil gövdeleri veriyorsa ikisi de korunabilir. UTF-8 SRT/VTT gövdesi denetlenir; bozuk kodlama ve HTML/ZIP/ASS gibi desteklenmeyen dış dosyalar elenir.

**Türkçe zorunlu** ayarı yalnız İngilizceyle karşılanmaz. Varsayılan modda EN varsa video korunur ve `TR altyazı yok` açıkça yazılır. Native sonuçlarda dil kodları `tr` ve `en` olarak taşınır. Otomatik oynatma/indirme dili Nuvio’nun kullanıcı tercihine bağlıdır; telefon testi olmadan iki dilin birlikte çevrimdışı indirildiği söylenmez.

## İstek sınırları

Metadata sorguları ve aynı altyazının doğrulama kanıtı bir arama içinde paylaşılır. Gövde bir kez çözülür; biçim, son cue zamanı ve içerik parmak izi saklanır. Tam metin/byte gövdelerinin her biri bellekte tutulmaz ve her kalite için yeniden taranmaz. Otomatik aday bütçesi TR12/EN8; hash sorgusu dil başına en fazla üç farklı dosya içindir. Geçerli seçenek sayısı dil başına dörtte durur. Bilinen bir dilin eşlenmiş dosyası varsa otomatik arama yalnız eksik dil için sürer.

Gövde işlerinde ortak en fazla dört native fetch vardır. İngilizce bunun en fazla birini kullanır; yavaş EN işleri Türkçe için tüm kapasiteyi işgal edemez. Native timeout/iptal sınırı devam eder; bu, iPhone’un fiziksel dönüş süresi garantisi değildir.

## Doğrulama

168 fixture/gerçek QuickJS testi: TR/EN doğrulama ve sıralama, dört+dört kontenjan, yanlış kimlik/kurgu/bölüm, dil başlıkları, EN-only sıkı filtre, TR’nin EN zaman aşımında korunması, native istek sınırları, sabit kart alanları ve gerçek GB dönüşümü. Native0.6.4-beta parserında altyazı dil kodları ve liste yapısı, StreamFetchSupport’ta kalite/boyut/dil alanlarının sırası kaynak üzerinden kontrol edildi; ABI alanları değişmedi.

Canlı sabit TMDB referansı + sınırlı Node HTTP kontrolünde Dune, Fleabag S01E01 ve Death Note S01E01 için hem TR hem EN gövdeleri geldi. Dune’da iki ve Death Note’ta iki gerçek indirme dosyası vardı. Fleabag Archive dosyası ilk turda bir, tekrarda sıfırdı; Range/ağ zaman aşımı kanıtta korunur, giderildi denmez. Online TR/EN alternatifleri vardı.

Kanıt `compatibility/subtitles-and-cards-172.json` içindedir. Tam iPhone oynatma, video/iki altyazı birlikte indirme, uçak modu ve sesle sahne senkronu testi yapılmadı.
