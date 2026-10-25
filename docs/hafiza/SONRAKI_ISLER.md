# Sonraki işler

**Güncel öncelik:** 1.3.0 GitHub Pages dağıtımı ve iPhone denemesi. Kullanıcı sa deposuna yazmayı yasakladı; yalnız yeni `burhanb3/nuvio-tr-hd` kullanılır. Eski Sites hesabı değiştiği için erişilemiyor, canlı sürüm 1.2.0. Worker yerelde hazır; üretim yayını yok. Doğrudan VixSrc, ortak servis kapalıyken çalışır.


İşlevsel teslimin dış bağımlılıkları:

- İsteğe bağlı kişisel JSON/Stremio adresleri; otomatik kaynak araması bunlara bağımlı değildir.
- Sites üzerinden HTTPS manifest yayını ve oturumsuz HTTP kontrolleri tamamlandı. Kaynak proje plugin-host/ ve kimlik .openai/hosting.json içindedir. Gelecek sürümleri aynı Site kimliğiyle güncelleyin. GitHub entegrasyonu 403 verdiğinden GitHub yayını yoktur.
- Full Android ve Full iOS cihazında `docs/UYUMLULUK.md` kontrol listesini gerçek dosyalarla yürütmesi.

İleride yapılabilecek geliştirmeler:

- Kullanıcının iPhone'unda 1.2.0 depo güncellemesi sonrası Dune HLS oynatımı/TR seçimi ve Spider-Man kaynak görünürlüğünü doğrulama. Önceki kapalı HLS ayarını elle açması gerekir. Telefonda indirme/senkron testi henüz yok.
- Öncelik: Dune dahil güncel filmler için erişilebilir, telefon için makul boyutlu bağımsız MP4/MKV sağlayıcıları. Mevcut Dune dosya CDN'i 403/429; Spider-Man'de bulunan 4K MKV yaklaşık 85,5 GiB. HLS sonucunu indirme başarısı diye sunmayın.
- Kullanıcının belirttiği yeni sağlayıcılar için ayrı, incelenebilir adaptörler; tek bir engellenen CDN'e bağımlılığı azaltma.
- Gerçek cihaz otomasyonu ve izinli küçük video örnekleriyle uçtan uca oynatma/indirme testleri.
- Nuvio upstream'de gerçek iptal, iOS sınırlı streaming okuma ve indirme yetenek alanı eklenirse bu desteğe geçiş.
- İhtiyaç oluşursa UTF-8 dışı altyazı dönüştürme, sürüm/fps ipuçları ve daha kapsamlı MP4/MKV parser desteği.

Hiçbir kayıt otomatik yeni görev, dış mesaj veya yayın yetkisi vermez. Bu dosya proje devamlılığı içindir.
