# 1.7.7 kaynak ve hız doğrulaması

## Kaynak katkısı

DiziBal'ın public öneri, yapım sayfası ve oynatıcı JSON akışı incelendi. Eşleşme tam ad/yıl/tür, kanonik sayfa ve tam sezon/bölümle yapılır. Türkçe katalog adları yalnız aynı TMDB kimliğinin çeviri kaydına bağlanır. Özel erişim kodu olan oynatıcılar ve farklı sunucuya yönelen kayıtlar kabul edilmez.

Gerçek HTTP kontrolünde Fleabag S1E1 için 1728×720 HLS + TR/EN VTT, Shameless S1E1 ve Death Note S1E1 için HLS + TR VTT bulundu. Matrix ve Inception'da 1728×720 HLS + TR/EN ses ve TR VTT vardı. Bazı tek kalite HLS listeleri piksel bilgisi vermedi; bilgi uydurulmadı. Bunlar online katkısıdır; indirilebilir dosya değildir. Tam oynatma veya sahne senkronu yapılmadı.

HDFilmDelisi ve DiziBal, yeni **Hızlı İzle** scraper'ında bağımsız çalışır. Eski üç kimlik korunur. Ana sağlayıcının PlayIMDb/VixSrc ve diğer online yolları kalır; HDFilmDelisi yeni gruba taşınır. Aynı iş iki grupta tekrarlanmaz. Manifestte yeni grup varsayılan açıktır; telefonda etkinleşmesi ayrıca kontrol edilmelidir.

## Bekleme düzeltmeleri

Kaynak keşif slotları video/altyazı kontrollerini beklemez. Bu kontroller mevcut ayrı kuyruk ve native kotalarını kullanır. Altyazı kataloğu 4,5 saniye bekler; yanıt vermeyen servise ek hash sorguları açılmaz. Sağlıklı boş katalog yanıtı hash aramasını engellemez. HDHub keşfinin kendi 8 saniyelik bütçesi vardır; bitmemiş native işin kotası erken bırakılmaz.

Hafif HLS okumasında ilk beş kaliteyle sınırlama kaldırıldı. Master zaten en fazla 16 varyantla sınırlıdır; ek child/segment isteği açılmadan sondaki mevcut 4K da korunur. Bu değişiklik yeni bir gerçek 4K film bulunduğu anlamına gelmez. Harici ses grubu varken izole video-only child sunulmaz.

## Kaynak ölçümleri

| Vaka | Önce tüm arama | Sonra ilk dolu grup | Sonra tüm gruplar | Farklı indirilebilir dosya |
| --- | --- | --- | --- | --- |
| Dune | 13,7 sn | 2,1 sn | 8,5 sn | 2 → 2 |
| Fleabag S1E1 | 12,3 sn | 1,4 sn | 5,0 sn | 2 → 2 |
| Shameless S1E1 | 9,5 sn | 1,7 sn | 2,8 sn | 0 → 0 |
| Death Note S1E1 | 10,5 sn | 2,3 sn | 3,2 sn | 4 → 4 |

Bu değerler ayrı canlı Node turlarının gözlemleridir; kontrollü hız testi veya fiziksel iPhone UI ölçümü değildir. TV ve son film kontrolleri ayrı turlardır. Matrix son kontrolde ilk dolu grubu 6,3, bütün grupları 6,7 saniyede verdi; indirme yoktu. Daha geniş 14 vaka turunda bazı aramalar 15–24 saniyeyi buldu ve Spider-Verse indirmesi boş kaldı. Bu olumsuz gözlemler raporda korunur; her arama hızlı veya kararlı oldu denmez.

## İndirme araştırması

Yeni genel MP4/MKV sağlayıcısı bu sürümde doğrulanmadı. FullHDFilmizlesene 403; FlixIndia satış sayfası; MoviesMod reklam yönlendirmesi; UHDMovies/Nkiri/FzMovies ağ hatası verdi. Streamflix'in public katalog/config yanıtı vardı, fakat dosya CDN'i çalışmadı; büyük katalog Range isteğini uygulamadı. Firebase 401 yanıtından sonra özel veri yolu zorlanmadı. Goojara ana sayfası, DiziFilm kataloğu ve topluluk manifestindeki format beyanı tek başına dosya kanıtı sayılmadı.

Öncelik hâlâ daha fazla sağlam film/dizi dosyası, farklı gerçek kaliteler ve uygun ses/altyazıdır. Yeni backend, hesap, gömülü üçüncü taraf anahtarı veya film başına üretim pini eklenmedi.

## Doğrulama

222 fixture/gerçek QuickJS testi geçti. Nuvio 0.6.5-beta release ağacındaki ilgili 20 blob önceki kilitle aynıydı; bu karşılaştırma incelendikten sonra kilidin release/head bilgileri güncellendi. Tekrar upstream doğrulaması geçti. Fiziksel iPhone/Android, Kotlin derlemesi, tam oynatma/indirme, offline TR/EN ve sahne senkronu yapılmadı.

[Kaynak ve performans raporu](../../compatibility/sources-and-performance-177.json), [son kontrol vakaları](../../compatibility/coverage-177.json), [release ağacı karşılaştırması](../../compatibility/upstream-177-release-audit.json), [upstream kontrolü](../../compatibility/upstream-177-check.json).
