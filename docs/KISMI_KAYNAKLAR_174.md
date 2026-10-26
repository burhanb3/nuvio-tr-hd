# 1.7.4 — çalışan kısmi kaynakları koruma

Kullanıcının yeni ölçütü: **bir sağlayıcı birkaç seri/bölümde sağlam dosya veriyorsa da kullanılabilir**. Kapsamı küçük diye tamamını kapatmak yerine her istek ayrı doğrulanır. Yanlış yapım/bölüm, bozuk bağlantı ve HLS’yi dosya saymama kuralları korunur. Yeni hesap, PC/sunucu veya film/bölüm pini yoktur.

## Kurulum ve üç tarama

Aynı manifest adresini Nuvio Pluginler ekranında yenileyip **1.7.4** sürümünü kontrol edin. Eski iki kimlik ve ayar korunur. Üçüncü sağlayıcı **Nuvio TR HD · Ek Anime** varsayılan açık gelir.

| Tarama | Görev |
| --- | --- |
| Nuvio TR HD | Mevcut film/dizi online HLS ve gerçek MP4/MKV kaynakları |
| Nuvio TR HD · Anime | Mevcut Animecix ve SonAnime |
| Nuvio TR HD · Ek Anime | AniMOM/YourUpload ve yeni SeiCode/MP4Upload kısmi dosyaları |

Ek Anime ayrı getStreams çağrısıdır. Resmî Nuvio0.6.4-beta StreamsRepository kaynağında her scraper ayrı başlatılır; tamamlanan sonuç mevcut gruba eklenir, boş sonuç eskisini silmez. Bu, pluginin tek tek satır yayınlama callback’i değildir. Gerçek telefonda ilk görünme süresi sınanmadı. AniMOM eski Anime ayarından yeni taramaya taşındığı için iki kez taranmaz.

Ek tarama içinde aynı anda yalnız **bir dosya** probu vardır. Ana taramalar kendi mevcut kotasıyla çalışır. Bunlar uygulama genelinde tek bir toplam kota değildir. Ek taramanın mantıksal bütçesi24s; native iOS iptal/iş tüketme sınırları nedeniyle fiziksel süre garantisi verilmez.

## Gerçek yeni dosyalar

Sabit kanonik TMDB referansı ve canlı kaynak/Range/altyazı HTTP kontrolü:

| Örnek | Ek dosya | Altyazı sonucu |
| --- | --- | --- |
| Death Note S01E01 | AniMOM356.493.310byte / 0,36GB MP4 | Bir paralel turdaTR+EN; bu turda piksel okunamadı. Önceki720p ölçümü otomatik taşınmadı. |
| Death Note S01E02 | AniMOM dosya düğümü yanıt vermedi | Ek sonuç0; mevcut Animecix/SonAnime seçenekleri korundu. |
| SHIBOYUGI S01E03 | SeiCode293.996.724byte / 0,29GB / gerçek1920×1080 /1456,914s MP4 | EN dış altyazı bulundu; TR bulunmadı. |
| SHIBOYUGI S01E11 | SeiCode291.531.575byte / 0,29GB / gerçek1920×1080 /1465,959s MP4 | EN dış altyazı bulundu; TR bulunmadı. |

SeiCode ek taraması bu iki denemede5351ms ve4657ms’de tamamlandı; olağan anime taramaları ayrıca20013ms ve15371ms sürdü. Bu Node ölçümüdür, iPhone hız garantisi değildir. İki dosyanın hash’i/boyutu mevcut kaynaklardan farklıdır; aynı aynayı yeni dosya diye saymıyoruz.

AniMOM tekrarında ilk bölüm de boş dönebildi. MP4Upload’da ikinci bölümün a3 düğümü başarısızken üçüncü ve on birinci bölümün a4 düğümü çalıştı. **Tüm sezon çalışıyor denmez.** Her aramada gerçek URL yeniden bulunur ve doğrulanır. Webflix’in daha önce çalışan tek anime API yolu da artık451 döndü; eklenmedi.

## SeiCode eşleştirmesi

Arama sonucu tek başına yeterli değildir. Ayrı detay kaydında tam TMDB ID, TMDB’den gelen kanonik isimlerden biri, yıl ve ilk yayın tarihi denetlenir. Yalnız istenen sezonun istenen bölümü seçilir. Olmayan bölüm yerine ilk bölüm veya başka sezon alınmaz. Bu kontrolden sonra verilen MP4Upload kimliğiyle normal public embed sayfası okunur; sadece gerçek Video.js player.src bloğundaki HTTPS MP4 alınır. Reklam scriptleri çalıştırılmaz, HLS veya HTML dosya sayılmaz. Başlıktaki1080p iddiası kalite kanıtı değildir; piksel dosyanın içinden okunur.

## Sağlam dosya, yavaş ek bilgi

Önce gerçek Range yanıtı, konteyner ve toplam byte boyutu gerekir. Ek kaynağın isteğe bağlı metadata okuması takılırsa bu geçerli dosya kaybolmaz. Bu kaynaklarda ek piksel/süre/hash isteği kısa tutulur; metadata ağ hatasından sonra gereksiz ek istekler bırakılır. Okunmayan değer **bilinmiyor** kalır; önceki başka aramadan veya dosya adından doğrulanmış kalite üretilmez.

Mevcut Archive kimlik pinleri ve gerçekten süre gerektiren adaylarda zorunlu süre/hash kuralları sürer. Ek taramada tamamen başarısız dosya için altyazı API’lerine boşuna istek açılmaz. 401/403/429 yeniden zorlanmaz.

TR/EN sistemi aynı: her dilde en fazla4 alternatif, TR önce. Türkçe zorunlu seçilirse yalnız EN olan video gizlenir. Varsayılan tercih modunda EN olan dosya korunur ve **EN altyazı · TR altyazı yok** yazılır. Hiç bulunmayan altyazı uydurulmaz; mevcut altyazı için tam sahne senkronu iddia edilmez.

## Film/dizi tarafı ve sınırlar

DiziYou ve FilmModu içindeki gerçek MP4 seçeneklerinin HLS kapalı ayarı yüzünden daha taramadan elenmesi düzeltildi. HLS yine gösterilmez/indirilebilir sayılmaz. Bu fixture ile sınanan bir hatadır; bu turda yeni canlı film/dizi dosya sağlayıcısı doğrulandı anlamına gelmez. Film/dizi indirme açığı hâlâ araştırma önceliğidir; aynı kısmi kapsama yaklaşımı orada da uygulanacak.

189 test/gerçek QuickJS: ayrı tarama izolasyonu, tek dosya probu, boş kaynakta gereksiz altyazı isteği açmama, bozuk aynada geçerli dosyayı koruma, tam kimlik/yıl/sezon/bölüm, eksik bölümde doğru boş dönüş, güvenli MP4 player ve native ayarlar/manifest. Üçüncü manifest kaydı mevcut ABI’yi kullanır. Güncel0.6.4-beta ve20kilitli dosyada drift yok; kilit değiştirilmedi.

Kanıt: compatibility/partial-sources-174.json ve upstream-174-check.json. Fiziksel iPhone, tam video oynatma/indirme, çevrimdışı ve altyazı-ses senkronu testi yapılmadı.
