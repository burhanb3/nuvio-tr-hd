# Nuvio uyumluluğu

Nuvio TR HD, Nuvio Mobile'ın Kotlin Multiplatform **Full** sürümündeki JavaScript plugin arayüzünü kullanır. Manifestte beş scraper vardır; önceki kimlikler güncellemelerde korunur.

## Doğrulanan sözleşme

- `getStreams` ve `onSettings` girişleri; mevcut sonuç, erişim başlığı ve altyazı alanları.
- Native parser'ın kalite, boyut ve dil alanlarını sıralaması; boş alanları atlaması.
- HLS/DASH URL'lerinin dosya indirme yolundan dışlanması.
- iOS ağ/timer köprüsünün iptal sınırları; uzun native bekleme oluşturmayan zamanlayıcı.

Resmî release ve geliştirme dalındaki ilgili dosyaların SHA'ları `compatibility/upstream-lock.json` içinde tutulur. `npm run verify:upstream` bunları ve kritik ABI parçalarını karşılaştırır. Fark varsa kilit otomatik yenilenmez; değişiklik incelenir.

## Güncel kontrol

2.0.3 (26 Kasım) yalnız CizgiMax satırlarında (`followMp4Boxes`) MP4 denetiminin dosyanın bildirdiği kutu sonlarını en fazla iki kez izlemesine izin verir: başında büyük dolgu, sonunda `moov` olan dosyalar (Gravity Falls) artık piksel ve süreyle doğrulanır. Dolgulu baş tek başına kabul edilmez. Diğer kaynakların denetimi ve Range dizisi değişmez. Plugin ABI'sine dokunmaz. 393 fixture/QuickJS testi geçti. Yayın kontrolü sonucu PROJE ve compatibility/github-publication.json içindedir. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

2.0.2 (26 Kasım) CizgiMax'i 7. bağımsız scraper (`nuvio-tr-hd-cizgimax`) yapar; ana paket artık CizgiMax kodu içermez. Sitenin sunucusu çöktüğünde bağlantı ve TLS kuruluyor ama ilk bayt gelmiyordu; iOS kurallı simülasyonda ana liste 60,6 sn'de döndü. Ayrıldıktan sonra aynı bölümde ana liste siteye hiç istek açmadan 7,7 sn'de döndü. Kaynak kodu ve medya doğrulaması 2.0.1 ile aynıdır. Plugin ABI'sine dokunmaz. 391 fixture/QuickJS testi geçti. `2d8374b` yayını: Test ve paket `45816189128`, Pages `45816189100` başarılı; 10 public dosya SHA-256 eşleşti. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

2.0.1 (26 Kasım) CizgiMax Türkçe dublajlı çizgi dizi bölüm dosyalarını ana sağlayıcıya ekler. Dosya Google Drive'ın herkese açık indirme adresinden (`confirm=t`) alınır; Range 206 döner, çerez veya anahtar gerekmez. Drive önizleme sayfası kendi dosya kimliğini `og:url` ile verir. Taşıma katmanı yönlendirme sonrası adresi bildirmezse bu kimlik kullanılır; iOS'un yönlendirme sonrası adresi bildirdiği cihazda doğrulanmadı. QuickJS'te tam boyutlu (0,6–0,8 MB) sayfalar ayrıştırıcı düzeyinde sınandı; paket testi küçültülmüş sayfalarla yapıldı (test düzeneği ~0,2 MB üstü metinde kapanışta duruyor; nedeni bulunmadı, yayınlanmış sağlayıcılarda da aynı). Plugin ABI'sine dokunmaz. 391 fixture/QuickJS testi geçti. `51082f7` yayını: Test ve paket `45779861170`, Pages `45779861123` başarılı; 9 public dosya SHA-256 eşleşti. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

2.0.0 (26 Kasım) DiziBox online dizi kaynağını Hızlı İzle ve sabit online pakete ekler. Kimlik bölüm başlığı ile dizi sayfasındaki ilk yayın yılına bağlıdır. Oynatıcı yapılandırması sayfanın verdiği parolayla AES olarak metin halinde çözülür; betik çalıştırılmaz. Başlık normalizasyonu tipografik noktalama işaretlerini (’ – … “”) ayırıcı sayar. Plugin ABI'sine dokunmaz. 378 fixture/QuickJS testi geçti. `fa5acb2` yayını: Test ve paket `45773314376`, Pages `45773314401` başarılı; 9 public dosya SHA-256 eşleşti. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.9 (26 Kasım) KultFilmler online film kaynağını Hızlı İzle ve sabit online pakete ekler. Kimlik oynatıcının IMDb kimliğine bağlıdır. Dublaj sitenin beyanıdır. Paketli oynatıcı betiği çalıştırılmadan, sınırlı sözlükle çözülür (`unpackPacked`). Plugin ABI'sine dokunmaz. 370 fixture/QuickJS testi geçti. `b653608` yayını: Test ve paket `45701344984`, Pages `45701345092` başarılı; 9 public dosya SHA-256 eşleşti. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.8 (25 Kasım) HDRezka'yı 6. bağımsız scraper (`nuvio-tr-hd-hdrezka`) yapar. Anizone ve AniMOM'u yeni opt-in anahtarlarıyla varsayılan kapatıp Anime taramasından çıkarır. SonAnime, SeiCode (tau-video), VixSrc (FHD 403), FilmEkseni (alan adı) ve PlayIMDb (`cast_urls`) değişikliklerine uyar; kesme işaretli adları `%27` ile gönderir. Plugin ABI'sine dokunmaz. 365 fixture/QuickJS testi geçti. `55b732d` yayını: Test ve paket `45692600060`, Pages `45692600154` başarılı; 9 public dosya SHA-256 eşleşti. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.7 (25 Kasım) JetFilmizle film MP4 kaynağını (HEAD Range 206 ön kontrolüyle), opt-in büyük `moov` MP4 ses izi okumasını (`readAudioTracks`), başarısız ayna host önceliğini, `4KHDHub` film sırasını, altyazı `v3` önceliği + 429 hash korumasını ve lane bazlı minified paketlemeyi (5 aktif scraper toplamı 1.650 KB → 583 KB) getirir; plugin ABI'sine dokunmaz. 363 fixture/QuickJS testi geçti (`URLSearchParams` test köprüsü kilitli `JsBindings.kt`'deki `has/keys/values/entries` ile hizalandı). Yayın kontrolü sonucu PROJE ve compatibility/github-publication.json içindedir. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.6 (25 Kasım) iOS'ta 60 sn native askı riski taşıyan DiziYou'yu yeni `diziyouOptInEnabled` anahtarıyla varsayılan kapatır, Goojara'yı ana taramadan ayırıp 5. bağımsız scraper (`nuvio-tr-hd-goojara`) yapar ve Goojara'nın sessiz timeout sonrası ikinci native isteğini durdurur; plugin ABI'sine dokunmaz. 357 fixture/QuickJS testi geçti. Yayın kontrolü sonucu PROJE ve compatibility/github-publication.json içindedir. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.5 (25 Kasım) yeni FzMovies film kaynağını, bu kaynak için aynı alan adındaki iki yedek sunucuya probe geçişini ve filmlerde FzMovies işinin MoviesDrive ardına eklenmesini getirir; plugin ABI'sine dokunmaz. 356 fixture/QuickJS testi geçti. Yayın kontrolü sonucu PROJE ve compatibility/github-publication.json içindedir. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.4 (20 Kasım) yeni FzTvSeries dizi kaynağını ve bu kaynağın aynı alan adındaki ikinci sunucusuna probe geçişini ekler; plugin ABI'sine dokunmaz. Dizilerde 4KHDHub ve FzTvSeries işleri öne alındı. 349 fixture/QuickJS testi geçti. Yayın kontrolü sonucu PROJE ve compatibility/github-publication.json içindedir. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.3 (20 Kasım) 4KHDHub dizi poster bağını ve Goojara'nın tek yeniden denemesini değiştirir; plugin ABI'sine dokunmaz. 342 fixture/QuickJS testi geçti. Yayın kontrolü sonucu PROJE ve compatibility/github-publication.json içindedir. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.2 (19 Kasım) yalnız MoviesDrive arama kökünü ve sürüm eşzamanlılığını değiştirir; plugin ABI'sine dokunmaz. 339 fixture/QuickJS testi geçti. Yayın kontrolü sonucu PROJE ve compatibility/github-publication.json içindedir. Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

1.9.1 (19 Kasım) plugin ABI'sine dokunmaz; 338 fixture/QuickJS testi geçti ve GitHub CI/Pages sonrası yayındaki dosyalar yerel derlemeyle aynı çıktı. Bu sürüm için Windows Desktop, fiziksel telefon, tam oynatma ve indirme testi yapılmadı; aşağıdaki masaüstü kayıtları 1.9.0 ve öncesine aittir.

11 Kasım Windows incelemesinde kurulu uygulamanın ham video yanıtını metin
üzerinden yeniden kodlarken bozduğu doğrulandı. Yerel native testte 131.072 byte
yerine 262.144 byte alındı. Byte koruması ve raw HTTP için 10 saniyelik toplam
çağrı sınırı sonrası kontrollü testler geçti. Black Clover S1E16 ayrı motor
testinde üç MP4 döndürdü. Normal Windows ekranında S1E17 için 480p, 720p ve
1080p indirilebilir satırlar göründü. Bu satırlarda EN altyazı vardı, TR etiketi
yoktu. Masaüstündeki Nuvio TR HD kısayolu düzeltilmiş kullanıcı kopyasını açar.
Sistem kurulumuna yazma izni alınamadı. Yerel kopya, mevcut kurulumun runtime ve
kütüphanelerine bağlıdır. Tam oynatma/indirme ve fiziksel telefon sınanmadı.
[Kontrol](../compatibility/windows-http-2026-11-11.json) ·
[Düzeltme kaynakları](../patches/desktop-binary-response/README.md).

1.9.0, Windows Nuvio Desktop üzerinde mevcut depo yenilenerek sınandı. Dune (2021) 1.8.9'da boş döndü, 1.9.0 ile normal yayın listesinde Türkçe altyazı etiketli bir online sonuç çıktı. Kurulu motorun ayrı işlem testinde Fleabag S1E1 dört online sonuç verdi. Ayrı MoviesDrive kaynak testinde Dune MKV seçenekleri doğrulandı, Windows uygulama denemesinde indirilebilir satır görünmedi. Tam oynatma, indirme ve fiziksel telefon sınanmadı. [Masaüstü ve kaynak ölçümü](../compatibility/desktop-190-check.json).

1.8.9: Android/iOS yanında Desktop platformu manifestte açıldı. Windows'taki Nuvio Desktop 1.1.35 depoyu 0 sağlayıcıyla gösteriyordu; yayımdan sonra aynı depoyu yenileyince dört sağlayıcı göründü. Gerçek uygulamadaki sağlayıcı testinde Matrix için 10 sonuç döndü. İlk Dune araması uygulamada boş kaldı; kurulu Desktop QuickJS motorunu kullanan ayrı işlemde Dune için 10 sonuç geldi. Bu farklı sonuçlar ağ ve uygulama durumunun değişebileceğini gösterir, sorunun tümüyle çözüldüğünü veya tam oynatım/indirmeyi kanıtlamaz. Linux ve macOS masaüstü sınanmadı. [Masaüstü kontrolü](../compatibility/desktop-189-check.json).

Nuvio Mobile 0.6.5-beta geliştirme dalında iki oynatıcı dosyasının değişikliği incelendi; eklenti ABI değişikliği saptanmadı. Ardından 23 kaynak dosyası kilidi tekrar kontrol edildi ve drift bulunmadı. [İnceleme](../compatibility/upstream-189-review.json), [kontrol](../compatibility/upstream-189-check.json), [örnek kapsam](../compatibility/coverage-189.json), [online kaynaklar](../compatibility/online-expansion-189.json).

1.8.8: 312 fixture/gerçek QuickJS testi. En son doğrulanan Nuvio sürümü **0.6.5-beta**; geliştirme dalı ilerlese de kilitli 23 dosyada drift yok. Kilit değiştirilmedi. [Upstream raporu](../compatibility/upstream-188-check.json), [yeni indirme dosyaları](../compatibility/download-expansion-188.json), [kapsam, baseline ve tekrarlar](../compatibility/coverage-188.json).

Uzantısız MKV için önceki eleme kararı gözden geçirildi: Nuvio iOS dosya gövdesini doğrudan yazar ve dosyayı MPV `loadfile` yoluna iletir. Nuvio'nun `.mp4` kayıt adı, dosyayı MP4'e dönüştürmez. Boyut/format ve gerçek video/ses denetimi geçen kaynaklar bu yola sınırlı olarak alınır. Resmî MPV masaüstü CI derlemesinde 1080p ve 4K MKV örnekleri `.mp4` adıyla tanındı ve bir kare çözüldü. Bu, fiziksel Nuvio/iPhone oynatma veya tam indirme kanıtı değildir.

1.8.4'te bir Fleabag 4K dosyasının ilk 1 MiB'ı masaüstü MPV'de bir kareyle sınandı; MP4 kayıt adı altında gerçek MKV/3840×1600 tanındı, EN-US ses ve TR-TR metin altyazı izi seçildi. Önceki 4 MiB örnek isteği zaman aşımına uğradı. Bu kısa, kesilmiş örnek tam dosya veya fiziksel Nuvio/altyazı senkronu testi değildir.

1.8.5, [Matroska dil kurallarını](https://www.matroska.org/technical/elements.html) uygular: eksik Language alanının eng varsayılanı ve BCP47 önceliği; açık bilinmeyen/boş veya kesik alanlar İngilizce sayılmaz. Masaüstü MPV küçük başlık örneklerinde ses izlerini tanıdı. Your Name 4K örneğinin ilk 1 MiB'ı Cluster'a ulaşmadığı için bir kare çözülemedi; bu, tam dosyanın bozuk olduğunu veya tam oynatımın sınandığını göstermez.

Üretilmiş JavaScript QuickJS WASM motorunda, Nuvio'nun API yüzeyine benzeyen köprüyle çalıştırılır. Bu test quickjs-kt JNI/Native köprüsünü veya fiziksel iPhone taşımasını çalıştırmaz. Fiziksel iPhone/Android, Kotlin derlemesi, tam film oynatma/indirme, offline altyazı ve sahne senkronu henüz sınanmadı.

Goojara için anonim public katalog çerezi yalnız kaynak keşfinde kullanılır. JavaScript elle yönlendirme yolunda farklı kökene geçmeden silinir; iOS otomatik yönlendirmesinin fiziksel başlık aktarımı sınanmadı. Video sonuçları katalog oturumu taşımaz. Kaynak incelemesi (20 Kasım, cihazda sınanmadı): iOS `httpRequestRaw` Ktor Darwin istemcisini kullanır, `followRedirects` bağımsız değişkenini uygulamaz (Ktor varsayılanı yönlendirmeyi izler) ve Ktor 3.4.1 oturumu `HTTPCookieStorage` olmadan kurar; yerel çerez deposu yoktur, yanıt `set-cookie` başlığı okunur. Ktor 3.4.1 `KtorNSURLSessionDelegate` yerel yönlendirmeyi `completionHandler(null)` ile kapatır; Nuvio yanıt adresini `response.call.request.url` olarak döndürür (Ktor `HttpRedirect` kodu okunmadı). Kilitli `JsBindings.kt`'deki `URLSearchParams` `keys`/`values`/`entries` içerir; QuickJS test köprüsü yalnız `searchParams.get` sunar, bu yüzden testler daha dardır.

FzTvSeries'in anonim `PHPSESSID` oturumu yalnız aynı kökendeki indirme sayfası isteğine eklenir; dosya adresi oturum veya Referer taşımaz. FzMovies'te film sayfasının oturumu yalnız `download1.php` ve `download.php` isteklerine eklenir; kural aynıdır.

Kaynak kontrolleri sabit kanonik metadata referanslarıyla gerçek public HTTP/Range ve altyazı yanıtlarını sınar; telefonun TMDB API anahtarı bu yöntemle sınanmaz. Tam katalog veya her kalitede dosya başarısı iddiası değildir.

[Yayın doğrulaması](../compatibility/github-publication.json) · [Önceki uyumluluk kayıtları](arsiv/UYUMLULUK_GECMISI.md).

1.8.8 yayımlandı: [Windows/Linux testleri](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40609766518) ve [Pages yayını](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/40609766742) başarılı. Manifest, beş sağlayıcı dosyası ve kurulum sayfası public HTTP 200 döndü; SHA/byte karşılaştırmaları yerel paketle aynı. Kaynak commit: 4c824c1002600687eca10c88f92ce11fad15b38b.

1.8.9 yayımlandı: [Windows/Linux paket testleri](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/42894719311) ve [Pages yayını](https://github.com/burhanb3/nuvio-tr-hd/actions/runs/42894717940) başarılı; yedi public dosya HTTP 200 ve yayındaki Git içerikleriyle eşleşti. Kaynak commit: bacb0f15723f2c080ad62f9f784ae907f1581f2c. Windows metin dosyalarındaki CRLF yalnız karşılaştırma için Git/Pages LF biçimine normalleştirildi.
