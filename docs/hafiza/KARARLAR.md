# Tasarım kararları

## 1.7.1 ek kararlar

- Harici ses dosyası birleştirme yolu kullanıcı tarafından bırakıldı; kaynak içi özgün/TR/EN ses aranır.
- Nuvio kodunu değiştirmeden VLC harici oynatıcı font alternatifi var; mevcut0.6.4-beta yolu. İlk subtitle gönderilebilir; otomatik bizim TR seçimi/cihaz/offline aktarım kanıtı değildir.
- Yeni sağlayıcı için önce hesapsız gerçek RangeGETdosyası, sonra katalog entegrasyonu. Login,challenge veya imza sabiti ile boşluğu doldurma. Kurtarma araması yanlış film döndürebilir; release kimliğini tekrar kontrol et.
- AyrıHEAD zorunlu değil: gerçekRangeGET zaten izin/format/bytekanıtı taşır. Native fiziksel dosyafetch3 lease mantıksaltimeout’tan sonra bırakılmaz.
- MP4adlı uzantısız kaynağı MKVköprüsüne bağımlı yapma; gerçekkonteynerprobe belirler. Uzantısız gerçekMKV hâlâ uygunad gerektirir.


## 26 Ekim 2026 — 1.7.0 kullanıcı yönlendirmesi

- Genel sağlayıcı yöntemleri öncelikli; yeni manuel film/bölüm pini veya her yapımda sahne/senkron analizi ana yol değil.
- Yeni yardımcı bilgisayar/sunucu/backend bağımlılığı yok. Eski PC hazırlama prototipi önerisi artık geçerli değil. Mevcut isteğe bağlı1.4köprü değişmez; yeni sağlayıcılar onsuz çalışır.
- Kodları EN/TR/JA şeklinde göster; iddia ?; sabit altyazı uyarısı ses dili değildir. Harici dublajı varmış gibi üretme.
- Kaynak kalite iddiasını ölçülmüş gösterme: aynı HLS URL farklıkalite tekAuto, embed.mp4HTML video sayılmaz, reklamvideo seçilmez.
- Aynı aramada kesin izin/kayıp hatası tekrar zorlanmaz; yeni arama yeniden dener. Cache arama içidir; Nuvio VM ömrü kanıtlanmadan kalıcı cache iddiası yok.
- Altyazı süre yakınlığı tahmindir; otomatikoffset yok. Mojibake remote dosyası değiştirilmez; temiz alternatif seçilir. Font appyaması uygulanabilirlik kontrolüdür, telefon düzeltmesi değil.


## 1.6.4 ek kararlar

- Yabancı sabit altyazı kaynak sayısı için gizlenmez; görüntüye işlenmiş olduğu açık etiketlenir. Temiz TR hedefi başarısı sayılmaz; önerilende temiz online önce, kullanıcının boyut/kalite sırası korunur.
- Hızlı geçerli altyazı, diğer API veya aynı gruptaki takılan gövde bitmeden korunur. Daha güçlü hash/sürüm sonucu sonradan iyileştirebilir; veri tekilleşir. Zorunlu TR modunda süre sonu geçerli çifti silmez.
- Alttaki native fetch bitmeden kotayı bırakma. Sadece Promise.race mantıksal zaman aşımı olduğu için yeni fiziksel istek başlatıp sınırı aşma. Bu kota fiziksel iPhone dönüş garantisi değildir.
- Görüntü kimliğinde eşiği düşürmek yerine kare piksel/letterbox geometri ve zaman örneklemesi düzeltilir. Tek kare, karanlık veya sabit logo yeterli değildir. Geliştirme aracının geçici dosyaları çalışmaya göre izole edilir.
- ZIP üyesinin gerçekMKV olması tek başına bounded native probe demek değildir; Range200/uzun gövde korumasını kaldırarak kaynak çoğaltma. Kaynak/kanıt/cihaz kapsamları ayrı kalır.

## 1.6.3 kapsam ve kanıt kararları

- Kullanıcı hedefi 14 vakalık deneme listesinden daha geniştir; bu liste regresyon ve kapsam ölçümüdür. 8 küçük dosya veya128 geçen test tüm hedef tamamlandı demek değildir. Aktif goal bu yüzden açık kalır.
- Archive eksik yıl alanı, kesin başlık/yıl + dosya adı/yıl ve gerçek süreyle tamamlanır; açık çelişki aşılmaz. Tam uzunluk belirgin eksikse kaynak çoğaltmak için kabul edilmez.
- Resmi metadata’nın verdiği dosya kopyaları aynı path/isimle kullanılabilir. Keyfi host, kişisel auth/cookie aktarımı veya 401/403/429 sonrası başka kopyayla zorlama yoktur. Aynalar ayrı dosya başarısı sayılmaz.
- Yeni TV kaynağı kanonik kimlik/yıl/S-E kanıtı olmadan yalnız bir isim aramasından kabul edilmez. Eksik metadata için dar istisna ancak bağımsız kanonik içerik örnekleriyle doğrulanmış tam dosya pinidir; hash/boyut/piksel/süre ve metadata değişirse reddedilir. Anonim OpenSubtitles oturumu hesap değildir; token gizli kalır ve hash bulunmadıysa dosyayı doğrulanmış saymayız.
- Ses dili konteynerden okunmuş değer ile dosya adı tahmini ayrılır. Özgün ses veya senkron bilinmiyorsa varmış gibi sunulmaz. HLS yine doğrudan indirilemez.
- HLS’den gerçek MP4 hazırlama ayrı servis gerektirir; GitHub Pages bunu çalıştıramaz. Yerel prototipin kaynak/alan kullanımı ölçülmeden ve tamamlanan dosya doğrulanmadan canlı özellik denmez. Önceki Sites kimliği yeniden oluşturulmaz.


## 1.6.2 düzeltme kararları

- Kullanıcıdaki 1.6.1 bilgisi korunur; boşluğu yalnız cache/eski sürüm varsayımıyla açıklama. Sabit metadata kullanan bilgisayar testini iPhone/TMDB API testi diye sunma.
- Filmde festival/genel gösterim yılı farkı yalnız aynı TMDB release_dates kanıtı + kesin IMDb/başlık ile aşılır. Kişisel katalogların kanonik yıl/kimlik eşleşmesi gevşetilmez. Altyazı alternatif yılı kimliğe bağlı olmalı; TMDB süresi senkron kanıtı değildir.
- HLS isteğe bağlı ağ işleri başlatılmayarak azaltılır; Promise.race/Abort tek başına native iOS iptali sayılmaz. Hafif yol yerleşik Play/Vix içindir; kişisel HLS ayrıntılı kalır. MP4/MKV doğrulaması ve HLS indirilemez kuralı korunur.
- Ayarlardaki Tanı ağsızdır; gizli anahtar/adres yoktur. Boş sonuç günlüğü kaynak/kimlik nedenlerini ayırır; sahte oynatılabilir hata kartı yoktur. Eski ayarlar izinsiz sıfırlanmaz.
- HDHub erken ayna sayacı release kapsamını daraltmaz. Aynı CDN aynası bağımsız sağlayıcı sayılmaz. Büyük boyut tavanı yok, küçük Dune hâlâ eksik.


## 1.6.1 gerileme kararı

- Eski ana scraper ID her zaman online+dosya aramasını kapsar. Yeni scraper kurulmasını zorunlu kılan geçiş kullanılmaz. Anime bağımsız; eski online script yolu yayımlanır ama manifestte kurulmaz.
- Shameless gibi grup öneki yalnız canonicalfolder+exactleaf/S/E+IMDb bağı varsa kabul edilir; fuzzy başlık yok.
- Küçük dosya sayfası doğrulanmış medya değildir; TLS/kimlik/Range engelleri kaldırılarak başarı uydurulmaz. Büyük dosya tavanı konmaz. Archive’da eksik metadata süresi gerçek video süresiyle tamamlanır; kısa/audio-only elenir.

## 1.6.0 ek kararları

- Native destekli bağımsız scraper tamamlaması kullanılır; tek getStreams içinde progressive callback uydurulmaz. Ayarlar/sonuç sınırları ayrıdır, geçiş rehberde açık yazılır.
- Anime eşleştirmesinde sayısal TMDB+özgün ad+yıl ve tam sezon/bölüm şart; çelişkili IMDb reddedilir. API kalite/byte iddiası gerçek probe’un yerini almaz. Türkçe kaynak hard-sub kanıtı sayılmaz.
- MKV içi TR dil+codec konteynerden okunur; tam oynatma/senkron doğrulaması sayılmaz.
- Font fallback plugin tarafından düzeltildi diye sunulmaz. Altyazı tanısı yalnız sayaç ve özgün URL korunur. Özel/başka repo anahtarı kullanılmaz. Range 200 büyük video iOS tampon riski nedeniyle geçmez.

## 1.5.0 ek kararları

- TV'de yıl içermeyen release adı yalnız doğru IMDb sorgu bağı + tam özgün başlık + kesin S/E ile kabul edilir. Filmde yıl zorunluluğu aynı kalır. Sezon paketi tek bölüm diye sunulmaz. Poster bağı, HDHub'ın numeric TMDB ID göstermeyen dizi sayfasını kanonik metadata'ya bağlayan ek kanıttır.
- Kaynak çeşitliliği gerçek dosya/altyazı erişimiyle sayılır; 221 manifest tanımı veya üç kalite profili bağımsız çalışan sağlayıcı değildir. Üçüncü taraf anahtarları kopyalanmaz.
- Varsayılan boyut küçükten büyüğe. Bilinmeyen boyut sona gelir; kalite, önerilen ve gruplu sıra ayarlanabilir. Kısa başlık/metaveri native parser'ın desteklediği alanlara dağıtılır. Özel accordion/header alanı uydurulmaz.
- HLS ayrı kalite satırı ses/altyazı grubunu korumalıdır. Muxed child URL doğrudan kullanılabilir. Ayrı sesli master yalnız yayımlanmış yetenek onayı varsa seçili master servisine gider. Hesap engelinde mevcut master korunur; 404 veren yeni yol yayımlanmış gibi kullanılamaz.
- HLS boyutunda ortalama bitrate/parça örneği tercih edilir; yalnız peak varsa üst tahmin açık yazılır. Otomatik çoklu kaliteye dar tek sayı uydurulmaz; değişken denir. HTML başlığı ölçüm değildir.
- Geçersiz ilk altyazı diğer adayları engellemez; en çok 12 aday/dört farklı geçerli dosya. Hash/sürüm/gerçek senkron ayrımı sürer.

1. Güncel KMP scrapers manifesti, CommonJS getStreams(tmdbId, mediaType, season, episode), onSettings formu kullanılır. Üretilmiş providers/nuvio-tr-hd.js doğrudan düzenlenmez.
2. Film kimliği TMDB ID + normalize özgün başlık + yıl. Dizilerde sezon/bölüm de kesin olmalı. Kaynak isimleri ve uzantı tek başına film kanıtı değildir.
3. MP4/MKV gerçek konteyner, video boyutu, byte toplamı ve mümkünse süreyle doğrulanır. Dosya adındaki çözünürlük yalnız tahmin etiketi taşır. HLS profili ve bitrate×süre aktarım tahmini gerçek dosya ölçümü değildir.
4. HLS yalnız online. Native indirme filtresine uygun .m3u8 URL sağlanır; uzantısız HLS hiçbir zaman dosya diye sunulmaz.
5. Public R2 presigned GET üzerinde HEAD imzayı bozabilir; sınırlı GET Range kullanılır. Özel/engelli diğer kaynaklarda HEAD 403 zorlanmaz. İmzalı URL veya erişim başlığı commit edilmez.
6. Yeni dosya köprüsü doğrulanan R2 nesnesine SHA-256 kimlikli .mkv/.mp4 yolu verir. GET 307, HEAD bilinen metadata; keyfi URL proxy'si değildir. En çok 6 saat/imza ömrü, silinirse 410. Video byte'ları kaynakta kalır; yalnız küçük doğrulama örnekleri okunur.
7. Bulut IP'sine kaynak sayfaları 403 verdiğinden varsayılan arama telefonda. Tam ortak tarama yalnız deneysel/internal yoldur ve varsayılan kapalıdır. Köprüye yalnız public dosya URL'si+kanonik metadata gönderilir; kişisel katalog/anahtar gönderilmez.
8. Altyazı önceliği hash/tam sürüm/kaynak/sürüm benzerliği/süre/aynı film belirsiz alternatifi. Son üçü gerçek senkron kanıtı değildir. Dengeli mod varsayılan; yanlış film/yıl/bölüm/dil ve açık farklı kurgu reddedilir. Dil kodu tr, UTF-8 SRT/VTT gövdesi şart. Altyazı hatası çalışan videoyu silmez.
9. Kayma ölçülmeden otomatik zaman düzeltmesi yok. Nuvio ABI'si offset taşımıyor; iOS AutoSync desteklenmiyor. Gelecekte ayrı ölçüm+altyazı dönüştürme aşaması gerekir.
10. Varsayılan Tümü/20/HLS açık/TR tercih et. 20 üst sınır, kaynak sayısı garantisi değil. Kaynak kotaları ve üç eşzamanlı video doğrulaması korunur. Güçlü Türkçe eşleşme, gerçek indirme ve makul boyut sıralamayı etkiler.
11. Nuvio clearTimeout native sleep'i iptal etmez. Ortak scheduler 100 ms tik kullanır; 24 s mantıksal bütçe fiziksel iPhone dönüş garantisi değildir. Native ağ/gövde iptali uygulama sınırıdır.
12. Fixture/QuickJS ve canlı sınırlı aralık testleri; fiziksel telefon/tam oynatma/indirme testinden ayrı raporlanır. npm run check son kontroldür. Upstream driftte kilit körlemesine yenilenmez.

Geçici kayıt kaybolduğunda bağlantıdaki public imzalı kaynak parametresi kullanılır: SHA-256 yoluyla eşleşmeli, izinli R2/signature biçimi ve gerçek konteyner yeniden doğrulanmalıdır. Böylece cache silinmesi tek başına linki bozmaz; imzanın sona ermesi hâlâ yeniden arama gerektirir. Ephemeral URL içeren tam linkler rapora/commit’e konmaz.
