# Proje hafızası

## 1.6.1 güncel durum — 26Ekim 2026

Kullanıcı Dune18–71GB büyük dosyaların kalmasını, küçük indirmeler eklenmesini istedi; online sonuçların gittiğini ve Shameless/Fleabag boşluğunu bildirdi.1.6.0’da eski nuvio-tr-hd ID’sini files-only yapmak geçiş/filtre gerilemesiydi. **Eski ana ID bir daha yalnız dosya arar hale getirilmemeli.**1.6.1 createEntry(main) files+online birlikte,24 saniye mantıksal bütçe; Anime ayrı20 saniye. Manifestte ana+anime2kayıt, online kaldırıldı; eski providers/nuvio-tr-hd-online.js uyumluluk/tanı için üretilir. src/entry-files.cjs adı tarihseldir, artık main çağırır. Ayarlar eski ID’de korunur; tek ana liste per-stream streaming değildir.

Shameless ABD34307/tt1586680 API filename Shameless.US.S01.../untouchables-shameless.us.s01e01... idi. Klasörü atmadan canonical folder + exact title leaf + exactS/E + IMDb kontrolü eklendi; diğer başlık/bölüm/sample reddedilir. Fleabag için canlı online vardı; files-only eski ID bunu gizleyebiliyordu, kullanıcı cihazı/etkin scraper durumu kesinleşmedi.

Archive rows12/popularity/bariz fragman önfiltre; en küçük3+HD3; eksik metadata süresi varsa candidate.requireDuration ile gerçek konteyner süresi şart. MP4 tail moov boyut+duration, audio-only tail reddi; IMDb tam token, prefix değil. Büyük HDHub dosyalarına boyut tavanı yok. Yeni küçük Dune dosyası **henüz doğrulanmadı**.

MoviesDrive title araması Dune2021 kaydını bulur (IMDb alanı boş);550MB/900MB/1,3GB/1,9GB/3,8GB sayfaları ve HubCloud pointer’ları incelendi. İlk iki10Gbps zinciri rohitkiskk.workers.dev uçlarında ERR_SSL_PACKET_LENGTH_TOO_LONG; diğerleri aynı terminal aileleri, gerçek dosya probe yok. Sayfa iddiaları verified byte/piksel değildir. Archive Dune yanlış2004yılı ve fragman kayıtları reddedildi. MovieBox v1 boş, v2 invalid token; eklenmedi. Sites get_site yineNOT_FOUND, yeniden create/checkout düzenleme/hesap değiştirme sorusu yok.

Canlı ana arama: Dune: 10 online/TR~6s, Fleabag S01E01: 10 online/TR~4s, Shameless (ABD) S01E01: 7 online/TR~5s. Metadata sabit kanonik referans; gerçek kaynak/subtitle sorguları; cihaz değil. Night of Living Dead küçük318/388MiB gerçekMP4+TR verdi; bu Dune küçük dosyası bulundu diye sunulamaz. Yerel107 test/QuickJS başarılı; authenticated upstream tekrar20dosya drift yok (ilk oturumsuz403rate-limit raporu değil başarılı yeni rapor saklandı). GitHub yayını henüz tamamlanmadı; sonuç sonradan güncellenecek.

## 1.6.0 çalışma durumu — 26 Ekim 2026

**GitHub yayını tamamlandı:** af89edae8999303b56e3191411fa6ead0e340d3c kod commit'i. Windows/Linux Test ve paket 40298554965 ve Pages40298554973 başarılı. Yerel100/100; oturumsuz manifest, üç sağlayıcı ve sayfa HTTP200 ve yerel SHA eşitliği compatibility/github-publication.json ile doğrulandı. Kurulum adresi aynı. Köprü1.4 ve fiziksel cihaz/tam oynatma/indirme/senkron sınırları değişmedi.

Üç bağımsız scraper hazır: eski nuvio-tr-hd kimliği Dosyalar, yeni nuvio-tr-hd-online Hızlı kaynaklar ve nuvio-tr-hd-anime Anime. Native StreamsRepository her scraper tamamlandığında ekler (release/current SHA aynı); bir çağrıda per-stream callback yok. Mantıksal bütçeler 28/16/20 sn; native iPhone drain garantisi yok. Ayarlar/20 sonuç sınırı scraper başına; eski kişisel JSON/Stremio ayarları Dosyalar’da korunur. Global sıralama native gruplara bağlıdır.

Animecix/Tau doğru TMDB ID+özgün ad+yıl ve exact title/season/episode ile çalışır; ilk sonuç/fuzzy/mutlak bölüm fallback yok. TMDB görünen başlığı arama yardımıdır. API boyut/kalitesi kanıt sayılmaz. Canlı Death Note 4 MP4 (90–229 MiB; 480/720) +4 TR; AoT 9 MP4 (165–569 MiB; 480/720/1080)+3 TR. Süre benzerliği gerçek senkron değildir; TR kaynak hard-sub kanıtı değildir.

HDHub erken çözümleme→probe kuyruğu, max12 release, poster/kimlik kuralları korunur. MKV’de gerçek TR subtitle track (type17, tur/tr/IETF, desteklenen codec) algılanır; sıkı TR’de kalır. Altyazı gövdesi bir kez decode edilir, hash sorguları ilk3 farklı istekle sınırlıdır. Karakter tanısı yalnız sayaç; URL/metin loglanmaz.

iOS 0.6.4-beta ve güncel MPVPlayerBridge varsayılan sub-font Noto Sans CJK SC. Gerçek bundled OTF cmap tablosu 240.929 byte range ile okundu: ş/Ş/ğ/Ğ/ı/İ glifleri0 (eksik), ç/ö/ü ve büyükleri mevcut. compatibility/ios-font-160.json kanıtı; npm run verify:ios-font yeniden inceler. Bu somut uygulama/font bulgusudur; kullanıcı cihazının kurulu sürümü/görseli doğrulanmadı. Plugin ABI font ailesi/inline body vermez. Bu sürüm font sorunu düzeldi diye sunulamaz. Kodlama/inline-font/combining sayaçları ayırt etmeye yardım eder.

26 Ekim canlı: Spider-Man ilk online4,2s, dosyalar14,1s; 665,6/835,3 MiB MP4 ve2,64GiB MKV+TR. Dune online4,6s/TR, GOT online3,5s/TR; ikisinde bu kontrolde dosya aynaları ağ hatası. Önceki1.5 büyük dosya başarısı bugünün erişim garantisi değildir. MoviesMod sayfasında1,3GB listelenen Dune public zinciri Google MKV’ye ulaştı; URL uzantısız+Range200, üretime alınmadı. MoviesDrive IMDb benzer ama yanlış kimlikler verdi, eklenmedi.

Ücretsiz/hesapsız, sa deposuna yazmama, Sites eski kimliğini yeniden oluşturmama sınırları sürer. Mevcut köprü1.4 değişmedi; yeni HLS profile servisi yayımlanmadı. Yeni docs/ANIME_HIZ_VE_ALTYAZI.md. Yerel npm run check 100/100; gerçek QuickJS’te üç paket ve upstream20 dosya geçti. GitHub yayını ve SHA doğrulaması tamamlandı. Fiziksel iPhone/tam oynatma/indirme/senkron yok.

## Güncel yönlendirme — 1.5.0, 25 Ekim 2026

**1.5.0 GitHub yayını tamamlandı:** 62bf0b31ae1a767cd63b442c3bbde113a4601dfb kod commit'i. Test ve paket 40229105237 (Windows/Linux) ve Pages 40229105202 başarılı; yerel check 92/92, güncel upstream drift yok. Manifest/provider/sayfa HTTP 200 ve yerel SHA eşitliği compatibility/github-publication.json ile doğrulanır. Ayrı Sites servisinin yeni kodu yayımlanmadı; mevcut köprü 1.4.0, aşağıdaki capability gate sınırı geçerli.

Kullanıcı Game of Thrones ve Fleabag dizilerinde boş sonuç/eklenti görünmüyor dedi; ayrıca daha çok indirilebilir+TR seçenek, dar HLS boyut tahmini, ayrı kalite satırları, boyut/kalite sırası, gruplama ve kısa başlık istedi. İki dizinin S01E01 bölümleri referans alındı; kullanıcı sezon/bölüm belirtmedi.

- PlayIMDb doğru IMDb+başlık+S/E dosya adı döndürmesine rağmen yıl yok diye eleniyordu; düzeltildi. VixSrc yalnız movie API'sini kullanıyordu; /api/tv/id/season/episode eklendi. Native normalizePluginType diğer/series/show türlerini TV sayar; yerel kimlik aynı normalizasyonu izler. Manifest movie/tv zaten doğruydu. ProviderFilterRow boş ve yüklenmeyen grupları gizler; bu nedenle boş tarama sağlayıcı görünmüyor gibi olur.
- HDHub TVSeries JSON-LD adı/yılı ve TMDB'den gelen poster yolu ile bağlanır. Tek bölüm MKV seçilir; sezon ZIP/RAR asla video sayılmaz. 902 KB Game of Thrones sayfası için kontrollü 1.000.000 karakter text sınırı eklendi; native 1 MiB sınırı büyütülmedi.
- Public Worker dosya terminalleri eklendi; URL'deki literal boşluklar tek kez %20 yapılır. HEAD 403 ama GET 206 olan bu terminallerde getOnly flag'iyle yalnız sınırlı GET kullanılır; genel erişim reddi kuralı korunur. İlk küçük aynalar ölüyse en çok altı release incelenir.
- AltyazıDB hesapsız Türkçe SRT yedeği eklendi. Kimliğe bağlı sürüm notu tam sürüm/hash kanıtına çevrilmez. Dizi sezon/bölüm adları doğrulanır; yılın ilk yayın yılından sonraki episode release yılı olması doğru IMDb sorgusuna bağlıysa kabul edilebilir. En çok 12 adaydan dört farklı geçerli altyazıda durulur; bozuk ilk URL sonraki alternatifi engellemez.
- Kısa kartlar native name + quality/size/language alanlarına ayrıldı. Varsayılan sortOrder=size_asc; quality_asc/desc, size_desc, recommended seçilebilir. groupResults=none/type/source/quality satırları bitişik sıralar; gerçek accordion oluşturmaz. hlsView=separate/auto/both vardır.
- HLS renditions her profile kendi boyut tahmini verir. Average bandwidth varsa o, yoksa üç uygun HEAD parça örneği; HEAD HTML/eksikse tepe bitrate üst tahmini. Hatalı örnek kökenine aynı aramada tekrar yüklenilmez. Çoklu otomatik kalitede geniş aralık yerine değişken bilgi yazılır. Ayrı ses grubunu video child URL'siyle koparmayın.
- **Sites erişimi tekrar kayboldu:** mevcut dosya köprüsü appgprj_6ade5021d6b88191818ece53a5d5f1e0 için get_site ve credential NOT_FOUND. Kullanıcı hesap/çalışma alanını değiştirdiğini ve şu an kamilbsr03'e dönemediğini doğruladı. Yeniden Site oluşturulmadı, download-bridge checkout'una kaynak kopyalanmadı. Mevcut public köprü 1.4.0 çalışır. hosting/worker.mjs 1.5.0 stateless /hls/profile.m3u8 hazır ama **yayımlanmadı**. Plugin /api/health features.hlsProfiles true görmeden kullanmaz. Ses birlikteyse doğrudan ayrı kalite; ayrı sesli VixSrc otomatik master kalır.
- Kaynak envanteri: dokuz repo denendi, sekizi 221 tanım/134 normalize kimlik verdi. Hepsi çalışan bağımsız sağlayıcı değildir. Araştırma docs/KAYNAK_ARASTIRMASI.md ve compatibility/source-inventory-150.json. MP4Hydra HTML, MovieBox web 404, Wyzie anahtarsız 401, TürkçeAltyazıOrg 502; çalışma iddiasıyla eklenmedi. Ücretsiz+hesapsız kapsam ve sa deposuna yazmama yasağı sürer.
- Son canlı geliştirme kontrolü: GOT S01E01 4,41/5,96/13,63 GiB gerçek 1920×1080 MKV ve TR altyazı; Fleabag S01E01 online/TR var, indirilebilir doğrulanmadı. Dune'da sonraki sürümlerden 18,24 GiB ve üzeri MKV+TR çıktı; telefonda makul boyutlu Dune hâlâ eksik. Spider-Man 730,3 MiB/1280×720 MP4 ve 2,64 GiB MKV dahil TR sonuçları verdi. Raporların kendi sürüm/tarihleri korunur; bazı erken testler 1.4.0 sürüm etiketiyle geliştirme kodudur. Fiziksel iPhone, tam oynatma/indirme, codec ve sahne senkronu yapılmadı.

Aşağıdaki 1.4.0 kayıtları tarihsel bağlamdır; yayın durumu compatibility/github-publication.json'dan doğrulanır.

Son güncelleme: 25 Ekim 2026. Geliştirilen sürüm: **1.4.0**. Kullanıcı **yalnız ücretsiz ve hesapsız** kaynak istedi. Kendi film/bölüm seçimiyle otomatik çoklu kaynak, gerçek MP4/MKV, Türkçe mevcut SRT/VTT, online/çevrimdışı birlikte sunma hedefi sürer. Telefon iPhone; test filmi Dune (2021). JSON/Stremio ek kaynak olarak korunur. Varsayılan Tümü/20/HLS açık, TR tercih et, dengeli altyazı eşleşmesi.

## Yetki ve dağıtım

- Kullanıcı **sa deposuna yükleme, adıyla yeni aç** dedi. Yalnız https://github.com/burhanb3/nuvio-tr-hd kullanılır; burhanb3/sa'ya yazılmadı.
- Yerel/uzak varsayılan dal codex/publish-nuvio-tr-hd. Manifest https://burhanb3.github.io/nuvio-tr-hd/manifest.json . **1.4.0 yayımlandı:** kod commit'i 1d7ca3d630a63bd30879f8872e735616eb05ec2b. Windows/Linux Actions 40225594715 ve Pages 40225594674 başarılı; oturumsuz manifest/provider/sayfa HTTP 200 ve yerel SHA eşitliği compatibility/github-publication.json ile kanıtlı.
- Eski Sites projesi appgprj_6ade23835f7c81919a2a9bb960abd631, plugin-host/, hayatimbitmiss adresi 1.2.0'da kaldı. Hesap değişti, NOT_FOUND; aynı eski Site'ı yeniden oluşturmaya çalışmayın.
- **Ayrı dosya köprüsü**: appgprj_6ade5021d6b88191818ece53a5d5f1e0, download-bridge/.openai/hosting.json; https://nuvio-tr-hd-download-bridge.kamilbsr03.chatgpt.site . Public erişim. Kimliği koruyun, yeniden create_site çağırmayın. Yayın kanıtı compatibility/download-bridge-publication.json içinde tutulmalıdır.
- Credential Manager mevcut burhanb3 oturumuyla Git push/API çalıştı. Token yalnız çocuk süreç belleğinde; komut satırına/dosyaya/günlüğe yazmayın. Sites credential gizli stdin ile verilir.

## 1.4.0 gerçek durum

- HDHub kanonik TMDB + JSON-LD başlık/yıl doğrulaması → public kısa bağlantı → HubCloud → FSL/R2 akışı kendi kodumuzla eklendi. CAPTCHA/DRM/uzak eval yok. Yalnız filmler. İlk üç küçük aday incelenir.
- İmzalı GET URL’sinde HEAD 403 beklenebilir. HEAD atlanır, sınırlı GET Range ve konteyner doğrulanır. Normal engelli HEAD'e tekrar yüklenilmez.
- Bilgisayarda canlı Spider-Man: 2.830.708.974 byte, 1920×800 MKV; ayrıca yaklaşık 8,28 ve 10,40 GB MKV. Dune HDHub zinciri indirilebilir dosya vermedi. Bu gözlem kalıcı erişim garantisi değildir.
- Bulut sunucusundan HDHub/PlayIMDb 403, VixSrc boş dönüyor. **Tam ortak tarama varsayılan kapalı** kalır. Kaynaklar telefondan aranır; köprü yalnız telefonun bulduğu public imzalı R2 dosyasını tekrar doğrulayıp dosya adını koruyan yönlendirme kaydeder. Public dosya URL’si ve kanonik metadata köprüye gider; kişisel kataloglar/anahtarlar gitmez.
- Köprü GET 307 ile kaynağa yönlendirir; tam video saklamaz/proxy’lemez. HEAD doğrulanmış boyut/MIME döner. Geçici kayıt en çok 6 saat/gerçek imza süresi; cache yoksa URL'deki public kaynak parametresiyle yeniden doğrulanır. İmza eskirse 410 ve yeniden arama gerekir. Cache kalıcı veritabanı değildir.
- HLS listesi gerçek çözünürlük profillerini, EXTINF süresini ve bitrate bazlı yaklaşık aktarım boyutunu sunar. Bu gerçek dosya boyutu/piksel doğrulaması değildir. HLS asla indirilebilir olmaz.
- Dengeli altyazı modu aynı film/yıl alternatiflerini belirsiz etiketle sunar; yanlış kimlik/dil/yıl/kurgu hâlâ reddedilir. Geçersiz bir altyazı diğer geçerli altyazıları çökertmez.
- **1 saniye otomatik düzeltme uygulanmadı.** Plugin ABI’sinde offset yok. Nuvio AutoSync yalnız Android dahili ExoPlayer ve kullanılabilir gömülü referans altyazı yolunda; iOS'ta yok. Zaman farkını ölçmeden rastgele kaydırmayın. Gelecek ayrı servis audio/VAD veya güvenilir zamanlı referans ve dönüştürülmüş VTT/SRT gerektirir.

## Uyumluluk ve test sınırları

Nuvio 0.6.4-beta; kilitli 19 dosya güncel cmp-rewrite HEAD 56ae37081afaff820b6073da84e711320238de36 üzerinde aynı bulundu. Kilit yalnız inceleyerek güncellenir. npm run check ve npm run verify:upstream çalıştırılır. Node ve gerçek QuickJS WASM, Kotlin/telefon testi yerine geçmez. Fiziksel iPhone, tam film oynatma/indirme ve çevrimdışı altyazı testi henüz yapılmadı. Kullanıcı önceki küçük Spider-Man MP4 + üç TR altyazının açıldığını/senkron göründüğünü bildirdi; yeni sürüm testi sayılmaz.

Nuvio clearTimeout native sleep'i iptal etmez; src/scheduler.cjs en çok 100 ms uyku bırakır. 24 saniyelik JS bütçesi gerçek iPhone dönüş garantisi değildir. Native fetch bütün gövdeyi tamponlayabilir ve AbortSignal'ı aktarmayabilir.

**1.4.0 son canlı kanıt:** public köprü kayıt → HEAD 200 / 2.830.708.974 byte → GET Range 206 / gerçek 1920×800 MKV; tekrar üç kayıt başarılı. Source discovery bilgisayardan, köprü üretimden sınandı. Tam Spider-Man sağlayıcı akışı yaklaşık 13,25 saniyede 10 alternatif ve Türkçe VTT verdi. Raporlar compatibility/download-bridge-live-140.json ve pipeline-spider-man-140.json. Bunlar iPhone/tam film indirme testi değildir.

Geçici kayıt kaybolduğunda bağlantıdaki public imzalı kaynak parametresi kullanılır: SHA-256 yoluyla eşleşmeli, izinli R2/signature biçimi ve gerçek konteyner yeniden doğrulanmalıdır. Böylece cache silinmesi tek başına linki bozmaz; imzanın sona ermesi hâlâ yeniden arama gerektirir. Ephemeral URL içeren tam linkler rapora/commit’e konmaz.
