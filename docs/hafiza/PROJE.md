# Proje hafızası

## 1.7.5 — 27 Ekim, film/dizi indirme odağı

Yeni Waploaded genel adaptörü ana sağlayıcıya eklendi; varsayılan açık `waploadedEnabled`. Yeni scraper yok; üç kimlik/ayar korunur. Ücretsiz/hesapsız; yeni PC/backend/film-bölüm pini yok. Kaynağın araması boş döndü; film ve dizi sitemap'leri yalnız son güncellenen 50'şer kayıt içeriyor. Bu **kısmi güncel liste**, tam arşiv veya Dune/Fleabag/Shameless çözümü değildir. Başarılı küçük indeks aynı JS ömründe 5 dakika tutulur, imzalı adres tutulmaz.

Kimlik: tam kanonik ad/yıl, açık IMDb çelişkisini reddetme; TV üst kayıt/sezon/bölüm zinciri. Film alternatif yılı yalnız gerçek TMDB release_dates + aynı açık IMDb. Normal public bilet POST ve yanıtın kendi kodlama anahtarı kullanılır; native atob/C-string NUL kesilmesi QuickJS testinde görüldü, binary çözüm JS içinde kaldı. Yayıncının son dosya adı segmenti .mkv/.mp4 kabul ediyor; bu tam URL gerçek Range/konteyner/byte/piksel/süre/hash ile doğrulanıyor. Kaynak sayacı episode range sanılmıyor; gerçek bölüm aralığı reddediliyor. HLS yine indirilemez.

Southland Tales: 421.697.346 byte, 1024×512, 8.682,751s, hash0a6c46f98bbaf195; dört TR ve bir EN SRT, 35 puan/film düzeyi; senkron belirsiz. Kaynak2006/kanonik2007: canlı test **verilmiş festival tarihi olan sabit metadata** kullanır; güncel TMDB yanıtının 2006'yı içerdiği doğrulanmadı. Telefonda gerçek release_dates olmadan bu yıl aşılmaz. Heartland S20E04:169.427.901 byte,1024×512,2.651,044s,hashd0ea16b14bb14ea3,EN ses/gömülüEN ve hariciEN69;TR yok. S20E01 dosya CDN timeout oldu.

Diğer varsayılan kaynaklar açık ve köprü kapalı birleşik Node testinde Wap dosyaları korundu; 10,1/11,2s, online HLS de var. Eski Archive seçenekleri kaldı. Regresyon Dune2 dosya+TR, Fleabag2 dosya+TR/tek piksel grubu, Shameless0 indirme. Bunları yeni kaynak kapsamı sayma.199test/QuickJS;Nuvio0.6.4-beta/güncel168aeaf3477edd42129f63252a7746d56de81d93,20dosya drift yok. Kanıt download-research-175/coverage-175/upstream-175-check. Fiziksel iPhone/tam indirme/offline/senkron yok. 1.7.5 yayımlandı: kod327a3765269ef2d1b8059bf6d43696bc76470630; Windows/Linux Test40419829204 ve Pages40419829111 başarılı. Altı public varlık HTTP200/yerelSHA eşit; github-publication.json güncel.

## 1.7.4 — 27 Ekim, kısmi kapsama izin

Kullanıcı birkaç seri/bölümde sağlam çalışan sağlayıcıları da kullanmamızı istedi. Bu talimat eski “birden çok bölüm/birleşik kararlılık yoksa varsayılan açma” kapısının önüne geçer; yanlış kimlik/yıl/bölüm veya sahte dosya kabul edilmez. YeniID nuvio-tr-hd-extra-anime, TV, varsayılan açık; ana+animeID/ayarları aynı. AniMOM bu bağımsız taramaya taşındı, eskiAnime’de tekrar çalışmaz. Yeni SeiCode/MP4Upload genel adaptörü: tamtmdbID/ad/yıl/ilkdate ve açıkS/E, yalnız gerçekVideo.jsMP4, fallbackbaşkabölüm yok.

CanlıSeiCodeSHIBOYUGIS1E3:293996724byte/1920×1080/1456,914s/hash8acf34a189bc23f8;E11:291531575byte/1920×1080/1465,959s/hash623b30874f041a0b; ENvar/TRyok. İkisindeek5,351/4,657s, olağananime20,013/15,371s ayrı. E2a3başarısız. DN1birparalelturAniMOM0,36GB+TR/EN, pikselnull; DN2veDN1tekrarındaek0; olağan4seçenekkorundu. Hepsikararlı/tümsezon/TReşleşti deme. Webflixsonpozitifyol451oldu,eklenmedi.

Ekprobe1,diğer3 herinvocationiçin; appgenelitoplamkotası değildir. Ekmetadata3s,baş MP4/Range/size geçerseisteğebağlımetadatabaşarısızlığıdosyayıdüşürmez; kalite/hashuydurulmaz. Zorunlusüre/pineskiadaylardakorunur. BoşekdosyaaltyazıAPIsorgusuaçmaz. DiziYou/FilmModuHLSkapalıgerçekMP4taramasıfixturebugfix; yenicanlıfilm/dizikaynağısayma.189check/QuickJS;20upstreamdriftyok. docs/KISMI_KAYNAKLAR_174.md,partial-sources-174.json. YeniPC/backend/hesap/videoPin0. Fizikselcihaz/tamindirme/offline/senkronyok.

**1.7.4 yayın tamamlandı:** kod c6815144c5586d999f5509d907ef41c9f820d7f3; Windows/Linux Test40414456692 ve Pages40414456949 başarılı.189test/QuickJS; altıpublicvarlık HTTP200/yerelSHAeşit. Aynı manifest/iki eskiID ve üçüncü nuvio-tr-hd-extra-anime açık. compatibility/github-publication.json güncel. Film/dizi dosya açığı sürer; source/QuickJS kanıtı telefon testi değildir.

## 1.7.3 — kaynak araştırması ve gerçek MP4 metadata

Varsayılan yeni kararlı film/dizi dosya sağlayıcısı0. AniMOM/YourUpload genel anime adaptörü tekil DeathNoteS01E01’de356493310byte/1280×720/1390,661s MP4+dörtTR68–69 puan verdi; başka bölüm ve birleşik aramalar kararsız, bu yüzden animomEnabled===true ile deneysel/varsayılan kapalı. Sezon/episode tahmini yok; yeni pin/hesap/backend0. Webflix tek AoT dosyası doğrulansa da film/TV451/5xx; SineWix/Anizium401, Nakios timeout, Movix embed/UqloadHLS+downloadSecurityerror/Dood403, VidZeeHLS, Soaperforsale/HydraBacksoon, Anizm/Sibnet403. Anahtar/imza/koruma aşılmadı.

Gerçek kod: büyük moov için gerçek mdat kutu sınırına en fazla1 ek<=256KiBRange; video handler/tkhd ile piksel. Sonraki Range’ler ilk byte’ın gerçek CDN adresinde kalır; URL/boyut/ETag koruması sürer. Deneysel YourUpload7s mantıksal pay/yalnız ağ hatasında1resmi yenileme; auth/HTML tekrar yok, toplam bütçe/native3/altyazı4/EN1 aynı. 178test/QuickJS;20upstream drift yok. source-pool/fair-scheduling denemesi üretime alınmadı; mevcut FIFO/kotalar aynı.

Canlı Dune1/Fleabag2 dosya ilk; Dune1/Fleabag1 tekrar. Archive ağ arızaları açık. DN ham6 çift/farklı4, mevcut kaynaklar; AniMOM birleşik turda0. Kapsam arttı/kararlı diye sunma. compatibility/download-research-173.json; fiziksel cihaz/tam indirme/offline/senkron yok.

**1.7.3 yayın tamamlandı:** kod a46d6838c257d7a21320e432a0c6be766b24fadd; Windows/Linux Test40391651511 ve Pages40391651671 başarılı.178test/QuickJS; beş public varlık HTTP200/yerelSHA eşit. compatibility/github-publication.json güncel. Aynı manifest/ID’ler, AniMOM varsayılan kapalı; film/dizi kapsamı hedefi açık.

## 1.7.2 — tek kart düzeni ve TR/EN

Kullanıcı her satırın aynı alanları göstermesini, TR yok yerine TR altyazı yok yazılmasını ve İngilizce altyazının aynı kontrollerle eklenmesini istedi. Kalite/GB/ses/altyazı her zaman doludur; bilinmeyen bilgi uydurulmaz. Boyut decimal GB (10^9 byte), iki hane/Türkçe virgül; HLS ~ veya ≤~ ve değişken/bilinmiyor ayrımı sürer. Ses:EN ile TR/EN altyazı ayrıdır; Animecix uzun kredisi kart adından çıkarıldı.

Yeni EN homes servisi ve eşlenmiş DiziYou/Animecix/Archive/dizin/JSON/Stremio EN SRT/VTT. MKV/HLS gömülü diller tespit edildiği ölçüde gösterilir. Aynı scoreSubtitle motoru; kanonik farklı dil adları yalnız kimliği bağlı sorguda; her dil4 seçenek (toplam8), TR önce. TR zorunlu EN-only ile geçmez. Otomatik aday bütçeleri TR12/EN8, hash dil başına3; ortak gövde native4, EN fiziksel ve mantıksal en fazla1. body cache arama içinde paylaşılır, nativeGroup fetch’e gitmez. Aynı URL farklı açık headers ile farklı dil gövdeleri korunabilir; aynı içerik aynası iki dil sayılmaz.

168 test/gerçek QuickJS;20 kilitli upstream dosyada drift yok. Native0.6.4-beta parser dil/string/liste alanları ve kart sırası kontrol edildi. Canlı Dune/Fleabag/DeathNote çift dilli; Dune2/DeathNote2 dosya+TR/EN. Fleabag Archive ilk1/tekrar0 indirme, ağ/Range zaman aşımı; düzelmiş veya korunmuş2 dosya denmez. compatibility/subtitles-and-cards-172.json. Fiziksel iPhone/tam oynatma/iki dil birlikte indirme/offline/sahne senkronu yok. Altyazı cache tam gövde yerine biçim/son cue/içerik parmak izini saklar; aynı gövde farklı kalite için yeniden çözülmez.

**1.7.2 yayın tamamlandı:** kod f6cdc270f3534d528bfd1df53834a8f23902a23b; Windows/Linux Test40383064585 ve Pages40383064008 başarılı. Beş public varlık HTTP200 ve yerel SHA eşit; compatibility/github-publication.json. Aynı manifest adresi/ID’ler; yeni video sağlayıcısı0, fiziksel cihaz testi yok. Kullanıcı için Pluginler ekranında mevcut depoyu yenilemek yeterli.


## 1.7.1 indirme araştırması — 26 Ekim 2026

**1.7.1 yayın tamamlandı:** kod37c70e5817f0c303a6fa278af3b8b58385686c2e; Windows/Linux Test40377335403 ve Pages40377335426 başarılı.156 test/QuickJS; beş public varlık HTTP200+yerel SHA eşit. Aynı kurulum adresi/ID’ler. Yeni çalışan indirme sağlayıcısı0; kapsam/fiziksel test hedefi açık.

Kullanıcı harici ses birleştirmeyi bıraktı; kendi içinde uygun ses olan kaynaklarla devam. Font için uygulama kodunu değiştirmeden mevcut harici VLC yolu0.6.4-beta kaynaklarında doğrulandı; VLC font seçer ve iOS bridge request’teki ilk subtitle URL’sini alabilir. Native hazırlık addon/language/local subtitle yoluna bağlı; bizim pluginin ilk TR’si kesin aktarılır veya offline sorunsuz demeyin. Fiziksel telefon yok. docs/IPHONE_TURKCE_FONT.md. Dahili Nuvio fontu hâlâ pluginle seçilemiyor.

**Bu tur yeni çalışan indirme sağlayıcısı doğrulanmadı.** RedFlix12embed, ShowBox/FebBoxpubliclistsonrasılogin, CinemaCity/Webteizle/HDHub4u-search403, eskiDiziBoxbölümleri404,6Workeruçdosya ağ hatası. MoviesDrive güncelsearch.php çalışıyor ama MatrixkurtarmaHubCloudqueryHarryPotter2009döndürdü; yanlışfilm reddedildi. Hiçbirinden artış diye sonuç eklenmedi. Publicformgeçiciparametreleri/anahtarlar commit edilmedi. Yeni account/helper/pin yok. Aynı başarısız yolu dış durum değişmeden tekrar tekrar denemeyin; dosya GET yolunu önce doğrulayın, sonra genel katalog bağlayın. compatibility/download-research-171.json ve docs/INDIRME_ARASTIRMASI_171.md.

Gerçek kod: ayrıHEAD kalktı, boundedGETboyut/format/piksel/auth koşulları sürer. NativeBitmemişmedia-probe3 lease hamfetch bitene kadar tutulur; subtitle4 ayrı, nativeGroupfetch’e gitmez. Bu fiziksel iPhone süre garantisi değildir. KaynakMP4adlı uzantısız aday doğrudan probe; MKV/HLS/HTML MP4 yapılmaz.156test/QuickJS;20upstream dosya drift yok. Yayın/CI/Pages/public SHA tamamlandı. Canlı Dune2/Fleabag2 dosya+TR korunur; Shameless online+TR/indirme0; AoT9MP4/TR/3piksel. Fiziksel cihaz yok.


## 1.7.0 genel sağlayıcı çalışması — 26 Ekim 2026

**1.7.0 yayın tamamlandı:** kod ab9f1391df6a5a2d4a12838d3ebe417f975ab6f6. Windows/Linux Test ve paket40370600453, Pages40370600251 başarılı;153 yerel test/QuickJS ve beş public varlık HTTP200+yerel SHA eşit. Aynı manifest adresi/kimlikler; compatibility/github-publication.json. Kapsam/fiziksel test hedefi tamamlanmadı.

Kullanıcı artık tek tek film pinleri/görüntü senkron incelemelerini ana yöntem istemiyor. Yeni yardımcı PC/sunucu/backend yok; topluluk depolarından fikir edin, uygulamalarını kopyalama. Bu talimat eski PC remux önerilerinin önüne geçer. Şu an goal aracı null; eski “aktif goal” ifadeleri tarihsel, otomasyon/goal oluşturma yetkisi değildir.

DiziYou, DiziBak, FilmModu, SonAnime genel adaptörleri eklendi; Animecix kanonik çok dilli ad eşleşmesi ve genel Archive TV tam bölüm araması. Yeni video pini yok. SonAnime MP4 gerçek480/720; AoT genel test9 MP4/üç ölçülen piksel/TR. Film/dizi yeni örnekleri HLS’dir, indirilebilir sayılmaz. Eski dosya kotası küçülmez;40 aday/3 probe,4 altyazı temel fetch sınırı sürer. Mevcut pin metadata’sı genel aramayı beklemeden başlar. EN/TR/JA kodları, kaynak iddiası ?, önerilen seste özgün/TR/EN tercihi; boyut/kalite sırası korunur. Aynı hash/boyut/piksel aynaları birleşir; ES sabit altyazı ses diline dönüştürülmez.

Yılsız tam TV release puanı, sentetik adın güçlü kanıt sayılmaması,65–69 süre yakınlık tahmini ve mojibake eleme. Remote altyazı gövdesi onarılmış değildir. iOS eksik glif sorunu plugin ABI’siyle çözülmez; patches/nuvio-ios-subtitle-font.patch0.6.4-beta üzerinde git apply --check geçti, uygulama derlenmedi/kurulmadı. Ayrı sesURL/mux yok.

153 test/QuickJS;20 upstream dosya drift yok, güncelHEAD7de46ead80c28ccd008cfd92bd69947e487992d0; lock değişmedi. Kapsam tam tur12online/10küçük, GOT/Breaking Bad çoklu-hosttimeout; tekrar online+BDdosyaları döndü. Son gözlemler14online/11küçük/10temiz/6kaynakölçütü, tek kesintisiz tur gibi sunma. Matrix/Shameless/GoT indirme eksik. Fiziksel iPhone/tam film/indirme/offline/senkron yok. Yayın/CI/Pages/public SHA tamamlandı.


## 1.6.4 çalışma durumu — 26 Ekim 2026

**Yayın tamamlandı:** kod b673412696a172a5f77967558a8bdaf9aa7ff4fb. Windows/Linux Test ve paket 40335362672 ve Pages 40335362557 başarılı. 140/140 yerel test/QuickJS; beş public varlık HTTP200 + yerel SHA eşit. Aynı manifest adresi ve kimlikler. Kanıt compatibility/github-publication.json. Aktif goal açık; kaynak ve fiziksel test eksikleri sürer.

Önceki goal turu ilerlemeydi: 1.6.3 yayımlandı ve yeni adaylar araştırıldı. Bu turda Breaking Bad S01E01 (329 MiB MP4 / 465 MiB MKV), Inception (830/861 MiB MP4) ve Fleabag S01E01 MP4 türevi (155 MiB) kesin dosya pinleriyle eklendi. Fleabag S02E01 (147/604 MiB) iki kanonik örnekle doğrulandı ama görüntüye işlenmiş İspanyolca altyazı var; ES görüntüde etiketi, önerilende temiz online önceliği ve temiz kapsam hedefine saymama uygulanır. Diğer sezon/bölümlere onay taşınmaz.

Canlı 14 vakada online+TR14, küçük dosya+TR11, bilinen yabancı sabit altyazısız küçük dosya+TR10, bütün kaynak ölçütleri6. Matrix, Shameless ABD S01E01 ve GoT S01E01 indirme hâlâ sıfır; Spider-Man ek kaliteleri ve Inception/Fleabag S01E01 ikinci çözünürlük eksik. compatibility/coverage-164.json / content-164.json ve docs/ALTYAZI_VE_DIZI_164.md. İlk tam tur Dune’da yavaş altyazı yüzünden dosyalar TR’siz kaldı; bu saklanmadı, altyazı bekleme hatası düzeltildi ve yeni tam tur ölçüldü. Node sabit TMDB referansı, fiziksel telefon değildir.

Altyazı API grupları ve tekil geçerli gövdeler onBatch/onTrack ile sağlayıcı içinde hemen korunur; daha güçlü sonuçlar sonra birleşir, aynı gövde tekilleşir. Native ABI’ye canlı liste alanı eklenmedi. Toplam12 URL, hash varsa başlangıçta8 genel+4 güçlü; dört dosya bulunmamışsa kalan kapasite açılır. http.subtitlePool mantıksal iş, http.fetchNetwork subtitle-body kotası alttaki native fetch bitene kadar tutulur (4); nativeGroup fetch seçeneklerine aktarılmaz. Abort yok sayılan simülasyon kotayı geçmez; iOS fiziksel60s/job-drain riski sürer.

Görüntü geliştirme aracı scripts/verify-archive-content.mjs ve content-fingerprint.mjs: UUID çalışma klasörü, sabit/karanlık örnek reddi, sıralı iki hareketli sahne, hassas25fps referans, display-width/16:9 crop ile letterbox farkı giderilir. Önceki araştırmada geçici dosya adı çakışması fark edildi; o yeni aday raporları kullanılmadan ayrı çalışmalarda yeniden üretildi. 1.6.3 bu adayları içermiyordu. Görüntü eşleşmesi altyazı offset’i veya kurgu/ses/senkron kanıtı değildir. Çekilen kareler commit edilmedi; yalnız sayısal özet/hash var.

1.6.4 kod/manifest/build hazır; son check140/140 + QuickJS. Güncel0.6.4-beta ve20 kilitli dosya drift yok; upstream-164-check.json. 1.6.4 CI/Pages/publicSHA tamamlandı; yayın kanıtı güncellendi. Aynı kurulum adresi/ID’ler. Mevcut Sites köprüsü1.4 değişmedi; PC hazırlama servisi veya tünel kurulmadı. Fiziksel cihaz/tam film/indirme/uçak modu/senkron yok. Kullanıcının telefon ve ses tercihi sorularına yanıt henüz gelmedi; tekrarlama.

Archive ZIP araştırması: Matrix1080p ve GOTSeason1 dosyaları ZIP içinde; resmi üye linkleri mevcut. GOT üye GET200 gerçekMKV prefix döndü ama Range/Content-Length yok; native fetch tam dosyayı doğrulama sırasında tüketebilir. ZIP parent Range d1/d2 timeout, Matrix üye HEAD timeout. Üretime eklenmedi; Range200 koruması gevşetilmedi. Gelecekte doğrulanmış dosya hazırlama/backend olmadan bunları hazır kaynak sayma.

## 1.6.3 kapsam çalışması — 26 Ekim 2026

**Yayın tamamlandı:** kod edc8a0527477b8208c8a4274691d44cb4f89e8c4. Windows/Linux Test ve paket 40326657313 ve Pages 40326657180 başarılı. 128/128 yerel test ve gerçek QuickJS; beş public varlık oturumsuz HTTP 200 + yerel SHA eşit. Aynı manifest adresi ve scraper kimlikleri; kanıt compatibility/github-publication.json. Bu sürüm ilk kazanımdır, aktif kapsam hedefi tamamlanmadı.

**Hedef aktif; tamamlanmadı.** Kullanıcı kendi seçtiğimiz farklı film/dizi listesinde makul boyutlu ve farklı gerçek çözünürlükte online/indirilebilir + TR kaynaklar olana kadar çalışmamızı istedi. validation/titles.json ve npm run test:coverage ile 14 vaka ölçülüyor. Başlangıçta küçük dosya+TR 3/14, bütün kaynak ölçütleri 2/14 idi. Yeni turda 8/14 küçük dosya+TR ve 5/14 kaynak ölçütü; 14/14 online+TR. Bu ölçütler ses tercihini, fiziksel oynatımı ve senkronu kanıtlamaz. docs/KAPSAM_MATRISI.md gerçek eksikleri listeler. Son tur compatibility/coverage-163.json; başlangıç coverage-baseline-163.json.

Gerçek küçük Dune ilk kez bulundu: Archive’da 792.903.325 byte 1280×536 MKV, 949.160.267 byte 1146×480 MP4; süre yaklaşık9326,7s. MKV audio track Hintçe. No Way Home 881.009.469 byte 720×304 MP4, Fransızca dosya adı ipucu; Spider-Verse 2.016.133.619 byte 1920×800 MP4. TR dosyaları bulundu, ancak süre/sürüm uyumu sahne senkronu değildir. No Way Home önceki turlarda yönlendirme/timeout nedeniyle bazen kayboldu; Archive’ın d1/d2/workable_servers ve dir alanlarından aynı dosyanın resmi doğrudan sunucusu seçiliyor, varsa ikinci resmi kopya yalnız ağ hatasında. 401/403/429 zorlanmaz.

Archive artık yıl alanı boşsa tam başlık+yıl + tam dosya adı+yıl + gerçek süre ister; açık yıl/IMDb/TMDB çelişkisi reddedilir. Bu yolda süre toleransı ±%10; asıl yıldan önceki date değeri reddedilir. İki arama, önceliklendirilmiş en çok12 metadata/ikili çözümleme, erken onCandidates ve mevcut aday kotası kullanılır. HEAD yerine küçük GET Range dosya kontrolü; 200 büyük gövde/yanlış format reddi sürer. HDHub uzantısız gösterim adını atlamaz; host uzantısı sadece isim ipucu, gerçek probe şarttır. No Way Home Marvel Phase4 koleksiyon etiketi ve doğrulanmış Obsession gösterim yılları doğru ID ile desteklenir.

Ses track dilleri MP4 mdhd / MKV TrackType2’den okunur. Kaynak dosya adı dil iddiası tahmini yazılır; başlığın French gibi sözcükleri çıkarılır. Mevcut boyut/kalite sırası korunur, özgün ses filtresi henüz yok. Kullanıcıya ses tercihi için isteğe bağlı soru gönderildi; yanıt gelmedi. Soruya yanıt gelmeden yalnız özgün sese filtreleme uygulanmadı.

Üretime eklenmeyen araştırmalar: MoviesDrive/Pixel 566.912.339 byte gerçek Dune MKV, fakat uzantısız ve Nuvio MP4 adı riski; doğru adlı endpoint denemeleri404. FilmModu.one HLS+TR gerçek ama MP4 değil. StreamFlix metadata kanonik; dosya hostları ENOTFOUND/404, Firebase REST401. HDRezka Anubis kontrolü istiyor, çözülmedi. Archive TV dosyalarında genel yıl/kimlik eksiği sürer. Fleabag S01E01 daha sonra kanonik bölüm HLS’siyle iki 20 saniyelik sıralı görüntü karşılaştırmasında 40/40 ve 40/40 kareyle eşleşti; yaklaşık 99 MiB MKV yalnız kesin dosya hash/piksel/süre/metadata pinleriyle eklendi. Diğer bölüm/sezonlara onay taşınmaz. OpenSubtitles XML-RPC anonim oturum normal API ile200; Fleabag hash cb34679d109bcf50 bulunmadı; filename sorgusunun doğru diziyi bulması dosya kimlik kanıtı değildir. Tokenlar yalnız bellek/ignored araştırmada, commit yok.

1.6.3 yayımlandı: 128 yerel test/QuickJS, Windows/Linux ve Pages başarılı; public SHA eşitliği tamamlandı. Kod/manifest sürümü1.6.3, aynı scraper ID’leri. Mevcut Sites köprüsü1.4 değişmedi. Bir sonraki uygulanabilir yol, PC’de HLS’yi gerçek MP4’e hazırlayan ayrı bir servis prototipidir; henüz servis veya internet erişimi yok. Medya incelemesi için portable FFmpeg, resmi Windows build sağlayıcısının SHA-256 değeriyle kullanıcı LocalAppData dizinine SHA-256 doğrulamasıyla indirildi; ffmpeg/ffprobe yalnız kendi LocalAppData klasörüne çıkarıldı, sistem kurulumu yok. HLS hazır olmadan indirilebilir etiketlenmeyecek. Fiziksel iPhone/tam indirme/çevrimdışı/senkron hâlâ yapılmadı.


Dune kaydında date:2004 çelişkisi son kontrolde yakalandı. Genel eski-date reddi korunur. İki ayrı 20 saniyelik sıralı görüntü örneği kanonik TMDB/IMDb’ye bağlı HLS ile örtüştü; örnekler yaklaşık 0,959 referans hız oranı verdi. Bu kimlik kanıtıdır, tam film hızı veya altyazı senkronu değildir; otomatik offset/rate uygulanmaz. Dune MKV ve ona metadata’da bağlı MP4 türevi ile Fleabag S01E01 için dar src/providers/archive-verified.cjs pinleri kullanılır. Her kullanımda metadata sha1/size ve gerçek Range OpenSubtitles hash/piksel/süre gerekir; altyazı araması kapalı olsa da hash zorunlu. Metadata SHA-1 yerelde tam dosya indirilerek hesaplanmadı. Kanıt compatibility/content-163.json. Son kapsam compatibility/coverage-163.json: 8/14 küçük dosya+TR, 5/14 kaynak ölçütü; 14/14 online+TR.


## 1.6.2 güncel durum — 26 Ekim 2026

**Yayın tamamlandı:** kod commit’i 5b298cdeda6dfbcc10b55b053fdbe25022dce446. Windows/Linux Test ve paket 40309193725 ve Pages 40309193727 başarılı. Yerel 114/114; oturumsuz manifest, iki sürümlü sağlayıcı, eski online JS yolu ve sayfa HTTP 200 + yerel SHA eşit. Kanıt compatibility/github-publication.json. İlk Linux denemesi süre sonu rapor yarışını yakaladı; 5b298cd düzeltmesi tamamlanan videoyu koruyup doğru deadline nedeni verir. Fiziksel telefon boş sonuç nedeni hâlâ doğrulanmadı.

Kullanıcı iPhone’da 1.6.1 gördüğünü doğruladı; eski sürüm varsayımı geçersiz. Fleabag ilk bölüm S01E01 olarak alındı; Obsession son Curry Barker filmi, 1339713/tt37287335. Telefonda ortak boş sonuç kök nedeni henüz bilinmiyor. Canlı pipeline TMDB metadata’sını sabit verir; Nuvio’nun enjekte ettiği anahtarla gerçek TMDB API adımını sınamaz.

Somut Obsession hatası: TMDB public başlığı 2026, PlayIMDb aynı IMDb ile dosya yılı 2025; TMDB gösterim sayfasında 2025 prömiyerleri var. Metadata’ya external_ids,release_dates aynı istekte eklenir; yalnız aynı TMDB’nin type 1–4 ve asıl yıla en çok bir yıl uzak gerçek gösterim yılları alınır. PlayIMDb alternatif yıl kabulünde aynı IMDb ve kesin dosya başlığı şart; genel yıl toleransı yok. Altyazıda alternatif yıl doğru kimlik sorgusuna veya IMDb bağı olan eşlenmiş kaynağa bağlıdır; çelişen kimlikler reddedilir.

Yerleşik PlayIMDb/VixSrc HLS varsayılanı hafif metadata: gerçek master doğrulanır, ek child/segment HEAD başlatılmaz; Vix master tekrar istenmez. Ayrı sesli master korunur. İsteğe bağlı detailedHlsMetadata açılabilir. Kişisel JSON/Stremio eski ayrıntılı yolda kalır; MP4/MKV gerçek probe şart. TMDB süresi yalnız boyut tahmini; altyazı süre uyumu sayılmaz. HDHub erken ayna sayacı kaldırıldı, en çok 12 release/ikili çözümleme; büyük dosya tavanı yok.

Tanı info alanı ağsız sürüm/ayar/anahtar varlığı gösterir; anahtarın geçerlilik testi değildir. Boş sonuç günlüğünde kimlik nedeni, sayaçlar ve HTTP host/durum bulunur; anahtar/tam URL/metin yok. Zorunlu kimlik sorgusuna 10 saniye JS süresi ayrılır; toplam bütçe geçerlidir. iOS native 60 saniye, iptal eksikliği ve bekleyen işlerin tüketilmesi riski sürer; telefonda düzeldi iddiası yok.

Canlı referans: Obsession 10 online/TR 2,9 saniye, Fleabag 10 online/TR 3,8 saniye, Dune 10 online/TR 4,3 saniye. Dune’da 5 dosya adayı Workers TLS/ağ hatası verdi; gerçek indirme sıfır, küçük Dune çözülmedi. Bu raporlar sabit metadata ve canlı kaynaktır, telefon testi değildir. Yerel check 114/114; yayın ve SHA kanıtı tamamlandı. Köprü 1.4 değişmedi/Sites erişimi açılmadı. Rehber docs/IPHONE_BOS_SONUC_162.md; upstream 20 dosyada drift yok; lock değişmedi.


## 1.6.1 güncel durum — 26 Ekim 2026

**Yayın tamamlandı:** kod commit’i e5824c9005805b366c52770f086c967c85ecdee8. Test ve paket 40303952952 (Windows/Linux) ve Pages 40303952928 başarılı. Yerel 107/107; oturumsuz manifest, sürümlü iki sağlayıcı URL’si, eski online JS yolu ve sayfa HTTP 200 + yerel SHA eşit. Kanıt compatibility/github-publication.json. Scraper kimliği değişmeden kod URL’sine ?v=1.6.1 eklendi. Yeni küçük Dune indirmesi hâlâ doğrulanmadı; büyük dosya desteği korunur.

Kullanıcı Dune18–71GB büyük dosyaların kalmasını, küçük indirmeler eklenmesini istedi; online sonuçların gittiğini ve Shameless/Fleabag boşluğunu bildirdi.1.6.0’da eski nuvio-tr-hd ID’sini files-only yapmak geçiş/filtre gerilemesiydi. **Eski ana ID bir daha yalnız dosya arar hale getirilmemeli.**1.6.1 createEntry(main) files+online birlikte,24 saniye mantıksal bütçe; Anime ayrı20 saniye. Manifestte ana+anime2kayıt, online kaldırıldı; eski providers/nuvio-tr-hd-online.js uyumluluk/tanı için üretilir. src/entry-files.cjs adı tarihseldir, artık main çağırır. Ayarlar eski ID’de korunur; tek ana liste per-stream streaming değildir.

Shameless ABD34307/tt1586680 API filename Shameless.US.S01.../untouchables-shameless.us.s01e01... idi. Klasörü atmadan canonical folder + exact title leaf + exactS/E + IMDb kontrolü eklendi; diğer başlık/bölüm/sample reddedilir. Fleabag için canlı online vardı; files-only eski ID bunu gizleyebiliyordu, kullanıcı cihazı/etkin scraper durumu kesinleşmedi.

Archive rows12/popularity/bariz fragman önfiltre; en küçük3+HD3; eksik metadata süresi varsa candidate.requireDuration ile gerçek konteyner süresi şart. MP4 tail moov boyut+duration, audio-only tail reddi; IMDb tam token, prefix değil. Büyük HDHub dosyalarına boyut tavanı yok. Yeni küçük Dune dosyası **henüz doğrulanmadı**.

MoviesDrive title araması Dune2021 kaydını bulur (IMDb alanı boş);550MB/900MB/1,3GB/1,9GB/3,8GB sayfaları ve HubCloud pointer’ları incelendi. İlk iki10Gbps zinciri rohitkiskk.workers.dev uçlarında ERR_SSL_PACKET_LENGTH_TOO_LONG; diğerleri aynı terminal aileleri, gerçek dosya probe yok. Sayfa iddiaları verified byte/piksel değildir. Archive Dune yanlış2004yılı ve fragman kayıtları reddedildi. MovieBox v1 boş, v2 invalid token; eklenmedi. Sites get_site yineNOT_FOUND, yeniden create/checkout düzenleme/hesap değiştirme sorusu yok.

Canlı ana arama: Dune: 10 online/TR ~6s, Fleabag S01E01: 10 online/TR ~4s, Shameless (ABD) S01E01: 7 online/TR ~5s. Metadata sabit kanonik referans; gerçek kaynak/altyazı sorguları; fiziksel cihaz değil. Night of Living Dead 318/388 MiB gerçek MP4+TR verdi; bu Dune küçük dosyası bulundu diye sunulamaz. Yerel 107 test/QuickJS ve Windows/Linux CI başarılı; authenticated upstream tekrar 20 dosyada drift bulmadı (ilk oturumsuz 403 rate-limit raporu değil, başarılı yeni rapor saklandı). GitHub yayını/HTTP/SHA kontrolü tamamlandı. Son ek Fleabag kontrolünde gerçek HLS playlist süresi PlayIMDb 1566s, VixSrc 1612s ile 26 dakikalık referansa yakındı; bu tam oynatma/sahne senkronu testi değildir.

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
