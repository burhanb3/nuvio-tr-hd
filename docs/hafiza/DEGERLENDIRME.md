# Nuvio TR HD: kapsam ve sağlayıcı karşılaştırması

Değerlendirme tarihi: 28 Ekim 2026. Ürün sürümü: 1.8.8.

Nuvio TR HD'nin dosya doğrulama ve eşleştirme temeli gelişti. Buna karşılık, rastgele seçilen film, dizi ve anime için farklı boyutlarda indirilebilir, uygun sesli ve Türkçe altyazılı seçenek bulma hedefi henüz tamamlanmadı. Kaynak sayısı, test sayısı veya sürüm sayısı üzerinden bir tamamlanma yüzdesi hesaplanamaz.

## İncelemenin kapsamı

GitHub aramasında bulunan depolardan 21 erişilebilir manifest okundu; toplam 466 manifest girdisi görüldü. Bu sayı bağımsız ve çalışan 466 kaynak değildir: ortak sağlayıcılar, canlı TV, katalog dışı araçlar ve arşivlenmiş depo da vardır. Eski React Native kurulum anlatımları güncel Kotlin Multiplatform ABI kanıtı sayılmadı.

11 seçili sağlayıcı dosyası; ayrıca Streamline test dosyası, NiakVIO doğrulama belgesi ve paket komutları statik olarak incelendi. Üç eski/alternatif depo yolunda ve Dublaj Filtresi'nin denenen kök yollarında manifest/README alınamadı; bu durum bütün depoların çalışmadığı anlamına gelmez. Bütün GitHub depolarının bulunduğu veya bütün sağlayıcıların çalıştırıldığı iddia edilmez.

Rakip kodu çalıştırılmadı, projeye kopyalanmadı. Aynı yapım listesiyle eş zamanlı canlı başarı/hız karşılaştırması ve telefon testi yapılmadı. Buradaki üstünlük değerlendirmeleri okunan kod davranışlarıyla sınırlıdır. Salt manifestte MP4/MKV/4K yazması indirme veya oynatma kanıtı sayılmaz.

## Bizim mevcut durumumuz

- Yayındaki sürüm 1.8.8. Windows/Linux CI, Pages ve yedi public varlığın HTTP/SHA kontrolü başarılı: [yayın kaydı](../../compatibility/github-publication.json).
- Son tamamlanmış ürün kontrolü 312 fixture/QuickJS testi. Son upstream kontrolü Nuvio Mobile Full 0.6.5-beta; izlenen 23 dosyada değişim yok: [uyumluluk](../UYUMLULUK.md).
- Manifestteki dört girdi dört çalışma grubudur. İçeride 19 yerleşik kaynak bağlayıcısı vardır: yedi dosya, sekiz online, dört anime. JSON, Stremio ve dizin bağlayıcıları ek yollardır. Bir sağlayıcının etkin olması bütün kataloğunun çalıştığı anlamına gelmez.
- Kanonik doğrulama listesi 37 giriş içerir: 23 film ve 14 bölüm. Japonca/anime işaretli dört giriş bu sayılarla örtüşür; ayrıca 37 bağımsız yapım veya rastgele katalog örneklemi değildir.
- Kaynak kimliği TMDB/IMDb, özgün/resmî alternatif ad, yıl ve tam sezon/bölüm üzerinden bağlanır. Gerçek dosyada uygun olduğunda byte, konteyner, piksel, süre, hash ve ses izleri okunur.
- HLS online olarak tutulur; dosya indirilebilir diye gösterilmez. Türkçe/İngilizce mevcut altyazılar ayrıca bulunup sıralanır. Altyazı servisi bozulduğunda varsayılan davranış geçerli videoyu korur.
- Kalite ve boyutun tamamı ölçülmüş değildir. Kartlarda bazı bilgiler dosyadan/oynatma listesinden gelir, bazıları kaynak etiketi veya bitrate/süre modelinden üretilir. Kullanıcı kartında “tahmini” yazmaması bunları ölçülmüş veriye dönüştürmez. Dahili kanıt türleri korunur.
- Önbellekler ağırlıkla aynı arama içindeki tekrarı azaltır. Ayrı Nuvio aramaları arasında kalıcı, garantili TTL önbelleği doğrulanmış değildir.
- Yeni kullanıcı bilgisayarı/sunucusu gerekmez; fakat bütünüyle harici servissiz değildir. Eski bazı MKV adlandırma/HLS profili yollarında mevcut Sites köprüsü kullanılır. Yeni Pixeldrain dosya yolları bunu gerektirmez; metadata, kaynak ve altyazı servisleri de harici bağımlılıklardır.

Son ilerlemenin somut örnekleri:

| Örnek | Doğrulanmış ilerleme | Açık kalan |
| --- | --- | --- |
| The Dark Knight | 17,72 GB gerçek 3840×2160 MKV; 1,36 GB ve 475 MB alternatifler | TR ses doğrulanmış değil; her aramada aynı sonuç garantisi yok |
| Fury / Hotel Rwanda | Dosya metadata'sında TR+EN sesli 1080p örnekler | Yaygın dublaj kapsamı ve fiziksel indirme testi yok |
| Fleabag | Denenen üç bölümde 1080p/4K dosya yolları | Bütün sezonlar veya tekrar kararlılığı kanıtlanmadı |
| Stranger Things S5E1/S5E2 | 415–509 MB 720p, yaklaşık 1 GB 1080p ve 9–11 GB 4K ek seçenekler | Tek dizinin iki bölümü, genel dizi kapsamı değil |
| Your Name | 3,01 GB 4K, JA/EN ses ve mevcut harici TR seçenekler | Anime bölümleri için aynı genişlik yok |

1.8.8'deki altı yeni dosya üç filme aittir; yeni dizi/anime dosyası veya yeni ölçülmüş TR dublaj yoktur. Kaynakta TR dublaj etiketi taşıyan üç yeni MP4 vardır, fakat ses metadata'sı okunamadığı için ölçülmüş TR sayılmaz. Önceki Fury/Hotel TR dosyaları ayrı, korunmuş örneklerdir.

Son sürümler büyük ölçüde Archive/MoviesDrive/HDHub üzerindeki genel eşleştirme ve çözümleme yollarını geliştirdi. Bu gerçek ilerlemedir, ancak aynı sayıda yeni bağımsız kaynak ailesi eklenmesi değildir. Sürümlerin artmasıyla katalog kapsamı aynı oranda büyümedi.

## Diğer depolardan çıkan sonuçlar

| Depo/ailesi | İncelemede görülen yaklaşım | Bizim için anlamı |
| --- | --- | --- |
| All-in-One Nuvio | 66 manifest girdisi, geniş film/dizi/anime kaynak listesi. İncelenen 4KHDHub kalite/boyutu sayfa metninden alıyor. AnimePahe hem HLS hem MP4 çözümleme yolları içeriyor. | Yeni kaynak keşfi için güçlü havuz. Bütün çıktılar ölçülmüş dosya/altyazı sayılmaz. |
| Anthology | 42 manifest girdisi; Türkçe film/dizi, canlı TV ve SineWix/SetFilm/LiderFilm gibi yollar. İncelenen SetFilm akışı HLS, SineWix çıktısı 1080p olarak sabit etiketleniyor. | Türkçe online/dublaj kapsamı için değerli araştırma. HLS yeni MP4 indirme açığını kapatmaz. |
| Turkish Nuvio / Serkan | Dört benzer sağlayıcı kimliği. Animecix kodunda metadata için sınırlı, süreli Map önbelleği ve geçersiz sonucu saklamama yaklaşımı var. | Küçük ama odaklı bakım örneği; önbelleğin Nuvio çalışmaları arasında yaşadığı ayrıca kanıtlanmalı. |
| Streamline | 25 sağlayıcı; ayrı modüller, testler, dinamik domain bilgisi. MoviesDrive modülünde IMDb/bölüm için alınan ortak altyazı listesi sürümlere ekleniyor. Bazı yollar anahtar/hesap/debrid gerektiriyor. | Modülerlik ve test yaklaşımı yararlı. Bütün özellikleri ücretsiz/hesapsız hedefimize uymaz. Aynı altyazı listesi sürüme senkron kanıtı değildir. |
| CB / phisher / michat / yoruix | Geniş ortak HubCloud, MoviesDrive, UHDMovies ve anime aileleri. CB MoviesDrive örneğinde kalite sayfa başlığından alınır; yoksa 1080 varsayılır. | Yeni host çözümleme fikirleri var; ortak sağlayıcı adları bağımsız kaynak artışı sayılmaz. |
| NiakVIO | Kök manifestte 41 girdi; belgede farklı 46 sağlayıcılı kapsam. Beş ayrı native uygulama laboratuvarı, değişken test kataloğu, sıfır/hata/timeout/oynatıcı ayrımı belgelenmiş. | Test ve yayın metodolojisinde örnek alınmalı. Belgelenen düzenek bütün kaynakların veya cihazların başarılı geçtiği kanıtı değildir. |
| Gowaru / Anime-Nuvio | Sırasıyla 37 ve 9 manifest girdisi; geniş anime ve dil odaklı listeler. | Anime kaynak çeşitliliği için önemli. FR görüntüye gömülü altyazı veya tek dil dublaj, TR/özgün ses hedefini otomatik karşılamaz. |
| Mooncrown / Wio / Manitux / V1RTV / TTuloglu / Onrcvn | Türkçe odaklı alternatif kaynak ve oynatıcı yolları. Wio CineStream modülü birden çok global resolver topluyor; bazı çıktılarda kalite sabit atanıyor. Onrcvn AsyaAnimeleri kodunda dosya/Drive çözümleme var. | Katkıyı tek tek gerçek dosya, ses, altyazı ve host bağımsızlığıyla ölçmek gerekir. |
| Alman / Latino paketleri | Dil ve bölge odaklı sağlayıcılar; Alman pakette ARD/Arte gibi farklı içerik kaynakları da var. | Resolver yaklaşımı için yararlı; doğrudan Türkçe katalog veya özgün ses artışı değildir. |

Kod örnekleri:
[All-in-One 4KHDHub](https://github.com/NuvioPlugin/All-in-One-Nuvio/blob/main/providers/4khdhub.js),
[AnimePahe](https://github.com/NuvioPlugin/All-in-One-Nuvio/blob/main/providers/animepahe.js),
[Streamline MoviesDrive](https://github.com/itsmeadarsh2008/Streamline/blob/main/providers/moviesdrive.js),
[Anthology SetFilm](https://github.com/falsisdev/anthology/blob/main/providers/setfilmizle.js),
[Anthology SineWix](https://github.com/falsisdev/anthology/blob/main/providers/sinewix.js),
[Turkish Nuvio Animecix](https://github.com/fmustafayaman/turkish-nuvio/blob/main/providers/animecix.js),
[CB MoviesDrive](https://github.com/SA7ANI/cb-providers/blob/main/providers/moviesdrive.js),
[Wio CineStream](https://github.com/miracxzx/turkish-sources/blob/main/providers/wiocinema-cinestream.js),
[NiakVIO doğrulama](https://github.com/niakw/NiakVIO/blob/main/VALIDATION.md).

## Neyi iyi yaptık, ne eksik?

**Güçlü yanlarımız:** doğru kimliği, gerçek dosya kontrolünü ve mevcut TR/EN altyazıyı aynı akışta ele almak; büyük dosyaları küçük seçeneklerle birlikte korumak; HLS/dosya ayrımını sürdürmek; yanlış/yabancı kimlikli sonucu sırf sayı artsın diye kabul etmemek; test, uyumluluk ve canlı kaynak kanıtını birbirinden ayırmak.

Bunlar incelenen bazı basit sağlayıcılara göre daha ayrıntılıdır. Bütün rakiplerden daha hızlı, daha kararlı, daha doğru veya daha kapsamlı olduğumuz gösterilmedi. NiakVIO'nun native test düzeni ve diğer paketlerin kaynak çeşitliliği öğrenilecek alanlardır.

**Asıl açıklar:**

1. Ücretsiz/hesapsız MP4/MKV'nin film-dizi-anime genelinde dağılımı dengesiz. Özellikle farklı diziler, sonraki sezonlar ve anime bölümleri eksik.
2. Aynı hosta bağlı çok sayıda sağlayıcı gerçek bağımsızlık sağlamaz. HubCloud/Pixeldrain aksaması birkaç bağlayıcıyı birlikte etkiler.
3. Türkçe dublajlı indirilebilir dosya ve özellikle TR dublajlı 4K çok sınırlı. Sonuçlarda TR altyazı bulunması TR ses bulunması değildir.
4. Tekrar aramalarda boş sonuç ve 24 saniyelik mantıksal sınıra ulaşma kayıtları var. Masaüstü 9–24 saniyelik örnekler iPhone süresi değildir.
5. Türkçe altyazı adayı/süre uyumu sahne senkronu testi değildir. Harici altyazı dosyasının telefonda indirmeye eşlik etmesi ve uçak modunda çalışması uçtan uca sınanmadı.
6. Karakter kodlaması bozuk metin ile Türkçe harflerin farklı fontta çizilmesi farklı sorunlardır. Eklenti temiz alternatif seçebilir; uygulamanın iOS font seçimini tek başına yönetemez. Yama hazırlanması telefona uygulanması değildir.
7. Kaynak kapsamına ilişkin güvenilir tek bir güncel başarı yüzdesi yok. Tarihsel dosya toplamlarını toplamak kopyaları ve değişken erişimi şişirir.

## Önerilen sonraki çalışma sırası

Bu bölüm uygulanmış değişiklik değil, değerlendirmeden çıkan öneridir.

1. **Ortak ölçüm tablosu:** mevcut 37 giriş korunarak dengeli film/dizi/anime ve Türkçe ses örnekleri eklenmeli. Aynı set farklı zamanlarda üç kez çalıştırılmalı. Başlık başına indirilebilir+TR, kalite/boyut çeşitliliği, ölçülmüş TR ses, ilk/toplam süre ve tekrar kaybı ayrı raporlanmalı. Önce karşılaştırılabilir baseline, sonra iyileştirme.
2. **Bağımsız dosya kaynağı genişletme:** rakip listelerinden yeni sağlayıcı/host aileleri adaylaştırılmalı. Her aday sınırlı bir örneklemle gerçek MP4/MKV, uygun ses, doğru kimlik ve farklı boyut katkısı açısından elenmeli. Birkaç bölümde yararlı olan kısmi kaynak kabul edilebilir; kapsamı açık tutulmalı. Yeni katkısı olmayan aynı host kopyası öncelik almamalı.
3. **Türkçe online ve Türkçe indirilebilir yolları ayrı ölçme:** SetFilm/LiderFilm benzeri online HLS adayları online açığına; gerçekten dosya yayımlayan yollar indirme açığına katkı olarak sayılmalı. SineWix gibi adayların hesap/anahtar gerektirmeyen yolu doğrulanmadan destek sözü verilmemeli. Eski başarısız 401/403/TLS yolları yeni bilgi olmadan döngüye alınmamalı.
4. **Hız ve tekrar kararlılığı:** en çok bekleten servisler ölçülmeli; sınırlı paralellik korunmalı. Aynı metadata/altyazı isteği paylaşılmalı, kısa süreli başarısız kaynak geri çekilmesi ve uygun TTL değerlendirilmelidir. Kalıcı depolama veya VM ömrü doğrulanmadan aramalar arası önbellek vaat edilmemeli. İmzalı/süresi dolan link körlemesine saklanmamalı. Nuvio her scraper tamamlanınca sonuç alır; satır satır callback mevcut kabul edilmemeli.
5. **iPhone kabul testi:** küçük MP4, MKV 1080p, MKV 4K; TR ses ve EN+harici TR örnekleriyle tam indirme/yeniden açma/uçak modu/altyazı seçimi/ses seçimi kontrol edilmeli. Bu aşama tamamlanmadan çevrimdışı deneyimin bittiği söylenmemeli.
6. **Sade ürün sunumu:** mevcut kısa kart korunmalı. Kartın temizliği için ölçüm/tahmin ayrımı dahili olarak kaybedilmemeli. Hedef, sağlayıcı sayısının artması yerine rastgele seçimde kullanılabilir alternatif bulma oranının artması olmalı.

“Her yapım, her kalite, ücretsiz ve hesapsız” kaynakların yayımlamadığı dosyaları üretemez. Ürün hedefi mümkün olan en geniş gerçek kapsam, hızlı alternatif bulma ve başarısızlıkta geçerli seçenekleri koruma olarak ölçülmelidir.

## Manifest envanteri

Sayılar yalnız bu tarihte okunan ilgili manifest girdileridir. Dil, oynatma/indirme başarısı ve bağımsız host sayısı değildir. README'ler aynı sayıyı taşımayabilir; NiakVIO'daki farklı projeksiyon/scope buna ayrıca örnektir.

| Depo / incelenen manifest | Manifest sürümü | Girdi |
| --- | --- | ---: |
| [falsisdev/anthology](https://github.com/falsisdev/anthology/blob/main/manifest.json) | 1.8.34 | 42 |
| [fmustafayaman/turkish-nuvio](https://github.com/fmustafayaman/turkish-nuvio/blob/main/manifest.json) | 1.21.0 | 4 |
| [serkan143/turkish-nuvio](https://github.com/serkan143/turkish-nuvio/blob/main/manifest.json) | 1.20.0 | 4 |
| [mooncrown04/nuviotr](https://github.com/mooncrown04/nuviotr/blob/main/manifest.json) | 0.4 | 18 |
| [manitux-app/nuvio-plugins](https://github.com/manitux-app/nuvio-plugins/blob/main/manifest.json) | 0.1.4 | 8 |
| [miracxzx/turkish-sources](https://github.com/miracxzx/turkish-sources/blob/main/manifest.json) | 2.0.0 | 50 |
| [v1rtech/v1rtvbox](https://github.com/v1rtech/v1rtvbox/blob/master/Nuvio/addons/manifest.json) | 3.4 | 8 |
| [ttuloglu/nuvio-tr-plugins](https://github.com/ttuloglu/nuvio-tr-plugins/blob/main/manifest.json) | 1.0.0 | 5 |
| [NuvioPlugin/All-in-One-Nuvio](https://github.com/NuvioPlugin/All-in-One-Nuvio/blob/main/manifest.json) | 1.0.0 | 66 |
| [phisher98/nuvio-providers](https://github.com/phisher98/nuvio-providers/blob/main/manifest.json) | 1.0.0 | 25 |
| [michat88/nuvio-providers](https://github.com/michat88/nuvio-providers/blob/main/manifest.json) | 1.0.0 | 30 |
| [yoruix/nuvio-providers](https://github.com/yoruix/nuvio-providers/blob/main/manifest.json) | 1.0.0 | 29 |
| [itsmeadarsh2008/Streamline](https://github.com/itsmeadarsh2008/Streamline/blob/main/manifest.json) | 1.9.1 | 25 |
| [SA7ANI/cb-providers](https://github.com/SA7ANI/cb-providers/blob/main/manifest.json) | 2.5.0 | 29 |
| [niakw/NiakVIO](https://github.com/niakw/NiakVIO/blob/main/manifest.json) | 5.21.130 | 41 |
| [D3adlyRocket/Anime-Nuvio](https://github.com/D3adlyRocket/Anime-Nuvio/blob/main/manifest.json) | 1.0.0 | 9 |
| [mkv9903/NuvioProviders](https://github.com/mkv9903/NuvioProviders/blob/main/manifest.json) | 1.0.1 | 1 |
| [InvalidPandaa/nuvio-german-providers](https://github.com/InvalidPandaa/nuvio-german-providers/blob/main/manifest.json) | 1.0.5 | 20 |
| [KennethJYS/Nuvio-Providers-Latino](https://github.com/KennethJYS/Nuvio-Providers-Latino/blob/main/manifest.json) | 2.0.0 | 10 |
| [Gowaru/gowaru-nuvio-providers](https://github.com/Gowaru/gowaru-nuvio-providers/blob/main/manifest.json) | 1.2.4 | 37 |
| [onrcvndev/nuvio-providers](https://github.com/onrcvndev/nuvio-providers/blob/main/manifest.json) | 3.0.0 | 5 |

Ayrıntılı seçili kaynak SHA'ları ve inceleme listesi yerel araştırma çıktısı `.cache/provider-survey-20261028.json` içindedir; bu dosya kullanıcı adresi, başlık veya anahtar içermez.
