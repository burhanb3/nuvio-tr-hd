# Nuvio Kotlin Multiplatform uyumluluğu

**1.7.2 — 26 Ekim:** mevcut ABI korunur; quality/size/language üçü her sonuçta string. Native0.6.4-beta StreamFetchSupport bu alanları sırayla birleştirir; PluginRuntime altyazı listesindeki ISO tr/en ve headers alanlarını taşır, dört-eleman kısıtı yoktur.168 test/gerçek QuickJS, [20 kilitli dosya kontrolü](../compatibility/upstream-172-check.json); drift yok/lock değiştirilmedi. Dört+ dört altyazı seçeneği sunmak iki dilin telefonda birlikte offline indirildiği kanıtı değildir. [TR/EN ve kartlar](TR_EN_VE_KARTLAR_172.md).

**1.7.1 — 26 Ekim:** ABI değişmedi;156 fixture/gerçek QuickJS. [Güncel20dosya denetimi](../compatibility/upstream-171-check.json):0.6.4-beta, HEAD`7de46ead80c28ccd008cfd92bd69947e487992d0`, drift yok; lock değiştirilmedi. İç media-probe seçeneği native fetch’e taşınmaz. Bitmemiş native dosya fetch limiti3, altyazı4; mantıksal timeout fiziksel iPhone garantisi değildir. Release0.6.4-beta iOS ExternalPlayerPlatform/LaunchCoordinator ve PlaybackSettingsPage kaynaklarında mevcut VLC/altyazı aktarma yolu incelendi; cihaz/offline aktarım yapılmadı. [Türkçe font rehberi](IPHONE_TURKCE_FONT.md).

**1.7.0 — 26 Ekim:** ABI/manifest kimlikleri değişmedi; 153 fixture/gerçek QuickJS testi. Resmî 0.6.4-beta ve cmp-rewrite HEAD 7de46ead80c28ccd008cfd92bd69947e487992d0 için 20 kilitli dosyada drift yok; kilit güncellenmedi. [Denetim](../compatibility/upstream-170-check.json). Ayrı ses URL’si ve plugin font seçimi alanı yok. iOS font yaması yalnız kaynak uygulanabilirliğiyle kontrol edildi; derleme/telefon kurulumu yapılmadı. Yeni native canlı liste callback’i yok.

**1.6.4 — 26 Ekim:** manifest ve getStreams/onSettings ABI’si aynı. İç altyazı grup/track callback’leri yalnız bu sağlayıcının uygulamasıdır; native canlı liste callback’i değildir. İç `nativeGroup` seçeneği fetch köprüsüne aktarılmaz; alttaki fetch bitmeden altyazı ağ kotası serbest bırakılmaz. 140 fixture/QuickJS testi ve 0.6.4-beta / güncel HEAD üzerinde 20 dosya doğrulaması; [upstream raporu](../compatibility/upstream-164-check.json). Native iptal yok sayılma simülasyonu gerçek cihaz testi değildir. Fiziksel iPhone/tam indirme/çevrimdışı/senkron yapılmadı.

**1.6.3 — 26 Ekim:** 128 yerel test ve üretilmiş paketlerin gerçek QuickJS testi başarılı. Aynı gün resmî 0.6.4-beta ve cmp-rewrite HEAD `56ae37081afaff820b6073da84e711320238de36` üzerinde 20 kilitli dosya doğrulandı; drift yok, kilit değiştirilmedi. [Denetim](../compatibility/upstream-163-check.json). Manifest/ABI değişmedi. 14 vakalık sabit TMDB referansı + gerçek kaynak/altyazı kontrolü, native ağ köprüsü ve fiziksel iPhone testi değildir. Dar dosya pinleri hash aramasını altyazı ayarı kapalıyken de zorunlu yapar. Tam oynatma, indirme, senkron ve çevrimdışı testi yapılmadı.

**1.6.2 — 26 Ekim:** 114 yerel test/QuickJS, GitHub Windows/Linux ve Pages başarılı; beş public varlık HTTP 200 ve SHA eşitliği doğrulandı. onSettings içindeki ağsız Tanı info alanı mevcut ABI’yı kullanır; sürüm build sırasında gömülür. TMDB key enjeksiyonu, native ID normalizasyonu ve iOS fetch60s/Abort eksikliği kaynakta tekrar incelendi. Kilitli20dosyada drift yok; compatibility/upstream-162-check.json. Lock değiştirilmedi. HLS opsiyonel sorguları azaltmak fiziksel iPhone dönüş garantisi değildir. [Tanı ve sınırlar](IPHONE_BOS_SONUC_162.md).


**1.6.1 — 26Ekim:** eski scraper ID tek başına online ve dosya döndürür; manifestte ana+anime iki kayıt vardır. Eski online JS yolu uyumluluk için üretilir ama kurulum girdisi değildir. ABI aynı, yeni ana paket gerçek QuickJS’te tek başına karma sonuç ve Shameless grup önekiyle test edildi.20kilitli dosya/güncel0.6.4-beta doğrulaması compatibility/upstream-161-check.json. Fiziksel cihaz testi yok. [Ayrıntılar](ONLINE_VE_DIZI_DUZELTMELERI.md).

**1.6.0 kontrolü — 26 Ekim 2026:** 0.6.4-beta üzerinde bağımsız scraper tamamlamalarının birleştirildiği StreamsRepository incelendi; aynı dosya güncel cmp-rewrite dalında da aynı SHA’da. İncelenen bu dosya kilide eklenerek 20 dosyaya çıkıldı; önceki 19 dosya değiştirilmedi. Üç CommonJS giriş, movie/tv, getStreams ve onSettings ABI’si kullanılır; streaming callback veya font alanı uydurulmadı.

Yerel100/100 ve GitHub Actions Windows/Linux doğrulaması başarılı. Üç üretilmiş paket QuickJS’te sınandı. GitHub Pages1.6.0 manifest/üç sağlayıcı/sayfa HTTP200 ve yerel hash eşitliği [yayın kanıtında](../compatibility/github-publication.json). iPhone/tam oynatma/indirme/senkron hâlâ çalıştırılmadı.

Yeni kanıtlar: [upstream](../compatibility/upstream-160-check.json), [tamamlama ve iOS font kaynağı](../compatibility/architecture-and-font-160.json), [kurulum/sınırlar](ANIME_HIZ_VE_ALTYAZI.md). Kaynak/QuickJS doğrulaması fiziksel cihaz testi değildir. 1.5.0 ve daha eski aşağıdaki notlar kendi tarihlerine ait gözlemlerdir.

**Güncel 1.5.0 kontrolü (25 Ekim 2026):** resmî 0.6.4-beta ve cmp-rewrite HEAD 56ae37081afaff820b6073da84e711320238de36 üzerinde kilitli 19 sözleşme dosyası değişmemiştir. [Yeni denetim](../compatibility/upstream-150-check.json). Kilit incelemesiz yenilenmedi. Native supportedTypes movie/tv uygundur; series/show/other tv'ye normalize edilir. Kaynak tipi hatası yüzünden manifestin diziyi gizlediği doğrulanmadı: asıl sorun taramada boş sonuçtu.

Nuvio [ProviderFilterRow.kt](https://github.com/NuvioMedia/NuvioMobile/blob/cmp-rewrite/composeApp/src/commonMain/kotlin/com/nuvio/app/features/streams/ProviderFilterRow.kt) boş ve yüklenmeyen grupları kaynak filtresinde gizler. [StreamFetchSupport.kt](https://github.com/NuvioMedia/NuvioMobile/blob/cmp-rewrite/composeApp/src/commonMain/kotlin/com/nuvio/app/features/streams/StreamFetchSupport.kt) name'i kart başlığı, quality/size/language alanlarını açıklama yapar; kısa görünüm buna uyar. Alt gruplar için özel accordion alanı yoktur; plugin satırları bitişik sıralar ve sayı öneki native alfabetik sıralamada korunur.

Yeni HLS master servisi kaynak/fixture testinden geçti ama mevcut Sites hesabına erişim olmadığı için üretime yayımlanmadı. Sağlık yanıtında features.hlsProfiles true olmadan yeni yol kullanılmaz. Önceden çalışan 1.4.0 dosya köprüsü korunur.

**Fiziksel iPhone/Android, Kotlin derlemesi, tam film oynatımı ve indirme henüz yapılmadı.** Kaynak/QuickJS testi bunların yerine geçmez. Aşağıdaki önceki sürümlere ait bölüm ve sayılar tarihsel kayıtlardır.


**1.3.0 dağıtım notu:** GitHub Pages sürümü doğrudan kaynak tarar; isteğe bağlı Worker eski Sites hesabına erişilemediği için üretime yayımlanmadı. Ortak tarama varsayılan kapalıdır. Yeni doğrudan VixSrc HLS format son eki, native `isSupportedDownloadUrl` filtresinin `.m3u8` kontrolüyle birlikte sınandı; HLS dosya indirmesi sunulmaz. Kaynak sözleşmesi güncel 0.6.4-beta ve 25 Ekim güncel dalda tekrar doğrulandı; rapor `compatibility/upstream-current-check.json`. Fiziksel yeni sürüm cihaz testi bekler.


Kontrol tarihi **25 Ekim 2026**. [Resmî son sürüm](https://github.com/NuvioMedia/NuvioMobile/releases/tag/0.6.4-beta): `0.6.4-beta`, 23 Ekim 2026. Release commit: `bcd62a2d6e77512597a8d693f46f035e5278cdb7`. Güncel `cmp-rewrite` HEAD: `c114d6fb69fbed2bbed1f728bce7d752b5a19158`. İncelenen 19 sözleşme/platform dosyasının kilitli Git blob SHA'ları güncel dalda doğrulandı.

## Ne doğrulandı?

| Katman | Durum | Kanıt |
| --- | --- | --- |
| Manifest ve scraper alanları | Kaynak sözleşmesi doğrulandı | `scrapers`, `filename`, `supportedTypes`, `hasSettings`, platform alanları |
| JavaScript giriş noktası | Kaynak sözleşmesi doğrulandı | `module.exports.getStreams(tmdbId, mediaType, season, episode)` |
| Ayarlar | Kaynak sözleşmesi ve QuickJS testi | `SCRAPER_SETTINGS`, `TMDB_API_KEY`, `onSettings()` |
| Akış/altyazı dönüş alanları | Kaynak sözleşmesi ve fixture testi | String kalite/boyut; `headers`; `subtitles[].url/language/name/headers` |
| QuickJS çalıştırma | Gerçek WASM motorunda başarılı | Üretilmiş sağlayıcı, MP4/MKV, Türkçe altyazı, bozuk JSON |
| Native indirme/altyazı bağlantısı | Kaynak kodu incelendi | Plugin altyazıları `externalSubtitles` → `sourceSubtitles` akışı |
| Otomatik kaynak + TR eşleştirme | Canlı sınırlı okuma başarılı | 1080p MKV + Türkçe VTT; sürüm benzerliği, tam senkron testi değil |
| Varsayılan sağlayıcı akışı | Canlı servisler / sabit referans metadata ile başarılı | 1.2.0: 30 saniye mantıksal bütçe; Dune HLS+TR / Spider-Man MKV+TR raporları |
| Android fiziksel telefon | Çalıştırılmadı | Aşağıdaki kabul testi gerekli |
| iOS fiziksel telefon | Çalıştırılmadı | Aşağıdaki kabul testi gerekli |
| Tam Kotlin/Gradle uygulama derlemesi | Çalıştırılmadı | Bu depo JavaScript plugin deposudur |

Bu kanıtlar plugin'in güncel kaynak sözleşmesini izlediğini ve gerçek QuickJS içinde çalıştığını gösterir. Telefonlardaki native `quickjs-kt 1.0.15`, ağ köprüleri, codec desteği ve indirme yöneticisinin uçtan uca doğrulandığı anlamına gelmez. Genel mağaza varyantları yerine **Full** varyantları hedeflenir.

## Resmî kaynaklar

- [PluginModels.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/plugins/PluginModels.kt): `PluginManifest.scrapers`, scraper alanları ve `PluginRuntimeResult`/`PluginSubtitleResult`.
- [PluginManifestParser.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/PluginManifestParser.kt): boş olmayan ad/sürüm ve scraper listesi zorunluluğu.
- [PluginRepository.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/PluginRepository.kt): manifest URL'sine göre göreli scraper dosyası çözümü ve platform filtresi.
- [JsBindings.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/runtime/js/JsBindings.kt): dört argümanlı ABI, global ayarlar, fetch/URL polyfill davranışı.
- [PluginSettingsDialog.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/PluginSettingsDialog.kt): `header/info/text/select/toggle` form alanları.
- [PluginRuntime.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/runtime/PluginRuntime.kt): 60 saniye host bütçesi, CommonJS sarma, sonuç/altyazı parserı.
- [FetchBridge.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/runtime/network/FetchBridge.kt): ağ isteği ve binary `bodyBase64` köprüsü.
- [StreamFetchSupport.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/streams/StreamFetchSupport.kt): header ve altyazıların oynatma modeline aktarımı.
- [DownloadsRepository.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/downloads/DownloadsRepository.kt): HTTP dosyaları, HLS/DASH URL filtresi, dosya uzantısı ve kaynak altyazıları.
- [DownloadSubtitles.kt](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/downloads/DownloadSubtitles.kt): indirilmiş videoya harici altyazı hazırlama/kaydetme.
- [Android raw HTTP](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/androidMain/kotlin/com/nuvio/app/features/addons/AddonPlatform.android.kt) ve [iOS raw HTTP](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/iosMain/kotlin/com/nuvio/app/features/addons/AddonPlatform.ios.kt): platform ağ farkları.

## Bilinen native sınırlar

1. **İptal:** fetch polyfill `signal` değerini native köprüye aktarmıyor. Genel isteklerde 4,5 saniye, ortak servis isteğinde 16 saniye ve toplamda 24 saniye telefon bütçesi vardır; başlamış native istekler JS zaman aşımı sonrasında çalışmaya devam edebilir ve gerçek dönüşü geciktirebilir. Public kaynaklar 13 saniye bütçeli sunucu taramasında çalışır. Uygulamanın 60 saniyelik bütçesi ayrıca geçerlidir.
2. **iOS gövde okuma:** iOS `httpRequestRaw`, gövdeyi `ByteArray` olarak aldıktan sonra sınırlar. Range'i yok sayan sunucuda gereğinden fazla veri aktarımı/bellek tüketimi olabilir. Sağlayıcı yanlış büyük yanıtı kabul etmez; native tarafın daha önce okumasını engelleyemez. Android sınırlı okuma yapar. Genel raw yanıt sınırı 1 MiB'dir.
3. **iOS yönlendirme:** iOS implementasyonu `followRedirects` parametresini uygulamıyor. Sağlayıcının manuel yönlendirme/köken kontrollerinin tümü iOS native yönlendirmelerinin önüne geçemez. Özellikle kimlik başlığı isteyen kaynaklarda güvendiğiniz doğrudan dosya adreslerini kullanın.
4. **İndirme yeteneği alanı:** `PluginRuntimeResult` içinde `downloadable` alanı bulunmuyor. Nuvio'nun indirme filtresi `.m3u8/.mpd` uzantısına bakıyor. Bu yüzden dosyalar önce gelir, HLS yalnız oynatma etiketi taşır ve uzantısız HLS elenir. 1.2.0 ile çevrimiçi HLS alternatifleri varsayılan açıktır.
5. **Uzantısız MKV:** uygulama uzantıyı URL'den üretip yoksa MP4 varsayıyor. Uzantısız MKV gösterilmez. İmzalı `.mkv?token=...` URL'ler desteklenir.
6. **Ayar gizliliği:** incelenen ayar formunda metin alanı için parola maskelemesi uygulanmıyor. Sağlayıcı anahtar alanını gizli kasa gibi tanıtmaz. İsteğe bağlı anahtarı ve erişim URL'lerini kendi profilinizde saklayın.
7. **Otomatik altyazı:** native dil eşlemesi ISO `tr` / `tur` kodunu kullanır. Sağlayıcı `tr` döndürür. Tercih edilen dilin Türkçe olması ve önceki manuel kapatma seçiminin kaldırılması kullanıcı profilinde bir kez ayarlanmalıdır. Plugin bu tercihleri zorla değiştiremez. Kaynak altyazı başlıklarının online `AddonSubtitle` yoluna aktarımı native tarafta sınırlıdır; yerleşik servisler genel erişimli URL kullanır.
8. **Zamanlayıcı ve native işlerin tüketilmesi:** Nuvio `JsBindings.timerPolyfill()` içindeki `clearTimeout`, yalnız `__plugin_timers[id]` kaydını siler; `__plugin_sleep` iptal olmaz. [quickjs-kt v1.0.15 native çalışma zamanı](https://github.com/dokar3/quickjs-kt/blob/v1.0.15/quickjs/src/nativeMain/kotlin/com/dokar/quickjs/QuickJs.native.kt), `pumpJobs` içinde aktif native işler bitmeden dönmez. Böylece eski 42 saniyelik zamanlayıcı, sonuç erken yakalansa da değerlendirme bitişini geciktirebilir. 1.2.0 ortak scheduler ile en çok 100 ms'lik native uyku bırakır. QuickJS regresyon testi iptal edilmeyen native timer ve çağrı sonrası iş tüketimini taklit eder; JNI/Native motorunu telefonda çalıştırmaz.

## Canlı kaynak gözlemi — 25 Ekim 2026

Son yerel `npm run check` çalıştırması: **68 test başarılı**, hata yok. Birim/adaptör, manifest ABI, süre bütçesi, hash, sıralama, 6/10/20 sonuç ayarı, MP4/MKV, Türkçe altyazı ve gerçek QuickJS testlerini kapsar. GitHub Actions işleri dosya olarak hazırlandı; uzak GitHub çalıştırması veya Pages yayını yapılmadı.

1.1.1'in Sites yayınına ait ilk kayıt ve sonraki güncelleme doğrulamaları yayın raporunda tutulur. [Yayın kontrol kaydı](../compatibility/publication.json), manifestin ve sağlayıcı dosyasının oturumsuz HTTP 200 yanıtlarını ve yerel dosyalarla SHA-256 eşitliğini kaydeder. Kurulum adresi: https://burhanb3.github.io/nuvio-tr-hd/manifest.json. Bu kontrol telefon üzerinde plugin kurulum testi değildir.

[Sınırlı okuma raporu](../compatibility/live-check.json): Night of the Living Dead (1968) için üç sağlayıcı aday döndürdü. DahmerMovies dosya CDN'i bu ağda 403/429 ile elendi. Internet Archive'da **1488×1080 MKV**, yaklaşık 96,6 dakika gerçek konteyner süresi ve OpenSubtitles hash'i doğrulandı; dört Türkçe VTT gövdesi bulundu. En iyi altyazı kanıtı sürüm benzerliğiydi (puan 76); işitsel/görsel senkron doğrulanmış sayılmaz. Düşük kaliteli MP4 varyantı da ayrı doğrulandı ve varsayılan 720p filtresinde elenir. PlayIMDb'nin örnek sonuçları HLS olduğundan dosya indirmesi olarak sunulmadı.

1.1.1 tarihsel [akış raporu](../compatibility/pipeline-live-check.json): TMDB referans metadatası sabit verilerek, diğer kaynak ve altyazı istekleri canlı çalıştırıldı. Gerçek `createProvider/getStreams` iş akışı, varsayılan 42 saniye bütçesi / 720p filtresi / Türkçe altyazı zorunluluğuyla yaklaşık **17 saniyede** 1080p MKV + dört Türkçe VTT sonucu döndürdü. Okunan veri yaklaşık 1,5 MB idi. Bu kontrol TMDB'nin canlı erişilebilirliğini veya telefonun native köprüsünü sınamaz; TMDB ABI'si fixture/kaynak kontrollerinde ayrıca incelenir.

Tam film indirilmedi. Kaynak servisleri değişebildiğinden bu gözlem sonraki gün/başka ağ için kullanılabilirlik garantisi değildir. Telefon üzerinde oynatma, sesle senkron ve tam çevrimdışı indirme kabul testleri aşağıda açık bırakılmıştır.

## # 1.2.0 / kullanıcının iPhone bildirimi

Kullanıcı 1.1.1 üzerinde Dune (2021) ve Spider-Man aramalarında uzun bekleme/boş sonuç bildirdi. Yeni sürümün fiziksel iPhone testi henüz yapılmadı. 25 Ekim canlı kaynak tekrarı:

- [Dune raporu](../compatibility/pipeline-dune-check.json): yaklaşık 11 saniyede üç HLS oynatma listesi + ikişer Türkçe VTT. En iyi altyazıda tam sürüm adı eşleşti. Dosya CDN'i 403/429; **indirilebilir MP4/MKV doğrulanamadı**.
- [Spider-Man raporu](../compatibility/pipeline-spider-man-check.json): yaklaşık 9 saniyede gerçek **3840×2160 MKV + üç Türkçe VTT**. MKV yaklaşık **85,5 GiB**; altyazı kanıtı sürüm benzerliği/süre uyumu. Düşük çözünürlüklü MP4 türevleri elendi.

İki komut da TMDB referans metadatasını sabit verir; diğer kaynak/altyazı istekleri canlıdır. Master HLS listesi ve sınırlı dosya aralıkları/SRT-VTT gövdeleri okundu; video segmentleri, tam film, codec oynatımı ve sesle senkron test edilmedi. Güncelleme ve ayar adımları [sorun giderme rehberindedir](SORUN_GIDERME.md).

## Yeniden doğrulama

```powershell
npm run check
npm run verify:upstream
```

Denetim resmî GitHub API üzerinden en son release etiketini, güncel dalı, kritik ABI parçalarını ve [kilitteki](../compatibility/upstream-lock.json) blob SHA'larını karşılaştırır. Rapor `.cache/upstream-report.json` dosyasına yazılır. Ağ/API hatası başarılı doğrulama sayılmaz. Yeni release veya dosya farkı olduğunda iş başarısız olur; değişen kod incelenmeden kilit güncellenmemelidir. GitHub Actions aynı kontrolü haftalık çalıştırır.

Upstream güncellenirse: değişen manifest/runtime/ağ/indirme dosyalarını okuyun, etkisini belirleyin, modülleri uyarlayın, testleri çalıştırın, aşağıdaki cihaz kabul testini yineleyin. Sonra kilidi, bu raporu, hafızayı ve sürüm notlarını gerçek sonuçlarla güncelleyin.

## 1.3.0 ortak tarama ve kullanıcı gözlemi

**GitHub üretim yayını:** [yayın kanıtı](../compatibility/github-publication.json). GitHub Actions Windows/Linux testleri ve Pages yayını başarılı; manifest/sağlayıcı/sayfa oturumsuz HTTP 200 ve yerel dosyalarla aynı. Doğrudan Dune tekrarı 4 sonuç (VixSrc Türkçe dahil), Spider-Man tekrarı 7 sonuç döndürdü. Son Spider-Man denemesinde Türkçe servisi sonuç vermediği halde video listesi korundu. Sunucu/cache yerelde hazır ama üretimde yok; GitHub sürümü ortak tarama kapalıyken çalışır. Bu yayın fiziksel iPhone testi yerine geçmez.

Kullanıcı iPhone'da küçük Spider-Man MP4'ünün üç Türkçe altyazıyla açıldığını, senkronun uygun göründüğünü bildirdi. Bu geliştirici tarafından yürütülmüş tam indirme/çevrimdışı test değildir. Tekrar arama başarısızlığı üzerine public tarama sunucuya taşındı; kısa cache, TR başarısızlığında videoyu koruma ve VixSrc eklendi. Yeni varsayılanlar Tümü / 20 / Türkçeyi tercih et.

Kaynak eşleştirmesi, dosya doğrulaması ve altyazı yüklemesi sunucuda aynı sağlayıcı çekirdeğiyle yapılır. Telefon ortak sonuçların TMDB/başlık/yıl ve URL sınıfını tekrar denetler. Kişisel kaynaklar yereldir. HLS profili çözünürlük beyanı ayrıca yazılır; gerçek piksel olarak sunulmaz. Sunucu yalnız küçük HLS master'ı proxy'ler, video/audio segmenti taşımaz. [Servis mimarisi](../hosting/README.md).

## Telefonda kabul testi — henüz tamamlanmadı

- [ ] Full Android sürümünde manifest ekleniyor, tek sağlayıcı ve ayarları görünüyor.
- [ ] Full iOS sürümünde aynı kurulum ve ayarlar çalışıyor.
- [ ] Kullanıcının erişebildiği gerçek MP4 ve MKV dosyaları doğru filmde görünüyor.
- [ ] Aynı adlı farklı yıl/TMDB ve farklı dizi bölümü sonuçları eleniyor.
- [ ] Piksel boyutları bağımsız medya incelemesiyle uyuşuyor; okunamayan çözünürlük Bilinmiyor.
- [ ] Türkçe UTF-8 SRT ve VTT oynatıcıdan seçiliyor; Türkçe karakterler düzgün.
- [ ] İndirilen MP4 ve MKV uçak modunda açılıyor; kaynak altyazıları çevrimdışı seçiliyor.
- [ ] 403, 404, süresi dolmuş URL, HEAD 405, yanlış range ve ağ kesintisi uygulamayı çökertmiyor.
- [ ] HLS varsayılan açık; yalnız oynatma etiketi var ve indirme sunulmuyor. Önceki kayıtlı kapalı ayar elle açılabiliyor.
- [ ] İndirme sırasında yönlendirme/erişim başlıkları ve telefonun arka plan davranışı ayrıca kontrol edildi.

Sonuçları uygulama sürümü, platform, tarih ve kişisel bilgileri temizlenmiş gözlemle kaydedin. Gerçek erişim tokenlarını rapora eklemeyin.

## 1.4.0 ek kontrol (25 Ekim 2026)

verify:upstream, 0.6.4-beta ve güncel cmp-rewrite HEAD 56ae37081afaff820b6073da84e711320238de36 üzerinde kilitli 19 dosyada drift bulmadı; kilit incelemesiz yenilenmedi. PluginSubtitleResult offset alanı taşımıyor. Nuvio AutoSync Android internal ExoPlayer ve gömülü referans altyazıya bağlı; iOS desteklenmiyor: [resmî AutoSync belgesi](https://github.com/NuvioMedia/NuvioMobile/blob/cmp-rewrite/docs/subtitle-autosync.md). Native indirme uzantıyı source URL yolundan seçtiği için gerçek dosya köprüsü .mkv/.mp4 yoluyla sınanır. HEAD/GET Range doğrulaması tam native indirme ve cihaz codec testi değildir.
