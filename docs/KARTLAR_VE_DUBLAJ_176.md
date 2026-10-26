# 1.7.6: sade kartlar, diller ve Türkçe dublaj

## Kullanıcıya görünen değişiklik

Mevcut depoyu Pluginler ekranında yenileyip **1.7.6** sürümünü kontrol edin. Manifest adresi ve üç sağlayıcı kimliği aynı kalır. Ana sağlayıcıdaki **HDFilmDelisi** seçeneği varsayılan açıktır; online kaynakları görmek için HLS açık olmalıdır.

Örnek kart:

**Online · HDFilmDelisi**  
1080p · 1920×804 · 2,11 GB · Ses: TR/EN · TR/EN/ST altyazı

Bu örnekte piksel ve dil izleri gerçek HLS listesinden okunmuştur. GB, online aktarım için hesaplanan tek değerdir; indirilebilir dosyanın ölçülmüş boyutu değildir. ST kodu da yayıncının listesindeki etikettir; altyazı gövdesinin Sesotho dilinde olduğu ayrıca sınanmadı.

- Kartlarda `bilinmiyor`, `?`, `~`, `tahmini` ve geniş boyut aralıkları gösterilmez. Dayanağı olan en olası değer kullanılır. Hiçbir dayanağı olmayan alan boş bırakılır; rastgele kalite, ses veya boyut üretilmez.
- Piksel okunursa p etiketiyle birlikte gösterilir. 1280×720 → 720p; kırpılmış 1920×800 → 1080p; 1080×720 → 720p. Standart genişlikten sapmış 1024×512 gibi kaynaklar 512p kalır. Bu etiket görüntü keskinliği/bitrate garantisi değildir.
- Ses ve altyazı dilleri ayrı sıralanır: TR, EN, FR, ES, DE… HI en son. İlk beş kod gösterilir, kalan sayısı eklenir: `TR/EN/FR/ES/DE +3`. Yalnız EN ve HI varsa `EN/HI`; HI gerçekten tek sesse HI kalır.
- Türkçe altyazı bulunmazsa `TR altyazı yok` yazılır. Harici altyazı keşfi hâlâ TR ve EN içindir; diğer kodlar mevcut gömülü/oynatma listesi izlerinden gelir. Listede bir dilin bulunması tam sahne senkronu kanıtı değildir.

## Değerler nasıl seçiliyor?

Kalitede öncelik gerçek konteyner pikselleri, sonra HLS çözünürlükleri, kaynak/dosya adı ipucu, son olarak bitrate modelidir. İpucu gerçek pikselin üzerine yazılmaz. Doğrulanmış minimum çözünürlük filtresi yalnız ölçülen piksel/listeden hesaplanır; dosya adından doğrulanmış sonuç üretilmez.

Boyutta gerçek Content-Range byte ölçümü varsa aynen kullanılır. HLS'de en yüksek bilinen sürümün ortalama bitrate × süre değeri tercih edilir. Yalnız tepe bitrate varsa %80 kullanım katsayısı uygulanır; kalan aralıkta geometrik orta değer, veri yoksa çözünürlük/süre/codec modeli kullanılır. Bunlar ölçüm değil sunum modelidir; özellikle otomatik HLS'de gerçekleşen aktarım farklı olabilir. Canlı yayında sonlu boyut üretilmez. İndirme boyutunda gerçek byte değeri önceliğini korur.

Ses için konteyner/oynatma listesi önce gelir; sonra kaynağın açık dil bilgisi, dosya adı ve kanonik özgün dil kullanılır. Sonuncusu en zayıf ipucudur; dublajlı sürümde yanılabilir. Ölçülmüş yalnız HI sesine EN eklenmez. Ayrı ses dosyası birleştirme veya font seçimi eklenmedi.

Bu kanıt ayrımı kod ve araştırma raporunda tutulur; kartta kullanıcının istediği sade görünüm sunulur.

## Yeni Türkçe dublaj kaynağı

HDFilmDelisi'nin public araması özgün başlık, yıl ve IMDb kimliğiyle eşleştirilir. Film sayfasının JSON-LD kimliği ve public oynatıcı zinciri ayrıca kontrol edilir. Sayfadaki video olmayan SEO `.mp4` adresi kullanılmaz. Public oynatıcının sayfada taşıdığı kodlanmış veri literal olarak çözülür; script çalıştırılmaz, üçüncü taraf sabit API anahtarı/lisans kopyalanmaz.

Gerçek kaynak HTTP testinde Dune (2021), The Matrix (1999) ve Spider-Man: No Way Home (2021) için HLS listesi, TR/EN ses ve TR altyazı izleri bulundu. Kaynak tek başına yaklaşık 0,5–1 saniyede aday verdi; bu bütün sağlayıcı aramasının veya iPhone'un dönüş süresi değildir. Kimlik referansları sabittir; telefonun TMDB API bağlantısı bu testle sınanmaz.

**Bu yeni kaynak online HLS'dir; yeni MP4/MKV indirme kaynağı sayılmaz.** Tam olarak probu yapılan aynı HLS uç noktası `.m3u8` biçim işaretiyle verilir; mevcut Nuvio indirme filtresi bunu dışlar. Başka sunucuda dönüşüm/remux veya yeni backend gerekmez. Üç film örneği bütün katalog/diziler için başarı garantisi değildir.

## İndirme aramasındaki düzeltme

HDHub sürüm listesindeki MB/MiB/GB/GiB artık doğru birimle okunur. Eski GB odaklı sıralama MB sürümleri sona itebiliyordu. Aynı en fazla 12 sürümlük planda küçük dosyalar, yüksek kalite ipuçları ve büyük sürümler iç içe incelenir; 4K/büyük dosyalar ilk küçük adayların arkasında tamamen dışarıda kalmaz. İpucu yalnız arama sırasıdır; gerçek MP4/MKV/Range kontrolleri değişmez. Büyük kaliteli dosyalara yeni üst boyut sınırı konmadı. Kullanıcının küçükten büyüğe veya kalite sırası tercihi korunur.

Son birleşik Node regresyonu: Dune iki gerçek dosya + TR (1280×536 ve 1146×480), Fleabag S1E1 iki dosya + TR (tek 848×354 piksel grubu), Shameless S1E1 **sıfır indirme**. Yaklaşık 10,5 / 6,2 / 8,6 saniye, tek tur gözlemidir. Yeni genel film/dizi indirme sağlayıcısı bu sürümde doğrulanmadı; bu eski dosyaları yeni kaynak başarısı diye saymıyoruz.

Ek araştırmada HDFilmCehennemi ve FilmMakinesi 403, güncel DiziPal adresi ağ hatası, eski Vidmody ağ hatası verdi; Sinema yönlendirmesi video kanıtı sağlamadı. PuhuTV örneğindeki gömülü sabit anahtar yolu kullanılmadı. Koruma aşılmadı, hesap açılmadı. Aynı bozuk yolu tekrar tekrar sınamak yerine gerçek dosya sunan yeni katalog/host yolları araştırılmalı.

## Kanıt ve kalan işler

210 fixture/gerçek QuickJS testi geçti. Nuvio 0.6.4-beta ve güncel cmp-rewrite dalındaki kilitli 20 dosyada drift yok; upstream kilidi değişmedi. Native parser boş alanları atlıyor; desteklenmeyen yeni sonuç/streaming ABI alanı eklenmedi.

[Kart ve kaynak kanıtı](../compatibility/cards-and-dub-176.json), [birleşik regresyon](../compatibility/coverage-176.json), [upstream kontrolü](../compatibility/upstream-176-check.json).

Fiziksel iPhone/Android, Kotlin derlemesi, tam film oynatımı, tam indirme, offline altyazı ve sahne/ses senkron testi yapılmadı. Shameless/Matrix/GoT indirme boşlukları ve birden fazla gerçek indirme kalitesi hedefi açık kalıyor. Altyazıdaki font sorunu bu kart/dublaj değişikliğiyle çözülmüş değildir.
