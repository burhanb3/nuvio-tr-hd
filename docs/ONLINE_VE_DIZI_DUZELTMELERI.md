# 1.6.1: online kaynaklar ve boş dizi sonuçları

## Ne düzeldi?

1.6.0’da eski `nuvio-tr-hd` kimliği yalnız dosya arar hale getirildi; online arama yeni bir scraper’a taşındı. Yeni scraper yüklenmez/etkinleşmezse veya eski filtre seçili kalırsa yalnız büyük dosyalar görünür, Fleabag gibi dosya bulunmayan diziler boş kalır. Bu bir geçiş tasarımı sorunuydu.

**1.6.1’de eski ana sağlayıcı tekrar hem online HLS hem indirilebilir MP4/MKV arar.** Aynı listede, aynı ayarlarda sunar. Yeni bir online scraper kurulmasına ihtiyaç yoktur. Ayrı Hızlı kaynaklar kaydı manifestten çıkarıldı; eski kod dosyası yolu uyumluluk için tutulur. Anime bağımsız kalır. Kaynaklar arka planda paralel sorgulanır; ana `getStreams` tek dizi döndürdüğünden ana listenin her satırının anlık eklenmesi sunulmaz. Mantıksal ana bütçe24 saniye, anime20 saniye; native iPhone ağ işlerinin bitişi ayrıca zaman alabilir.

Shameless (ABD) S01E01’de başka bir gerçek hata vardı: API `Shameless.US.S01.../untouchables-shameless.us.s01e01.1080p.mkv` döndürüyordu. Kod klasör bağını attığı için dosyanın grup önekini yanlış dizi sayıyordu. Şimdi **doğru IMDb + kanonik dizi klasörü + dosyada tam başlık + kesin sezon/bölüm** birlikte denetlenir. Yanlış başlık/bölüm veya örnek/fragman dosyası kabul edilmez.

## Küçük dosya araması

Archive aramasında daha fazla sonuç incelenir; bariz fragman/inceleme sonuçları metadata sorgusu öncesinde elenir. Bir öğenin yalnız büyük HD kopyaları yerine küçük türevleri ve HD asılları birlikte seçilir. Dosya boyutu/pikseli yine gerçek içerikten doğrulanır; metadata sayısı ölçüm yerine geçmez. Süre metadatası eksik dosya otomatik atılmaz; gerçek video süresi okunarak tam filme yakın olması şarttır. MP4 sonundaki `moov` bölümünden süre de okunur; kısa veya yalnız ses içeren dosya elenir.

**Büyük HDHub dosyalarına boyut tavanı eklenmedi.** Kullanıcının iPhone’unda Dune için18–71GB dosyalar geldiği bildirildi; bu destek korunur. Bu değişiklik küçük bir Dune dosyası bulunduğu anlamına gelmez.

MoviesDrive üzerinde Dune550MB/900MB/1,3GB/1,9GB/3,8GB sayfaları bulundu; bunlar sayfanın iddiasıdır. İncelenen HubCloud terminalleri Pixel/10Gbps bağlantıları verdi. İki10Gbps zincirinin sonraki Worker bağlantısında TLS hatası oluştu; gerçek dosya kontrolü yapılamadı. MoviesMod/Google uzantısız+Range200 sorunu ve mevcut Sites köprüsünün NOT_FOUND erişim sorunu sürüyor. Özel anahtar/hesap eklenmedi, engelli kaynak çalışan diye sayılmadı.

## Güncelleme

Nuvio Pluginler’de aynı depoyu yenileyin: https://burhanb3.github.io/nuvio-tr-hd/manifest.json . Ana sağlayıcı **Nuvio TR HD**, sürüm **1.6.1** olmalı; Anime ayrı görünür. HLS gösterme seçeneği açık olduğunda online sonuçlar ana sağlayıcıda gelir. Kullanıcının bilerek kaydettiği kapalı kaynak/kalite/altyazı tercihleri zorla değiştirilmez. Depoyu kaldırmak gerekmez; kaldırıp ekleme kişisel ayarları sıfırlayabilir.

Manifestte sağlayıcı kodu URL’sine `?v=1.6.1` eklenir. Yeni manifest alındığında eski JS yanıtının önbellekten gelmesi azaltılır; scraper kimliği ve ayarlar değişmez. Nuvio’nun PluginRepository kodu bu dosya adresini olduğu gibi depo köküne ekler. Güncel manifestin telefon tarafından yenilenmesi yine gerekir.

## Gerçek kontrol ve sınırlar

26 Ekim bilgisayar kontrolünde sabit kanonik TMDB referansı ve canlı kaynak/altyazı sorgularıyla Dune: 10 online/TR, Fleabag S01E01 10 online/TR, Shameless (ABD) S01E01 7 online/TR geldi. Yaklaşık6/4/5s sürdü; sonuç sayıları kalite/ayna satırlarıdır, bağımsız sağlayıcı sayısı değildir. Sonraki arama ve fiziksel iPhone süresi garanti değildir. Üçünde bu bilgisayarda yeni küçük indirilebilir dosya doğrulanmadı. Kullanıcının test ettiği sezon/bölüm henüz belirtilmedi; S01E01 referans alındı.

Yeni ana paket gerçek QuickJS’te tek başına online+dosya birlikte ve grup önekli Shameless örneğiyle sınanır. Süresiz metadata, kısa video, yanlış IMDb ve yalnız ses MP4 negatif testleri vardır. Fiziksel iPhone, tam oynatma, tam indirme, çevrimdışı ve sahne senkronu testleri yapılmadı. Kanıtlar `compatibility/pipeline-*-161.json` ve `compatibility/small-download-research-161.json` içindedir.
