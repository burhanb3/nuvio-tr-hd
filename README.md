# Nuvio TR HD

Nuvio Mobile'ın Kotlin Multiplatform **Full** sürümü için JavaScript sağlayıcı deposu. Film/bölüm seçildiğinde birden çok gerçek kaynağı otomatik tarar, MP4/MKV bağlantılarını doğrular ve her video için mevcut Türkçe altyazıları arayıp eşleştirir. Seçilen boyut/kalite/uygunluk sırasıyla sunar. Her taramada varsayılan üst sınır **20**, çözünürlük filtresi **Tümü**. İstenirse 6/10 seçilebilir. Sürüm **1.7.0**.

**26 Ekim 2026 uyumluluk kontrolü:** `0.6.4-beta` ve güncel `cmp-rewrite` dalının ilgili kaynak sözleşmeleri karşılaştırıldı. Derlenmiş sağlayıcı gerçek QuickJS WASM motorunda test edilir. Fiziksel Android/iOS cihazında oynatma ve indirme testi henüz yapılmadı. Ayrıntılar: [uyumluluk raporu](docs/UYUMLULUK.md).

Bu depo medya barındırmaz. SonAnime, DiziYou, DiziBak, FilmModu, Animecix/Tau, 4KHDHub/HubCloud, VixSrc, Internet Archive ve PlayIMDb yerleşiktir; DahmerMovies deneysel yerel yedektir ve varsayılan kapalıdır. JSON/Stremio adresi girmek zorunlu değildir. Kişisel JSON ve Stremio kaynakları ek alternatif olarak korunmuştur. Her film için erişilebilir HD dosya veya uygun Türkçe altyazı bulunması garanti değildir; başarısız/engelli kaynaklar atlanır.

## 1.7.0: genel kaynaklar, ses kodları ve altyazı seçimi

Tek tek yapımlara yeni dosya pini eklemek yerine DiziYou, DiziBak, FilmModu ve SonAnime genel taramaları eklendi. Animecix kanonik farklı dil adlarını tanır; Archive tam bölüm dosyalarını genel olarak arar. Yeni yardımcı sunucu kurulmadı; önceki kaynaklar/kimlikler ve JSON/Stremio desteği korunur.

Sesler EN/TR/JA gibi kısa kodlarla, doğrulanmamış kaynak iddiası ? ile görünür. Önerilen sırada özgün/TR/EN tercih edilebilir; boyut/kalite sıralaması değişmez. Aynı dosya aynaları tekilleşir. Çelişen HLS kaliteleri çoğalmaz. Yılsız tam dizi release eşleşmesi ve bozuk Türkçe kodlama kontrolü geliştirildi.

**Yeni film/dizi alternatifleri çoğunlukla online HLS’dir. Normal film/dizi için küçük MP4/MKV boşluğu sürer; her yapım/her kalite hedefi tamamlanmadı.** Harici ses birleştirme plugin ABI’sinde yoktur. iPhone’daki eksik Türkçe font glifleri uygulama düzeltmesi gerektirir; hazır yama kaynak üzerinde kontrol edildi, cihazda uygulanmadı. 153 yerel test ve gerçek QuickJS geçti. Tam oynatma/indirme/çevrimdışı/senkron testi yok. [Yöntemler, sınırlar ve araştırma](docs/KAYNAK_GENISLETME_170.md).

## 1.6.4: normal diziler ve erken korunan altyazılar

Breaking Bad S01E01 için yaklaşık 329 MiB 853×480 MP4 ve 465 MiB 1280×720 MKV; Inception için 830/861 MiB 1280×536 MP4 eklendi. Fleabag S01E01 artık aynı 848×354 çözünürlükte 99 MiB MKV yanında 155 MiB MP4 de sunar. Her kaynak canlı metadata ve gerçek dosya hash/boyut/piksel/süre kontrolüne bağlıdır; bölüm onayı tüm sezona taşınmaz.

Fleabag S02E01’de 147 MiB MP4 / 604 MiB MKV ve TR var, fakat **İspanyolca altyazı görüntüye işlenmiş**. Listede “ES görüntüde” yazılır. Önerilen sırada temiz online seçenek önce gelir; kullanıcının boyut/kalite sırası korunur. Bu dosyalar temiz Türkçe izleme hedefini tamamlamış sayılmaz.

Son 14 vaka kontrolü: 14/14 online+TR; 11/14 küçük indirme+TR, bunun 10’unda bilinen yabancı sabit altyazı yok; 6/14 bütün kaynak ölçütlerini geçti. Matrix, Shameless ABD S01E01 ve Game of Thrones S01E01 indirme boşluğu sürüyor. No Way Home/Spider-Verse ek kalite, Inception/Fleabag S01E01 ikinci çözünürlük istiyor. **Hedef tamamlanmadı.**

Hızlı geçerli altyazı, yavaş servis/aynı gruptaki takılan gövde bitmeden korunur; güçlü hash eşleşmeleri sonradan daha zayıf olanları değiştirebilir. Aynı gövdeler birleşir. Altyazı gövdeleri dört temel ağ isteğiyle sınırlandırılır; JS timeout’u native isteği bitmiş saymaz. Native iOS bekleyen işleri yine dönüşü geciktirebilir. Bu iç akış Nuvio’ya yeni bir canlı liste callback’i eklemez. **140 yerel test/QuickJS; fiziksel telefon, tam video indirme ve çevrimdışı senkron sınanmadı.** [Detaylar ve geliştirme aracı](docs/ALTYAZI_VE_DIZI_164.md).

## 1.6.3: ölçülen indirme kapsamı

Archive’ın yıl alanı eksik kayıtları, kesin başlık/yıl + dosya adı/yıl ve gerçek süre kanıtıyla taranır. Resmi dosya sunucuları doğrudan kullanılır; hazır adaylar kalan metadata’yı beklemez. HDHub’da uzantısız gösterim başlıkları, koleksiyon etiketi ve doğrulanmış gösterim yılı farkları nedeniyle yanlış elenen sürümler yeniden incelenir. Gerçek MP4/MKV/Range doğrulaması korunur.

14 vakalık gerçek kaynak matrisinde küçük indirilebilir + Türkçe altyazı 3/14’ten 8/14’e çıktı. Dune için yaklaşık 756/905 MiB, Spider-Verse için 1,88 GiB dosyalar doğrulandı. Fleabag S01E01 için yaklaşık 99 MiB MKV bulundu; bağımsız görüntü örnekleri doğru bölümle eşleşti. No Way Home’da 840 MiB düşük çözünürlüklü bir alternatif var; ikinci iyi kalite hâlâ eksik. **Diğer normal dizi vakalarında, Matrix ve Inception’da indirme boşlukları sürüyor.** [Tam liste, ses dilleri ve kalan hedefler](docs/KAPSAM_MATRISI.md).

Ses dili okunabildiğinde konteynerden gösterilir; dosya adı iddiası tahmini yazılır. Küçük Dune MKV’si Hintçe ses içerir. Türkçe altyazı bulunması özgün ses veya sahne senkronu garantisi değildir. Mevcut boyut/kalite sıralaması korunur.

128 fixture/QuickJS testi, kaynak/altyazı canlı kontrolleri ve ayrı kapsam ölçümü vardır. Sabit TMDB referansı telefonun gerçek API anahtarını sınamaz. **Fiziksel iPhone, tam oynatma/indirme, çevrimdışı altyazı ve sahne senkronu testi yapılmadı.** Ana scraper aynı kimlikle online ve dosyaları birlikte arar; Anime ayrıdır. Ana arama 24, Anime 20 saniye mantıksal bütçe; native iOS işleri ayrıca geciktirebilir.

Animecix/Tau, kesin TMDB ID + özgün başlık + yıl + tam sezon/bölümle aranır. Önceki canlı kontrollerde Death Note S01E01 90–229 MiB 480p/720p MP4 ve dört TR SRT; Attack on Titan S01E01 165–569 MiB 480p/720p/1080p MP4 ve üç TR SRT verdi. SRT senkronu ölçülmedi. MKV içindeki gerçek Türkçe altyazı izleri de algılanır. [Anime ve iOS font incelemesi](docs/ANIME_HIZ_VE_ALTYAZI.md).

## 1.5.0’dan korunan dizi ve liste özellikleri

Game of Thrones ve Fleabag için TV yolu düzeltildi. PlayIMDb'nin doğru IMDb/bölüme ait, yıl içermeyen release adları artık yanlış elenmez; VixSrc tam TV bölüm rotasını kullanır. HDHub tek bölüm MKV'lerini sezon ZIP/RAR paketlerinden ayırır. Hesapsız AltyazıDB, mevcut Türkçe SRT kaynağı olarak eklendi.

Varsayılan kaynak sırası **küçükten büyüğe**. Kalite/boyut/önerilen sıralama ve tür/kalite/sağlayıcıya göre yan yana gruplama ayarlıdır. Kısa başlık örneği: **01 · İndirilebilir · 4KHDHub**; Nuvio alt satırı **1920×1080 ✓ · 4.41 GiB · TR · senkron belirsiz**. Ayrı açılır grup/kart tasarımı plugin ABI'siyle oluşturulmaz.

HLS, sesi birlikte gelen kaynaklarda her kalite için ayrı satırdır. Her satırın kendi ortalama bitrate/parça başlığı tahmini veya açık üst tahmini vardır; geniş 784 MB–4,65 GB aralığı gösterilmez. Ayrı ses grubu olan kaynaklar mevcut köprü 1.4.0 kaldığı için otomatik master olarak korunur, boyutu değişken yazılır. HLS profil servisinin 1.5.0 kodu hazırdır; Sites hesabına erişim kaybı ve kullanıcının şu an geçememesi nedeniyle yayımlanamadı. Sağlık cevabında yetenek onayı olmadan yeni URL kullanılmaz.

[Dokuz depo envanteri ve gerçek kaynak araştırması](docs/KAYNAK_ARASTIRMASI.md): 221 tanım/134 normalize kimlik; hepsi bağımsız veya çalışır sayılmaz. Yeni yöntemler ve başarısız denemeler belgelenmiştir.

## Otomatik çalışma

1. Nuvio'nun verdiği TMDB ID ile özgün başlık, yıl, IMDb kimliği ve film süresi alınır.
2. Yerleşik sağlayıcılar sınırlı paralellikle taranır; ek JSON/Stremio kaynakları varsa aynı havuza katılır. Başlık/yıl uyuşmazlığı ve fragmanlar elenir.
3. Dosyaların gerçek MP4/MKV yapısı, video piksel boyutları ve mümkünse süresi okunur. Konteyner okunamazsa dosya adındaki kalite yalnız açıkça etiketlenmiş tahmindir. HLS çözünürlükleri oynatma listesinden, yaklaşık aktarım boyutu bitrate × süreden gelir; gerçek dosya ölçümüyle karıştırılmaz.
4. Her dosya için OpenSubtitles hash'i hesaplanabildiğinde hesaplanır; Türkçe altyazı servislerine film/bölüm ve dosya bilgileriyle sorgu yapılır. Video URL'si altyazı servisine gönderilmez.
5. Altyazılar **hash → tam sürüm → kaynakla eşlenmiş → sürüm benzerliği → süre uyumu → aynı filmden belirsiz alternatif** sırasıyla değerlendirilir. Süre/sürüm benzerliği, sesle doğrulanmış senkron değildir ve arayüzde açıkça belirtilir. Farklı film/yıl/bölüm ve açıkça farklı extended/director's cut sürümleri elenir.
6. Varsayılan küçükten büyüğe sıralanır; istenirse Önerilen seçimi indirilebilir dosya ve güçlü Türkçe eşleşmesini öne alır. Kaynaklar dengeli taranır; tek sağlayıcı tüm aday kotasını tüketmez.

Varsayılanlar: otomatik tarama ve Türkçe altyazı araması açık; çözünürlük filtresi Tümü; Türkçe altyazısız videolar TR bulunamadı etiketiyle görünür; **HLS çevrimiçi alternatifleri açık**. Varsayılan boyut sırası uygulanır; Önce indirilebilir gruplaması ayrıca seçilebilir. HLS yalnız online etiketi taşır. Çözünürlük okunamazsa mevcut dosya adı ipucu tahmin diye sunulur; hiçbir kanıt yoksa eksik bilgi açık kalır. İstenirse ayarlardan kaynaklar ayrı kapatılabilir, düşük kalite veya altyazısız sonuçlar gösterilebilir.

**Altı sonuç Nuvio'nun sınırı değildir.** Bu eklentinin ayarlanabilir liste sınırıdır. Genel kaynaklara tarama başına 40 aday kotası ayrılır; HDHub ayrıca en çok 12 release’i aşamalı işler. Sonuç sayısını 20 seçmek yeni sağlayıcı eklemez. Mantıksal bütçeler ana arama 24, Anime 20 saniyedir; başlamış native ağ işlerinin bitişi ayrıca Nuvio’ya bağlıdır.

**1.6.3’e geçiş:** Mevcut GitHub deposunu Nuvio Pluginler ekranından yenileyin ve ana sağlayıcı sürümünün **1.6.3** olduğunu kontrol edin. Eski Sites kopyası varsa kapatın. Önceden kaydedilmiş HLS kapalı ayarı değişmez; online alternatifler için sağlayıcı ayarındaki **HLS çevrimiçi izleme alternatiflerini göster** seçeneğini açın. Depoyu kaldırmak gerekmez; kaldırıp yeniden eklemek kişisel ayarları sıfırlayabilir.

Dune (2021) / Spider-Man denemesi, uzun bekleme düzeltmesi ve sonuçların sınırları: [sorun giderme](docs/SORUN_GIDERME.md).

**Kaynaklar telefondan aranır; dosya köprüsü varsayılan açıktır.** Yeni public köprü yalnız bulunan imzalı R2 dosyasını sınırlı GET aralığıyla doğrular ve `.mkv` / `.mp4` adını koruyan yönlendirme verir. Video doğrudan kaynaktan gelir. Bulut IP’sine kaynak sayfaları 403 verdiğinden tam ortak tarama varsayılan kapalı tutulur. Kişisel kataloglar/anahtarlar gönderilmez; bu public dosya adresi ve film metadatası köprüye gider. [Servis ve sınırlar](hosting/README.md).

Eski kayıtlı tercihler taşınırsa **Tümü / 20 / HLS açık / MKV dosya köprüsü açık / DahmerMovies kapalı** seçin. Yeni altyazı politikası Türkçeyi tercih eder; gerekirse sıkı mod seçilebilir.

Kaynak ve eşleştirme ayrıntıları: [otomatik sistem rehberi](docs/OTOMATIK_KAYNAKLAR.md).

## Kurulum

Nuvio'nun **Pluginler / Plugins → Depo ekle / Add Repository** alanına eklenecek manifest adresi:

```text
https://burhanb3.github.io/nuvio-tr-hd/manifest.json
```

Eklenti adı **Nuvio TR HD**'dir. Bu yayın GitHub'a giriş gerektirmez. Aşağıdaki GitHub Pages seçeneği plugin dosyalarının kendi kopyasını barındırabilir; ortak tarama servisi için ayrıca Worker gerekir. [Servis rehberi](hosting/README.md).

1. [Resmî Nuvio Mobile Releases](https://github.com/NuvioMedia/NuvioMobile/releases) sayfasından plugin destekli **Full** Android APK veya Full iOS paketini kullanın. Play Store/App Store varyantları aynı plugin çalışma ortamını içermez.
2. Bu deponun `manifest.json` ve `providers/` içindeki üç üretilmiş dosyayı aynı HTTPS kökü altında barındırın. Kolay seçenek: aşağıdaki GitHub Pages akışı.
3. Nuvio'da **Ayarlar → Content & Discovery → Plugins → Add Repository** yolundan yukarıdaki manifest adresini ekleyin. Kendi kopyanızı barındırıyorsanız kendi HTTPS manifest adresinizi kullanın. Menü adları uygulama diline göre değişebilir.
4. **Nuvio TR HD** ana sağlayıcısını ve Anime’yi etkinleştirin. JSON/Stremio adreslerini ana sağlayıcının ayarına yazın. Otomatik tarama varsayılan açıktır. İsterseniz ek JSON katalog veya Stremio **manifest** adresleri girin; birden fazla adresi boşlukla ayırın. Her türden en çok üç ek adres kullanılır.
5. TMDB anahtarı alanını boş bırakabilirsiniz; Nuvio'nun sağladığı anahtar kullanılır. Gerekirse kendi TMDB **v3 API anahtarınızı** girin.
6. Nuvio'nun **Playback / Oynatma → Subtitles / Altyazılar → Preferred subtitle language / Tercih edilen altyazı dili** ayarını **Türkçe** yapın. Daha önce o film için altyazıyı elle kapattıysanız bu manuel tercihi kaldırın. Plugin uygulamanın dil tercihini değiştiremez.
7. Filmi açın; `01`, `02`… sıralı video–altyazı alternatiflerinden birini seçin. Nuvio Türkçe dil tercihiyle altyazıyı otomatik seçer. İndirmeyi Nuvio'nun kaynak/indirme menüsünden başlatın ve altyazıların da hazırlanması tamamlandıktan sonra çevrimdışı açın. Nuvio aynı kaynak altyazılarını yerel video yanına kaydeder ve `tr` dil kodunu korur. Cihaz davranışı için [kabul testi](docs/UYUMLULUK.md) henüz yapılmalıdır.

Plugin kurulumu, Nuvio'nun **Addons** ekranına yapılan bir Stremio kurulumundan ayrıdır. Stremio kaynak adresleri bu sağlayıcının **ayarlarına** yazılır. Sağlayıcı, uygulamada kurulu diğer addon adreslerini kendiliğinden okuyamaz.

### GitHub Pages ile barındırma

1. Projeyi kendi GitHub deponuza aktarın; örnek depo adı `nuvio-tr-hd`.
2. Depoda **Settings → Pages → Source → GitHub Actions** seçin.
3. **Actions → Manifesti GitHub Pages üzerinde yayınla → Run workflow** çalıştırın.
4. İşlem bittiğinde deployment adresinin sonuna `/manifest.json` ekleyin. Sağlayıcı URL'si bu manifestin bulunduğu kökten çözülür; dosya adını değiştirmeyin.

Pages işlemi varsayılan yayın dalına push ile veya elle başlatılır ve testler geçince yalnızca `dist/` içeriğini yayınlar. Doğrudan ham manifest kurulumu Pages gerektirmez. Kataloglarınızın herkese açık olması gerekmez; fakat telefonunuz bunlara ulaşabilmelidir. İmzalı URL ve kişisel erişim bilgilerini herkese açık depoya koymayın. Pages'in ücretsiz/genel kullanımını özel medya saklama alanı gibi değerlendirmeyin.

### Bilgisayarınızdan yerel deneme

Node.js 22 veya üzeri gerekir:

```powershell
npm ci --ignore-scripts
npm run check
Copy-Item examples/catalog.example.json catalog.local.json
# catalog.local.json içindeki adresleri kendi dosyalarınızla değiştirin.
npm run serve:example
```

Telefon ve bilgisayar aynı ağdayken `http://BILGISAYARIN_YEREL_IP_ADRESI:8787/manifest.json` adresini kullanın. Katalog ayarına `http://BILGISAYARIN_YEREL_IP_ADRESI:8787/catalog.local.json` yazın. Kaynaklarınız HTTP ise sağlayıcı ayarındaki **HTTP adreslerine izin ver** seçeneğini açın. Bilgisayar güvenlik duvarının bu porta izin vermesi gerekebilir. `localhost` telefonda bilgisayarınızı göstermez. İşiniz bitince sunucuyu `Ctrl+C` ile durdurun.

## Kaynak biçimleri

JSON biçimi ve örneği: [katalog rehberi](docs/KAYNAKLAR.md), [örnek katalog](examples/catalog.example.json), [JSON şeması](schemas/catalog.schema.json).

```json
{
  "version": 1,
  "items": [{
    "tmdbId": 603,
    "type": "movie",
    "originalTitle": "The Matrix",
    "year": 1999,
    "streams": [{
      "url": "https://sunucunuz.example/arsiv.mp4",
      "subtitles": [{
        "url": "https://sunucunuz.example/arsiv.tr.srt",
        "language": "tr"
      }]
    }]
  }]
}
```

Stremio kaynağında `stream` kaynağı gerekir. `meta` sağlanıyorsa orijinal başlık ve yıl doğrulanır; çelişki varsa sonuç elenir. Yalnız `stream` sunan kaynaklarda `behaviorHints.filename` içinde **tam orijinal başlık + yıl** bulunmalı veya akış açık bir `identity` kaydı taşımalıdır. Bu katı eşleştirme bazı kaynakları eleyecektir. Türkçe yerelleştirilmiş başlık tek başına yeterli değildir. IMDb kimliği gerekirse TMDB'nin `external_ids` yanıtından alınır. Torrent/magnet sonuçları döndürülmez.

## Kalite ve indirme davranışı

- MP4 `ftyp`/konteyner yapısı, MKV EBML `DocType=matroska` kontrol edilir. HTML hata sayfası, sahte uzantı, 403/404, bozuk JSON, hatalı byte range ve zaman aşımı sonucu atlanır.
- Video boyutları MP4 `moov/trak/tkhd` + video handler veya MKV video track `PixelWidth/PixelHeight` alanlarından okunur. MP4 başında bulunamazsa en çok 256 KiB kuyruk aralığı da denenir. Dosya adındaki `1080p/2160p` kalite kanıtı sayılmaz.
- Kalite etiketi gerçek kısa kenara göre konservatif hesaplanır. Örneğin `1920×800`, `720p` etiketiyle birlikte tam piksel boyutuyla gösterilir. Okunamayan çözünürlükte dosya adı ipucu yalnız **tahmin** olarak yazılır; hiçbir kanıt yoksa eksik bilgi açık bırakılır.
- Kontrol ilk 128 KiB + gerekirse son 256 KiB üzerinden yapılır; tam dosya çözme, görsel kalite, codec/HDR/DRM veya dosyanın tümünün sağlam olduğu garantisi değildir. İndirme kullanılabilirliği sunucunun erişim/süre sınırlarına da bağlıdır.
- HLS çevrimiçi alternatifleri varsayılan açıktır; kısa kartta **Online**, metaveride **HLS** yazar. Ayrıntılı başlık/başlık alanında **Online izlenebilir · İndirilemez** açıklaması korunur; doğrudan dosya denmez. Yalnız indirilebilir dosya istiyorsanız HLS ayarını kapatın. Uzantısız HLS, Nuvio'nun indirme filtresine takılmayabileceği için hiç döndürülmez. DASH desteklenmez.
- MKV URL’si `.mkv` ile bitmelidir. Yeni köprü doğrulanmış public R2 dosyalarına bu adı sağlar. Köprü kapalıysa uzantısız MKV, yanlış adla kaydetmeyi önlemek için elenir.
- Harici altyazı Türkçe ve UTF-8 olmalı; SRT/VTT gövdesi doğrulanır. OpenSubtitles gibi `/sub.vtt/` ve uzantısız indirme uçları da gövde incelemesiyle desteklenir. Video başlıkları altyazı sunucusuna otomatik aktarılmaz. Türkçe altyazı, Türkçe ses anlamına gelmez.
- Hash ve sürüm eşleşmesi güçlü kanıttır; sürüm benzerliği veya süre uyumu tam senkron garantisi değildir. Nuvio AutoSync yalnız Android dahili ExoPlayer yolunda, kullanılabilir gömülü referans altyazıyla çalışır; iPhone’da bu özellik yoktur. Plugin ABI’si zaman kaydırma alanı sağlamaz.

Nuvio plugin sonuç şemasında bir `downloadable` anahtarı yoktur. Bu proje desteklenmeyen bir bayrak uydurmaz; dosya türünü ve doğrulama durumunu sonuç adında gösterir. Son indirme ve oynatma davranışını uygulama belirler.

## Geliştirme ve hafıza

```powershell
npm run check
npm run verify:upstream
npm run test:live
npm run test:live:pipeline
npm run test:live:bridge
```

`npm run build`, modülleri Node bağımlılığı olmayan üç CommonJS sağlayıcısına paketler. `providers/nuvio-tr-hd*.js` dosyaları depoda tutulur; uygulama kaynak modüllerini ayrı ayrı yüklemez. `dist/` her derlemede temizlenen yayın paketidir. Normal testler ağsızdır; `test:live` gerçek servislerde metadata, sınırlı video aralıkları ve altyazı gövdelerini denetler, tam film indirmez. Canlı kontrolün dış servisler yüzünden başarısız olması fixture testinden ayrı raporlanır.

- [Mimari ve katkı rehberi](docs/GELISTIRME.md)
- [Basit anlatım ve birlikte geliştirme sırası](docs/BASIT_REHBER.md)
- [Uyumluluk kanıtları ve cihaz kontrol listesi](docs/UYUMLULUK.md)
- [Proje hafızası](docs/hafiza/PROJE.md)
- [Tasarım kararları](docs/hafiza/KARARLAR.md)
- [Sonraki işler](docs/hafiza/SONRAKI_ISLER.md)
- [Değişiklik günlüğü](CHANGELOG.md)

GitHub Actions: Windows/Linux test ve paket üretimi; haftalık Nuvio sözleşmesi değişiklik kontrolü; elle tetiklenen Pages yayını. İş akışları GitHub'a aktarılınca çalışır. MIT lisansı.
