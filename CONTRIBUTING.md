# Katkı rehberi

Hata bildirimi, kaynak önerisi ve kod katkıları kabul edilir. Küçük ama sağlam çalışan bir kaynak da değerlidir; bütün kataloğu kapsaması gerekmez.

## Yerel kurulum

Node.js 22+ ile `npm ci --ignore-scripts` çalıştırın. Kaynak kodu `src/` altında düzenleyin; `npm run check` paketi üretir ve testleri çalıştırır. Üretilmiş `providers/` dosyalarını kaynak koduyla birlikte güncelleyin.

## Sağlayıcı ekleme

Adaptör yalnız adayları bulur; dosya ve altyazı kontrolleri ortak akışta kalır. TMDB/özgün ad/yıl ve dizide tam sezon/bölüm eşleşmesi gerekir. Yanlış yapım, ilk bölüm fallback'i ve HTML dosyası kabul edilmez. HLS indirilebilir MP4/MKV diye sunulmaz. Kaynak etiketleri gerçek piksel/byte ölçümü yerine kullanılmaz.

Yeni davranışı sınayan bir örnek ekleyin: doğru eşleşme, yanlış kimlik/bölümün reddi ve bozuk kaynakta diğer sonuçların korunması. Gerçek kaynak kontrolü yaptıysanız küçük metadata/Range okumalarını, tam oynatımı ve fiziksel cihaz testini ayrı belirtin. Fixture veya QuickJS sonucu cihaz testi değildir.

Yeni backend, hesap veya gömülü üçüncü taraf API anahtarı gerektiren değişikliği önce bir issue'da açıklayın. Kişisel URL, erişim başlığı, anahtar ve imzalı dosya bağlantılarını commit etmeyin. Örneklerde yer tutucu adresler kullanın.

## Değişiklik gönderme

PR açıklamasında kullanıcıya etkisini ve doğrulamayı yazın. ABI değişikliğinde upstream kilidini inceleyip `npm run verify:upstream` çalıştırın. Sürüm değişikliğinde manifest/paket/scraper sürümleri aynı olmalıdır. İlgili kullanıcı belgesini ve `CHANGELOG.md` dosyasını güncelleyin.

[Mimari ve geliştirme ayrıntıları](docs/GELISTIRME.md) · [Nuvio uyumluluğu](docs/UYUMLULUK.md).
