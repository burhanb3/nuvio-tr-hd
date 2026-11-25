# Sürüm notları

## 1.9.6 — 25 Kasım 2026

- **iPhone'da 60 sn askı nedeniyle tüm dizi sonuçlarının düşmesine karşı düzeltme:**
  - **Kök neden:** Nuvio eklentiyi 60 sn'de keser; iOS ağ katmanı `AbortSignal` ve `redirect: 'manual'` desteklemez ve yanıt vermeyen (SYN düşen) tek bir bağlantı 60 sn bekleyerek aynı scraper içindeki tüm sonuçları silebilir. TR ev ağında iki kaynak bu riski üretiyordu: `www.diziyou.one` (İSS engel sunucusu, yalnız dizilerde) ve `Goojara` (`web.wootly.ch/source` → yanıt vermeyen ölü CDN düğümü, The 100 S5E5'te 16 denemenin 11'i).
  - **DiziYou varsayılan kapalı:** Yeni `diziyouOptInEnabled` anahtarıyla varsayılan kapalı hale getirildi; önceden kaydedilmiş `diziyouEnabled: true` ayarı yeni varsayılanı ezmez. Yalnız erişilebilir ağlarda elle açılabilir.
  - **Goojara 5. bağımsız scraper (`nuvio-tr-hd-goojara`):** Goojara ana `Nuvio TR HD` taramasından çıkarılıp kendi bağımsız tarayıcısına alındı. Dönen CDN düğümü yanıt vermezse yalnız Goojara zaman aşımına uğrar; ana listedeki FzTvSeries, 4KHDHub, MoviesDrive, HDRezka, Archive, FzMovies ve diğer sonuçlar etkilenmez. Dosya doğrulanmadan altyazı ön-sorgusu da başlatmaz.
  - **Goojara yeniden deneme koruması:** Probe artık Goojara için yalnız anlık taşıma hatalarında (`network: true`) bir kez yeniden dener; sessiz zaman aşımında ikinci bir 60 sn native askı oluşturmaz.
- 357 yerel birim ve QuickJS paket testi geçti (`npm run check`). Fiziksel telefon, tam oynatma, indirme ve çevrimdışı altyazı testi yapılmadı.

## 1.9.5 — 25 Kasım 2026

- **Filmlere yeni dosya kaynağı: FzMovies.**
  - Sorun: filmlerde çoğu zaman tek indirilebilir kaynak kalıyordu; o da yavaşladığında seçenek yoktu.
  - Bağlantı zinciri:
    - Ad araması. Kart adı başlıkla veya "başlık (yıl)" ile tam tutmalı; yılı tutan kart önce, en fazla 3 film sayfası açılır.
    - Film sayfasında tek IMDb kimliği hedefle aynı olmalı. Dublajlı sayfalar (ör. "Hindi Dubbed") açılmaz.
    - Sayfanın anonim oturumu yalnız sitenin iki indirme sayfasına gönderilir; video adresi oturum taşımaz.
    - Dosya adında başlığın hemen ardından yıl gelmeli. "Inception_The_Cobol_Job_(2010)" gibi aynı adla başlayan başka yapımlar elenir.
  - Kalite: "high" MP4 genelde 640×360 (0,24–0,50 GB), 720p MKV 0,7–1,19 GB. Çözünürlük ve süre dosyadan okunur; süre ±%10 tutmalı. Dosya adındaki 720p etiketi doğrulama sayılmaz.
  - Site aynı dosyayı üç sunucuda listeler. 25 Kasım'da bu bilgisayardan ilk sunucu her filmde TLS hatası verdi. Probe FzMovies için aynı yol ve aynı alan adındaki iki yedeği dener; 401/403/429 sonrası denemez.
  - Bazı dosya adlarında ham boşluk var ("BluRay v2"). Adres artık `%20` ile gönderilir; bu olmadan The Dark Knight ve Spider-Verse 0 satır veriyordu.
  - Yalnız filmler; dizi aramaz. Ayarlarda "FzMovies film dosyaları" anahtarı, varsayılan açık.
- **Kapsam (gecikmesiz, bu bilgisayar, yalnız FzMovies açık):** doğrulama listesindeki 23 filmin 19'unda probe ile doğrulanmış satır, çoğunda iki dosya (360p MP4 + 720p MKV).
  - Sonuç yok: Totoro ve Your Name (benzetimde yalnız Japonca özgün ad var) ve 2026 yapımı Obsession.
  - Bridge at Remagen'de tek sunucu listelenmiş ve 403 veriyor; doğru elendi.
- **Filmlerde iş sırası:** FzMovies, MoviesDrive'ın hemen ardından başlar (10 sn kapsam). Dizilerde sıra değişmedi.
  - Telefon benzetimi: bu bilgisayar, istek başına 600 ms ek gecikme, en fazla 6 eşzamanlı istek, ardışık çalıştırma. Gerçek telefon değil.
  - Goojara'nın ardında FzMovies satırı 18 çalıştırmanın 13'ünde çıktı, ama Matrix'te HDRezka 720p 0/3 oldu (kapalıyken 3/3).
  - 4KHDHub'ın ardında 9'da 1. Goojara ardında 7,5 sn kapsamla 9'da 3.
  - Seçilen sırada 12'de 8: Matrix 1/3, Fury 2/3, Spider-Verse 2/3, Oppenheimer 3/3. Matrix HDRezka 720p 3/3.
- **Bilinen maliyetler (aynı benzetim, telefonda ölçülmedi):**
  - MoviesDrive: Fury ve Spider-Verse'te seçilen sırada 0/6. Aynı turlarda FzMovies kapalıyken 4/6, sonradan alınan iki kapalı turda 1/4. MoviesDrive keşfi kapalıyken de 10 sn sınırında (9,4–10 sn). Site dalgalanması ile çekişme payı ayrılamadı.
  - Oppenheimer HDRezka: seçilen sırada 1/3 (kapalıyken 3/3, farklı saatte).
  - 4KHDHub film zinciri medyanda 1,6–3,1 sn geç başlıyor. Bu benzetimde 4KHDHub, FzMovies kapalıyken de hiçbir filmde satır vermedi.
- Bağlantılar kaynağa göre yaklaşık 12 saat geçerli. 25 dakikalık bağlantı çalıştı; daha uzun ömür ölçülmedi. Sitenin telefona Cloudflare sınaması gösterip göstermediği denenmedi.
- **Kapsam (1.9.5, 25 Kasım, gecikmesiz, bu bilgisayar):** 37 durumun 34'ü ölçütü sağladı (aynı gün 1.9.4: 35). Değişen tek durum Stranger Things S3E2: Goojara adayı dosya kontrolünde `video_unavailable` ile düştü, yalnız FzTvSeries kaldı; FzMovies dizilerde çalışmaz. Doğrulanmış dosya 304'ten 326'ya çıktı; FzMovies 23 filmin 19'unda 37 dosya verdi. Filmlerde MoviesDrive 16→16, HDRezka 64→60, Goojara 15→12, 4KHDHub/HubCloud 30→27, 4KHDHub/Pixeldrain 10→12. The Dark Knight'ta HDRezka 4→0: HDRezka'nın kendi sitesi ilk saniyede zaman aşımına uğradı, FzMovies başlamadan önce (site dalgalanması). En yüksek çözünürlük Matrix'te (3840×2160→1920×800), Dune'da (3840×1608→1920×804) ve Fury'de (3840×2160→3840×1606) düştü; No Way Home ve Interstellar'da 3840×2160 eklendi. Düşen 4K satırlarında 4KHDHub aynı adayları buldu, Worker aynaları 403 verdi (dosya kotası, bkz. 19 Kasım kararı); zaman aşımı değil. Goojara dizilerde de 9→6 düştü; bu kısım FzMovies'e bağlanamaz (Goojara düğüm dalgalanması).
- 356 yerel test geçti. FzMovies zinciri ve ikinci ayna QuickJS paketinde de sınandı; oturum çerezinin kapsamı yalnız Node testinde. Fiziksel telefon, tam oynatma ve indirme testi yapılmadı. Altyazı senkronu bu dosyalar için ayrıca sınanmadı.

## 1.9.4 — 20 Kasım 2026

- **Dizilere ikinci bağımsız dosya kaynağı: FzTvSeries.**
  - Sorun: The 100 gibi dizilerde indirilebilir olarak çoğu zaman yalnız Goojara çıkıyordu; Goojara'nın düğümü düştüğünde hiç dosya kalmıyordu.
  - Neden 4KHDHub görünmüyordu: The 100'ün Pixeldrain dosyalarının çoğu "captcha gerekli" sınırında. 20 Kasım'da S1E1, S1E3, S1E10 ve S3E5 sınırlıydı; S2E1 ve S4E2 açıktı (gün içinde değişiyor). Diğer HubCloud sunucuları `workers.dev` üzerinde. Captcha çözülmez.
  - FzTvSeries ana sağlayıcıda ve Dosyalar'da dizi bölümleri için varsayılan açık. Bağlantı zinciri:
    - Arama kartındaki ad, ardından dizi sayfasında tek IMDb kimliği.
    - Sezon bağlantısı ve tam SxxEyy bölüm kartı.
    - Bölüm sayfasının anonim oturumuyla indirme sayfası; buradan dosya adresi kurulur.
    - Dosya adında bölüm denetimi. Süre ±%10 olmalı; piksel dosyadan okunur.
  - Site aynı dosyayı iki sunucuda listeler. İlki açılmazsa (bu bilgisayarda süresi dolmuş sertifika) aynı yol ve aynı alan adındaki ikincisi denenir.
  - Kalite çoğunlukla 360p. The 100 S1E1, S1E10 ve S3E5 bu bilgisayarda probe ile 640×360 doğrulandı (~0,12 GB).
  - Breaking Bad S1E1'de iki sunucu da bu bilgisayardan açılmadı; aday doğru şekilde elendi.
- **Dizilerde uzun kaynak zincirleri önce başlar.** 4KHDHub (7 adım) ve FzTvSeries (5 adım) artık Archive ve Goojara'nın hemen ardından başlıyor; HDRezka, MoviesDrive ve online kaynaklar sonra. Filmlerde sıra değişmedi.
  - Neden: FzTvSeries ilk denemede öne konunca 4KHDHub geç başladı, ilk biten kaynakların probe/altyazı yoğunluğuna denk geldi ve 8 sn sınırını aştı. The 100 S2E1'deki 1080p ve Stranger Things S5E1'deki 2160p satırı kayboldu. FzTvSeries sona alınınca bu kez kendisi geç kaldı.
- **Telefon benzetimi** (bu bilgisayar, istek başına 600 ms ek gecikme, en fazla 6 eşzamanlı istek, ardışık çalıştırma; gerçek telefon değil), son sırayla:
  - The 100 S2E1: FzTvSeries 360p + Goojara 480p + 4KHDHub 1080p.
  - Stranger Things S5E1: FzTvSeries 480p + Goojara 480p + 4KHDHub 2160p.
  - The 100 S1E1: FzTvSeries 360p + Goojara 480p. 4KHDHub yok (Pixeldrain captcha).
  - Game of Thrones S1E1: FzTvSeries kapalıyken 2, açıkken 4 indirilebilir satır. 4KHDHub adaylarının hepsi `workers.dev` üzerinde (bu hatta engelli).
  - Breaking Bad S1E1: sonuç değişmedi (Archive 480p/720p + VixSrc).
- Gecikmesiz canlı çalıştırmada The 100 S3E5'te Goojara iki denemede de zaman aşımına uğradı; FzTvSeries tek dosya olarak kaldı.
- **Bilinen kayıp (yayın sonrası ölçüm):** Stranger Things S5E1 benzetiminde FzTvSeries açıkken ana listedeki DiziBak online satırı 24 sn sınırına yetişmedi (2/2). Kapalıyken çıktı. MoviesDrive'ın 720p/1080p/2160p satırları üç çalıştırmada da kaldı. 4KHDHub aynı ölçümde dörtte üç kez kendi 8 sn sınırına takıldı; sıra değişikliği onu garanti etmiyor.
- **Probe:** ikinci sunucu yalnız FzTvSeries ve Internet Archive için, yalnız aynı yol/sorgu ve aynı ana alan adındaysa denenir.
- 349 yerel test geçti; FzTvSeries zinciri ve ikinci ayna QuickJS paketinde de sınandı (oturum çerezinin kapsamı yalnız Node testinde). Fiziksel telefon, tam oynatma ve indirme testi yapılmadı. Altyazı senkronu bu dosyalar için ayrıca sınanmadı.

## 1.9.3 — 20 Kasım 2026

- **4KHDHub dizileri daha sık bağlanır:**
  - Sorun: dizi sayfası TMDB'nin ana posteri yerine başka bir dil veya sezon posteri gösterdiğinde sayfa hiç bağlanmıyordu (The 100, Stranger Things).
  - Artık tür, tam ad ve yıl tuttuğunda aynı TMDB kaydının poster listesi okunur: dizinin tüm dilleri, istenen sezon ve son sezon. Sayfadaki poster bu listedeyse sayfa bağlanır.
  - Başka bir kaydın posteri, başka ad veya yıl yine bağlanmaz. Liste yalnız ana poster tutmadığında yüklenir.
  - Canlı ölçüm (bu bilgisayar; TMDB verisi elle yazılmış sabit veri, gerçek TMDB yanıtı değil):
    - The 100 S1E1: Goojara'ya ek olarak 4KHDHub/Pixeldrain 1080p 3,07 GB.
    - Stranger Things S5E1: önce 0, şimdi probe ile doğrulanmış 4KHDHub/Pixeldrain 1080p 3,95 GB ve 2160p 7,57 GB.
    - The 100 S3E5: sonuç yok. Pixeldrain bu dosyayı "captcha gerekli" sınırına almış, diğer aynalar `workers.dev` üzerinde.
- **Goojara daha kararlı:**
  - Sorun: wootly'nin `/source` yönlendirmesi her istekte farklı bir CDN düğümü seçiyor. Bazı düğümler bu ağdan bağlantı zaman aşımı veya ret veriyor, bu yüzden aynı bölüm bazen çıkıp bazen çıkmıyordu.
  - Artık ilk Range isteği ağ hatası veya zaman aşımıyla düşerse aynı adres bir kez daha istenir (AniMOM'daki kuralın aynısı). HTTP yanıtı veya dosya uyuşmazlığı tekrarlanmaz. En kötü durumda probe 4,5 sn uzar.
  - Küçük ölçüm (bu bilgisayar, The 100'ün 24 farklı bölümü, sırayla biri tekrarlı biri tekrarsız): tekrarlı 10/12, tekrarsız 8/12. Üç tekrarın biri dosyayı kurtardı, ikisinde iki düğüm de ölüydü. Kesin çözüm değil; telefonda ölçülmedi.
- **Ağ gözlemi (20 Kasım, bu bilgisayar, TR ISS hattı):**
  - `*.workers.dev`, `workers.dev` ve `*.r2.dev` yeniden engelli.
  - Belirtiler: DNS (DoH dahil) aynı Cloudflare adreslerini veriyor. TLS isteğine ara kutu düz HTTP 307 ile ISS'nin özel ağdaki uyarı sayfasına yönlendiriyor; istemci `ERR_SSL_PACKET_LENGTH_TOO_LONG` görüyor.
  - 19 Kasım'da erişilebiliyordu; değişimin nedeni bilinmiyor.
  - HubCloud'da Pixeldrain dışındaki tüm sunucular (10Gbps, ZipDisk, "Download File") bu hostlarda. Bu hatta 4KHDHub ve MoviesDrive yalnız Pixeldrain dosyalarıyla sonuç verebilir.
- **HDHub4u incelendi, eklenmedi.** IMDb kimliğiyle kesin bağlanıyor ve 4KHDHub'dan farklı dosyalar sunuyor. Ancak:
  - Dosyaları aynı HubCloud altyapısında. İncelenen Inception dosyalarında Pixeldrain yok, aynaların hepsi `workers.dev`.
  - `hubcdn` bağlantıları Google'ın doğrudan dosyasına çıkıyor, fakat sunucu Range desteklemiyor (570 MB'lık tam yanıt). Güvenli probe yapılamıyor.
  - Gofile bir misafir hesap anahtarı istiyor.
  - Bu hatta uçtan uca doğrulanamadı; yeniden deneme koşulu hafızada.
- 342 yerel test/QuickJS geçti. Fiziksel telefon, tam oynatma ve indirme testi yapılmadı.

## 1.9.2 — 19 Kasım 2026

- **MoviesDrive daha hızlı:**
  - Eski `new2` kökü her aramayı 302 ile yeni kökün sorgusuz `/search.php` adresine yönlendiriyordu; bu her aramada iki fazla istek (≈1,5 sn) demekti. Arama artık doğrudan güncel `new4` kökünden başlar.
  - Kök yine değişirse mevcut davranış korunur: sorgusuz yanıttaki "son yazılar" listesi kullanılmaz, yeni kökte bir kez gerçek arama yapılır. Bu davranış için test eklendi.
  - Sürümler 2 yerine 3 paralel zincirle çözülür.
  - Canlı ölçüm (aynı bilgisayar, TR ISS, her iki tarafta tek ölçüm, farklı saatlerde): Dune keşfi 8,9 sn'den 4,3 sn'ye indi (3 MKV, 480/720/1080p). Inception 5,4 sn (1080p 2,50 GB + 2160p 7,59 GB). Kök ve eşzamanlılık değişikliklerinin payı ayrı ölçülmedi.
- **Ağ durumu değişti:** `*.workers.dev` bu bilgisayardan artık erişilebiliyor; 1.9.1 öncesinde SNI engelliydi. Kod değişmeden 4KHDHub'ın Worker aynaları sonuç vermeye başladı:
  - Inception: 1080p 7,09 GB, 2160p 32,25 GB ve 70,82 GB MKV.
  - GoT S1E1: 1080p 6,40 GB ve 14,63 GB, 2160p 23,14 GB ve 28,80 GB MKV. Hepsi workers.dev hostlarından; tekrarlarda 1080p'lerden biri kota 403'üyle düşebiliyor.
  - Bu aynalar Google Drive kotasına bağlı. 12 denemelik ölçümde dosyaya göre 0/12 ile 12/12 arasında başarı görüldü. Listede görünen 4K dosyanın indirmesi kota yüzünden başlamayabilir.
- **GoT S1E1 tam tarama:** elle yazılmış sabit sezon verisiyle (gerçek TMDB yanıtı değil) iki turda 9 ve 10 sonuç geldi: HDRezka 240/360/480/720p MP4, Goojara 720p, 4KHDHub 1080p/2160p, VixSrc online. Önceki "HDRezka yok" gözlemi büyük olasılıkla test düzeneğindeki sahte anahtarın sezon uç noktasından aldığı 401'di. Gerçek anahtarla ve telefonda doğrulanmadı.
- **Yeni kaynak araştırması:** bu tur kurallara uyan yeni bağımsız dosya kaynağı bulunamadı. Nedenleri hafızada (SONRAKI_ISLER) tarihli olarak kayıtlı.
- 339 yerel test/QuickJS geçti. Fiziksel telefon, tam oynatma, indirme ve senkron testi yapılmadı.

## 1.9.1 — 19 Kasım 2026

- **Türkçe altyazı:** AltyazıDB indirme yolu sürekli 502 döndüğü için dosya başına 12 TR altyazı hakkı bozuk adaylarla doluyordu. Artık:
  - Aynı yoldaki üç 5xx yanıtından sonra o yol arama süresince atlanır; kardeş yollar etkilenmez.
  - 5xx ile düşen adayın hakkı iade edilir.
  - İlk turda her altyazı servisi en fazla 4 aday alır; kalanlar ikinci turda denenir.
  - Kaynak odaklı canlı testte Dune'un indirilebilir dosyaları (Pixeldrain, MoviesDrive 480/720/1080, Archive, Goojara) 0 yerine TR altyazı aldı. Inception ve GoT S1E1'de de dosyalar TR altyazılı.
  - AltyazıDB'nin kendi kaynağı API anahtarı istediği için onarılamadı.
- **Yanlış altyazıya karşı:**
  - Yalnız yabancı konuşmaları çeviren ("forced/foreign parts only") altyazılar elenir.
  - Yalnız sürüm notu içeren satırlar "tam sürüm eşleşmesi" sayılmaz.
- **Bozuk online yayınlar:**
  - Oynatma listesi süresi TMDB süresinin 0,7–1,35 katı dışındaysa elenir.
  - Tek parçalı listede ilk segment sunucusu DNS/TLS hatası verirse liste elenir. FilmModu'nun segment sunucusu artık yok (NXDOMAIN); bu yüzden listelenmez.
- **4KHDHub:**
  - Pixeldrain dosyası Worker aynalarından önce denenir.
  - "Dune - Part One (2021)" gibi alt başlıklı dosya adları kabul edilir. Featurette, örnek ve başka yıl reddedilir.
  - Sürümler üçlü kayan havuzla çözülür.
- **HDFilmDelisi** yeni hdfilmdelisi1.com yapısına uyarlandı:
  - Kimlik sayfadaki IMDb bağlantısı ve oynatıcıdaki videoId ile doğrulanır.
  - Erişim kapısı açıkça herkese açık ve oturumsuz olmalıdır.
  - Yeni oynatıcı verisi yalnız çözülür, çalıştırılmaz.
  - 19 Kasım canlı kontrolünde keşif iki filmde doğru medya adresini buldu. Ancak medya sunucusu (ha.vixolity.com) 502 veriyordu ve sitenin kendi oynatıcısı da bağlanamadı, bu yüzden yayın listelenmedi. TR dublajın geri geldiği doğrulanmadı.
  - Ana liste açılsa bile ilk alt listesi 4 sn içinde 5xx veya HTML dönerse yayın listelenmez. Canlı denemede bu 502'ler 0,4–3,7 sn'de geldi; daha yavaş yanıt veren alt liste yayını eletmez.
- 338 yerel test/QuickJS geçti. Fiziksel telefon, tam oynatma, indirme ve senkron testi yapılmadı.

## Windows uygulama düzeltmesi — 11 Kasım 2026

- Windows aramasında ayırt edilebilmesi için kullanıcı Başlat menüsüne ayrıca **Nuvio TR HD** adlı kontrollü açılış kısayolu eklendi.

- Nuvio Desktop'ın ham video yanıtını metin üzerinden yeniden kodlarken bozduğu doğrulandı. Tam byte koruyan sınırlı HTTP düzeltmesi ve derleme kaynakları eklendi.
- Eklenti sürümü 1.9.0. Masaüstündeki Nuvio TR HD kısayolu düzeltilmiş yerel Windows kopyasını açar.
- 12 Kasım: kullanıcı Başlat menüsüne de düzeltilmiş kopyanın kısayolu eklendi. Ayrı motor testinde Black Clover 1×17 üç MP4 döndürdü; yeni açılışın kullanıcı arayüzü kontrolü bekleniyor.
- Yerel Windows başlatıcısı açılış öncesinde düzeltilmiş paketi doğrular. Başka Nuvio kopyası açıksa kullanıcının onayıyla normal kapatma denenir; zorla kapatılmaz. Gömülü Java 17 ile penceresiz paket yükleme kontrolü geçti; son kaynak ekranı testi bekleniyor.

## 1.9.0 — 11 Kasım 2026

- Hızlı İzle, yavaş TMDB yanıtından sonra kaynakları denemek için sekiz saniyeye kadar süre ayırır. Toplam mantıksal sınır 18 saniyedir.
- TMDB geçici ağ hatasında aynı yapım bir kez daha istenir. Yıl, kimlik ve bölüm kontrolleri uygulanır.
- MoviesDrive güncel kataloğa taşındı. Yayıncı aramayı yeni ana sayfasına yönlendirirse özgün sorgu bir kez yeniden gönderilir. Dune (2021) için iki kaynak testinde sırasıyla üç ve bir gerçek MKV bulundu.

## 1.8.9 — 10 Kasım 2026

- Masaüstü platformu dört sağlayıcıya eklendi; mevcut Android/iOS desteği korundu. Windows uygulamasında depo yenilemesi sonrası dört sağlayıcı göründü; yerleşik Matrix testi 10 sonuç verdi. İlk Dune araması boş kaldı, tekrar kararlılığı incelenmeli.
- MoviesDrive adres değişiminde kaybolan arama sorgusu güvenli biçimde yeniden gönderilir; daha önce erişilemeyen mevcut dosyalar geri gelebilir.
- FilmEkseni ve Anizone online HLS alternatifleri eklendi; indirme dosyası olarak işaretlenmez.
- Dune için 567 MB, 948 MB ve 2,07 GB; Spider-Man: No Way Home için 904 MB, Into the Spider-Verse için 402 MB MKV seçenekleri örnek ağ testlerinde bulundu. İngilizce ses ve mevcut TR altyazı alternatifleri var; altyazı senkronu sınanmadı.
- Fleabag ilk taramada boş, tekrarda sekiz dosya; Shameless örneğinde indirme yok. Yeni bağımsız indirme kaynağı veya doğrulanmış TR dublaj eklenmedi.
- 324 yerel test ve Windows/Linux CI geçti; kaynak kapsamı, eşleşme ve masaüstü platform testi ayrıntıları uyumluluk belgelerinde. Tam oynatma/indirme, offline ve fiziksel telefon testleri henüz yapılmadı.

## Araştırma notları

- Belgeler: mevcut kapsam, açıklar ve 21 erişilebilir sağlayıcı manifestinin karşılaştırması geliştirici hafızasına eklendi. Statik araştırma; yeni sağlayıcı veya ürün davranışı değişikliği değildir.

## 1.8.8 — 28 Ekim 2026

- Arşiv kaydı İngilizce, dosya adı Türkçe olduğunda aynı TMDB kaydının resmî çevirisiyle dosya eşleştirilir. Mevcut İngilizce dosyalar yerel alternatifleri gizlemez; yanlış yıl/kimlik ve kısa video kontrolleri korunur.
- MoviesDrive film aramasında resmî alternatif başlıklar da kullanılabilir. Özgün adı içeren bir ipucu tek başına sonuç kabul edilmez; alternatif adın aynı TMDB kimliğinden gelmesi gerekir.
- Üç filmde altı ek indirme: The Dark Knight için 17,72 GB/3840×2160, 1,36 GB/1280×528 ve 475 MB/720×298 MKV; Küçük Kardeşim için 1,31 GB/720p, Ölüm Avı için 1,64–1,67 GB/720p MP4. Hepsinde mevcut Türkçe altyazı alternatifleri var.
- Son üç MP4 kaynakta Türkçe dublaj olarak yayımlanmış; dosyalardaki ses dili metadatası okunamadığı için doğrulanmış TR ses sayılmaz. Aynı arşiv kopyası ek dosya sayısına dahil edilmedi.
- 312 fixture/QuickJS testi ve Nuvio 0.6.5-beta/23 kaynak dosyası kontrolü geçti. Önceki 4K/dublaj örnekleri korundu. Fiziksel telefon, tam indirme/oynatma ve altyazı senkronu sınanmadı.


## 1.8.7 — 28 Ekim 2026

- MoviesDrive'da sonraki sezonlar için ek bölüm araması. Dizinin ilk yılı korunur; sezon yılı ve bölüm süresi aynı TMDB kaydından ayrıca doğrulanır. Kaynak sayfasındaki yıl, IMDb ve tam sezon/bölüm birlikte eşleşir.
- Aynı dört bağlantı sınırında ikinci bir 4K sürümüne de yer ayrılır. Erişimi kısıtlı dosyalar atlanır; ayrı yayımlanmış uygun sürüm kontrol edilir.
- Stranger Things S5E1/S5E2'de altı ek MKV: iki gerçek 4K (11,17/9,03 GB), iki 1080p (1,22 GB/993 MB) ve iki 720p (509/415 MB). Altısı da EN sesli ve mevcut Türkçe altyazı alternatifli; bu tur yeni Türkçe dublaj doğrulanmadı.
- 303 fixture/QuickJS testi ve Nuvio 0.6.5-beta/23 kaynak dosyası kontrolü geçti. Önceki TR dublaj ve 4K örnekleri tekrar kontrol edildi. Bazı taramalar ağ nedeniyle boş döndü; fiziksel telefon, tam indirme/oynatma ve altyazı senkronu sınanmadı.


## 1.8.6 — 28 Ekim 2026

- Archive, yıl alanı eksik kayıtları tam kanonik ad/yıl içeren arşiv kimliğinden de arar. Kayıt kimliği, gerçek dosya adı ve süre birlikte eşleşir; yanlış yıl, film ve koleksiyon kabul edilmez. Sorgu sayısı artırılmadı.
- Fury için 2,23 GB/1920×808 MKV'de TR/EN ses ve 838 MB/1141×480 küçük MP4 bulundu. Küçük dosyanın ses dili ayrıca doğrulanmadı. Her ikisinde mevcut Türkçe altyazı alternatifleri var.
- MoviesDrive'ın uygun ilk sezon sayfalarına bölüm desteği: arama ve sayfada aynı IMDb, kanonik ad/ilk yıl, sezon ve tam bölüm kontrol edilir. Stranger Things S1E1 için 1,03 GB 1080p; S1E2 için 469 MB 720p ve 905 MB 1080p MKV doğrulandı. Üçü de EN sesli ve harici TR altyazı seçenekli; Türkçe dublaj sayılmaz.
- 297 fixture/QuickJS testi ve Nuvio 0.6.5-beta/23 dosya kontrolü geçti. Önceki 4K ve dublaj örnekleri korundu; bu tur yeni 4K veya anime dosyası doğrulanmadı. Bazı dizi tekrarları kaynak sunucularında zaman aşımı verdi. Fiziksel telefon, tam indirme/oynatma ve senkron testi yapılmadı.


## 1.8.5 — 28 Ekim 2026

- Archive aramasında aynı TMDB kaydının özgün ve gösterim başlıkları birlikte kullanılır. Japonca özgün adla İngilizce kaynak adı arasındaki arama açığı giderildi; sorgu sayısı artırılmadı.
- Önceki sürümle karşılaştırılan üç anime filminde 12 ek MP4/MKV ve mevcut Türkçe altyazı alternatifleri; sekiz eski Archive dosyası da korundu. Your Name için 3,01 GB/3840×2160 ve 1,45 GB/1920×1080, Totoro için 0,91 GB/1920×1038, Spirited Away için 1,60 GB/1920×1080 MKV bulundu. Bu dört MKV'de Japonca ve İngilizce ses var.
- Sekiz ek MP4 farklı küçük/orta boyut seçenekleri sağlar; bunların ses dili ayrıca doğrulanmış sayılmaz. Dosya adındaki 1080p, gerçek 480p'nin yerine geçmez.
- Matroska'nın eksik Language alanındaki İngilizce varsayılanı ve BCP47 önceliği doğru okunur. Açık bilinmeyen veya kesilmiş dil bilgisi İngilizceye çevrilmez.
- Yalnız Hintçe ses taşıdığı dosyadan doğrulanan Archive kaynakları ve açıkça onlardan türetilmiş, sesi okunamayan dosyalar listeden çıkarılır. Gerçek EN/JA gibi başka sesi ölçülen türevler korunur.
- 288 fixture/QuickJS testi; Nuvio 0.6.5-beta ve 23 ilgili kaynak dosyası kontrolü geçti. Yeni Türkçe dublaj veya anime bölümü doğrulanmadı. Fiziksel cihaz, tam indirme/oynatma ve sahne senkronu test edilmedi.

## 1.8.4 — 27 Ekim 2026

- 4KHDHub'ın yayımladığı Pixeldrain bağlantıları film ve tam dizi bölümleri için aramaya alındı. Önceki FSL yolları korunur; yeni dosyalar için adlandırma servisi veya hesap gerekmez.
- Canlı kontrolde 15 ek MKV: Fleabag S01E01/S01E02/S02E01 için dokuz, Severance S01E01 için iki, Oppenheimer/The Dark Knight/John Wick için dört dosya. Bunların altısı gerçek 4K, 11'inde dosya içinde Türkçe metin altyazısı var; tümünde mevcut TR alternatifleri bulundu.
- Fleabag için yaklaşık 1,59–1,69 GB 1080p ve 2,92–3,89 GB 4K seçenekler. Kaynağın kalite adı yerine gerçek piksel gösterilir; başka bölüm, yanlış dosya ve yalnız HI sesli kayıtlar elenir.
- Hazır dosya kontrolü eski aynanın yanıtını beklemez. Kaynak/arama bütçeleri ve native iş kotaları artırılmadı. Nuvio'nun sonuçları scraper tamamlandığında göstermesi değişmedi.
- 276 fixture/QuickJS testi; Nuvio 0.6.5-beta ve 23 kilitli kaynak dosyasında değişiklik yok. Bir Fleabag 4K örneği masaüstü MPV'de bir kareyle açıldı ve gömülü TR izi seçildi.
- Bu tur yeni Türkçe dublaj veya anime dosyası doğrulanmadı. Fiziksel cihaz, tam indirme/oynatma ve bölüm boyunca altyazı senkronu test edilmedi.

## 1.8.3 — 27 Ekim 2026

- Archive aramasında Türkçe ve özgün adı birlikte taşıyan film sürümleri için daha iyi eşleştirme. Ayrı yıl alanı eksik olan HD kayıtlar, başlık/dosya yılı ve gerçek süreyle doğrulanır; yanlış kimlik ve yıl kabul edilmez.
- Canlı kontrolde dört filmde 12 ek MP4/MKV ve mevcut Türkçe altyazı alternatifleri. Altı MKV'de TR/EN ses izleri okundu. The Crow, The Eye ve Hotel Rwanda için yaklaşık 1,72–2,12 GB 1080p; The Bridge at Remagen için 720p/1080p büyük dosyalar bulundu.
- Yaklaşık 0,58–0,72 GB boyutunda altı küçük MP4 de bulundu. Bu dosyalarda ses dili ölçülemedi; doğrulanmış Türkçe dublaj sayısına dahil değiller. Dosya adındaki 1080p yerine gerçek 480p gösterilir.
- Önceki Inception 4K dosyası ve film/dizi/anime yolları korundu. Yeni sağlayıcı, sunucu, hesap veya kaynak başına video sabitlemesi eklenmedi; arama ve native iş kotaları artırılmadı.
- 269 fixture/QuickJS testi ve Nuvio 0.6.5-beta kaynak kontrolü geçti. Bazı tekrarlar ağ nedeniyle boş döndü. Bu tur yeni 4K veya bölüm dosyası doğrulanmadı; fiziksel cihaz, tam indirme ve altyazı senkronu test edilmedi.

## 1.8.2 — 27 Ekim 2026

- MoviesDrive/Pixeldrain üzerinden ek film ve anime filmi indirmeleri. Tam başlık/yıl, varsa IMDb, dosya adı, gerçek boyut, piksel, süre ve ses birlikte denetlenir; yalnız HI sesli dosyalar atlanır.
- Uzantısız MKV'ler için kontrollü MPV desteği. Nuvio `.mp4` adıyla kaydedebilir; gerçek format MKV olarak korunur. Önceki sürümde ad nedeniyle elenen bazı çalışan dosyalar artık değerlendirilebilir. Yeni sunucu veya hesap gerekmez.
- Canlı aramada altı yapımda dokuz ek MKV ve mevcut TR altyazılar. Inception için 3840×1598/7,59 GB ve 1920×800/2,50 GB; Dune için 0,57/0,95/2,07 GB alternatifler. No Way Home, Spider-Verse, Interstellar ve Your Name için de ek dosyalar bulundu.
- Kaynağın yüksek/düşük kalite seçenekleri aynı sınırlı bütçede aranır; aynı dosya iki kalite olarak sayılmaz. 4K ve 1080p MKV örnekleri `.mp4` adıyla masaüstü MPV'de bir kareyle sınandı.
- 261 fixture/QuickJS testi; Nuvio 0.6.5-beta ve incelenen 23 dosyada drift yok. Bir taramada eski dizi/anime kaynaklarında zaman aşımı oldu; sonraki kontrolde Fleabag ve Death Note dosyaları tekrar bulundu.
- Yeni Türkçe dublaj ve dizi bölümü dosyası bu tur doğrulanmadı. Fiziksel cihaz, tam indirme, offline altyazı ve sahne senkronu test edilmedi.

## 1.8.1 — 27 Ekim 2026

- Hızlı İzle grubuna Purstream online film/dizi alternatifi. Tam TMDB kimliği, tür, yıl ve resmi başlık; dizide istenen sezon/bölüm ve video yolu birlikte denetlenir.
- Kaynağın kalite etiketi yerine HLS içindeki gerçek çözünürlük ve dil izleri kullanılır. Mevcut TR/EN altyazı araması aynı akışla devam eder; HLS indirilebilir gösterilmez.
- Yeni kaynak ana dosya aramasına iş eklemez. Kaynak keşfi 5,5 saniye, Hızlı İzle toplamı 8 saniye mantıksal bütçeyle sınırlıdır; iPhone için fiziksel süre garantisi değildir.
- Canlı kontrolde No Way Home, Matrix, Fleabag S01E01/S02E01 ve Shameless S01E01 için beş ek 720p online seçenek ve mevcut TR altyazılar. Sesler EN/FR; altyazı bulunması tam senkron kanıtı değildir.
- 254 fixture/QuickJS testi ve Nuvio 0.6.5-beta sözleşme kontrolü geçti. Bu tur yeni indirilebilir 4K veya Türkçe dublaj dosyası eklenmedi. Çalışan bir 1080p MKV, Nuvio'nun uzantısız dosya adı sınırı nedeniyle entegrasyona alınmadı. Fiziksel cihaz, tam indirme ve senkron testi yapılmadı.

## 1.8.0 — 27 Ekim 2026

- Film ve dizi indirmeleri için HDRezka araması. Aynı IMDb, başlık/yıl ve tam bölüm denetlenir; ücretsiz özgün sesli MP4 seçenekleri mevcut TR/EN altyazılarla eşleştirilir.
- Gerekli olduğunda aynı TMDB kaydından alternatif başlık doğrulaması. Kaynak başlığı farklı diye benzer bir yapıma veya başka bölüme geçilmez.
- Ücretli kalite, reklamlı/camrip çeviri ve kısa örnek videolar atlanır. Kaynağın 1080p/4K etiketi gerçek piksel doğrulaması sayılmaz.
- Kapsam kontrolünde iki farklı kırpılmış 480p dosya artık iki ayrı kalite sayılmaz. Harici TR ve toplam altyazı sayıları ayrı tutulur.
- Canlı kontrolde sekiz film/bölümde 31 yeni MP4 varyantı ve mevcut TR altyazılar; yaklaşık 59 MB–3,07 GB, gerçek 240p–720p. Bir Dune tekrarı boş döndü; sonraki kontrolde eski ve yeni dosyalar yeniden bulundu.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 248 fixture/QuickJS testi geçti. Yeni indirilebilir 4K/TR dublaj bu tur doğrulanmadı; fiziksel cihaz, tam indirme ve senkron testi yapılmadı.

## 1.7.9 — 27 Ekim 2026

- Goojara genel film/dizi dosya araması. Tam başlık/yıl, film IMDb kimliği, seçilen sezon ve bölüm, oynatıcı dosya adı ve gerçek video süresi denetlenir. Yeni sunucu veya hesap gerekmez.
- Canlı taramada Dune, Into the Spider-Verse, Fleabag S01E01/S02E01, Game of Thrones S01E01 ve Breaking Bad S01E01 için ek MP4 ve mevcut Türkçe altyazılar. Dosyalar yaklaşık 94 MB–1,18 GB; kaynak değişkenliği sürüyor.
- Dosya adındaki 720p/1080p yerine gerçek piksel gösterilir. HCSubs gibi sabit altyazı işareti gizlenmez; dili uydurulmaz.
- Arama kaynağın public oturumuyla yapılır; kullanıcı hesabı veya çerezi istenmez. Katalog oturumu video bağlantısına eklenmez.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 238 fixture/QuickJS testi geçti.
- Yeni indirilebilir 4K veya TR dublaj kaynağı bu sürümde doğrulanmadı. Matrix/Shameless indirme açığı, fiziksel cihazda tam indirme/offline ve senkron kontrolleri açık.

## 1.7.8 — 27 Ekim 2026

- Eski ve az bulunan filmlerde küçük MP4 seçenekleri için RareFilmm araması. Tam başlık/yıl, makale ve oynatıcı kimliği/süre kontrolü; mevcut TR/EN altyazılarla aynı eşleştirme akışı.
- İndirme önceliği ayarı varsayılan açık. Küçük HLS satırları büyük dosyaları liste sınırının dışına itmez; boyut/kalite sırası her bölümün içinde korunur.
- Nuvio'nun gerçek dosya adı kuralıyla uzantı kontrolü. Query içine yazılan `.mkv` veya `.mp4`, yanlış kaydetme uzantısını gizleyemez.
- Görüntüye işlenmiş İngilizce altyazı için EN görüntüde etiketi. Bu yazılar harici altyazı gibi kapatılamaz.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 229 fixture/QuickJS testi geçti.
- Canlı kaynak kontrolünde üç filmde dokuz MP4; 0,15–0,98 GB. Genel dizi/anime, indirilebilir 4K ve TR dublaj açığı kapanmadı. Fiziksel cihaz, tam indirme ve senkron testi yapılmadı.

## 1.7.7 — 27 Ekim 2026

- Bağımsız **Hızlı İzle** sağlayıcısı. HDFilmDelisi buraya taşındı; yeni DiziBal film/dizi/anime desteği eklendi. Önceki üç sağlayıcı kimliği korunur, aynı kaynak iki grupta tekrar aranmaz.
- DiziBal'da gerçek TR/EN altyazılar ve uygun kaynaklarda TR/EN ses. Yerelleştirilmiş katalog adları, aynı TMDB kimliğinin çevirileriyle eşleştirilir.
- Kaynak keşfi dosya/altyazı kontrollerini beklemeden devam eder. Yanıt vermeyen altyazı kataloğuna ek hash sorgusu açılmaz; katalog isteği daha kısa bekler.
- HDHub zincirinde kaynak bütçesi; diğer sağlayıcıların ve devam eden gerçek dosya kontrollerinin bütçesi korunur.
- Hafif HLS okumasındaki ilk beş kalite sınırı kaldırıldı. Listenin devamındaki mevcut 4K seçenekler kaybolmaz; olmayan kalite üretilmez.
- README, kurulum, ayarlar ve sorun giderme belgeleri yenilendi; eski ayrıntılı kayıtlar arşive taşındı. Hata/kaynak önerisi formları ve katkı rehberi eklendi.
- Nuvio **0.6.5-beta** kaynak sözleşmesi ve 222 fixture/QuickJS testi. Fiziksel cihaz, tam indirme/offline/senkron testi yapılmadı. Genel film/dizi indirme açığı sürüyor; bu sürümde yeni MP4/MKV sağlayıcısı doğrulanmadı.

## 1.7.6 — 27 Ekim 2026

- Daha sade kartlar; p ve piksel birlikte, destekli tek GB değeri, TR/EN öncelikli dil kodları ve beş dil/+N gösterimi.
- HDFilmDelisi Türkçe dublaj/çoklu ses kaynağı; HDHub MB/MiB sıralaması ve küçük/yüksek kalite/büyük sürüm seçimi.

## 1.7.5 — 27 Ekim 2026

- Waploaded'ın kısmi güncel film/dizi kataloğu ve public MP4/MKV dosya yolu eklendi.

## 1.7.4 — 27 Ekim 2026

- Bağımsız Ek Anime grubu; AniMOM ve SeiCode/MP4Upload kaynakları.
- Kısmi kataloglar, yanlış bölüme geçmeden mevcut dosyaları sunabilir.

## 1.7.3 — 26 Ekim 2026

- Büyük MP4 metadata kutuları ve ilk CDN adresinde kalan Range kontrolleri iyileştirildi.

## 1.7.2 — 26 Ekim 2026

- TR ile aynı kimlik/sürüm/gövde kontrollerinden geçen İngilizce altyazı desteği.
- Aynı gövdeli altyazı aynalarının birleştirilmesi ve dil başına alternatif sınırı.

## 1.7.0–1.7.1 — 26 Ekim 2026

- DiziYou, DiziBak, FilmModu ve SonAnime kaynakları; genel Archive bölüm araması.
- Gerçek dosya kontrolleri, ses kodları ve iPhone harici oynatıcı rehberi.

## Önceki sürümler

[Ayrıntılı sürüm ve araştırma kayıtları](docs/arsiv/SURUM_NOTLARI.md).
