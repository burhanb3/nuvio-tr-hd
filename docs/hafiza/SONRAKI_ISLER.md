# Sonraki işler

- Son durum: masaüstü Nuvio TR HD artık Start-NuvioTRHD.ps1 üzerinden açılır. Kullanıcı yeniden aynı hata bildirdiğinde özgün kurulum çalışıyordu; nedeni kesinleşmedi. CheckOnly ve gömülü Java17 penceresiz classpath probe geçti. Kullanıcı kontrollü başlatıcıyla deneyip hata sürerse çalışan yol ve gerçek kaynak raporu birlikte incelenmeli. Tekrar UI başarısı/tam indirme doğrulanmış sayılmamalı.

## 2.0.6 — 26 Kasım 2026

1. **Yayımlandı (`6ec9cb5`):** Test ve paket `45883477156` ve Pages `45883477139` başarılı; 10 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı):**
   - Depo yenilenmeli, kaynak ekranında yenile düğmesine basılmalı; `Tanı · 2.0.6` görünmeli.
   - **The Matrix:** `İndirilebilir · JetFilmizle` 1080p (~3,1 GB, "Sitede Türkçe altyazılı olarak etiketlenmiş") satırı oynatılmalı. Türkçe altyazının görüntüde olup olmadığı not edilmeli. Görüntüdeyse dış TR altyazı da seçilirse iki altyazı üst üste biner; oynatıcıda dış altyazı kapatılmalı. Dublaj 360p satırı da gelmeli.
   - **Stranger Things S1E1:** "Nuvio TR HD · HDRezka" altında 4 satır (240p–720p) gelmeli; biri indirilip açılmalı.
   - **Breaking Bad S1E1 ve Stranger Things S1E1 (ana liste):** 4KHDHub satırı gelip gelmediği not edilmeli (TMDB afiş bağlaması cihazda doğrulanmadı).
   - Bir filmde ana liste beklenmedik şekilde boş gelirse yenile düğmesine basılmalı ve not edilmeli (simülasyonda bir kez 4KHDHub/HubCloud tarafında 60 sn asılma görüldü, KARARLAR 2.0.6).
3. **Açık kalanlar:**
   - Altyazılı JetFilmizle dosyalarında ses izi dili Shadow's Edge ve The Mummy'de okunamadı; bu dosyalarda "Ses" etiketi sitenin iddiasıdır.
   - 4KHDHub dizi zinciri sayfa afişiyle elle bağlanınca Breaking Bad S1E1'de 1 doğrulanmış dosya verdi (Pixeldrain 1080p, PROJE 2.0.6). Telefonda TMDB afişiyle bağlanıp bağlanmadığı görülmeli.
   - FzTvSeries CDN'i bu bilgisayardan bazen açılıyor (Stranger Things S1E1, Shameless satır verdi), bazen açılmıyor.
   - Severance'ta dış Türkçe altyazı yok; Türkçe yalnız 4KHDHub MKV'lerinin gömülü izinde. HDRezka ve FzTvSeries dosyaları Türkçesiz kalıyor. Yeni bir anahtarsız TR kaynağı çıkarsa yeniden bakılır.
   - JetFilmizle altyazılı sekmesi başarısız olduğunda JetFilmizle ~2 sn geç biter (Night Patrol 3,6–4,8 → 5,6–6,4 sn); dublaj satırı düşmedi. Ana listede gecikme sorun olursa ikinci Gold denemesi sınırlanabilir.
   - Türkçe dublajlı film için bu turda yalnız JetFilmizle incelendi; yeni Türkçe film sitesi denenmedi.
4. **Sonraki konu (kullanıcıyla):** Nuvio fork/PR ile iOS arka plan indirmesi ve "Sezonu indir" (aşağıdaki iOS indirme notu).

## Nuvio iOS indirme davranışı (26 Kasım 2026, kaynak okundu, cihazda denenmedi)

- **Kaynak:** 1.0.1 etiketi `3cfc311` ve ana dal `6d2fdab`: `DownloadsPlatformDownloader.ios.kt` (ikisinde aynı), `DownloadsRepository.kt`, `DownloadsScreen.kt`, `Info.plist`.
- **Arka plan:**
  - iOS indirmesi normal (ön plan) `NSURLSession` veri görevidir; arka plan oturumu değildir. Uygulama askıya alınınca aktarım durur.
  - `.part` dosyası kalır ve devam, Range (`bytes=N-`) ile sürdürülür.
  - `pauseDownloadsForAppBackground()` var; çağıranı okunan dosyalarda bulunamadı.
  - `Info.plist` arka plan modu yalnız `audio`.
  - Android'de arka plan indirmesi Eylül 2026'da eklendi (`3c239664`); iOS'ta yok.
  - Çözüm Nuvio tarafında: arka plan `NSURLSession` indirme görevi. Eklenti bunu değiştiremez.
- **Ağ değişimi:**
  - `waitsForConnectivity = true` ve 24 saatlik kaynak süresi var; 0.6.5-beta'da da vardı (dosya Nisan 2026'dan beri).
  - Eklenti yalnız Range'e doğru 206 ile yanıt veren dosyaları İndirilebilir listeler (`http.bytes`). Bu, devamın çalışması için gerekli.
  - Özel bir ağ değişimi düzeltmesi yazılmadı.
- **Toplu indirme:**
  - `enqueueFromStream` bölüm başına tek satır alır. Eklenti bölüm başına çağrılır ve indirme başlatamaz.
  - 1.0.1'de ve ana dalda sezon indirme yok. Ana dalda (sürümde değil) yalnız "tümünü duraklat / tümünü devam ettir" düğmesi var.
- **Kullanıcının sorusu (SideStore):**
  - Nuvio değiştirilirse fork, macOS/Xcode derlemesi (ör. GitHub Actions macOS) ve SideStore ile kurulum gerekir.
  - Her Nuvio sürümünde fork güncellenmelidir. Upstream PR daha az bakım ister.
  - Karar kullanıcıda, geliştirme turundan sonra.

## 2.0.5 sonrası test turu — 26 Kasım 2026 (sürüm değişmedi)

1. **Yapıldı (bilgisayarda, ayrıntı PROJE):** CizgiMax, Hızlı İzle (DiziBox, DiziBal, KultFilmler), ana liste ve RareFilmm yeniden denendi. Eklenti hatası bulunmadı; kod ve sürüm değişmedi. 397/397.
2. **Telefonda: CizgiMax satırı gelmezse:**
   - Sağlayıcı listesinde "Nuvio TR HD · CizgiMax" açık olmalı. Ayarlarında `Tanı · 2.0.5` görünmeli.
   - Gravity Falls S1E1'de İndirilebilir 1080p satırı da mı yok, yoksa yalnız Online satırı mı? Drive satırı akıştan bağımsız gelir.
   - Kaynak listesinin başındaki yenile düğmesine basılmalı.
   - 26 Kasım 17:00 UTC'de online satır yalnız Gravity Falls S1E1'de beklenir. Diğer bölümlerde sitenin akış sunucusu 502 veriyordu (site tarafı).
3. **DiziBox izleme:**
   - Bir dizide Hızlı İzle satırları çok geç geliyorsa Hızlı İzle ayarlarında DiziBox kapatılıp yenile denenmeli. Bu durum not edilmeli.
   - İkinci bir yavaş pencere veya 60 sn'yi aşan dönüş görülürse DiziBox ayrı scraper'a taşınır (KARARLAR).
4. **İsteğe bağlı (başka nedenle sürüm çıkarsa):** DiziBox ad döngüsü, ilk ad taşıma hatasıyla düşünce ikinci adı denemeyi bırakmalı. Bu, yavaş pencerede en kötü dönüşü ~55 sn'den ~50 sn'ye indirir. İki ad yalnız özgün ad ile arama adı farklıysa denenir.

## 2.0.5 — 26 Kasım 2026

1. **Yayımlandı (`3331704`):** Test ve paket `45855931852` ve Pages `45855931799` başarılı; 10 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı; 2.0.4 listesinin yerine geçer):**
   - Depo yenilenmeli, sonra kaynak ekranında **yenile düğmesine** basılmalı; `Tanı · 2.0.5` görünmeli. Arama anahtarında sürüm yok, bu yüzden yenilemeden eski aramanın satırları görünebilir.
   - Gravity Falls S1E1 veya Adventure Time S1E1: `Online · CizgiMax` satırı gelmeli. Gelmezse kaynak listesinin başındaki yenile düğmesine basılmalı; ekranı kapatıp açmak 15 dk boyunca yeniden taramaz. Satır oynatılmalı ve 5 dk sonra ileri sarılmalı. Satırda indirme seçeneği olmamalı.
   - Listede olup açılmayan satırda önce yenile denenmeli: saklanan aramadaki bağlantılar 15 dk'ya kadar eski olabilir. Yine açılmazsa aynı ağda DiziBal (`.png` parçalar) ve KultFilmler (`.html` parçalar) satırları denenmeli.
   - Ayar değiştirince (ör. `cizgimaxOnlineEnabled` kapatma) aynı bölümde yenile düğmesine basılmalı.
   - Gravity Falls/Scooby-Doo Drive satırları, bir DiziBox bölümü ve KultFilmler (Inception) indirme/oynatma.
3. **Açık kalanlar:** `StreamsRepository.clear()`/`cancelLoading()` ve `StreamSearchSessions.clear()` çağıranları izlenmedi. Media3'ün uzantısız HLS parçalarını nasıl işlediği okunmadı. Kotlin derlemesi yok.

## 2.0.4 — 26 Kasım 2026

1. **Yayımlandı (`ebd9b22`):** Test ve paket `45824418450` ve Pages `45824418430` başarılı; 10 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Yapıldı (bilgisayarda):** Akış API'si 12:49 UTC'de geri geldi. Gravity Falls S1E1 2 satır (MP4 + online 720p), Adventure Time S1E1 tek online 540p satır (PROJE 2.0.4). Bölümün ilk isteği yavaş/502 olabiliyor.
3. **Telefonda (Wi-Fi ve LTE ayrı):**
   - Depo yenilenmeli; `Tanı · 2.0.4` görünmeli. CizgiMax sağlayıcısının ayarlarında `CizgiMax online Türkçe dublaj (HLS)` açık görünmeli.
   - We Bare Bears S1E3, Gravity Falls S1E1 veya Adventure Time S1E1'de `Online · CizgiMax` satırı gelmeli (site akış sunucusu çalışıyorsa). Adventure Time S1E1'de yalnız online satır gelir (simülasyonda geldi). İlk açılışta gelmezse yenile düğmesine basılmalı (2.0.5 notu; ilk istek yavaş/502 olabiliyor). Satır oynatılmalı ve 5 dk sonra ileri sarılmalı: Referer'lı HLS'nin cihazda oynadığı henüz denenmedi. Satır indirme seçeneği göstermemeli.
   - Satır listede olup açılmıyorsa olası neden uzantısız parça adresleri (FFmpeg `extension_picky`) olabilir. Aynı ağda DiziBal (`.png` parçalar) ve KultFilmler (`.html` parçalar) satırları da denenmeli; sonuç birlikte değerlendirilir.
   - Site akış sunucusu 502 verirken Drive satırları gelmeli (simülasyonda geldi).
   - CizgiMax satırları hiç gelmez veya geç gelirse `cizgimaxOnlineEnabled` kapatılıp aynı bölüm denenmeli.
4. **Kapandı (2.0.5): Nuvio 1.0.1 tam inceleme ve kilit.** Eski not: StreamsRepository'deki eklenti çağrısının taşındığı dosya (ayar, başlık ve sonuç birleştirme) incelenmeli. Oynatıcılar başlıkları `http-header-fields` ile veriyor ve `extension_picky` vermiyor (görüldü). iOS Libmpv sürümü bulundu (mpv 0.41.0 + FFmpeg n8.1.2 etiketli derleme, PROJE 2.0.4); uzantı riski kaynak düzeyinde düşük, cihazda DiziBal/KultFilmler/CizgiMax online satırlarıyla doğrulanmalı. Kilit ancak inceleme bittikten sonra güncellenmeli.
5. **Altyazı kaynakları turu yapıldı (26 Kasım, yeni kaynak eklenmedi):** YIFY, SubSource, SubDL, turkcealtyazi, Podnapisi, planetdp ve Gestdown ölçüldü (KAYNAK_ARASTIRMASI "26 Kasım 2026 altyazı turu"). ZIP/anahtar/doğrulama/erişim nedeniyle elenenler dışında yalnız Gestdown uygun; Türkçe katkısı küçük (0–2), ana listeye yeni host riski getirdiği için eklenmedi. AltyazıDB indirme yolu yeniden 200/UTF-8. Yeni bir anahtarsız, UTF-8 düz SRT veren ve kimliğe bağlanabilen Türkçe kaynak çıkarsa yeniden bakılır.

## 2.0.3 — 26 Kasım 2026

1. **Yayımlandı (`8284773`):** Test ve paket `45817192160` ve Pages `45817192182` başarılı; 10 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı):**
   - Depo yenilenmeli; `Tanı · 2.0.3` görünmeli.
   - Gravity Falls S1E1'de `CizgiMax` sağlayıcısı altında İndirilebilir satır (1080p, ~0,47 GB, Ses: TR) gelmeli. Satır oynatılmalı ve indirilmeli. İleri sarma özellikle denenmeli: `moov` dosya sonunda olduğu için oynatıcı açılışta sonu okumak zorunda.
3. **Kapandı:** RubyVidHub HLS 2.0.4'te eklendi (yukarıda).

## 2.0.2 — 26 Kasım 2026

1. **Yayımlandı (`2d8374b`):** Test ve paket `45816189128` ve Pages `45816189100` başarılı; 10 public dosya (manifest, 7 sağlayıcı, sabit online, ana sayfa) HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı):**
   - Depo yenilenmeli; yeni **Nuvio TR HD · CizgiMax** sağlayıcısı etkinleştirilmeli; `Tanı · 2.0.2` görünmeli.
   - Scooby-Doo! Mystery Incorporated S1E1'de `CizgiMax` sağlayıcısı altında İndirilebilir satır (1080p, ~0,41 GB, Ses: TR) gelmeli. Ana `Nuvio TR HD` altında artık CizgiMax satırı yoktur.
   - Satır oynatılmalı ve indirilmeli; dosyanın tam ve oynatılabilir olduğu, Türkçe sesin geldiği not edilmeli.
3. **2.0.3 adayı: dolgulu MP4 düzeni (yalnız CizgiMax).** Gravity Falls S1E1: `ftyp` + 0,7 MB `free` + `mdat` + sonda 0,7 MB `moov`.
   - Ölçüldü (yayından sonra, PROJE): ana `mdat`'tan sonra 138 baytlık ikinci bir `mdat`, ardından `moov` geliyor. `moov` başından 256 KB piksel ve süre veriyor. Phineas and Ferb bu düzende değil (mevcut probe okur).
   - Gereken: dolgulu başın kabulü, iki metadata atlaması ve aralıktaki tamamlanmış küçük kutuların geçilmesi.
   - Uygulanırsa: `readAudioTracks` gibi aday bayrağı, yalnız CizgiMax ayarlar. Bildirilen kutu sınırları izlenir, her atlamada `sameFile`, en fazla iki ek atlama. Yalnız `ftyp` + dolgudan satır çıkmaz; `moov` içinde video izi, piksel ve süre zorunlu. "Tek ftyp → null" testi korunur. Range dizisini birebir denetleyen sentetik fixture eklenir.
4. **2.0.4 adayı: RubyVidHub HLS (CizgiMax lane'inde).** Site kararlıyken `cmx-age.cjs` (master gerçekçi gecikmeye dayanmalı; t0 alt listesinin parçaları t0 + bölüm süresinde açılmalı) ve `cmx-ua.cjs` (oynatıcı UA ve Referer varyantları) yeniden koşulmalı. Satır HLS'dir; indirilebilir gösterilmez. Ayrı anahtar, 2.0.1 reddinin yerine geçen KARARLAR maddesi, sentetik belirteçli fixture.
5. **Altyazı kaynakları (sonra):** Wyzie, subsource, subtitlecat (yapay çeviri olmayanlar), yifysubtitles. Hesap, anahtar, captcha yok; kimliğe bağlı; yabancı veya yanlış kimlikli altyazı birleştirilmez.
6. **Kapandı:** 2.0.1 madde 5 (RareFilmm UA denetimi ve CizgiMax verimi) bu sürümde ölçüldü; sonuçlar PROJE'de.

## 2.0.1 — 26 Kasım 2026

1. **Yayımlandı (`51082f7`):** Test ve paket `45779861170` ve Pages `45779861123` başarılı; 9 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı):** 2.0.2'den beri CizgiMax ayrı sağlayıcıda; güncel adımlar yukarıda (2.0.2 madde 2).
   - Depo yenilenmeli; `Tanı · 2.0.1` görünmeli.
   - "Scooby-Doo! Mystery Incorporated" (Scooby Doo Gizem Avcıları) S1E1'de `CizgiMax` İndirilebilir satırı (1080p, ~0,41 GB, Ses: TR) gelmeli.
   - Satır oynatılmalı ve indirilmeli. İndirilen dosyanın tam ve oynatılabilir olduğu, Türkçe sesin geldiği not edilmeli.
3. **QuickJS test düzeneği:** ~0,2 MB üstü metin gövdelerinde çalışma zamanı kapanışında `list_empty(&rt->gc_obj_list)` ile duruyor. Yayınlanmış DiziBox'ta 300K ile de tekrarlandı; yalnız shim içeren küçük denemede 600K temiz kapandı. Neden bulunmadı. Cihazda büyük sayfa çöküşü bildirilmedi. Ayrıştırıcı tam boyutta ayrı sınanıyor; neden ayrıca araştırılmalı.
4. **Elenen adaylar (26 Kasım, 2.0.1 sonrası):** BelgeselX, IzleAI, UHDMovies/MoviesMod, mobiletvshows (FzTvSeries kopyası), nkiri. Gerekçeler KARARLAR'da.
5. **Eksik kapatma turu (2.0.2'de ölçüldü, kapandı):** RareFilmm ok.ru yanıtı tek başlıkla yeniden denetlenmeli (iPhone UA ile ok.ru anonim giriş sayfasına yönlendirme görüldü). CizgiMax'in başka çizgi dizilerdeki verimi ölçülmeli; sayı kuralı ve `.ts` kararı ayrı karar olmadan değişmez. Ardından altyazı kaynakları (Wyzie, subsource, subtitlecat, yifysubtitles).

## 2.0.0 — 26 Kasım 2026

1. **Yayımlandı (`fa5acb2`):** Test ve paket `45773314376` ve Pages `45773314401` başarılı; 9 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı):**
   - Depo yenilenmeli; `Tanı · 2.0.0` görünmeli.
   - Stranger Things S5E1 veya The 100 S5E5'te `Hızlı İzle` altında DiziBox satırı gelmeli.
   - Satır oynatılmalı. Parçalar `.png` adlıdır. Açılmazsa aynı ağda KultFilmler (Inception) satırı da denenmeli. İkisi birlikte açılmıyorsa olası neden Nuvio oynatıcısının FFmpeg uzantı denetimidir.
   - Görüntüde Türkçe altyazı olup olmadığı not edilmeli; site etiketi doğrulanmadı.
3. **Sonraki kaynaklar:** CizgiMax (2.0.1'de eklendi), BelgeselX, IzleAI. İndirilebilir: o2tvseries / mobiletvshows, nkiri. HD: uhdmovies / moviesmod. Ardından altyazı kaynakları.
4. **Kullanıcı bildirimi (26 Kasım):** 1.9.9 sonrası "kısa testleri yaptım, sıkıntı yok" dedi. Hangi başlık, kaynak ve ağda denendiği söylenmedi. Bu, tam oynatma, indirme veya KultFilmler `.html` parçalarının iPhone'da oynatıldığının kanıtı sayılmaz.
5. **MovieBox elendi (26 Kasım):** Yeni `h5-api` araması anonim istekte 400 "invalid token" döndü; sayfanın istemci tarafında ürettiği belirteçle de aynı. Sayfa verisinde VIP düzeyi ve önizleme saniyesi alanları var. Belirteç peşine düşülmez; yeni dış durum olmadan yeniden denenmez.
6. **DiziBox eklendi:** 19 Kasım'da Cloudflare challenge veriyordu; 26 Kasım'da bölüm sayfaları challenge'sız 200 döndü. Çerez gerekmedi, yalnız tarayıcı `User-Agent`'ı gerekti. Ayrıntılar KARARLAR'da.

## 1.9.9 — 26 Kasım 2026

1. **Yayımlandı (`b653608`):** Test ve paket `45701344984` ve Pages `45701345092` başarılı; 9 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı):**
   - Depo yenilenmeli; `Tanı · 1.9.9` görünmeli.
   - Inception'da `Hızlı İzle` altında iki KultFilmler satırı gelmeli: 1080p altyazılı ve `Ses: TR` dublaj.
   - Her iki satır oynatılmalı. HLS parçaları `.html` adlıdır; iPhone oynatıcısının bunları açtığı doğrulanmalı.
   - Altyazılı satırda TR altyazı görünmeli ve senkron olmalı.
   - Oynatma bağlantısı yaklaşık 2 saat geçerli. Liste uzun süre açık kaldıktan sonra oynatma denenip hata alınırsa not edilmeli.
3. **HDRezka:** Kullanıcı Interstellar, Inception, Fury'de Wi-Fi ve mobil veride ayrı denemeli. İki ağda farklı sonuç çıkarsa düğüm kısıtlaması ağa bağlıdır.
4. **Sonraki kaynak turu:** DiziBox (dizi). King oynatıcısında AES çözümü için gereken parola sayfadan geliyor; ayrıca sabit bir çerez var. Önce bu çerezin koruma sabiti olup olmadığına bakılmalı; koruma sabitiyse eklenmez. Ardından CizgiMax ve BelgeselX değerlendirilmeli. **2.0.0'da yapıldı:** çerez gerekmedi.
5. **1.9.8 maddeleri** (aşağıda) hâlâ açık.

## 1.9.8 — 25 Kasım 2026

1. **Yayımlandı (`55b732d`):** Test ve paket `45692600060` ve Pages `45692600154` başarılı; 9 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`).
2. **Telefonda (Wi-Fi ve LTE ayrı):**
   - Depo yenilenmeli, `Tanı · 1.9.8` ve yeni **Nuvio TR HD · HDRezka** satırı görünmeli ve açık olmalı.
   - Inception, Dune ve The 100 S5E5'te ana `Nuvio TR HD` listesi boş dönmemeli.
   - Anime: Death Note, Frieren, JJK ve Solo Leveling'de `Anime` satırları gelmeli. Solo Leveling S2'de `Ek Anime` SeiCode MP4 satırı gelmeli.
3. **Kullanıcıya sorulacak:** Hangi anime adlarında ve hangi ağda (Wi-Fi/LTE) boş sonuç gördü? Önceden gelip artık gelmeyen kaynak adları neler?
4. **voidboost nedeni:** Ertesi gün, tam tarama yapmadan, tek başlıkla (`hdrezka` hattı, Interstellar/Inception) yanıtsız ve yavaş düğüm oranı yeniden ölçülmeli. Oran 0'a dönerse kısıtlama taramalardan kaynaklanıyordu. Yayın sonrası ölçümde 4,5 sn prob süresi dolmuştu. Yalnız bağımsız `hdrezka` hattında prob süresini uzatmak geç yanıt veren düğümleri kurtarabilir, ancak bağlantıyı tamamen düşüren düğümün 60 sn askısını çözmez. Önce ölçülmeli.
5. **Ağ gürültüsüyle boş kalan başlıklar:** Avatar, Oppenheimer, Crow ve Breaking Bad S1E1 tek tek, sessiz ağda yeniden denenmeli.
6. **Waploaded:** Arama yolu bulunmazsa yalnız yeni yüklemeler kapsanır. RareFilmm hâlâ incelenmedi.
7. **Fiziksel cihaz kabul testi (Faz 5):** 1.9.7 maddesindeki çevrimdışı uçtan uca test hâlâ açık.

## 1.9.7 — 25 Kasım 2026

1. **Yayımlandı (`ea01076`):** Test ve paket `45683585388` (ubuntu+windows) ve Pages `45683585479` başarılı; 8 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`). JetFilmizle Gold MP4 + büyük `moov` MP4 `readAudioTracks`, başarısız ayna host önceliği, `4KHDHub` film sırası/10 sn kapsamı, `opensubtitles-v3` önceliği + 429 hash koruması, lane bazlı minified paketleme (`1.650 KB → 583 KB`) yayında. `npm run check` **363/363** geçti (QuickJS dahil). `todaytvseries` ve `HDHub4u` canlı ölçümde elendi.
2. **Fiziksel cihaz kabul testi (Faz 5, hâlâ açık):**
   - **Wi-Fi ve LTE ayrı:** Depo yenilenip `Tanı · 1.9.7` görülmeli; `Nuvio TR HD`, `Hızlı İzle`, `Goojara`, `Anime`, `Ek Anime` açık olmalı.
   - **Dizi askı kontrolü:** The 100 S5E5 ve S1E3/S2E1'de ana listeden FzTvSeries / varsa 4KHDHub'ın düşmeden geldiği doğrulanmalı.
   - **Film TR dublaj + indirme:** Fury, Inception ve Matrix'te `JetFilmizle` (360p/720p MP4, `workers.dev` açık ağda) ve `4KHDHub` 1080p/4K satırları kontrol edilmeli.
   - **Çevrimdışı uçtan uca test:** Küçük MP4 + 1080p/4K MKV (`.mp4` kayıt adıyla MPV tanıma) + harici TR altyazı tam indirme → uçak modunda yeniden açma, ses/altyazı seçimi ve Türkçe font görünümü.

## 1.9.6 — 25 Kasım 2026

1. **Yayımlandı (`f2263d1`):** Test ve paket `45637051671` (ubuntu+windows) ve Pages `45637051709` başarılı; 8 public dosya HTTP 200 ve SHA-256 yerel `dist/` ile aynı (`compatibility/github-publication.json`). DiziYou `diziyouOptInEnabled` ile varsayılan kapalı (eski `diziyouEnabled: true` yok sayılır); Goojara 5. bağımsız scraper (`nuvio-tr-hd-goojara`) olarak ana taramadan ayrıldı ve sessiz timeout sonrası yeniden denemesi kapatıldı. `npm run check` 357/357 geçti (QuickJS dahil).
2. **Telefonda doğrulama (Wi-Fi ve LTE ayrı):** Depo yenilenip `Tanı · 1.9.6` ve yeni **Nuvio TR HD · Goojara** satırının görünmesi/etkinliği kontrol edilmeli. The 100 S5E5 ve S1E3/S2E4'te ana `Nuvio TR HD` sonuçlarının (FzTvSeries, varsa 4KHDHub) artık boş dönmediği doğrulanmalı.
3. **Sıradaki geliştirme:** Yarım kalan `JetFilmizle` (TR dublajlı MP4 indirme + MP4 büyük `moov` `readAudioTracks` testleri) tamamlanmalı; ardından hız/sıralama/bundle yol haritasına geçilmeli.

## 1.9.5 — 25 Kasım 2026

1. Telefonda depo yenilenip `Tanı · 1.9.5` görünmeli. Inception, Dune ve Fury gibi filmlerde FzMovies 360p/720p satırları çıkmalı. LTE ve Wi-Fi ayrı denenmeli. Sitenin telefona Cloudflare sınaması gösterip göstermediği bilinmiyor. Telefonda doğrulanmadı.
2. MoviesDrive: benzetimde FzMovies açıkken Fury ve Spider-Verse satırları daha seyrek (seçilen sırada 0/6; aynı turlarda kapalı 4/6, sonra kapalı 1/4). Telefonda Fury'de MoviesDrive satırları FzMovies açık ve kapalı karşılaştırılmalı. Kayıp doğrulanırsa seçenekler: FzMovies'i MoviesDrive keşfi bittikten sonra başlatmak ya da MoviesDrive keşfini kısaltmak (kapalıyken de 9,4–10 sn).
3. 4KHDHub filmlerde benzetimde hiç satır vermedi, FzMovies kapalıyken de (keşif 8 sn sınırında). 1.9.4 madde 7'nin yerine geçer: önce film keşfinin hangi adımda zaman harcadığı ve `workers.dev` dışı aday oranı ölçülmeli.
4. FzMovies bağlantı ömrü: 25 dakika doğrulandı; ~12 saat ölçülmedi. Uzun indirme kuyruğunda süre dolabilir.
5. Totoro ve Your Name'de FzMovies sonuç vermiyor; benzetimdeki kimlikte yalnız Japonca özgün ad var. Telefonda TMDB başka ad döndürürse sonuç değişebilir. İngilizce adla arama ancak sitede listelendiği ölçüldükten sonra eklenmeli.
6. todaytvseries hâlâ incelenmedi.
7. Oppenheimer HDRezka benzetimde FzMovies açıkken daha seyrek (1/3, kapalı 3/3, farklı saatte). voidboost zaman aşımları gürültülü; ayrı ölçülmedi.
8. Kullanıcıya hâlâ sorulacak: The 100 S2E1'de telefonda 4KHDHub satırı çıkıyor mu (1.9.4 madde 11).
9. `*.workers.dev` 25 Kasım'da bu bilgisayardan erişilebilirdi (kapsam raporlarında Worker aynaları 206/403). 1.9.3 madde 3'teki yeniden ölçümler (4KHDHub Worker aynaları, HDHub4u koşulu) yapılabilir. Matrix, Dune ve Fury'nin 4K Worker aynalarındaki 403'lerin kota mı kalıcı mı olduğu ayrılmalı.
10. **Telefon bildirimi (25 Kasım, kullanıcı):** 1.9.5 yüklendi; bir 4KHDHub satırı çıktı; Fury'de FzMovies ve MoviesDrive birlikte göründü. 4KHDHub satırının hangi başlıkta çıktığı ve ağ (LTE/Wi-Fi) söylenmedi; sorulmalı. Tek liste gözlemi; oynatma veya indirme testi değil. Madde 2'deki MoviesDrive maliyetini kapatmaz (tek gözlem).

## 1.9.4 — 20 Kasım 2026

1. Telefonda depo yenilenip sağlayıcı sürümü 1.9.4 görünmeli. The 100 S1E1, S1E10 ve S3E5'te FzTvSeries 360p, Goojara'nın yanında veya Goojara yokken çıkmalı. LTE ve Wi-Fi ayrı denenmeli. Telefonda doğrulanmadı.
2. FzTvSeries indirme bağlantıları kaynağa göre ~12 saat geçerli. Uzun bekleyen indirme kuyruğunda süre dolabilir; telefonda tam indirme denenmedi.
3. FzTvSeries kapsamı küçük örnekle ölçüldü (8 dizi). Eski dizilerin (Breaking Bad) sunucuları bu bilgisayardan kapalı. Daha geniş örnek (20+ dizi, eski/yeni karışık) ve telefonda gözlem gerekli. Kesme işaretli adlarda (Grey's Anatomy) yalnız birim testi var, canlı bakılmadı.
4. Sonraki aday kaynaklar: FzMovies (`fzmovies.live`, filmler; aynı işletmeci olabilir) ve todaytvseries. Önce kimlik bağı ve Range desteği ölçülmeli. FzMovies 1.9.5'te eklendi; todaytvseries açık.
5. HubCloud 10Gbps (`pixel.hubcloud.mov` → `*.workers.dev`):
   - 20 Kasım: kullanıcının telefonunda mobil veride `https://workers.dev` açıldı (ekran görüntüsü). Yalnız kök adres denendi; dosya alt alanları ve Wi-Fi denenmedi. Bu bilgisayardan aynı adres TLS hatası veriyor (curl çıkış 35).
   - The 100 S1E1 HubCloud sayfasında yalnız Pixeldrain, 10Gbps ve Telegram düğmesi var; FSL yok. 4KHDHub'ın bu bölümdeki tek Pixeldrain dışı yolu 10Gbps.
   - Zincirin yalnız ilk adımı görüldü: `pixel.hubcloud.mov/?id=…` → 302 → `pixel.<ad>.workers.dev/?id=…` (yalnız `id` parametresi). Sonrası bu hattan görülemiyor. Public bir eklentideki (`link=` parametresini bekleyen) kod bu biçime uymuyor; ondan uydurma yapılmamalı.
   - Engeller: adres uzantısız; köprü kapalıyken uzantısız MKV yalnız kesin bayt boyutuyla kabul ediliyor, sayfadaki boyut yaklaşık. Token ömrü, tek kullanımlık olup olmadığı, son host ve Range desteği bilinmiyor. iOS yönlendirmeleri kendisi izliyor; her probe aralığı zinciri yeniden yürür.
   - **Kapandı (20 Kasım):** yerel taslak gerçek sayfada 0 aday verdi (`id` biçimi `<değer>::<32 hex>`) ve sayfa "Resume Not Supported in 10Gbps" diyor. Eklenmedi; yeniden açma koşulu KARARLAR'da.
6. Önerilen sıralamada FzTvSeries 360p bazen Goojara 480p'nin üstünde (altyazı puanı baskın; kimlik puanı ikisinde de 90). Kullanıcı yüksek kaliteyi üstte isterse sıralama ayarı önerilmeli.
7. Filmlerde 4KHDHub hâlâ geç başlıyor (Inception benzetiminde 12,6 sn). Dizideki "en uzun zincir önce" ilkesi filmlerde de denenebilir; önce `workers.dev` dışı adayı olan bir filmde açık/kapalı ardışık ölçüm gerekir.
8. Dizi sırası değişikliği yalnız benzetimle ölçüldü. Telefonda The 100 S2E1 veya Stranger Things S5E1'de 4KHDHub satırının hâlâ çıktığı kontrol edilmeli.
9. FzTvSeries açıkken ana yoldaki DiziBak online satırı Stranger Things S5E1 benzetiminde 24 sn bütçesine yetişmedi (iki çalıştırmanın ikisinde). Seçenekler ölçülmeli: DiziBak'ı dizilerde daha erken başlatmak (MoviesDrive'ı geciktirir) veya Hızlı İzle'ye almak. Hızlı İzle'ye almak "online yollar ana yolda korunur, DiziBal/HDFilmDelisi tek kez" kararına dokunur, karar birlikte güncellenmeli.
10. Benzetimdeki dizi bölüm sürelerinin boş olması MoviesDrive'ı sessizce devre dışı bırakıyor. Sonraki sezon ölçümlerinde süreler TMDB'den alınmalı.
11. Kullanıcı 1.9.4 sonrası telefonda The 100'de yine yeni kaynak görmediğini bildirdi (20 Kasım). Önce eklenti ayarlarındaki `Tanı · <sürüm>` satırı ile 1.9.4'ün yüklendiği ve mobil veride `https://tvseries.in` açılıp açılmadığı öğrenilmeli. Telefonda neden çıkmadığı bilinmiyor.
    - Sonra (20 Kasım): kullanıcı telefonda FzTvSeries'in çıktığını, diğerlerinin çıkmadığını bildirdi; bölüm belirtilmedi. The 100 S1E1/S1E10'da 4KHDHub'ın kullanılabilir dosyası yok (Pixeldrain captcha, FSL yok). S2E1'de Pixeldrain 1080p aynı gün açıktı: telefonda S2E1'de 4KHDHub satırı çıkıp çıkmadığı sorulmalı. Çıkmıyorsa telefondaki zamanlama ayrı incelenmeli.
12. Elenen açıklama: iOS'ta yerel çerez deposu FzTvSeries/Goojara oturumunu bozuyor olabilir mi? Nuvio iOS eklenti fetch'i Ktor Darwin istemcisi; Ktor 3.4.1 `DarwinSession` `setHTTPCookieStorage(null)` yapıyor ve Nuvio çerez eklentisi kurmuyor (kilitli commit ve 20 Kasım `cmp-rewrite` başı). Çerez deposu yok; bu yüzden değişiklik yapılmadı. Yerel öykünmede çerez deposu olsaydı FzTvSeries 0, Goojara oturumsuz kalırdı; tvseries.in ve Goojara çerez gönderilince yenisini vermiyor.

## 1.9.3 — 20 Kasım 2026

1. Telefonda depo yenilenip sağlayıcı sürümü 1.9.3 görünmeli. The 100 S1E1'de Goojara'nın yanında 4KHDHub/Pixeldrain 1080p, Stranger Things S5E1'de 4KHDHub/Pixeldrain 1080p ve 2160p çıkmalı. Aynı bölümü birkaç kez açıp Goojara'nın kaç kez çıktığına bakılmalı.
2. Telefonun hangi ağda olduğu önemli. Ev Wi-Fi'si bu bilgisayarla aynı hatsa `workers.dev` engeli telefonda da geçerli olabilir; mobil veride farklı olabilir. İkisi ayrı denenmeli. Telefonda doğrulanmadı.
3. `workers.dev` yeniden açılırsa: Stranger Things/The 100 ve Inception ile 4KHDHub Worker aynalarını tekrar ölç; ardından HDHub4u kontrolünü yap. HDHub4u için beş başlık (biri bölüm bazlı dizi), her terminalde Pixeldrain var mı ve `/info` `availability` boş mu, say. Karar koşulu KARARLAR'da.
4. Erişilebilir hostlardaki eksikler (20 Kasım'da kısmen bakıldı):
   - Waploaded: `/sitemap/series` ve `/sitemap/movie` yalnız son 50 kaydı veriyor (`?page=2` aynı liste). `/search/<q>` yalnız forum yazısı döndürüyor; Breaking Bad, Stranger Things ve GoT için de dizi sayfası çıkmadı. Eski başlıklar bu kaynakta bulunamaz; derin katalog yolu bulunmadan uğraşma.
   - Directory (`a.111477.xyz`) DahmerMovies'tir ve varsayılan kapalıdır; dosya hostu challenge veriyor (19 Kasım).
   - Archive: The 100 için bakılmadı.
5. Pixeldrain'de captcha sınırına giren dosyalar (The 100 S3E5) beklenir; captcha çözülmez, başka host aranır.
6. The 100 4KHDHub keşfi (20 Kasım, poster listesi elle yazılmış sabit veri): ilk bakışta S1E3, S2E1, S2E5, S3E1, S4E2, S5E3, S6E4 ve S7E5'te `availability` boş Pixeldrain 1080p adayı vardı. Aynı gün sonra S1E1, S1E3, S1E10 ve S3E5 `file_rate_limited_captcha_required` oldu; S2E1 ve S4E2 açık kaldı. Pixeldrain durumu saatler içinde değişiyor; bölüm bazında kalıcı sayılmamalı. Shameless ve Severance yeniden izlenmedi.
   - Kapsam karşılaştırması (`.cache/coverage-192-baseline.json`) yapılmadı. Bu temel, `workers.dev` erişilebilirken alındı; bugünkü engelli hatla yapılacak fark poster/Goojara değişikliğinin etkisini ağ değişiminden ayıramaz. Ya aynı ağ durumunda yeni temel al ya da farkı ağ etkisiyle birlikte yorumla.
7. Goojara tekrarının etkisi küçük örnekle ölçüldü (10/12 ve 8/12). Daha fazla ölçüm veya telefonda gözlem olmadan "çözüldü" denmemeli.
8. Fiziksel telefon, tam oynatma, indirme, çevrimdışı altyazı ve senkron hâlâ açık.

## 1.9.1–1.9.2 — 19 Kasım 2026 kaynak/altyazı düzeltmeleri ve MoviesDrive hızı

1. 1.9.1 kullanıcı isteğiyle yayımlandı; ABI değişmedi, CI/Pages başarılı ve public 7 dosya SHA eşleşti. Telefonda depo yenilenip sağlayıcı sürümünün 1.9.1 göründüğü ve Dune/Inception dosyalarında TR altyazı çıktığı kontrol edilmeli. Yayın/CI sonucu PROJE ve compatibility/github-publication.json içinde.
2. HDFilmDelisi: işaretsiz `ha.vixolity.com/vs/<imdb>`, işaretli `?format=.m3u8` ve ilk `/mm/` alt listesini birlikte tekrar kontrol et.
   - 19 Kasım'da işaretsiz Inception ana listesi 200 (cf-cache DYNAMIC), işaretli olanı ve tüm alt listeler 502 idi. Başka filmlerin işaretsiz listeleri de 502 idi.
   - Oynatıcı modülü işaretsiz `kaynak` adresini yüklüyor. İşaretsiz ana ve alt listeler 200 olurken işaretli liste hâlâ 5xx ise sorun kesinti değil, işaretin reddedilmesidir. O durumda native indiricinin HLS'yi dosya sanmasını başka yolla önle; işaretsiz adresi doğrudan indirilebilir etiketleme.
   - Hepsi 200 olursa uçtan uca canlı tarama ve gerçek oynatma dene. Kimlik ve erişim kontrollerini gevşetme.
   - Film sayfası 807.666 karakter; `http.text` üst sınırı sabit 1.000.000. Sayfa bunu aşarsa sağlayıcı sessizce boş döner; o zaman sınırlı/kısmi okuma gerekir.
3. AltyazıDB indirme kaynağı anahtar istiyor. Anahtar kopyalama veya üçüncü taraf proxy ekleme; liste yolu çalışsa da indirme sayılmaz.
4. **1.9.2 ile yayımlandı:** MoviesDrive keşfi Dune'da 8,9 → 4,3 sn (tek ölçüm). Değişiklikler: eski kökün yönlendirmesi kaldırıldı, zincir 2'den 3'e çıktı; payları ayrı ölçülmedi. 3'lü eşzamanlılık cihazda denenmedi. Telefonda depo yenilenince sağlayıcı sürümü 1.9.2 görünmeli.
5. **Büyük olasılıkla açıklandı:** GoT'ta HDRezka yokluğu izleme düzeneğinin sezon 401'iydi. Elle yazılmış sabit sezon verisiyle GoT S1E1'de 9–10 sonuç (HDRezka 4, Goojara 1, 4KHDHub 3–4, VixSrc 1). Gerçek TMDB anahtarıyla ve telefonda tekrar bakılmalı. `workers.dev` artık erişilebilir; 4KHDHub film/dizi 1080p/4K dosyaları geliyor. Worker aynaları Google Drive kotasına bağlı; telefonda indirme başlangıcı kota hatası verebilir. Telefonda bir 4KHDHub 4K indirmesinin başlayıp başlamadığı kontrol edilmeli.
6. Yeni kaynak araştırması (19 Kasım) sonuçsuz; nedenler PROJE'de. Yeni durum (alan adı, challenge kalkması, bölge açılması) olmadan aynı adayları tekrar deneme: DahmerMovies, MovieBox, XDMovies içerik sayfası, Bollyflix, GDFlix, dizibox.live, Cinevood, NiakVIO. TR'den erişilebilen, Range destekli, kimliği doğrulanabilen hostlar öncelikli kalır.
7. MoviesDrive TV yalnız çok sezonlu paket sayfası veriyor (BB/GoT). Arama satırında da sayfada da IMDb bağlantısı yok; IMDb veya eşdeğer kimlik kanıtı olmadan eşleme yapma.
8. Fiziksel telefon, tam oynatma, indirme, çevrimdışı altyazı ve senkron hâlâ açık.

## 12 Kasım 2026 — yeniden açılış kontrolü

Kullanıcının açık eski Nuvio'yu tamamen kapatıp masaüstü Nuvio TR HD ile Black Clover 1×17'yi sınaması bekleniyor. Son ayrı JVM turu 7651ms/3MP4. Masaüstü ve kullanıcı Başlat menüsü hedefleri doğrulandı; ortak kurulum ve sabitlenmiş bağlantılar değiştirilmedi. Kullanıcı bilgisayarı kullanırken UI testine devam etme.

## 11 Kasım 2026 — yerel Windows düzeltmesi

1. Black Clover S1E17 normal kaynak ekranında 480/720/1080p üç indirilebilir satır görüldü. Bölüm16 ayrı native işlemde3MP4. Kullanıcı PC'yi kullandığından UI girişleri durduruldu; bir sonraki açılışta temiz final JAR seçili. Tam oynatma/indirme ve TR altyazı kapsamı açık.
2. Masaüstündeki Nuvio TR HD kısayolu düzeltilmiş kopyayı açar. Eski Nuvio simgesi asıl kurulumu açar. Yerel kopya kurulu runtime/kütüphanelere bağlı olduğundan resmî güncelleme sonrası tekrar doğrula.
3. Tam oynatma/indirme/offline/senkron ve telefon testleri açık. Sağlayıcıların ağ/kapsam eksikleri ayrıca devam eder.

## 1.9.0 öncelik

1. Windows yayın ekranında 1.9.0 sonrası Dune bir online satır gösterdi. Fleabag S1E1 kurulu motorun ayrı işleminde dört online sonuç verdi. Windows'ta doğrulanmış indirme satırlarının niçin elendiğini kaynak keşfi ve Range adımlarında ayrı ölç.
2. Dune MoviesDrive ilk canlı tur 3, tekrar 1 MKV. Bu eski sağlayıcının geri kazanımı. Dizi, TR dublaj ve 4K kapsamı açık.
3. HDFilmDelisi yeni alanında geçerli oynatma listesi doğrulanmadan adres güncelleme. Fiziksel telefon, tam oynatma, indirme ve çevrimdışı altyazı açık.

## 1.8.9 öncelik

1. Desktop 1.1.35 yenilemesi 0 → 4 ve gerçek uygulama Matrix sağlayıcı testi 10 sonuç; Dune ilk uygulama araması boş, kurulu JVM motoru ayrı işlemde 10 sonuç. Uygulamadaki Dune tekrarını ve boş arama/ayar/ağ nedenlerini incele; tam masaüstü oynatma/indirme açık. 1.8.9 yayını bacb0f15723f2c080ad62f9f784ae907f1581f2c, Test 42894719311/Pages 42894717940 başarılı.
2. Shameless ve diğer eksik diziler için bağımsız ücretsiz ve kararlı dosya ailesi ara. Yeni TR dublaj veya anime indirme bu tur doğrulanmadı.
3. İlk Fleabag 0 ve sonraki 8 dosya sonucu birlikte değerlendir; ağ değişkenliği ve telefon fiziksel süresi bilinmiyor. Fiziksel telefonda tam indirme/offline/senkron/font açık.


## 28 Ekim 2026 değerlendirmesinden önerilen öncelik

1. [Kapsam ve karşılaştırma](DEGERLENDIRME.md): 21 manifest/11 seçili sağlayıcı dosyası incelendi; yeni sağlayıcı eklenmedi. Sonraki uygulama turunda mevcut 37 referansın tekrar sonuçlarını dengeli film/dizi/anime setinde karşılaştır; test sayısı veya tarihsel dosya toplamından kapsam yüzdesi çıkarma.
2. Öncelik bağımsız MP4/MKV kaynak ailesi, gerçek TR dublaj ve bölüm devamlılığıdır. HLS katkısını indirme artışı sayma; aynı HubCloud/Pixel ailesini çoğaltmayı bağımsızlık sanma. Kısmi yararlı kaynak kabul edilebilir; yeni aday desteği canlı kanıt gerektirir.
3. Süreyi uzatmak yerine bekleten origin/metadata/altyazı işlerini ölç. Arama içi cache var; ayrı VM/aramalar arasında kalıcı depolama doğrulanmadı. Satır satır native sonuç callback'i veya iPhone fiziksel timeout garantisi verme.
4. Fiziksel iPhone küçükMP4/1080MKV/4KMKV, TRses ve hariciTR ile tam indirme/yeniden açma/uçakmodu/altyazı/ses seçimi hâlâ açık. Kodlama, font ve senkron sorunlarını birbirinden ayır. Bu maddeler öneri ve açık iştir; tamamlanmış sayılmaz.

## 1.8.8 öncelik

1. Hazır: Archive resmî yerel dosya adı ve MoviesDrive resmî film aliası;6yeni dosya/3film/1yeni4K.312test ve23upstream drift0. Yayımlandı: 4c824c1002600687eca10c88f92ce11fad15b38b; Test40609766518/Pages40609766742 başarılı, yedi public HTTP200/SHA eşit.
2. Gerçek TRdublaj/film-dizi-anime/4K kapsamı açık. Üç yeniMP4 kaynakta TRdub etiketli ama ses metadata'sı yok; doğrulanmış TR0. Farklı ses veya senkronu dosya adından/parent'tan uydurma. YeniTV/anime0; eski kaynakların çalışması yeni uygun kaynak aramayı bırakma gerekçesi değildir.
3. Yeni4KDark17.72GB yanında1.36GB720 ve475MB720×298 seçenekleri var. Stuart1.31GB/Death1.64–1.67GB720 yeni; Stuart.ia kopyası ek dosya sayılmaz. Vikings11/11kontrol, yeni değil. Dune/Interstellar çözülemeyen yüksek kalite yolunu yeni veri olmadan tekrar etme.
4. Fury24s mantıksal sınır, eski4K/TR korunmuş olsa da fiziksel iPhone hızı/kararlılığı garantisi yok. Upstream anonim403 olursa mevcutGitHub doğrulamasını yalnız bellekte kullan; token/userURL commit etme. Fiziksel cihaz/tam indirme/offline/senkron/font açık.


## 1.8.7 öncelik

1. Hazır: sonraki sezonların kanonik yılı/süresiyle MoviesDrive; aynı4route içinde ikinci4K.6yeniMKV/2yeni4K,303test ve23upstream drift0. Yayımlandı: ffe3ee430254d2e9a6f19f622758dad7399854d6; Test40606575896/Pages40606575720 başarılı, yedi public HTTP200/SHA eşit.
2. TRdublaj/film/anime ve farklı dizilerin indirme kapsamı açık. Bu tur yeniTRdub/film/anime0; yalnız ikiS5bölümü6yeni. S3MovieDrive0. Yeni kaynak aramasını bırakma; metadata etiketini gerçek dosya/ses kanıtı yerine koyma.
3. Inception/Flea/YourName0 ağ turu ve9/10/9recovery saklandı. Native kotayı/toplam süreyi artırma veya iPhone fiziksel iptal garantisi verme. Sonraki sezonun TMDB yanıtı eksik/yanlışsa kimliği gevşetme; ilk yılı sezon yılına dönüştürme.
4. Fiziksel iPhone/tam indirme/offline/senkron/font açık.7.568GB kısıtlı4K başka host/hesapla denenmez. Diğer11.171GB4K ayrı yayımlanmış dosyadır. TR4K başlıklı StepDogs kaydında2013/2023 çelişkisi var; tekrar zorlamaya girme.


## 1.8.6 öncelik

1. Hazır: Archive eksik yıl/identifier araması ve MoviesDrive ilk sezon bölümleri;5yeni dosya/1TRdublaj/3TV.297test,23upstream drift0. Yayımlandı: 2aa334fff0b90f9ef59a73de278ce5e010c84f07; Test40604773258/Pages40604773251 başarılı, yedi public HTTP200/SHA eşit.
2. Sonraki sezon ve küçük TV/4K/TRdublaj kapsamı açık. MoviesDrive sonraki sezonu destekliyor diye sunma. Yeni TRdublaj için gerçek ses izi gerekir; Fury küçükMP4 sesini asıl MKV'den kopyalama. Yeni anime/4K bu tur0.
3. TV ara tekrarda yeni dosyalar0, son tur S1E1 bir/S1E2 iki bulundu. HubCloud/gamerxyt/Pixel timeoutları saklandı. Ek kotayla veya farklı hostla kısıt aşma; kimliği gevşetme. Eski Inception/YourName/Flea4K ve HotelTRdub korundu.
4. Fiziksel iPhone/tamindirme/offline/senkron/font açık. Baştan joker Archive sorgularını yeniden ekleme; AND/OR gruplaması canlı sorgu anlamını değiştirir. UHDMovies public sayfada indirme yok, MoviesMod medya kanıtı yok; yeni veri olmadan aynı yolları döndürme.


## 1.8.5 öncelik

1. Hazır: Archive kanonik ad sorgusu; 12 ek anime filmi dosyası, bir yeni 4K; sekiz eski dosya korundu. Dört MKV'de JA/EN ölçüldü; sekiz MP4'ün sesi ölçülmedi. 288 test/QuickJS ve 23 upstream dosyası kontrolü geçti. Yayımlandı: e454421efc8ed2ec642640ef51a1a0d0a79ae74b; Test 40601281450, Pages 40601281261 başarılı. Yedi public HTTP 200/SHA kontrolü geçti.
2. Türkçe dublaj, film/dizi/anime bölümü ve 4K kapsamını büyütmeye devam et. Bu tur yeni dublaj veya bölüm yok. Mevcut başarılı kaynaklar yeni uygun kaynak aramayı bırakma gerekçesi değildir. Geçerli baseline sekiz dosyadır; ilk boş tur üzerinden katkı hesaplama. Yeni video pini, hesap, sabit anahtar veya sunucu ekleme.
3. Fleabag/Death Note önce ağ nedeniyle boş, tekrarda 9/4 dosya verdi. Dune son turda 24 saniyelik mantıksal sınırda sekiz hazır sonuç korudu. Native kotayı artırma veya iPhone zaman garantisi verme. Hintçe asıl/türev filtresinde kendi ölçümü EN/JA olan çocuğun korunmasını izle.
4. Your Name 4K'nın 1 MiB örneği Cluster'a ulaşmadığı için kare çözülmedi; bu tam dosyanın bozuk olduğu anlamına gelmez. Film başına manuel senkron kontrolüne sapma. Fiziksel iPhone, tam indirme/oynatma, offline altyazı, senkron ve font hâlâ açık. Anizium token/Cf-Control, kimliksiz Mononoke koleksiyonu ve videosuz Totoro 4K yollarını yeni bilgi olmadan tekrarlama.

## 1.8.4 öncelik

1. Hazır: HDHubPixel film/bölüm yolu;15yeniMKV,6yeni4K,11gömülüTR. 276fixture/QuickJS;0.6.5-beta/23drift0. Yayımlandı: kod 9172166ee08173ef444fe4b636a6934053dd2485, Test 40578064383, Pages 40578064386 başarılı; yedi public HTTP200/SHA eşit.
2. YeniTRdub0/anime0; film4KveTVkapsamıaçık. Flea3bölüm9yeni,Sev2yeni,3film4yeni; hertekrardatümkataloğunçalışacağıanlamınagelmez. Severanceküçükdosya/kalitesınıfıeksik. EskiDune7/Inception8/Hotel7/Death4 korunmuşörneklerdir.
3. StrangerThings4Kgerçekfileama sourceposterkanonikTMDBilefarklı. AynıIDresmiimagesbağıaraştırılabilir;eşleşmeyiposteriuydurarakgevşetme. AnimeWorldchallenge/Ultime403/AniPub404/DiziWatchTLS/NakiosDNS/recoveryyanlışfilm yeniolayolmadan tekrarloopolmasın.
4. FizikseliPhoneindirme/MKVadlandırma/offlineTR/EN/senkron/fontaçık. MasaüstüMPV1MiBbirkaresadeceparser/decoder/TRiziseçimkanıtı. EkPC/backend/accountkurma;nativekotalarınıartırma.

## 1.8.3 öncelik

1. Kod ve kanıtlar hazır: Archive iki dilli genel eşleştirme + yıl alanı olmayan HD araması;269check/QuickJS,0.6.5-beta/23blob drift0. download-expansion-183 ve coverage-183 içinde12yeni dosya/4film,6ölçülmüş TR+EN MKV. Yayımlandı: kod7bb885fe547f2c14e82292c0df499b3a0e82e4c3,Test40567450137,Pages40567450138 başarılı;7publicHTTP200/SHA eşit.
2. İndirme/4K/TRdub/TV/anime kapsamı açık. Yeni4K/TV/anime0. Altı küçükMP4'ün sesdili ölçülmedi, TRdub iddia etme. Hotel6->0tekrarboşluğu ve Flea24sdeadline izlenmeli; kotayı artırarak veya yanlışyıl/sesle kapatma.
3. HDFilmCehennemi encryptedplayer sabitsecret, HDHub4u Cloudflare, yeniHDHub gpdl TLS ve MoviesDriveTV2023yanlışyıl yollarını yeni durum olmadan döndürme. DiziGom aynıDiziBalHLS ailesi, yeniindirmesayma. FizikseliPhoneMKV/TR-ENoffline/ses/senkron/font testleri hâlâ yok.

## 1.8.2 öncelik

1. Tamamlandı: 1.8.2 aynı manifestte yayımlandı. Kod be767570da27096bc1bddd0c11d699b68e16dbf1; Test40557879614 ve Pages40557879693 başarılı, yedi public dosya HTTP200/SHA eşit. MoviesDrive main'de varsayılan açık. Altı yapımda dokuz yeni MKV+TR; Inception 3840×1598/7,59 GB. 261 check/QuickJS ve Nuvio0.6.5-beta/23 blob drift0.
2. İndirme, TR dublaj ve bölüm kapsamı öncelik. Bu tur yeni TR dublaj0/TV0/anime bölümü0. Genel TV yollarında kimlik/yıl/sezon/bölüm kanıtı aranmalı; MoviesDrive'ın eksik metadata kayıtları zorla eşlenmemeli. Yeni 4K dosyalar aynı Range/ses/TR kontrolünden geçmeli; EN+HI, TR dublaj sayılmamalı.
3. Fleabag2/DeathNote0 zaman aşımı sonrası recovery5/4 geldi. Your Name 24 saniyede beş hazır sonuç döndürdü. Hız/kararlılık takibi açık; video3/sub4/EN1 değişmedi. Fiziksel telefonda MKV indirme, offline TR/EN, ses, senkron ve dışa aktarımda yeniden adlandırma henüz sınanmadı. Masaüstü örneğinden bu testleri geçti sonucu çıkarılmamalı.

## 1.8.1 öncelik

1. Tamamlandı:1.8.1 aynımanifestte yayımlandı. Kod071bda9bba5b12dec1dab157d98a6fb3bd9d5932; Test40552547300,Pages40552547175 başarılı,7publicHTTP200/SHAeşit. Purstream online ekkaynak,254check/QuickJS,Nuvio0.6.5-beta20drift0. Beş film/bölümde720p+mevcutTR; yeniindirme/4K/TRdub/anime0.
2. İndirme/4K/TRdub öncelik: yeni hazırdosya + nativeuygunad + doğrukimlik/yıl/S/E ->geneladaptör. DunePixel2.07GB1080MKV gerçek ama uzantısıznativead sorunu; desteklenmeyenR2köprüsüne zorlaekleme, yeniPC/backend/accountkurma. Yeni durum olmadan4KWorkerTLS/Pixel,Epiktimeout,CineFreakDNS,SeiCodeaynaları döngüsüne girme.
3. DuneFRaliası ve Purstreamanimepremiumpath bu turadaptebaşarı değil. MevcutTR35 alternatifler senkron ölçümü değil. FizikseliPhoneoynatım/indirme/offline/senkron/fontyok. Birleşik Dune7,Matrix5,Flea6,Death4 dosya sayısı tarihseltur; tekrar garantisi değil.


## 1.8.0 öncelik

1. Tamamlandı:1.8.0 aynı adreste yayımlandı; kod 7ea52b8609fa1e236147bff1d359753b37be1be2, 248 check/QuickJS, Nuvio0.6.5-beta/20 drift0, dört aktif ID. Windows/Linux 40522695904, Pages 40522696038, yedi public dosya HTTP200/SHA başarılı; github-publication.json güncel.
2. Yeni HDRezka31MP4/8örnek+TR,59MB–3,07GB/240–720p. Matrix indirme açığı kısmen kapandı; Shameless0 sürüyor. Yeni indirilebilir4K/TRdub0, animeyeniHD0. Premium4K veya RUdublajı bu hedefleri karşılamış gibi sayma; yeni gerçek ücretsizdosya yollarını araştır.
3. Bir Dune tekrarı24s/0oldu; sonrakiHDkapalı3,açık6(HD4) dosya verdi. CDN değişkenliğini saklama. sourceoff/on farklı zamanlarda; telefonhızı/kararlılık kanıtı değil. root24s/native3/sub4/EN1,HDkeşif10s aynı.
4. Dunealias fixture gerçektelefonTMDBalternative_titles API kontrolü değildir. FizikseliPhone özgünses, bütün dosya, TR/ENindirme/offline/senkron/font hâlâ sınanmadı. YeniPC/helper/backend/hesap/secret/per-titlepin ekleme.
5. Bu tur başarısız: HDHubPixel404/10GbpsWorkerTLS(Node+curl),Jet.nettimeout,Eksen404,Cizgitimeout;Archive4Ktrailer. Güncel durum değişmedikçe aynı düğümlerde dönme. Shameless'te yalnızRU/UA/KA var, gizlioriginalIDzorlamayla ekleme.

## 1.7.9 öncelik

1. Tamamlandı:1.7.9 aynı adreste yayımlandı; kod 9cc51c8c95ad77579812f2818541ad512e92e6d9, 238 check/QuickJS, Nuvio0.6.5-beta/20 drift0, dört aktif ID. Windows/Linux 40516316789, Pages 40516317132, yedi public dosya HTTP200/SHA başarılı; github-publication.json güncel.
2. Ana açık indirilebilir yüksek kalite/4K ve TR dublaj; yeni doğrulanmış katkı bu tur sıfır. Goojara altı küçük MP4+TR katkısı yaptı; çoğu gerçek480p, GoT720p HCSubs. Bu katkı yüksek kalite açığını kapatmaz. Anime yeni dosya katkısı yok; önceki DeathNote4 seçeneği korundu.
3. Matrix/Shameless dosyaları hâlâ eksik. NoWayHome oyuncu yılı2022, Shameless üst yıl2010 çelişkisini doğru IMDb/kanonik yıl kanıtı olmadan aşma. Dune tekil timeout sonrası iki birleşik turda yeni dosyayı verdi; Spider-Verse yeni dosyası sonraki tekrarda başarısız, eski Archive1dosya kaldı. Kaynak/CDN kararlılığını bütçe içinde izle, bütün filmlere tek tek pin yazma.
4. DiziBoxIzle eksik episode/404, FullHDFilmizlesene.co kimliksiz iframe, Asya nohit, AnimePraX timeout, Vikingfile404; key isteyen SineWix/Anizium/1shows ve kullanıcı token isteyen GramCinema bu tur eklenmedi. Goated PoW çözülmedi. Yeni dış durum olmadan aynı başarısız yolları döndürme; HLS ağırlıklı M3U'yu yeni MP4 sayma.
5. Fiziksel iPhone'da yeni dosya+TR/EN indirme/offline, tam oynatım, ses ve görsel senkron yok. Public anonim cookie auto-follow fiziksel davranışı sınanmadı. Font problemi çözüldü deme. Yeni PC/backend/hesap/sabit secret ve native kota gevşetmesi yok.

## 1.7.8 öncelik

1. Tamamlandı:1.7.8 aynı adreste yayımlandı; kodfa935e2aca48cfb1c324a942971272c9c10e2b42,229check/QuickJS,Nuvio0.6.5-beta/20drift0,4aktifID. Windows/Linux40509886549,Pages40509886492,7publicHTTP200/SHA başarılı; github-publication.json güncel.
2. Ana açık: genel film/dizi gerçek indirme, indirilebilir4K/TRdub ve eksik anime. Matrix/Shameless0dosya devam; Dune2/Fleabag2/DeathNote4 önceki sayı korundu. RareFilmm9kısmiMP4 bu açıkların kapandığı anlamına gelmez.
3. RareFilmm tekrarında3+3+3boyut/piksel/süre aynı. HushENonly, GüneşTR35+ENhard, YolTR66. FizikseliPhone tamMP4+TRindirme/offline/senkron yok. TRözgünses yeniTRdub diye sayılmaz.
4. Yeni durumu araştırmadan MoviesModGoogleRange200/uzantısızMKV,MatrixUploadinprogress, UHD4KUnknownerror,5HDHubWorkerTLSağhatası,FullHD403,Sezon/Jet/Nkiri/CTGağhatası,Sibnet403 tekrarlarında dönüp durma. Aynı ağda Node hatası telefonun kesin başarısızlığı değildir; cihazbaşarısı da varsayma.
5. İlerleme yeni hazırdosya/Range kanıtından geneladapöre; yalnızmanifest/ad/claimed4K ile kaynakekleme. YeniPC/backend/account/secret/per-title pin yok. Nativekotayı veyaaltyazıkorumalarını gevşeterek sayışişirme.

## 1.7.7 öncelik

1. Tamamlandı:1.7.7 aynı adreste yayımlandı; kodfe0eed0d323268f186a3f17e85612de2e1bc18f4,222check/QuickJS,Nuvio0.6.5-beta/20drift0,4aktifID. Windows/Linux40499840365,Pages40499840426,7publicHTTP200/SHA başarılı; github-publication.json güncel.
2. Film/dizi MP4/MKV kapsamı hâlâ öncelik. Yeni genelindirmesağlayıcısı0. Matrix/Shameless/GoT eksik; Spider-Verse bazı güncel denemelerdeArchive ağ/erişim nedeniyle0. Farklıkalite/özgünses veTR ile tekrar erişim hedefi açık. Tektek yeni video pinlerine dönme.
3. Hızlıİzle defaultaçık4.ID; HDF+DiziBal burada, main'de yinelenmez. Telefonda4.grupetkinleşme/ilkcompletiongörünümü/fizikselağbeklemesisınanmadı. Source/QuickJSveNodeilkgrupsüresini iPhonegarantisi sayma.
4. Streamflix publiccatalog/config açıldı ama dosyaCDN ağhatası, Firebase401/private. DB'yi zorlamadık, statikdevkatalogmirror yapılmadı; entegredeğil. FlixIndia forsale, FullHD403, MoviesMod reklam yönlendirme, UHDMovies/Nkiri/FzMovies ağ; Vidnest haricidecryptbağımlılığı/Franimeanti-scrape yolları eklenmedi. Goojara ana sayfa erişimi tekbaşınadosya kanıtı değil. Eski başarısızları yeni durum olmadan tekrarlama.
5. Genelilksonuç hızını izle: kaynakkeşfi/probekuyruğu ayrıldı, subtitlehashgate var, HDHub8s keşiflimiti var. Metadata/Range gecikmeleri veNativeiptal nedeniyle bazıdosyaaramaları hâlâ15–24s olabilir. Fizikseloynatım/indirme/TR-ENoffline/senkron/fonttestleri yok. YeniPC/backend/hesap/sabitkeyekleme.

## 1.7.6 öncelik

1. Tamamlandı: 1.7.6 aynı adreste yayımlandı; kodc785f7544cdc94de70f7c4c33db63bedf07814b2,210check/QuickJS ve20upstreamdrift0. Windows/Linux40423385497,Pages40423385471,altıpublicHTTP200/SHA başarılı; üçkimlik korunur. github-publication.json güncel.
2. Film/dizi MP4/MKV açığı öncelik: Shameless/Matrix/GoT ve ek gerçek kaliteler açık. HDHub MB/sürüm planı düzeldi ama yeni dosya sağlayıcısı bulunmuş sayılmaz. Public gerçekdosya ucu ->genelkatalog yöntemini sürdür; yeni pin/PC/backend/hesap/sabitkey yok.
3. Yeni HDFilmDelisi TRdublajı HLSonline katkısıdır. Dune/Matrix/NoWayHome yalnız gerçekliste/probe; fiziksel ses/senkron/tamfilm testi değil. FilmModuDunebu tur0; eski/ölüVidmody,DiziPal2140ağ,HDFilmCehennemi/FilmMakinesi403,PuhuTVsabitkey yolunu yeni durum olmadan tekrarlama.
4. Yeni sade kartlarda ipucu modellerini rastgele genişletme. Gerçekpiksel/byte/ses önceliği veHI-only doğru kalsın;TR/ENöncelik5+N. Model GB gerçekindirmebyte değil; kaynak/renditionevidence içeride tutulsun.
5. Telefon yenilemesi/TRdublaj seçimi/tamdosya/TR-ENoffline/senkron/font testleri yapılmadı. iOSnativebeklemeleri için fiziksel süre garantisi verme. Font sorunu bu kart sürümüyle çözülmedi.

## 1.7.5 öncelik

1. Waploaded ana sağlayıcıda varsayılan açık; kısmi son50 film/50dizi listesi. 1.7.5 aynı adreste yayımlandı:327a3765269ef2d1b8059bf6d43696bc76470630.199check/QuickJS,20upstream drift yok; Windows/Linux40419829204,Pages40419829111 vealtıpublicHTTP200/SHA başarılı; github-publication.json güncel.
2. Yeni gerçek film ve bölüm dosyaları var; yine de Matrix/Shameless/GoT indirme açığı kapanmadı. Genel dosya hostu/katalog araştırmasına devam. Waploaded'ın bozuk aramasını veya önceki başarısız API'leri dış değişiklik olmadan sürekli çağırma; manuel film pinine dönme.
3. Yeni kaynağın arşiv keşfini ancak küçük ve sağlam genel bir yol bulunursa genişlet; güncel50 kayıt dışında kapsam varmış gibi davranma. İki dosya Node'da ve birleşik taramada geçti; S20E01 dosya timeout oldu, tüm sezonun kararlı olduğunu söyleme.
4. Southland alternatif yılının gerçek telefon TMDB release_dates yanıtında bulunması ve gerçek iPhone indirme/TR altyazı/offline/senkron hâlâ test edilmedi. Sabit festival tarihi fixture'ını canlı TMDB API kanıtı sayma. TR35 puan aynı film düzeyidir; senkron garantisi yok.
5. Yeni PC/backend/hesap/secret/videoPin ekleme. Aynı mevcut köprü hesabı sorusunu tekrarlama. Wap yeni dosyaları köprü kapalıyken de doğrulandı; eski akış korunur.

## 1.7.4 öncelik

1. **Tamamlandı:**1.7.4 c6815144c5586d999f5509d907ef41c9f820d7f3 aynı manifest/üçscraperile yayımlandı.189check/QuickJS,20upstreamdriftyok; Windows/Linux40414456692/Pages40414456949 vealtıpublicHTTP200/SHAbaşarılı. Kanıt/hafızagüncel.
2. Kısmi kaynakları kabul eden güncel kullanıcı talimatıyla film/dizi MP4/MKV araştırmasına devam; yeni film/diziadaptörü0. Bütünkatalogkapsamı şartı koyma; gerçekdosya/kimlik/yıl/S/E şartı sürer.
3. EkAnimeAniMOM+SeiCodevarsayılanaçık. SeiCodeE3/E111080p0,29GB/EN;TRyok. AniMOMDN1birkez0,36GB/TR-EN,tekrarveDN2boş. Kalıcıistikrar/tümsezon/hep720piddiasıyok.
4. Telefondaüçüncüscraperotomatiketkinleşme,erkenEkAnimegörünümü,tamindirme/offline/TR-EN/senkron sınanmadı. Tekrarkimlikayarlarıbozma/PCsunucu/hesapsabitanahtarekleme.

## 1.7.3 öncelik

1. **Tamamlandı:**1.7.3 a46d6838c257d7a21320e432a0c6be766b24fadd aynı manifest/ID’lerle yayımlandı.178check/QuickJS,20upstream drift yok; Windows/Linux40391651511/Pages40391651671 ve5publicHTTP200/SHA başarılı. Yayın kanıtı/hafıza güncel; kapsam hedefi açık.
2. Yeni kararlı film/dizi MP4/MKV sağlayıcısı hâlâ0. Önce terminal dosya/kararlılık, sonra genel katalog; kaynak sayısı diye HLS/embed/401/403 ekleme. download-research-173.json yeni engelleri içerir.
3. AniMOM varsayılan kapalı. DN1tekil720p/0,36GB+TR;DN2vebirleşik0. Birden çok bölüm ve birleşik kararlılık olmadan default açma; aynı başarısız düğümü durmadan sınama.
4. Büyükmoov/ilkCDNRange düzeltmesi gerçek dosya bilgisi içindir; fiziksel iPhone indirme/offline/senkron ve genel kapsam garantisi değildir.

## 1.7.2 öncelik

1. **Tamamlandı:**1.7.2 kart düzeni/EN aynı manifest/ID’lerle yayımlandı; kodf6cdc270f3534d528bfd1df53834a8f23902a23b.168test/QuickJS,20upstream drift yok; Windows/Linux40383064585/Pages40383064008 ve5varlıkHTTP200/SHA başarılı. Yayın kanıtı ve hafıza güncel.
2. Fiziksel iPhone’da kalite/GB/ses/TR-EN sırası, Türkçe zorunlu EN-only filtresi ve iki dil seçimini denemek gerekiyor. Tam video/iki dil indirme/offline/senkron henüz yok.
3. Fleabag Archive ilk canlıtur1/tekrar0 dosya verdi; sebep ağ/Range. Bunu EN regresyonu çözüldü veya iki dosya hep korunuyor diye sunma. Online TR/EN vardı.
4. Yeni genel MP4/MKV sağlayıcı hedefi açık; bu tur yeni video sağlayıcısı değil altyazı ve görünüm geliştirmesidir. Ücretsiz/hesapsız/yeniPCsunucuyok ve manuel film pinine dönmeme şartları sürer.


## 1.7.1 öncelik

1. Yeni çalışan genel MP4/MKV sağlayıcı bulma hedefi açık. Bu tur yeni sağlayıcı yok; bozuk/embed/login isteyen sonuçları ekleyerek sayıyı şişirme. Matrix/Shameless/GoT indirmeleri hâlâ eksik.
2. download-research-171.json’daki güncel engelleri esas al: CinemaCity/Webteizle/HDHub4u403; ShowBox/FebBoxlogin; MoviesDrive/HubCloudkurtarmayanlışfilm; Workerörnekleri ağ hatası. Bunları değişiklik kanıtı olmadan aynı tur tekrar tekrar deneme. Üçüncü taraf anahtar/hf.space yardımcıproxy kullanma.
3. Çalışan dosyaGET hostunu doğrula, sonra genel katalog araştır; tek tek yeni film/bölüm pinine dönme. Ücretsiz/hesapsız/yeniPCsunucuyok şartı sürer.
4. MevcutVLCfontalternatifi için kullanıcıtelefonu: VLCtercihi,altyazıaktarımı,TRfont ve offlineaynıdosya. Kaynakvar/cihaztestiyok ayrımı. DahiliNuviofont değişmedi.
5. **Tamamlandı:**1.7.1 37c70e5 yayımlandı;156test/QuickJS,20upstream drift yok; Windows/Linux40377335403/Pages40377335426 ve5assetHTTP200/SHA başarılı. Canlı kanıtlar coverage-171/anime-aot-171/download-research-171 içinde. Yeni dosyaGETnativekotası3 vealtyazı4 sürer; fiziksel iPhone zaman garantisi yok.


## 1.7.0 öncelik — kullanıcının son yönlendirmesi

1. Genel ve ücretsiz/hesapsız **farklı gerçek MP4/MKV** sağlayıcıları araştırmaya devam et. Yeni film/dizi adaptörlerinin HLS olması indirme hedefini tamamlamaz. Aynı hash/boyut aynasını yeni dosya sayma. Matrix/Shameless/GoT indirme boş.
2. Yeni manuel video pinleri/film başına sahne incelemesi ana yöntem değil; yeni PC/sunucu remux servisi kurma. Mevcut köprü/Sites hesap sorusunu tekrarlama.
3. DiziBak tarih/kategori koruması eksikse sonucu gevşetme; başka yapımın ilk bölümünü birleştirme. Anime sonraki sezon/mutlak bölüm tahmini yok. FilmModu alt/TRdubmevcutkaynakdilleri; harici sesABI’si yok.
4. En son tam turda GOT/Breaking Bad çoklu-hosttimeout oldu; yeniden aramada toparlandı. coverage-170-full-run ve-recheck birlikte raporlanmalı; kararsızlık çözüldü deme. Eski pin metadata’sı artık genel aramadan önce paralel başlar.
5. Türkçe font appyamasının kaynak check’i başarılı; iOS derleme/kurulum ve gerçek glif/oynatma doğrulaması hâlâ yok. Physical tam video+TRindirme/uçakmodu/senkron yapılmadan başarı deme.
6. **Tamamlandı:**1.7.0 ab9f139 yayımlandı; Test40370600453/Pages40370600251 başarılı;153test/QuickJS ve beşassetHTTP200/SHA eşit. Yayın kanıtı ve hafıza güncel. Kapsam/fiziksel hedefler açık.


## 1.6.4 öncelik

1. **Tamamlandı:** 1.6.4 b673412696a172a5f77967558a8bdaf9aa7ff4fb yayımlandı. Yerel140/140 ve QuickJS, Windows/Linux40335362672, Pages40335362557 başarılı; beş public varlık HTTP200 + yerel SHA eşit. compatibility/github-publication.json güncel. Kapsam ve cihaz hedefi tamamlanmadı.
2. Aktif goal tamamlanmadı: Matrix, Shameless ABD S01E01 ve GoT S01E01 indirme yok. Spider-Man iki başlıkta ek kalite; Inception ve Fleabag S01E01 ikinci piksel seçeneği eksik. Fleabag S02E01 ES sabit kaynak temiz TR hedefine sayılmaz. 11 küçük+TR ile10 temiz değerini karıştırma.
3. Archive ZIP üye linkleri .cache/zip164-{matrix,got}.html; GOT üye GET200 gerçekMKV ama Range/Content-Length yok. ZIP Range d1/d2 ve Matrix HEAD timeout; saf native doğrulamaya eklenmedi. Sunuculu hazırlama prototipi hâlâ yapılmadı. Sites kayıp hesap engeli aynı; yeni Site açma.
4. İçerik kanıtları compatibility/content-164.json, test aracı npm run test:archive:content. .cache/breaking-content164.json eski araştırma yerine yayımlanan yeni UUID’li kanıtı esas al. Fleabag2 ilk sonuçlar geometri yüzünden zayıftı; düzeltilen iki örnekte40/40 eşleşti. Sabit İspanyolca yazı manuel raster kontrolünde görüldü; temiz izleme sayma.
5. Yeni erken altyazı akışı ve bitmemiş native fetch sınırını koru. Genel URL rezervi metadata bitince uygun durumda geri açılır. Yeni kaynağı sadece adıyla ekleme; yeni arama native iş sayısını gereksiz büyütmesin. Bilinen Archive pinini genel arama beklemeden doğrulamaya alma ileride ayrı incelenebilir.
6. Fiziksel iPhone video+TR tam indirme/uçak modu/senkron ve ses tercihi yanıtları bekleniyor; aynı soruları tekrarlama. Bu testler ve kaynak boşlukları olmadan goal complete yapma.

## 1.6.3 ve aktif kapsam hedefi

Sonraki araştırma notu (henüz üretimde değil): `.cache/compare-next164.mjs breaking` iki ayrı 20 saniyelik sıralı örnekte kanonik Breaking Bad S01E01 ile 40/40 kare eşleştirdi; offset -1 saniye, hash/boyut/süre bilgisi `.cache/breaking-content164.json` içinde. Kaynak `breaking-bad-s-01e-01-720p.-brrip.-sujaidr_202411`; MKV 487.194.215 byte, MP4 344.478.919 byte. Bu dosyalar daha pinlere eklenmedi; 1.6.3 kapsam sayıları bunları içermez. MP4 türevi `original` bağı ve gerçek hash/piksel/süre ayrıca doğrulanmalı. Fleabag S02E01 `FL34B4G SUB T02XE01.mkv` örnekleri +3,5 saniye benzerlik verdi fakat ilk örnek katı eşiği geçmedi; `.cache/fleabag2-content164.json` contentSamplesMatch=false. Eşiği düşürüp başarılı sayma; farklı bağımsız sahne/ekranda yakılmış yazı etkisini incele. Streamline’ın güncel VegaMovies `search.php?q=IMDb` yöntemi iki başlıkta 404; kaynak diye eklenmedi. Üretim hâlâ 1.6.3/8 küçük+TR, 14 online+TR, 5 kaynak ölçütü.

1. **Tamamlandı:** 1.6.3 edc8a0527477b8208c8a4274691d44cb4f89e8c4 yayımlandı; Dune/Spider-Verse/No Way Home küçük dosyaları ve Fleabag S01E01 99 MiB MKV+TR eklendi. Yerel 128/128 ve QuickJS, Windows/Linux 40326657313, Pages 40326657180 başarılı. Beş public varlık HTTP 200 ve yerel SHA eşit; upstream 20 kilitli dosya değişmedi. Kapsam hedefi tamamlanmadı.
2. Hedef hâlâ açık: Matrix, Inception ve Fleabag S02E01/Shameless/GoT/Breaking Bad vakalarında indirilebilir dosya sıfır; Fleabag S01E01 99 MiB MKV+TR ile eklendi. No Way Home ve Spider-Verse’de ikinci kaliteli seçenek eksik. 14/14 online+TR olması hedefi tamamlamaz. Kapsam JSON’u gerçek eksikleri tutuyor.
3. Ses tercihi sorusuna yanıt gelirse uygula. Küçük Dune MKV Hintçe, No Way Home dosya adı Fransızca; özgün ses bilinmiyorsa varsayma. Şimdilik tüm seçenekler etiketli, mevcut boyut sırası korunuyor.
4. PC’de HLS’yi tamamlanmış gerçek MP4’e hazırlama prototipini araştır/test et. Portable FFmpeg resmi zip+SHA ile LocalAppData/NuvioTrHdTools/media-prototype altında; .cache/media-tools163.json sonucunu kontrol et. Dışarıdan erişim veya kalıcı servis kurulmadı. Public servis öncesi PC açık kalması, alan/bant kullanımı ve erişim tasarımı somutlaştırılmalı; kaynaklar/anahtarlar commit edilmemeli.
5. Archive TV’de kimlik/yıl eksikliğini zayıf ad eşleşmesiyle aşma. OpenSubtitles anonim hash araştırması örnek Fleabag’de sonuçsuz; arama sonucunu hash kanıtına dönüştürme. HDRezka challenge, StreamFlix izin reddi/dosya hatası, Pixel uzantısız MKV sınırları korunur.
6. Son aşama iPhone’da tam video + TR indirme, uçak modu ve senkron. Bu yapılmadan goal tamamlanamaz. Aynı Sites hesap sorusunu tekrarlama; köprü1.4 sürer.


7. Dar içerik pinlerini genişletmek için her yeni dosya/bölümde bağımsız kanonik örnek karşılaştırması ve gerçek Range/hash gerekir. Dune örneklerinde hız farkı var; yalnız başlangıç offset’iyle altyazı düzeldi deme. Fleabag S01E01 pinini tüm sezonun kimlik onayı sayma. compatibility/content-163.json ve tests/archive-pins.test.cjs kanıtları korunmalı.


## 1.6.2 öncelik

1. **Tamamlandı:** 1.6.2 5b298cd yayımlandı; yerel 114 test/QuickJS, Windows/Linux 40309193725 ve Pages 40309193727 başarılı. Beş public varlık HTTP 200 + yerel SHA eşit. Ana/anime kimlikleri ve ayarlar korunur; kaynak sorunu telefonda çözüldü sayılmaz.
2. iPhone’da yeni Tanı satırıyla gerçek ayarlar/anahtar varlığı ve sonuç alınmalı. Fleabag S01E01/Dune/Obsession telefon kontrolünden önce çözüldü deme. Sabit metadata testi gerçek TMDB API değildir; gerekirse yalnız online için HDHub/Archive geçici izolasyonu dene, varsayılanları sıfırlama.
3. Native iOS 60 saniye/iptal eksikliği/bekleyen işler kalan risktir. Plugin mantıksal bütçesi fiziksel garanti değildir. API erişimi ve HTTP durumları gizli veri içermeyen özetle ayrılmalı.
4. Küçük Dune dosyası, fiziksel tam oynatma/indirme, çevrimdışı altyazı ve senkron çözülmedi. Canlı Dune dosya CDN’i ağ hatası verdi; kimlik/konteyner/Range kontrollerini kaldırma. Büyük dosyalar kalsın.
5. Sites erişimi yok; aynı hesap sorusunu tekrarlama/yeni Site ile etrafından dolanma. Köprü 1.4 korunur.


## 1.6.1 öncelik

1. **Tamamlandı:** 1.6.1 e5824c9 yayımlandı; 107 test/QuickJS, Windows/Linux ve Pages başarılı. Manifest/sürümlü JS/legacy JS/sayfa HTTP200+yerel SHA eşit. Depoyu yenileyince ana+anime iki kayıt; kimlik/ayarlar korunur.
2. iPhone’da Dune online satırları, Shameless ABD/Fleabag kullanıcının gerçek S/E’si kontrol edilmeli; kullanıcıya üç scraper açık mı ve S/E soruldu, yanıt bekleniyor.
3. Küçük Dune indirmesi hâlâ çözülmedi. MoviesDrive/HubCloud küçük sayfalar TLS hatalı Worker/Pixel uçları verdi; metadata/büyük Range200 koşullarını gevşeterek ekleme. Büyük HDHub desteklenir.
4. Sites köprüsü get_site yineNOT_FOUND; mevcut kimlik korunur, yeni Site ile erişim engeli aşılmaz, kullanıcıya aynı hesap sorusu tekrarlanmaz.
5. Fiziksel iPhone/tam indirme/çevrimdışı/senkron, anime sezon mapping ve native Türkçe font düzeltmesi bekleyen işlerdir.

## 1.6.0 güncel öncelik

1. **Tamamlandı:** GitHub1.6.0 af89eda, Windows/Linux100 test ve Pages başarılı; manifest/üç scraper/sayfa HTTP200+yerel SHA eşit. Kanıt compatibility/github-publication.json. Mevcut eski scraper ayarları Dosyalar’da; yeni iki scraper varsayılan.
2. iPhone’da hızlı grup diğer taramalar sürerken gerçekten görünüyor mu, Death Note/AoT S01E01 MP4+TR tam indirme ve uçak modunu doğrula. Sabit referans metadata/QuickJS telefon testi değildir.
3. Küçük film/dizi dosyaları hâlâ eksik; Dune/GOT dosya aynaları26Ekim ağ hatası verdi. MoviesMod/DriveSeed uzantısız+Range200 MKV’yi korumayı kaldırarak ekleme. Yeni kaynakları gerçek dosya ile doğrula.
4. Anime sonraki sezon/mutlak bölüm eşlemesi yapılmadı; kanonik episode mapping olmadan tahmin ekleme. Yakılmış altyazı otomatik tanınmıyor; harici metin üst üste binebilir.
5. Nuvio iOS Türkçe font kapsamı uygulama tarafında çözülmeli; plugin font alanı yok. Gerçek OTF cmap ş/ğ/ı/İ ve büyüklerinde eksik glif doğruladı. Kullanıcının kurulu sürümü/görüntüsü doğrulanmadı; mevcut plugin font düzeltmesi diye sunma.
6. Sites çalışma alanına erişim gelmedi; mevcut köprü1.4 sürer, ayrı sesli HLS master korunur. Kullanıcıdan aynı hesap geçişini yeniden isteme.

## 1.5.0 güncel öncelik

1. **Tamamlandı:** GitHub Pages 1.5.0, 92/92 yerel check, Windows/Linux testleri ve Pages başarılı. Oturumsuz manifest/provider/sayfa SHA eşitliği compatibility/github-publication.json'da; kod commit'i 62bf0b31ae1a767cd63b442c3bbde113a4601dfb. Yeni Sites HLS servisi bu yayına dahil değildir.
2. Kullanıcı iPhone'da GOT/Fleabag bölüm taramasını ve kısa sıralı listeyi deneyecek. GOT 4,41 GiB ve Spider-Man küçük MP4/MKV için video+TR tam indirme/sonrasında uçak modu gerekiyor. Kaynak/QuickJS testini cihaz testi saymayın.
3. Fleabag indirilebilir dosya yok; Pixel404/link-generator HTML elendi. Dune'da en küçük yeni dosya 18,24 GiB; daha küçük ücretsiz doğrudan aynalar ana kapsam eksiği.
4. **Sites bekleyen iş:** kullanıcı şu an önceki çalışma alanına dönemiyor. appgprj_6ade5021d6b88191818ece53a5d5f1e0 aynı kimlikte korunur; yeni Site açmayın. Erişim geldiğinde source helper ile açın, src/ + hosting/worker.mjs 1.5 kodunu mevcut checkout'a aktarın, Worker ESM doğrula/paketle/yayımla. /hls/profile.m3u8 ses/altyazı grupları korunarak canlı test edilmeli. O zamana kadar capability gate kapalı; ayrı sesli HLS otomatik master olarak kalır.
5. Kaynak envanteri/araştırma raporu üzerinden yalnız gerçek erişilebilir ücretsiz/hesapsız kaynakları genişletin. Kopya sağlayıcı sayısını başarı sanmayın. Otomatik zaman senkronu hâlâ uygulanmadı; güvenilir referans/ses ölçümü gerekir.

Aşağıdaki 1.4.0 notları tarihsel bağlamdır.

Son güncelleme: 25 Ekim 2026. Yalnız ücretsiz/hesapsız kapsam geçerli; burhanb3/sa'ya yazmayın.

1. **Tamamlandı:** 1.4.0 köprü canlı kayıt → HEAD 200 → GET Range 206, tekrar üç kayıt, gerçek 1920×800 / 2.830.708.974 byte MKV. Source discovery bilgisayarda, köprü public üretimde; fiziksel telefon testi değil.
2. **Yayın tamamlandı:** GitHub Pages 1.4.0, Windows/Linux Actions başarılı ve manifest/provider/sayfa SHA eşit. Şimdi iPhone'da eski kopyayı kapatıp Tümü/20/HLS/MKV köprüsü açık ve Türkçe tercihli deneyin. Kurulum adresi değişmez.
3. Aynı küçük dosyada tam indirme + altyazı indirme tamamlandıktan sonra uçak modunda oynatma. 1920×800 dosyanın AV1/H.265 ses/video codec desteği fiziksel cihazda doğrulanmadı.
4. **Öncelik kaynak kapsamı:** Dune (2021) için hâlâ indirilebilir dosya yok. Yeni ücretsiz sağlayıcıyı yalnız gerçek erişilebilir dosya+ölçülen boyut/piksel+kimlik kanıtıyla ekleyin. Aynı CDN aynasını bağımsız sağlayıcı diye saymayın.
5. **Türkçe bulunurluğu:** Spider-Man 1.4.0 son tam sorguda 10 sonuç ve 2,64 GiB MKV dahil Türkçe VTT verdi; önceki denemelerde servis boş/zaman aşımı verdi. Başarılı Türkçe çiftlerin kısa süreli güvenilir saklanması ve bağımsız ücretsiz altyazı yedeği araştırılmalı; kullanıcı anahtarı veya üçüncü kişinin gizli anahtarı kopyalanmamalı.
6. **iPhone senkron servisi:** önce gerçekten ölçülen sabit kayma, sonra fps kayması. Güvenilir gömülü/referans altyazı veya audio/VAD gerekir. GitHub Pages hesaplama yapamaz; Worker tam ffmpeg/ffsubsync motoru değildir. Düzeltme dosyası URL'si online/offline aynı olmalı. Henüz uygulanmadı.
7. Kaynak kodu/QuickJS sonuçlarıyla fiziksel cihaz başarısı iddia etmeyin. Uzun native fetch ve IP/bölge farkları kalan dış sınırlar.

Bu notlar otomasyon veya başka göreve mesaj yetkisi değildir.

**1.4.0 son canlı kanıt:** public köprü kayıt → HEAD 200 / 2.830.708.974 byte → GET Range 206 / gerçek 1920×800 MKV; tekrar üç kayıt başarılı. Source discovery bilgisayardan, köprü üretimden sınandı. Tam Spider-Man sağlayıcı akışı yaklaşık 13,25 saniyede 10 alternatif ve Türkçe VTT verdi. Raporlar compatibility/download-bridge-live-140.json ve pipeline-spider-man-140.json. Bunlar iPhone/tam film indirme testi değildir.

## The 100 telefonda boş (25 Kasım, kök neden adayı)

Kullanıcı 1.9.5'te The 100 S5E5 ve bir ilk sezon bölümünde ana eklentiden hiç satır görmedi; Fury (film) çalıştı. Telefonda doğrulanmadı; aşağıdakiler kaynak kodu ve bu bilgisayar ölçümüdür.

1. Mekanizma (upstream kaynak, kilitli commit): Nuvio `PLUGIN_TIMEOUT_MS = 60_000` ile tüm eklentiyi sarar; iOS Ktor istemcisi 60 sn request/connect/socket timeout kullanır; quickjs-kt 1.0.15 kök `evaluate` etkin async iş kalmayana kadar döner. Sonuç 24 sn'de yakalansa bile, yanıt vermeyen (SYN düşen) tek bir native istek dönüşü 60 sn'nin ötesine iter ve `runCatching` ile eklentinin **tüm satırları** düşer. JS AbortSignal native isteği iptal etmez; yakalanmamış reddetme yolu da istisna fırlatır (çözüm değil). Eklentiye kalıcı depolama host fonksiyonu yok (aramalar arası "ölü host" hafızası kurulamaz).
2. Bu ağda iki tehlike:
   - DiziYou alan adı İSS engel sunucusuna çözülüyor; bağlantı bazen hemen kesiliyor, bazen hiç kurulmuyor (Windows 21 sn sınırı). Yalnız dizilerde çalışır; bütün benzetimlerde 0 aday; 20 Kasım LTE ekranlarında da DiziYou satırı yoktu.
   - Goojara wootly yönlendirmesi bir CDN düğümüne (düğüm A) gidiyor; düğüm A bu ağdan hiç yanıt vermiyor. The 100 S5E5 dosyası için 16 yönlendirmenin 11'i düğüm A, 3'ü B, 2'si C (B ve C açık).
3. Benzetim (`IOS=1`: abort yok sayılır, connect timeout 60 sn'ye uzatılır, LAT=600 CAP=6): The 100 S5E5, S1E3, S2E4 üçü de ~72 sn'de bitiyor → Nuvio tüm satırları düşürür. Fury, Matrix, Inception 20–30 sn içinde. Gecikmesiz PC benzetiminde The 100'de FzTvSeries 360p (+ bazen 4KHDHub 1080p / Goojara 480p) çıkıyor.
4. Yapılacak (1.9.6 adayı): DiziYou varsayılan kapalı veya ana/online yoldan çıkarılmalı (kayıtlı `diziyouEnabled: true` değeri eski varsayılanı korur mu, Nuvio ayar kaydı incelenmeli; gerekirse yeni anahtar). Goojara için: düğüm sağlığı bilinmeden ilk bağlantı engellenemez; seçenekler ölçülmeli (yönlendirmeyi birkaç kez isteyip aynı aramada çoğunluk düğümünü atlamak bir çözüm değildir; aday olarak sunmak yerine kapatmak/ayarla sınırlamak, ya da yalnız Range yanıtı hızla gelen düğümü kabul etmek native askıyı önlemez). Önce telefonda DiziYou ve Goojara kapalıyken The 100'ün döndüğü doğrulanmalı.
5. DiziBal dublaj kayması: The 100 bölümlerinde tek muxlu HLS (ayrı ses listesi yok), toplam süre DiziBak ile aynı (S5E5 2494 sn). Kayma yayıncının dosyasında; liste düzeyinde ölçülemez, eklenti düzeltemez.

