# Dosya köprüsü ve deneysel ortak servis

1.4.0 public köprü: https://nuvio-tr-hd-download-bridge.kamilbsr03.chatgpt.site . Kurulum/kod hâlâ https://burhanb3.github.io/nuvio-tr-hd/manifest.json üzerinden gelir. Eski hayatimbitmiss Sites projesiyle karıştırmayın.

## Varsayılan akış

1. Telefon Nuvio TMDB anahtarıyla kanonik kimliği çözer; gerçek sağlayıcı sayfalarını kendisi arar. HDHub sayfasındaki TMDB + JSON-LD özgün başlık/yıl kontrol edilir.
2. HDHub → public kısa bağlantı → HubCloud → FSL/R2 zinciri imzalı public GET dosya adresi verir. Bu adresler çoğunlukla uzantısızdır; Nuvio böyle bir MKV’yi MP4 adıyla kaydedebilir.
3. /api/files POST’a yalnız kanonik metadata ve en çok üç public R2 adresi/dosya adı gönderilir. Kişisel katalog/addon adresi, TMDB anahtarı, Cookie/Authorization gönderilmez. R2 hostname + AWS imzası biçimi sınırlandırılır; keyfi URL proxy'si değildir.
4. Worker sınırlı GET Range ile gerçek konteyner/boyutu doğrular. Bu URL için HEAD imzayı bozabildiğinden kullanılmaz. Doğrulanan nesneye /files/SHA256.mkv veya .mp4 adresi verir. Telefon da gerçek konteyneri kontrol eder.
5. Köprü GET 307 ile dosya sunucusuna yönlendirir; HEAD doğrulanmış Content-Length/MIME döner. Dosya adı Nuvio'ya doğru uzantıyla ulaşır. Tam video kaynak sunucudan gelir; burada saklanmaz/proxy'lenmez.

Kayıt en çok altı saat ve gerçek imzanın kalan ömrü kadar Map/Cache API'de tutulur. Bu kalıcı depolama değildir; cache silinirse veya kayıt eskirse 410 döner, yeniden kaynak aranmalıdır. İndirme başladıktan sonraki bağlantı doğrudan kaynaktadır.

## Tam ortak tarama neden kapalı?

/api/discover ve /hls/vix/...m3u8 deneysel kod olarak korunur. Ancak üretim Worker IP'sinden HDHub ve PlayIMDb 403; VixSrc boş sonuç verdi. Bilgisayardaki aynı aramalar çalıştı. Bu nedenle hostedDiscovery varsayılan kapalıdır; Nuvio ayarına önerilen açık servis diye sunulmaz. Köprünün dosyaya erişebilmesi, sağlayıcı sayfasını tarayabilmesiyle aynı şey değildir. Boş servis yanıtı doğrudan aramayı durdurmaz.

## Kaynak ve yayın

Kimlik download-bridge/.openai/hosting.json içinde: appgprj_6ade5021d6b88191818ece53a5d5f1e0. Aynı Site kimliğini koruyun. Worker kaynak dosyası hosting/worker.mjs; src/ ortak modülleri kullanılır. Sites Worker ESM düzeni dist/server/index.js + dist/.openai/hosting.json. Script Windows Node/esbuild ile aynı düzeni üretir.

```powershell
npm run check
# src/ ve hosting/worker.mjs dosyalarını mevcut download-bridge checkout'una kopyala.
node scripts/build-host.mjs download-bridge
npm run test:live:bridge
```

Source helper açma → aynı kimlikle exact commit push/arşiv → saved version → deploy akışı kullanılır. Gizli bilgiler yalnız stdin; public repoya kayıt/token konmaz. Son native yayın ve sınırlı ağ doğrulama kanıtı compatibility/download-bridge-publication.json içinde tutulur.

## Senkron ve cihaz sınırı

Bu köprü ses/altyazı senkronu ölçmez. Nuvio plugin ABI’sinde offset yok. iOS otomatik senkron motoru uygulanmadı. Tam video/indirme, codec ve uçak modunda Türkçe seçim testi fiziksel iPhone'da yapılmadı. 24 saniye JS bütçesi native iPhone dönüş garantisi değildir.

Geçici kayıt kaybolduğunda bağlantıdaki public imzalı kaynak parametresi kullanılır: SHA-256 yoluyla eşleşmeli, izinli R2/signature biçimi ve gerçek konteyner yeniden doğrulanmalıdır. Böylece cache silinmesi tek başına linki bozmaz; imzanın sona ermesi hâlâ yeniden arama gerektirir. Ephemeral URL içeren tam linkler rapora/commit’e konmaz.
