# 1.6.0: anime, erken sonuçlar ve Türkçe harfler

**Güncel 1.6.1:** Ana Nuvio TR HD yeniden online HLS+MP4/MKV’yi birlikte sunar; ayrı Hızlı kaynaklar kaydı kaldırıldı, Anime bağımsızdır. Grup önekli Shameless bölümü düzeltildi. Archive küçük türevleri/süre doğrulaması genişledi; yeni küçük Dune dosyası doğrulanmadı. [Geçiş, kanıt ve sınırlar](ONLINE_VE_DIZI_DUZELTMELERI.md). Aşağıdaki1.6.0 üçlü tarama düzeni tarihseldir.

## Tek bağlantıyla üç bağımsız tarama

Kurulum adresi değişmedi: https://burhanb3.github.io/nuvio-tr-hd/manifest.json . Nuvio'da depoyu yenileyin. **Dosyalar**, **Hızlı kaynaklar**, **Anime** adlarında üç sağlayıcının 1.6.0 ve etkin olduğunu kontrol edin. Eski Sites kopyasını kapalı tutun.

| Tarama | İş | Mantıksal bütçe |
| --- | --- | --- |
| Hızlı kaynaklar | PlayIMDb + VixSrc; MP4/MKV veya online HLS | 16 saniye |
| Dosyalar | HDHub + Archive + isteğe bağlı JSON/Stremio | 28 saniye |
| Anime | Animecix/Tau MP4 ve mevcut Türkçe altyazılar | 20 saniye |

Nuvio bir scraper'ın `getStreams` sonucunu tek seferde alır; o çağrıda tek tek satır ekleme callback'i yoktur. Fakat ayrı scraper'ların sonuçlarını her biri tamamlandığında birleştirir. Bu sürüm desteklenen yolu kullanır: hızlı tarama, yavaş dosya taramasının bitmesini beklemez. Aynı taramanın içindeki her dosya için anlık ekran güncellemesi sunulmaz. Telefonun başlamış native ağ işlerini bitirmesi ayrıca zaman alabilir; bu süreler fiziksel iPhone garantisi değildir.

**Ayarlar sağlayıcı başına saklanır.** Eski `nuvio-tr-hd` kimliği Dosyalar olarak korundu; kişisel JSON/Stremio ayarları orada kalır. Yeni iki tarama kendi varsayılanlarıyla başlar. Özel altyazı adresi, sıralama veya sıkı TR filtresi kullanıyorsanız ilgili taramada da ayarlayın. Varsayılan Tümü/20/küçükten büyüğe; 20 sınırı her tarama içindir, toplamda daha fazla satır çıkabilir. Boyut/kalite sırası tarama içinde uygulanır; Nuvio'nun kaynak grupları arasındaki genel sıralamasını plugin belirleyemez. Tek başlık isteyenler Nuvio'nun depoya göre gruplama ayarını kullanabilir.

HDHub artık release bağlantısı çözülür çözülmez dosya doğrulamasına yollar. Bozuk bir küçük ayna, diğer dosyaların tarama bitene kadar beklemesine yol açmaz. En çok 12 release, gerçek dosya kontrolleri ve sınırlı eşzamanlılıkla denenir. Aynı altyazı gövdesi yalnız bir kez çözülür; hash sorgusu ilk üç farklı sorguyla sınırlanır. Ortak film/bölüm altyazı araması diğer dosyalarda da sürer.

## Anime eşleştirmesi

TMDB metadatasında Japonca/Japonya + animasyon olan film/diziler aranır. TMDB'nin İngilizce görünen başlığı aramaya yardımcı olur; kabul için **TMDB ID + özgün başlık + ilk yayın yılı** birlikte gerekir. Varsa IMDb çelişkisi reddedilir. Animecix bölüm kaydı ve Tau video yanıtı aynı title ID, sezon ve bölüm numarasını taşımalıdır. İlk arama sonucunu seçme veya S02E01'i tahmin ederek mutlak bölüm 13'e çevirme yoktur; bu yüzden bazı anime sezonları henüz boş kalabilir.

Birden fazla çeviri/encode ve farklı çözünürlük bulunabilir. API'nin `1080p` veya dosya boyutu beyanı doğrulama sayılmaz; gerçek MP4/MKV byte toplamı ve video track pikseli okunur. Türkçe SRT/VTT aynı kimliğe göre ayrıca aranır. `TR kaynak` tek başına ayrı ya da gömülü altyazı kanıtı değildir. Videoya yakılmış altyazı otomatik algılanmadı; zaten yazılı bir videoda ikinci harici altyazı üst üste binerse oynatıcıdan hariciyi kapatın.

MKV içinde gerçek Türkçe altyazı izi bulunursa `TR içi` görünür. Dil ve desteklenen codec bilgisi konteynerden okunur; dosya adı tek başına kanıt değildir. Bu iz indirilen MKV'nin içinde kalır. İz metadata'sı tam oynatma, cihaz codec desteği veya sahne senkronu testi yerine geçmez.

## “ş” harfi başka yazı tipinde görünüyorsa

`ş` doğru harf olarak görünüyor ama şekli diğerlerinden farklıysa olası neden **font fallback**: seçilen fontta o harf bulunmayınca oynatıcı başka fonttan alır. Nuvio iOS 0.6.4-beta `MPVPlayerBridge.swift` içinde varsayılan `sub-font` açıkça **Noto Sans CJK SC** olarak seçilir. Bu seçim Japonca/Çince/Korece kapsamına yöneliktir. Dahası, uygulamayla gelen gerçek OTF dosyasının cmap tablosu sınırlı byte aralıklarıyla okundu: **ş/Ş/ğ/Ğ/ı/İ glifleri yok; ç/Ç/ö/Ö/ü/Ü var.** [Font kanıtı](../compatibility/ios-font-160.json). Bu, karışık font görünümü için somut uygulama bulgusudur; kullanıcının kurulu sürümü/görüntüsü cihazda doğrulanmadı. Altyazı stil paneli font boyutu/renk sunar; plugin ABI'sinde font ailesi alanı yoktur.

`ÅŸ`, `Ä±`, `�` gibi yazılar ise karakter kodlaması/önceden bozulmuş metin işaretidir. Harfin ayrık Unicode birleştirme işaretleriyle yazılması ya da dosyadaki `<font>` etiketleri de görünümü etkileyebilir.

Eklenti UTF-8 ve cue yapısını doğrular. Hata ayıklama özetine geçersiz UTF-8, Türkçe harf, birleştirme işareti, inline font ve bozuk kodlama **sayaçları** eklendi; altyazı metni/adresi günlüğe yazılmaz. Bu tanı, oynatıcının fontunu değiştirmez. Uzak dosyayı yalnız bellekte normalize etmek de işe yaramaz; Nuvio altyazıyı orijinal URL'den yeniden indirir.

**Bu sürümde iOS font sorunu giderildi iddiası yoktur.** Kalıcı uygulama çözümü, Latin/Türkçe harfleri tam kapsayan bir varsayılan font ve CJK yedeği ya da font ailesi seçeneğidir. Bu Nuvio uygulamasında yapılmalı ve iPhone'da test edilmelidir. Rastgele karakter değiştirme veya ölçmeden altyazı kaydırma uygulanmadı.

## Canlı kontrolün sınırı

26 Ekim 2026 bilgisayar kontrollerinde Death Note S01E01 için 90–229 MiB 480p/720p MP4 + dört TR SRT; Attack on Titan S01E01 için 165–569 MiB 480p/720p/1080p MP4 + üç TR SRT geldi. İlk taramalar yaklaşık 5,6 ve 6,7 saniye sürdü. Spider-Man'de ilk online grup 4,2 saniyede, dosyalar yaklaşık 14 saniyede geldi; 665,6/835,3 MiB MP4 ve 2,64 GiB MKV vardı. Bunlar sonraki aramada erişim/süre garantisi değildir.

Dune ve GOT bu denemede online/TR verdi; dosya aynaları ağ hatası verdi. Dune için MoviesMod/DriveSeed sayfasında 1,3 GB olarak listelenen adres uzantısızdı ve Range isteğine 200 dönüyordu; tam videoyu tamponlamamak ve MKV'yi yanlış adla kaydetmemek için üretime alınmadı. Bu dosyanın gerçek boyutu/çözünürlüğü doğrulanmadı. MoviesDrive IMDb araması da benzer rakamlı yanlış kimlikler döndürdü; kabul edilmedi. Kaynak sayısı uydurulmadı. Küçük film/dizi dosyaları ana kapsam eksiğidir.

Fiziksel iPhone, tam oynatma, tam indirme, uçak modu ve ses/altyazı senkronu testleri yapılmadı. Raporlar `compatibility/pipeline-*-160.json` içindedir.

## İncelenen birincil kaynaklar

- [Nuvio StreamsRepository: bağımsız tamamlanan scraper sonuçları](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/streams/StreamsRepository.kt)
- [Nuvio iOS MPV font seçimi](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/iosApp/iosApp/Player/MPVPlayerBridge.swift)
- [Nuvio altyazı stil paneli](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/player/SubtitleStylePanel.kt)
- [Animecix kaynak yöntemi referansı](https://github.com/fmustafayaman/turkish-nuvio/tree/main/src/animecix) — algoritma/API araştırması; bağımlılık, üçüncü taraf anahtarı veya kaynak kod kopyası eklenmedi.
- [Streamline kaynak yöntemi referansı](https://github.com/itsmeadarsh2008/Streamline/tree/main/src/_shared/sources) — ek dosya kaynakları araştırması; bulunan link gerçek dosya testi yerine sayılmadı.
