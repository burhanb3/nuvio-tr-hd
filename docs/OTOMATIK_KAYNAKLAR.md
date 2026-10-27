# Kaynaklar ve arama akışı

## Yerleşik sağlayıcılar

| Sağlayıcı | Alan | Sonuç türü |
| --- | --- | --- |
| Internet Archive | Film/dizi | MP4/MKV; kimlik ve dosya kontrolüne bağlı |
| 4KHDHub / HubCloud | Film/dizi | MP4/MKV; public dosya zinciri |
| Waploaded | Film/dizi | MP4/MKV; son güncellenen kısmi katalog |
| PlayIMDb, VixSrc | Film/dizi | Online HLS |
| DiziYou, DiziBak | Dizi | Genellikle online HLS |
| FilmModu, HDFilmDelisi | Film | Dublaj/altyazılı online alternatifler |
| DiziBal | Film/dizi/anime | Dublaj/altyazılı online HLS |
| Animecix, SonAnime | Anime | Gerçek dosya seçenekleri |
| AniMOM, SeiCode / MP4Upload | Anime bölümleri | Ek, kısmi MP4 kaynakları |

Liste çalışan bütün katalog garantisi değildir. Kaynağın bir bölümde çalışması diğer bölümde çalışacağını göstermez. Yalnız embed sayfası, HTML hata yanıtı veya HLS bulunan sonuç yeni bir indirme dosyası sayılmaz.

## Seçimden sonuca

1. TMDB kimliğinden özgün ad, yıl, IMDb ve bölüm bilgisi alınır.
2. Uygun sağlayıcılar sınırlı paralellikle aranır. Türkçe katalog adı gerekiyorsa aynı TMDB kimliğinin TR/EN çeviri adları istenir.
3. Adaylar bulunur bulunmaz dosya/oynatma listesi kontrol kuyruğuna geçer. Bu kuyruk kaynak keşfini bekletmez.
4. MP4/MKV byte aralıkları ve konteyner başlığı okunur. HLS'de gerçek oynatma listesi ve mevcut kalite/dil izleri incelenir.
5. Mevcut TR/EN altyazılar kimlik, bölüm, sürüm, hash ve süreye göre eşleştirilir; gövdeleri doğrulanır.
6. Aynı dosya aynaları birleştirilir; kullanıcı sırası ve gruplamasına göre sunulur.

Hızlı İzle, HDFilmDelisi ve yeni DiziBal kaynaklarını bağımsız tarar; ana sağlayıcıda aynı işler tekrarlanmaz. Eski üç sağlayıcının kimlikleri korunur. Ana sağlayıcıdaki PlayIMDb/VixSrc ve diğer online yollar çalışmaya devam eder; HDFilmDelisi yeni Hızlı İzle grubuna taşınmıştır.

Nuvio her scraper tamamlandığında sonuçlarını birleştirir. Eklenti içinde hazır adayların korunması, Nuvio'ya satır satır canlı sonuç callback'i eklendiği anlamına gelmez.

## Kapsam ve sınırlar

720p/1080p/4K gibi bir kalite ancak kaynakta varsa sunulabilir. Dosya adındaki etiket, doğrulanmış piksel sayılmaz. HLS'de gerçek dosya boyutu yoktur; aktarım hesabı kullanılır. Ayrı ses grubu olan master'ın video parçasını tek başına sunup sesi kaybetmeyiz.

Yanlış film, yıl veya bölüm eşleşmesi kabul edilmez. Bir sağlayıcı bozulduğunda diğer geçerli sonuçlar korunur. Ücretsiz/hesapsız kaynaklar tercih edilir; torrent/magnet, ayrı ses birleştirme ve yeni kullanıcı sunucusu kurulumu bu projenin akışı değildir.

Kaynak testi, fiziksel telefonun tam oynatma/indirme ve offline senkron testi yerine geçmez. [Doğrulama](UYUMLULUK.md) · [Geliştirme](GELISTIRME.md).
