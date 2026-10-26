# Kaynak araştırması — 25 Ekim 2026

**1.6.1 araştırması:** MoviesDrive Dune550MB/900MB/1,3GB/1,9GB/3,8GB sayfaları → mdrive → HubCloud incelendi. Sayfa boyutları doğrulanmış dosya sayılmadı.İki10Gbps zincirinde hedef Worker TLS hatası; yeni küçük dosya üretime alınmadı. Archive Dune benzer kayıtlarında yanlış yıl/fragmanlar reddedildi. MovieBox açık v1 araması boş; v2 invalid token döndü, özel anahtar kopyalanmadı. [Kanıt ve sınırlar](ONLINE_VE_DIZI_DUZELTMELERI.md).

**26 Ekim 2026 / 1.6.0 ek araştırma:** Animecix/Tau açık API’si ve gerçek MP4 dosyaları doğrulanıp eklendi. Death Note ve Attack on Titan S01E01, mevcut Türkçe SRT alternatifleriyle sınandı. MoviesMod → public form → DriveSeed → Google video bağlantısı izlendi; uzantısız MKV ve Range 200 nedeniyle üretime eklenmedi. MoviesDrive IMDb araması yanlış benzer ID’ler verdi. UHDMovies sayfası erişilebilir; çalışan yeni terminal kanıtı yok. Yeni araştırma her kaynağı çalışır saymaz. [Kanıt ve sınırlar](ANIME_HIZ_VE_ALTYAZI.md).

1.5.0 için dokuz topluluk deposunun herkese açık manifesti sorgulandı. Sekizi yanıt verdi: **221 sağlayıcı tanımı, normalize adlarla 134 kimlik**. Phisher deposunun denenmiş main manifest adresi 404 verdi. Sayılar kopyaları, sarmalayıcıları ve aynı CDN'yi kullanan adaptörleri içerir; 221 bağımsız çalışan kaynak değildir. Bütün internetin eksiksiz tarandığı iddia edilmez. [Makineyle okunur envanter](../compatibility/source-inventory-150.json), `npm run research:sources` ile yeniden üretilebilir.

## İncelenen depolar

| Depo | Tanım sayısı | İnceleme amacı |
| --- | ---: | --- |
| [All-in-One Nuvio](https://github.com/NuvioPlugin/All-in-One-Nuvio) | 66 | Dosya/TV/API yöntemleri, aday sağlayıcılar |
| [Michat88](https://github.com/michat88/nuvio-providers) | 30 | VixSrc TV, MovieBox web ve diğer API yolları |
| [Yoru](https://github.com/yoruix/nuvio-providers) | 29 | Dosya ve HLS sağlayıcı envanteri |
| [MoonCrown](https://github.com/mooncrown04/nuviotr) | 18 | DiziYou, SezonlukDizi ve Türkçe kaynak yöntemleri |
| [Turkish Nuvio](https://github.com/fmustafayaman/turkish-nuvio) | 4 | Türkçe film/dizi kaynakları ve bakım yaklaşımı |
| [Manitux](https://github.com/manitux-app/nuvio-plugins) | 8 | Türkçe sağlayıcı envanteri |
| [Streamline](https://github.com/itsmeadarsh2008/Streamline) | 25 | Açık kaynak HubCloud, TV bölüm listeleri ve kaynak sınırlamaları |
| [NiakVIO](https://github.com/niakw/NiakVIO) | 41 | Sağlayıcı/kapsam envanteri |

Seçilen sağlayıcı kodları yalnız yöntemleri anlamak için okundu. Uzaktan JavaScript çalıştırılmaz. Topluluk kodundaki gömülü TMDB anahtarları, kişisel ShowBox tokenları veya özel uygulama anahtarları projeye kopyalanmadı. Bazı README'ler eski React Native/Hermes dönemini anlatır; ABI için resmî Nuvio KMP kaynakları esas alınır.

## Canlı denemeler ve kararlar

| Yol | Gözlem | 1.5.0 kararı |
| --- | --- | --- |
| PlayIMDb TV | Game of Thrones ve Fleabag için doğru IMDb ve S01E01, yıl içermeyen release adı, üç HLS sunucusu | Yanlış yıl zorunluluğu düzeltildi; doğru IMDb + özgün ad + tam bölüm şart. Film kontrolü gevşetilmedi. |
| VixSrc TV | `/api/tv/{id}/{season}/{episode}` iki dizide yanıt verdi | Filmle sınırlı adaptör TV yoluna genişletildi. API rotası ve embed başlığı doğrulanır. |
| HDHub bölüm listeleri | `episode-download-item` içinde tek bölüm MKV'leri, ayrıca sezon ZIP/RAR paketleri | Paketler elenir. TV JSON-LD adı/yılı + TMDB poster yolu ve tam bölümle bağlanır. |
| HubCloud public dosya terminali | Game of Thrones'ta gerçek 1920×1080 MKV; HEAD 403, GET Range 206 | Terminalin `.mkv/.mp4` adlı public Worker bağlantısı sınırlı GET ile doğrulanır. Genel HEAD 403 kuralı değiştirilmedi. Literal filename boşlukları tek kez kodlanır. |
| Dune ilk küçük sürümler | İlk üç release'in aynaları çalışmadı; sonraki grupta gerçek dosyalar çıktı | En çok altı release, küçükler önce ve en çok iki paralel çözümleme. Dosya boyutu/boyutlar yine gerçek aralıktan gelir. |
| Fleabag indirilebilir dosyaları | Pixel bağlantıları 404; 10Gbps yolu dosya yerine link-generator HTML sayfasına döndü | Sahte dosya diye listeye alınmadı. Online/TR sonuçları korunur. |
| DiziYou | Yanıt HTTP 200 olsa da beklenen normal dizi/bölüm yapısı bulunamadı | Çalışıyor iddiasıyla eklenmedi. |
| MP4Hydra info2 | Dune/Fleabag POST yanıtları video JSON'u yerine HTML | Sadece sağlayıcı adı çoğaltmak için eklenmedi. |
| MovieBox web arama | Denenen eski public web yolu 404 | Ekleme yapılmadı. Özel imzalama anahtarları kopyalanmadı. |
| Internet Archive TV araması | Fleabag/GOT sezon item'larında kullanılabilir video dosyası yok | Bunlar dizi kaynağı başarısı olarak sayılmadı. |

## Türkçe altyazı

- **AltyazıDB eklendi:** [sağlayıcının kurulum açıklaması](https://altyazidb.com/forum/moduller-eklentiler/8-altyazidb-subtitles-stremio-eklentisi.html), [manifest](https://altyazidb.online/manifest.json). Dune ve Fleabag için hesap/anahtar girmeden gerçek UTF-8 SRT gövdeleri doğrulandı. Game of Thrones S01E01 sorgusu bu denemede boştu. Her film/bölüm için sonuç sözü değildir.
- OpenSubtitles v3+ ve resmî v3 korunur. Ortak dizi/bölüm sorguları adaylar arasında paylaşılır. Yanlış S/E ve farklı film/yıl/kurgu reddedilir. Dizi release yılının serinin ilk yılından farklı olması, doğru IMDb bölüm sorgusuna bağlıysa tek başına yanlış dizi sayılmaz.
- [SubDL'nin resmî açıklaması](https://subdl.com/fi/stremio) hesap ve API anahtarı istediğini belirtir. SubSource ve Community Subtitles güncel kurulumları da anahtar/hesap gerektirir; bu oturumun **ücretsiz ve hesapsız** sınırına hazır yerleşik kaynak olarak eklenmedi.
- [Wyzie'nin güncel arama API'si](https://sub.wyzie.ru/) anahtar istiyor; eski anahtarsız örnek 401 döndü. Çalışıyor diye varsayılmadı.
- [SubSense](https://github.com/NepiRaw/Stremio-SubSense) incelendi; birden çok arka uç ve dönüştürme sunuyor. Kendi başına daha çok bağımsız Türkçe dosya garantisi değil. Hesapsız sağlayıcılar tek tek doğrulanmadan varsayılan bağımlılık yapılmadı.

Bir altyazı alternatifi bozuksa sonraki aday denenir; en çok 12 adaya kadar, dört farklı geçerli dosyada durulur. Video ile eşleşen release notları tam hash/sürüm kanıtına dönüştürülmez. Aynı bölüm için paket içinden çıkarılmış SRT, yanlış bölümü kabul etme gerekçesi değildir.

## Daha yakın HLS boyutu ve sade liste

MP4/MKV toplam byte değeri HTTP Content-Range'den okunur. HLS için tek bir dosya boyutu yoktur. Kaliteler ayrı satırlara bölündüğünde her profilin kendi süre/bitrate tahmini kullanılır. `AVERAGE-BANDWIDTH` varsa ortalama kullanılır. Yoksa uygun parçalardan üç HEAD örneği denenir; örneklerin toplam byte/süre oranından tahmin yapılır. HTML/hatalı/eksik başlıklar ölçüm sayılmaz. Örnek alınamazsa tepe bitrate **üst tahmin** olarak belirtilir; kesin byte sayısı değildir. Ses ayrıysa sadece video parçasını ölçüp toplam diye sunmayız.

1.4.0 mevcut köprüde stateless HLS profil servisi yok. Sites hesabı/çalışma alanı değiştiği için bu servisin 1.5.0 kodu **yayımlanamadı**; kullanıcı şu an eski hesaba dönemediğini belirtti. Sağlık cevabında açık `features.hlsProfiles` bulunmadan plugin yeni yolu kullanmaz. Sesin birlikte olduğu HLS child playlistleri doğrudan ayrı gösterilir; ayrı ses grubu olan VixSrc otomatik master olarak kalır. Bu satırda geniş aralıklı boyut yerine “değişken” bilgisi kullanılır. Hazırlanan servis ses ve altyazı gruplarını korur; yalnız küçük master metni döndürür.

## En mantıklı sonraki adımlar

1. Önce kullanıcının iPhone'unda aynı S01E01 kaynaklarıyla tam video+TR indirme, sonra uçak modunda açma. Kaynak/QuickJS testi fiziksel cihaz testi değildir.
2. Fleabag ve Dune için küçük/orta boyutlu gerçek dosya aynalarını artırma; bugün Dune'da doğrulanan en küçük yeni dosya yaklaşık 18,24 GiB, telefon için hâlâ büyük.
3. Yeni kaynak sayısından önce birkaç farklı film/bölümde tekrar eden dosya+Türkçe başarısı ve bağlantı ömrünü ölçme. Aynı dosyanın kalite profilleri veya üç CDN aynası bağımsız sağlayıcı sayılmamalı.
4. Sites erişimi döndüğünde mevcut köprüye HLS profil servisini yayımlama. Aynı Site kimliği korunmalı; farklı hesapta kopya Site açarak erişim sorunu örtülmemeli.
5. iOS senkron için güvenilir referans/işitsel karşılaştırma gerekir. Sadece bir saniye kayık olabileceği düşüncesiyle altyazı rastgele kaydırılmaz. Gömülü TR track'i okuyup dış SRT olarak çıkarma, uygun bir sunucu çalışma ortamında araştırılabilecek diğer yoldur; mevcut Worker tam ffmpeg motoru değildir.
