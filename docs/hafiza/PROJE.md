# Proje hafızası

Son güncelleme: 25 Ekim 2026. Geliştirilen sürüm: **1.4.0**. Kullanıcı **yalnız ücretsiz ve hesapsız** kaynak istedi. Kendi film/bölüm seçimiyle otomatik çoklu kaynak, gerçek MP4/MKV, Türkçe mevcut SRT/VTT, online/çevrimdışı birlikte sunma hedefi sürer. Telefon iPhone; test filmi Dune (2021). JSON/Stremio ek kaynak olarak korunur. Varsayılan Tümü/20/HLS açık, TR tercih et, dengeli altyazı eşleşmesi.

## Yetki ve dağıtım

- Kullanıcı **sa deposuna yükleme, adıyla yeni aç** dedi. Yalnız https://github.com/burhanb3/nuvio-tr-hd kullanılır; burhanb3/sa'ya yazılmadı.
- Yerel/uzak varsayılan dal codex/publish-nuvio-tr-hd. Manifest https://burhanb3.github.io/nuvio-tr-hd/manifest.json . **1.4.0 yayımlandı:** kod commit'i 1d7ca3d630a63bd30879f8872e735616eb05ec2b. Windows/Linux Actions 40225594715 ve Pages 40225594674 başarılı; oturumsuz manifest/provider/sayfa HTTP 200 ve yerel SHA eşitliği compatibility/github-publication.json ile kanıtlı.
- Eski Sites projesi appgprj_6ade23835f7c81919a2a9bb960abd631, plugin-host/, hayatimbitmiss adresi 1.2.0'da kaldı. Hesap değişti, NOT_FOUND; aynı eski Site'ı yeniden oluşturmaya çalışmayın.
- **Ayrı dosya köprüsü**: appgprj_6ade5021d6b88191818ece53a5d5f1e0, download-bridge/.openai/hosting.json; https://nuvio-tr-hd-download-bridge.kamilbsr03.chatgpt.site . Public erişim. Kimliği koruyun, yeniden create_site çağırmayın. Yayın kanıtı compatibility/download-bridge-publication.json içinde tutulmalıdır.
- Credential Manager mevcut burhanb3 oturumuyla Git push/API çalıştı. Token yalnız çocuk süreç belleğinde; komut satırına/dosyaya/günlüğe yazmayın. Sites credential gizli stdin ile verilir.

## 1.4.0 gerçek durum

- HDHub kanonik TMDB + JSON-LD başlık/yıl doğrulaması → public kısa bağlantı → HubCloud → FSL/R2 akışı kendi kodumuzla eklendi. CAPTCHA/DRM/uzak eval yok. Yalnız filmler. İlk üç küçük aday incelenir.
- İmzalı GET URL’sinde HEAD 403 beklenebilir. HEAD atlanır, sınırlı GET Range ve konteyner doğrulanır. Normal engelli HEAD'e tekrar yüklenilmez.
- Bilgisayarda canlı Spider-Man: 2.830.708.974 byte, 1920×800 MKV; ayrıca yaklaşık 8,28 ve 10,40 GB MKV. Dune HDHub zinciri indirilebilir dosya vermedi. Bu gözlem kalıcı erişim garantisi değildir.
- Bulut sunucusundan HDHub/PlayIMDb 403, VixSrc boş dönüyor. **Tam ortak tarama varsayılan kapalı** kalır. Kaynaklar telefondan aranır; köprü yalnız telefonun bulduğu public imzalı R2 dosyasını tekrar doğrulayıp dosya adını koruyan yönlendirme kaydeder. Public dosya URL’si ve kanonik metadata köprüye gider; kişisel kataloglar/anahtarlar gitmez.
- Köprü GET 307 ile kaynağa yönlendirir; tam video saklamaz/proxy’lemez. HEAD doğrulanmış boyut/MIME döner. Geçici kayıt en çok 6 saat/gerçek imza süresi; cache yoksa URL'deki public kaynak parametresiyle yeniden doğrulanır. İmza eskirse 410 ve yeniden arama gerekir. Cache kalıcı veritabanı değildir.
- HLS listesi gerçek çözünürlük profillerini, EXTINF süresini ve bitrate bazlı yaklaşık aktarım boyutunu sunar. Bu gerçek dosya boyutu/piksel doğrulaması değildir. HLS asla indirilebilir olmaz.
- Dengeli altyazı modu aynı film/yıl alternatiflerini belirsiz etiketle sunar; yanlış kimlik/dil/yıl/kurgu hâlâ reddedilir. Geçersiz bir altyazı diğer geçerli altyazıları çökertmez.
- **1 saniye otomatik düzeltme uygulanmadı.** Plugin ABI’sinde offset yok. Nuvio AutoSync yalnız Android dahili ExoPlayer ve kullanılabilir gömülü referans altyazı yolunda; iOS'ta yok. Zaman farkını ölçmeden rastgele kaydırmayın. Gelecek ayrı servis audio/VAD veya güvenilir zamanlı referans ve dönüştürülmüş VTT/SRT gerektirir.

## Uyumluluk ve test sınırları

Nuvio 0.6.4-beta; kilitli 19 dosya güncel cmp-rewrite HEAD 56ae37081afaff820b6073da84e711320238de36 üzerinde aynı bulundu. Kilit yalnız inceleyerek güncellenir. npm run check ve npm run verify:upstream çalıştırılır. Node ve gerçek QuickJS WASM, Kotlin/telefon testi yerine geçmez. Fiziksel iPhone, tam film oynatma/indirme ve çevrimdışı altyazı testi henüz yapılmadı. Kullanıcı önceki küçük Spider-Man MP4 + üç TR altyazının açıldığını/senkron göründüğünü bildirdi; yeni sürüm testi sayılmaz.

Nuvio clearTimeout native sleep'i iptal etmez; src/scheduler.cjs en çok 100 ms uyku bırakır. 24 saniyelik JS bütçesi gerçek iPhone dönüş garantisi değildir. Native fetch bütün gövdeyi tamponlayabilir ve AbortSignal'ı aktarmayabilir.

**1.4.0 son canlı kanıt:** public köprü kayıt → HEAD 200 / 2.830.708.974 byte → GET Range 206 / gerçek 1920×800 MKV; tekrar üç kayıt başarılı. Source discovery bilgisayardan, köprü üretimden sınandı. Tam Spider-Man sağlayıcı akışı yaklaşık 13,25 saniyede 10 alternatif ve Türkçe VTT verdi. Raporlar compatibility/download-bridge-live-140.json ve pipeline-spider-man-140.json. Bunlar iPhone/tam film indirme testi değildir.

Geçici kayıt kaybolduğunda bağlantıdaki public imzalı kaynak parametresi kullanılır: SHA-256 yoluyla eşleşmeli, izinli R2/signature biçimi ve gerçek konteyner yeniden doğrulanmalıdır. Böylece cache silinmesi tek başına linki bozmaz; imzanın sona ermesi hâlâ yeniden arama gerektirir. Ephemeral URL içeren tam linkler rapora/commit’e konmaz.
