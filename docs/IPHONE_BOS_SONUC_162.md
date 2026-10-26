# 1.6.2: boş sonuçları düzeltme ve ayırt etme

Kullanıcı iPhone’da **1.6.1** gördüğünü, Fleabag’in ilk bölümünün ve son çıkan Obsession filminin boş döndüğünü, Dune seçeneklerinin azaldığını bildirdi. Bu nedenle sorun yalnız eski sürüme bağlanamaz. Fleabag için S01E01 esas alındı. Telefonda boş sonucun ortak kök nedeni henüz kesinleşmedi.

## Düzeltilen noktalar

- **Obsession yıl farkı:** TMDB 1339713 filmi 2026 olarak gösteriyor; PlayIMDb aynı IMDb `tt37287335` için `Obsession.2025...mp4` dosya adı döndürüyor. TMDB’nin gösterim sayfasında 2025 festival prömiyerleri var. Önceki kod bu doğru kimlikli kaynağı eliyordu. Film metadata isteğine `release_dates` eklenir; yalnız bu TMDB kaydında gerçekten bulunan, asıl yıla en fazla bir yıl uzak prömiyer/sinema/dijital yılları tutulur. PlayIMDb’de alternatif yıl ancak **aynı IMDb + kesin başlık** ile kabul edilir. Genel ±1 yıl toleransı yoktur. Dizi bölüm kontrolü değişmedi. Türkçe altyazıda alternatif yıl ayrıca doğru kimliğe bağlı sorgu veya doğrulanmış eşlenmiş kaynak gerektirir; açıkça çelişen IMDb/TMDB reddedilir.
- **HLS ek ölçümleri:** PlayIMDb/VixSrc için gerçek ana oynatma listesi alınır ve yapısı doğrulanır. Varsayılan arama artık her kalite için çocuk liste ve parça HEAD sorgusu başlatmaz. Böylece bu isteğe bağlı işler geçerli ana listenin tamamlanmasını engellemez. VixSrc’nin zaten okunan master’ı yeniden istenmez. Ayrı ses/altyazı grupları korunur. HLS yine yalnız online’dır; boyut varsa bitrate × TMDB süresinden **tahmin** diye sunulur. Bu süre altyazı senkronu veya gerçek video süresi kanıtı sayılmaz. İstenirse **HLS için ek süre ve boyut ölçümleri** açılabilir. Kişisel JSON/Stremio HLS incelemesi mevcut ayrıntılı yolunu korur; MP4/MKV gerçek dosya doğrulaması gevşetilmedi.
- **Sonraki dosya sürümleri:** HDHub’da birkaç erken ayna tamamlandığında sonraki sürümleri atlayan durdurma kaldırıldı. Ana arama bütçesi içinde en çok 12 release, aynı anda iki çözümleme ile denenir. Büyük dosyalar için boyut tavanı yoktur. Bu, ölü bir CDN bağlantısını çalışır hale getirmez ve 12 sonucun bulunacağı anlamına gelmez.
- **Temel TMDB sorgusu:** Genel kaynak timeout’u yerine bu zorunlu kimlik adımına en çok 10 saniye mantıksal süre ayrılır; toplam bütçe yine geçerlidir. Boş manuel anahtar yerine Nuvio anahtarı kullanılır. Geçerli olmayan kimlikte başlık tahminiyle devam edilmez.

Obsession birincil referansları: [TMDB film sayfası](https://www.themoviedb.org/movie/1339713-obsession?language=en-US), [TMDB gösterim tarihleri](https://www.themoviedb.org/movie/1339713-obsession/releases?language=en-US), [IFCO’nun IMDb bağlantılı sınıflandırma kaydı](https://www.ifco.ie/en/ifco/pages/F4F81130005EB8DB), [TMDB release type tanımları](https://developer.themoviedb.org/reference/movie-release-dates). Public TMDB HTML sayfaları okundu; canlı API anahtarı kullanılmadı.

## Telefonda tanı

Mevcut GitHub deposunu **Nuvio → Pluginler** ekranından yenileyin; sağlayıcı sürümü **1.6.2** olmalı. Depoyu silmek gerekmez; eski ana scraper kimliği ve ayarlar korunur. Kurulum adresi:

```text
https://burhanb3.github.io/nuvio-tr-hd/manifest.json
```

Sağlayıcı ayarlarının üstünde **Tanı · 1.6.2 · TMDB anahtarı: var ...** satırı bulunur. Bu satır ağa çıkmadan geçerli kayıtlı ayarların özetini gösterir. Anahtarı, kişisel URL’leri veya erişim başlıklarını göstermez. **TMDB anahtarı var**, anahtarın doğruluğu/erişimi test edildi demek değildir.

Boş sonuç sürerse bu tanı satırını ve film/bölümü paylaşın. Önce otomatik tarama, HLS, Play ve Vix açık mı, TR zorunlu mu görülebilir; ayarlar izinsiz sıfırlanmaz. Bir sonraki izolasyon kontrolünde geçici olarak HDHub/Archive kapatılarak yalnız online kaynaklarla denenebilir; bu bir çözüm veya varsayılan değişikliği değildir.

Boş aramalar uygulama günlüğüne `[Nuvio TR HD]` özetini yazar. Kimlik adımı `missing_tmdb_key`, `missing_episode`, `tmdb_request_failed`, `tmdb_id_mismatch`, `tmdb_metadata_incomplete` gibi nedenleri ayırır. Kaynak başına aday sayısı, reddetme sayacı ve yalnız HTTP host/durum bilgisi bulunur. Tam URL, anahtar, altyazı metni ve başlık değerleri yazılmaz. Hata ayıklama açıkken başarılı aramalar da özetlenir. Uygulamanın kendi günlükleri farklı veri içerebilir; bu eklenti özeti dışında tam günlük paylaşılması istenmez.

İlk Linux CI çalışması, HTTP timeout’u ile toplam arama zamanlayıcısının aynı anda dolduğu bir raporlama yarışını yakaladı. Tamamlanan video korunur; artık son HTTP isteği önce çözülse bile gerçek son tarih geçildiyse neden `deadline` olur. Yalnız tanıyı doğru yapar; native ağı iptal etmez.

## Testlerin sınırı

Regresyon testleri Obsession’ın doğrulanmış alternatif yılı/yanlış IMDb reddi, farklı kimlikli altyazı, durmayan isteğe bağlı HLS sorgusunun hiç başlatılmaması, sonraki büyük release’in korunması, TMDB/ayar tanısı ve gerçek QuickJS ayar formunu kapsar. Kaynak/altyazı canlı testleri **sabit TMDB referansıyla** çalışır; Nuvio’nun telefonda enjekte ettiği anahtarla gerçek TMDB API sorgusunu sınamaz.

Nuvio iOS `httpRequestRaw` istekleri 60 saniyeye kadar sürebilir; JS `AbortSignal` native iptale taşınmaz. quickjs-kt aktif native işleri tüketebilir. Bu yüzden gereksiz sorguları başlatmamak yararlıdır, ama 24 saniyelik JS bütçesi fiziksel iPhone dönüş garantisi değildir. Başka bir kaynakta takılan native ağ işinin tamamlanan sonucu geciktirmesi uygulama tarafında çözülmesi gereken kalan risktir.

**Küçük indirilebilir Dune dosyası doğrulanmadı. Fiziksel iPhone, tam film oynatma/indirme, çevrimdışı altyazı ve sahne senkronu testi yapılmadı.** Mevcut Sites dosya köprüsü 1.4.0 olarak korunur; yeni servis yayımlanmadı. Yayın kanıtı [github-publication.json](../compatibility/github-publication.json), canlı raporların sürüm/tarihi kendi dosyalarındadır.
