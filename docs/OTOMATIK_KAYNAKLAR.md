# Otomatik kaynak ve altyazı sistemi

**Güncel sürüm 1.5.0:** dizilerde PlayIMDb yıl filtresi ve VixSrc TV rotası düzeltildi, HDHub tek bölüm dosyaları ve AltyazıDB eklendi. Kısa başlık, küçükten büyüğe varsayılan sıra, kalite/gruplama seçenekleri var. Sesi birlikte gelen HLS ayrı kalite satırlarıdır; ayrı sesli HLS için profil servisi Sites erişimi olmadığı için yayımlanamadı ve otomatik master korunur. Aşağıdaki 1.4.0 notları tarihsel bağlamdır. [Yeni araştırma ve sınırlar](KAYNAK_ARASTIRMASI.md).


Sürüm 1.4.0 ile ek adres gerektirmeden arama yapılır. Önceki JSON/Stremio modülleri korunmuştur.

## Sağlayıcılar

| Sağlayıcı | Yöntem | Kapsam / sınır |
| --- | --- | --- |
| 4KHDHub / HubCloud | TMDB+JSON-LD kimliği, public kısa bağlantı, HubCloud/FSL, imzalı R2 GET | Film; doğru ad için dosya köprüsü, gerçek byte/piksel doğrulaması |
| VixSrc | Public API/embed/master, bağlı Türkçe VTT | Film; HLS profilleri ve yaklaşık aktarım boyutu, indirilemez |
| DahmerMovies | TMDB özgün başlık/yılından dosya dizini; her dosya adında kimlik/bölüm kontrolü | MP4/MKV; bazı ağlarda dosya CDN'i 403/429 döndürebilir ve elenir |
| Internet Archive | HD ipuçlu ve genel metadata araması; item metadata ve gerçek dosya listesi | Filmler; tam uzunluk için TMDB süresiyle karşılaştırma; fragmanlar elenir |
| PlayIMDb | TMDB ID ile API sorgusu; IMDb ve dosya adı kontrolü | Film/dizi; çoğunlukla HLS dönebilir, HLS açık varsayılanında online görünür |
| Kişisel JSON | Mevcut katalog adaptörü | Ek kaynak; zorunlu değil |
| Stremio | Mevcut meta/stream/subtitles adaptörü | Ek kaynak; zorunlu değil |

Arama örüntüleri için [All-in-One Nuvio](https://github.com/NuvioPlugin/All-in-One-Nuvio), özellikle [dizin sağlayıcısı](https://github.com/NuvioPlugin/All-in-One-Nuvio/blob/3f09a6ff4360498895e622877af7a32212f75038/providers/dahmermovies.js) ve [PlayIMDb sağlayıcısı](https://github.com/NuvioPlugin/All-in-One-Nuvio/blob/3f09a6ff4360498895e622877af7a32212f75038/providers/playimdb.js) incelendi. Dinamik kimlik sorgusu, dizin listeleme, birden çok dosya ve bağımsız hata yönetimi örüntüleri kullanıldı. Bu projede adaptörler yeniden yazıldı; obfuscate edilmiş uzak scriptler indirilip çalıştırılmaz. Upstream çalışma/başarı iddiaları bu projeye aktarılmaz.

Internet Archive için [resmî metadata API](https://archive.org/developers/metadata.html) kullanılır. HD arama ipuçları ve dosya metadata sırası yalnız ön elemedir; kalite etiketi gerçek video track boyutundan gelir. Büyük index veya sayfa gezintisi yapılmaz: en çok altı eşleşen item incelenir. İlk otomatik canlı kontrolde aynı başlığa sahip fragmanlar görüldüğü için süre filtresi eklendi.

Kaynakların tümü her filme sahip olmayabilir. Sunucu engeli, hız sınırı, başlık eşleşmesi yokluğu, dosya doğrulama hatası veya Türkçe altyazı bulunamaması durumunda sonuç eksilebilir. CAPTCHA/DRM çözme, özel servis anahtarı kopyalama ve kaynak scripti üzerinde kontrolsüz `eval` yoktur.

## Altyazı eşleştirmesi

Yerleşik servisler:

- [OpenSubtitles v3+](https://opensubtitles.stremio.homes/) Türkçe yapılandırması; AI çeviri kapalı. Uzaktan otomatik ayar kapalıdır; aranan mevcut altyazı dosyalarıdır.
- [Resmî OpenSubtitles v3](https://github.com/Stremio/stremio-official-addons/blob/master/index.json) yedeği.

İsteğe bağlı `subtitleUrls` ayarı bu yerleşik listeyi alternatif Stremio altyazı taban/manifest adresleriyle değiştirir. [Stremio altyazı sözleşmesindeki](https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineSubtitlesHandler.md) `videoHash`, `videoSize`, `filename` kullanılır. Video URL'si gönderilmez. Aynı filmde ortak sorgu ve altyazı gövdeleri önbelleğe alınır; farklı dosyalar için hash sorgusu ayrıdır.

OpenSubtitles hash'i dosya boyutu ile ilk ve son 64 KiB'nin 64-bit little-endian toplamından hesaplanır. Güvenilir range erişimi yoksa hash uydurulmaz. Farklı CDN'ye yönlenen aralıklarda dosya boyutuna ek olarak güçlü ETag eşitliği aranır.

| Puan | Eşleştirme | Gösterim |
| --- | --- | --- |
| 100 | Gerçek video hash'i | Dosya hash eşleşmesi |
| 95 | Tam normalize sürüm adı | Tam sürüm eşleşmesi |
| 90 | Kişisel/sağlayıcı kaydında video ile açıkça eşlenen altyazı | Kaynakla eşlenmiş |
| 74–85 | Aynı film/yıl, kaynak ailesi ve birden çok ortak sürüm ipucu | Sürüm benzerliği; senkron kontrolü önerilir |
| 65 | Aynı film/yıl ve gerçek video süresiyle altyazı son cue zamanının yakınlığı | Süre uyumu; senkron doğrulanmadı |
| 30–35 | Aynı film/yıl; varsayılan dengeli modda belirsiz alternatif | Film eşleşmesi; senkron belirsiz |

Süre kontrolünde altyazının son cue'su video süresinin %90–101 aralığında ve en çok 420 saniye farkla olmalıdır. Bu sadece bariz süre uyuşmazlıklarını eler; konuşmaların sahne sahne örtüştüğünü kanıtlamaz. Açık farklı yıl, bölüm veya kesim etiketi elenir. Hash/tam sürüm önceliklidir. Altyazı dili çıkışta ISO **`tr`** olur; `Turkish` metnini dil kodu olarak kullanmak Nuvio'nun otomatik seçimini bozabilir.

## Online ve çevrimdışı otomatik seçim

Plugin video sonucunun `subtitles` alanına en iyi eşleşmeyi ilk sıraya koyar. Nuvio plugin altyazılarını oynatıcının altyazı listesine taşır; tercih edilen dil Türkçe olduğunda otomatik seçer. Uygulama içi gömülü Türkçe track veya önceden kaydedilmiş manuel tercihler bu seçimi etkileyebilir. Plugin kullanıcının oynatıcı tercihlerini zorla değiştiremez.

Nuvio'nun indirme katmanı `sourceSubtitles` listesini video tamamlanınca indirir, SRT/VTT dosyalarını ve dili yerel manifestte saklar. Çevrimdışı oynatım bu yerel altyazıları kullanır. Altyazı indirme adımı tamamlanmadan bağlantıyı kesmeyin. Korunan/oturum başlığı isteyen altyazılar için native online yolun header aktarımı sınırlıdır; yerleşik servisler genel erişimli bağlantı döndürür.

Görsel/işitsel tam senkron ve telefonun çevrimdışı davranışı cihaz kabul testine tabidir. Proje telefon üzerinde otomatik açılmayı test etmiş gibi raporlamaz.

## Canlı doğrulama

```powershell
npm run test:live
npm run test:live:pipeline
# İsteğe bağlı başka referans filmi:
node scripts/test-live.mjs --matrix
```

Varsayılan referans `Night of the Living Dead` (1968), TMDB 10331'dir. Deneme metadata ve sınırlı byte range okur; tam video indirmez. Rapor kişisel medya URL'leri veya altyazı metni içermez, `.cache/live-report.json` içine yazılır. En az bir doğrulanmış video/Türkçe altyazı çifti yoksa başarısız döner. Bu kontrolün bütçesi daha geniştir; Nuvio TR HD'nin 24 saniyelik mantıksal sağlayıcı bütçesi normal testlerde ayrıca sınanır. Son gözlemler [uyumluluk raporundadır](UYUMLULUK.md).

`test:live:pipeline`, sabit TMDB referans metadatasıyla gerçek sağlayıcı akışını 24 saniyelik mantıksal telefon bütçesinde çalıştırır. Ortak servis/önbellek ve kaynak istekleri canlıdır. Varsayılanlar Tümü/20, Türkçeyi tercih et, HLS açık. `.cache/pipeline-live-report.json` raporu üretir; bu test canlı TMDB servisini sınamaz. Dune için `npm run test:live:pipeline -- --film=dune`, Spider-Man için `--film=spider-man` kullanılır. Ortak servisin arka plandaki kaynak taraması 13 saniye bütçelidir; başarılı public çiftler en çok üç dakika tutulur. [Servis mimarisi](../hosting/README.md).

## 1.4.0 zamanlama sınırı

Yakın süre dışında kalan aynı film alternatifinde son cue video süresinin %75–103 aralığında ise dengeli mod 35 puanla belirsiz seçenek sunabilir. Bu bir senkron ölçümü değildir. Otomatik kaydırma uygulanmadı. iOS AutoSync yok; [resmî açıklama](https://github.com/NuvioMedia/NuvioMobile/blob/cmp-rewrite/docs/subtitle-autosync.md). Üretim bulut taraması kaynaklardan 403 aldığı için varsayılan kapalı; telefonun public R2 dosyasını kaydettiği köprü ayrıdır. Ayrıntı [servis rehberinde](../hosting/README.md).
