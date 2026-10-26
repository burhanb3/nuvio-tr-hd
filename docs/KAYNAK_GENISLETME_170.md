# 1.7.0: genel kaynak taraması

Bu sürüm tek tek filmlere kayıt eklemek yerine sağlayıcıların genel arama yollarını genişletir. Önceki dosyalar ve ana/anime eklenti kimlikleri korunur. Yeni PC servisi, tünel, yardımcı backend veya hesap gereksinimi eklenmedi. Önceden isteğe bağlı kullanılan MKV ad köprüsü değişmedi; yeni sağlayıcılar ona bağımlı değildir.

## Ne eklendi?

| Sağlayıcı | Genel yöntem | Gerçekte sunabildiği |
| --- | --- | --- |
| DiziYou | Dizi adı + ilk yıl; JSON-LD bölüm ve sezon; yalnız gerçek video etiketi | Online HLS ve kaynağın eşlenmiş Türkçe VTT’si; varsa kaynağın TR dublaj seçeneği |
| DiziBak | Public WordPress metadata; ilk bölüm tarihi + kök dizi kategorisi + tam bölüm | Online HLS. `/embed/123.mp4` adresi HTML oynatıcıdır, indirme değildir |
| FilmModu | Arama/arama yönlendirmesi; özgün başlık + yıl; varsa altyazı yolundaki IMDb | Online HLS; varsa TR VTT ve kaynağın kendi dublaj seçeneği |
| SonAnime | Arama ve ayrıntıda aynı TMDB, kanonik ad/yıl; tam sezon ve bölüm | Gerçek MP4 adayları. Boyut/piksel konteynerden ölçülür |
| Archive genişletmesi | Film aramasına ek olarak genel dizi araması | Yalnız başlık/yıl veya kesin IMDb bağı ile dosya adında doğru bölüm; mevcut Range/format kontrolleri şart |

DiziBak’ta ilk bölümün public `date` alanının tam kanonik ilk yayın günüyle uyuşması istenir. Bu, kaynak metadata’sıyla tarih uyumudur; her yükleme tarihi yayın tarihi sayılmaz. Kök kategori ve tam bölüm de doğrulanır. Tarih farklı/eksikse kaynak atlanır. Anime kaynakları sırasız bölüm listelerinden tam sezon/bölümü seçer; mutlak bölüm tahmini yapmaz.

Animecix artık TMDB’nin verdiği kanonik ad karşılıklarını da tanır. Örneğin özgün ad Japonca, kaynak adı İngilizce olabilir. Aynı TMDB kimliği, yıl ve film/dizi türü hâlâ zorunludur. Başka bir animenin benzer adı yeterli değildir. Bunlar tüm anime ve bölümlerin erişilebilir olduğu anlamına gelmez.

## Doğruluk ve görünüm

- Ses: `EN/TR/JA` gibi kısa kodlar. `EN?` yalnız kaynağın/dosya adının iddiasıdır. `EN`, konteyner ses track’i veya HLS ses listesi bilgisidir; konuşulan dilin dinlenerek doğrulandığını söylemez.
- `ES görüntüde`, görüntüye işlenmiş İspanyolca altyazıdır; ES ses track’i anlamına gelmez. Üzerine Türkçe açıldığında iki yazı üst üste gelebilir.
- Önerilen sıralama özgün/TR/EN sese öncelik verebilir. Farklı sesli dosya silinmez. Kullanıcının boyut/kalite sırası korunur.
- Aynı gerçek hash/boyut/pikseldeki dosya aynaları tek satır olur; altyazıları birleştirilir. İki sağlayıcı aynı videoyu kullanıyorsa iki bağımsız indirme kazanımı sayılmaz.
- Aynı HLS çocuk adresine 480/720/1080 yazılmışsa bu çelişki üç ayrı kaliteye dönüştürülmez. Auto korunur. Uzun gerçek film listeleri 700.000 karaktere kadar, sınırlı biçimde kabul edilir.
- Gerçek piksel bilgisi bulunmadığında kaynak kalite iddiası hâlâ tahmindir. HLS aktarım tahmini dosya boyutu değildir. HLS her zaman online kalır.

## Altyazı

Yıl içermeyen ama doğru dizi/bölüme bağlı tam release adları daha güçlü eşleşir. Sağlayıcının ürettiği sentetik video adı tam release kanıtı olamaz. Yakın süreli alternatiflerde daha yakın bitiş süresi biraz öne çıkar; bu sahne senkronu ölçümü veya otomatik zaman kaydırma değildir.

Geçersiz UTF-8 ve `ÅŸ`, `Ä±` gibi bozuk kodlanmış dosyalar elenir; temiz alternatifler korunur. Eklenti uzak dosyayı yeniden yazmaz. Video ile çalışan TR dosyası, başka bir altyazı kaynağı takıldığında korunur. Arama içindeki aynı gövdeler ve metadata sorguları paylaşılır; kaynak kesin 401/403/404/410 döndürdüğünde aynı adres/başlık/metot tekrar zorlanmaz. 429 bekleme kuralı sürer. Yeni arama kaynakları yeniden değerlendirebilir; bozuk sonuç kalıcı saklanmaz.

Doğru `ş` harfinin farklı fontta görünmesi ayrı bir Nuvio iOS sorunudur. Bundled fontta bazı Türkçe glifler eksiktir. [Uygulama yaması](../patches/nuvio-ios-subtitle-font.patch) `0.6.4-beta` kaynağına uygulanabilir olarak kontrol edildi; Latin fontunu birincil, mevcut CJK font klasörünü yedek yapar. **Uygulama derlenmedi, telefona kurulmadı ve font düzeldi denemez.** Plugin ABI font seçimi veya ayrı ses URL’si taşımaz. Başka dublaj dosyasını filme otomatik birleştirmek bu sürümde yoktur.

## Verimlilik ve sınırlar

Mevcut kesin dosyaların metadata kontrolü genel Archive aramasıyla paralel başlar; yavaş arama eski dosyayı bekletmez. Yeni taramalar içerik türüne göre başlar: film sağlayıcısı diziye, anime sağlayıcısı normal diziye gereksiz istek yapmaz. Yeni online kaynak eklemek mevcut dosya kaynağının kotasını küçültmez. Toplam aday kabulü 40 ve eşzamanlı video probu 3 ile sınırlıdır. Altyazı temel ağ işleri için mevcut 4 istek sınırı korunur.

Bu, Nuvio’ya canlı satır ekleme ABI’si getirmez: sonuçlar çağrı bitince gösterilir. Native iOS fetch iptal eksikliği nedeniyle mantıksal bütçe fiziksel dönüş garantisi değildir. Önbellek ve paylaşım arama içindedir; Nuvio her aramada yeni JavaScript ortamı açarsa aramalar arası kalıcı önbellek varmış gibi sunulmaz.

## Araştırma ve doğrulama

Topluluk depoları yalnız endpoint/yanıt biçimi hakkında fikir edinmek için incelendi; sağlayıcı kodu kopyalanmadı. Gömülü özel API anahtarı, challenge çözme veya yeni decrypt/proxy servisi kullanılmadı. Canlı incelemede DiziYou’daki reklam MP4’leri, DiziBak’taki HTML `.mp4` ve hatalı HLS kalite çoğaltması özellikle ayırt edildi.

- [Anthology sağlayıcı envanteri](https://github.com/falsisdev/anthology)
- [DiziYou güncel alan adı çalışması](https://github.com/kratoskrator/diziyou-nuvio)
- [Türkçe sağlayıcı çalışmaları](https://github.com/ttuloglu/nuvio-tr-plugins)
- [All-in-One Nuvio](https://github.com/NuvioPlugin/All-in-One-Nuvio)
- [Nuvio iOS font kaynağı](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/iosApp/iosApp/Player/MPVPlayerBridge.swift)

Kaynak kanıtları `compatibility/source-expansion-170.json`, son kapsam `compatibility/coverage-170.json`, upstream kontrolü `compatibility/upstream-170-check.json` içindedir. Sabit TMDB referansı + canlı sınırlı HTTP testidir. Tam film indirme, fiziksel iPhone, uçak modu ve sahne/ses senkronu çalıştırılmadı. Her yapımda her kalite/indirme hedefi tamamlanmadı; sonraki araştırmanın ana önceliği normal film/diziler için farklı gerçek MP4/MKV sağlayıcılarıdır.
