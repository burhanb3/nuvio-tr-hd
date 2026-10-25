# Tasarım kararları

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
