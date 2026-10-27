# Sorun giderme

## Hiç kaynak görünmüyor

Depoyu yenileyin; Nuvio Full ve ilgili sağlayıcının etkin olduğunu kontrol edin. Yeni Hızlı İzle sağlayıcısını da açın. Dizilerde sezon/bölüm seçilmeli. Çözünürlük filtresini Tümü, Türkçe altyazı bulunamazsa seçeneğini Videoyu göster yapın. HLS kapalıysa online yayınlar görünmez.

Aynı yapım farklı bir aramada farklı sonuç verebilir. Boş liste her zaman uygulama hatası değildir: sağlayıcı erişilemiyor, dosya kaldırılmış veya kimlik eşleşmesi reddedilmiş olabilir.

## Yayınlar bulunuyor uzun sürüyor

Arama süresini en yavaş kaynak, dosya başlığı veya altyazı servisi etkileyebilir. 1.7.7 ile kaynak keşfi dosya/altyazı kontrollerini beklemeden devam eder; yanıt vermeyen altyazı kataloğuna ek hash istekleri açılmaz. HDHub bağlantı zincirinin kendi arama bütçesi vardır.

Nuvio iOS ağ çağrıları JavaScript zaman aşımıyla her zaman fiziksel olarak iptal edilemez. Bu yüzden 8 saniyelik bir kaynak bütçesi telefonun kesin 8 saniyede döneceği anlamına gelmez. Sürekli sorun çıkaran sağlayıcıyı ayarlardan kapatıp yeniden deneyebilirsiniz.

## İndirme düğmesi veya küçük dosya yok

Online HLS seçenekleri indirilebilir dosya değildir. Küçük MP4/MKV bulunması sağlayıcının o yapım için sunduğu dosyalara bağlıdır; büyük bir dosya eklenti tarafından küçültülmez. Desteklenen uzantısız MKV'ler için dosya köprüsü açık olmalıdır.

Bir dosyanın başlığı ve Range yanıtı çalışsa da bağlantı sonradan sona erebilir. İndirmeyi başlatmadan önce kaynak ekranını yeniden açmak yeni bağlantı alınmasını sağlar.

## Türkçe dublaj veya altyazı yok

Ses menüsünde yalnız kaynakta bulunan diller seçilebilir. Türkçe altyazı, Türkçe dublaj anlamına gelmez. TR altyazı yok yazıyorsa başka kaynak veya mevcut EN alternatifi denenebilir. Eklenti olmayan bir çeviri ya da seslendirme üretmez.

## Altyazı kayık veya Türkçe harfler farklı görünüyor

Önce daha güçlü eşleşen alternatif altyazıyı deneyin. Aynı filmde farklı kurgu ve fps senkronu etkileyebilir; otomatik sahne kaydırması yapılmaz. Bozuk UTF-8 dosyaları elenir, ancak iOS oynatıcı fontunun eksik glifleri eklentiyle değiştirilemez. [iPhone ve VLC seçenekleri](IPHONE_TURKCE_FONT.md).

## Hata bildirimi

[Hata formunu](https://github.com/burhanb3/nuvio-tr-hd/issues/new/choose) kullanın. Nuvio/eklenti sürümü, cihaz, yapım/yıl, sezon/bölüm ve gördüğünüz davranış yeterlidir. İsteğe bağlı Hata ayıklama özeti kaynak/adet/HTTP durumlarını verir. Kişisel katalog adresi, Cookie, Authorization, API anahtarı veya imzalı video bağlantısı paylaşmayın.
