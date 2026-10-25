# Nuvio TR HD çalışma notları

Bu projenin amacı filmi seçince gerçek sağlayıcıları otomatik taramak, doğrulanmış MP4/MKV ve her dosyaya uygun mevcut Türkçe altyazı alternatiflerini sıralamaktır. Kişisel JSON/Stremio desteği ek kaynak olarak korunur.

- İşe `docs/hafiza/PROJE.md`, `docs/hafiza/KARARLAR.md` ve `docs/hafiza/SONRAKI_ISLER.md` okuyarak başlayın.
- Güncel plugin ABI kanıtları `docs/UYUMLULUK.md` ve `compatibility/upstream-lock.json` içindedir. Eski React Native manifest örneklerini esas almayın.
- Uygulamanın yüklediği dosya `providers/nuvio-tr-hd.js` üretilmiştir; `src/` düzenleyip `npm run build` çalıştırın.
- Gerekli son doğrulama `npm run check`. ABI değişikliğinde `npm run verify:upstream` da çalıştırın. Upstream kilidini incelemeden güncellemeyin.
- Kaliteyi dosya adından doğrulanmış göstermeyin. HLS'yi doğrudan indirilebilir etiketlemeyin. Yabancı/yanlış kimlikli altyazıyı birleştirmeyin.
- Nuvio clearTimeout native sleep'i iptal etmez; quickjs-kt native işleri tüketir. Uzun setTimeout kurmayın; src/scheduler.cjs kullanın. Mantıksal zaman aşımını fiziksel iPhone dönüş süresi garantisi olarak sunmayın.
- Kullanıcı adreslerini, erişim başlıklarını ve anahtarları commit etmeyin. Örneklerde yalnız yer tutucu URL'ler kullanın.
- Fiziksel cihaz, tam film oynatımı ve indirme testi çalıştırılmadıysa bunu açıkça yazın; kaynak/QuickJS testini cihaz testiyle eş tutmayın.
- İş bitiminde hafıza ve değişiklik günlüğünü gerçek duruma göre güncelleyin. Kullanıcı talimatları bu notlara göre önceliklidir.
