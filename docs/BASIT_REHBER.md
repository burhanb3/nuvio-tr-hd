# Kurulum ve kullanım

## Depoyu ekleme

1. Plugin destekli Nuvio **Full** sürümünü açın.
2. **Pluginler → Depo ekle** alanına `https://burhanb3.github.io/nuvio-tr-hd/manifest.json` adresini yapıştırın.
3. Nuvio TR HD, Hızlı İzle, Anime ve Ek Anime sağlayıcılarını etkinleştirin.
4. Sağlayıcı ayarlarında çözünürlüğü **Tümü**, sonuç sınırını **20**, HLS'yi **açık** tutun.
5. Nuvio altyazı tercihinde Türkçe seçin; film veya bölümün kaynak ekranını açın.

Güncellemede depoyu yenileyin. Eski Sites adresindeki kopya da kuruluysa aynı kaynakların tekrarlanmaması için o kopyayı kapatın. Ayarlar sağlayıcıya göre ayrı kaydedilir; önceden seçtiğiniz 6/10 sınırı kendiliğinden 20 olmaz.

## Kaynak seçme

**İndirilebilir · Kaynak adı** gerçek MP4/MKV dosyasıdır. **Online · Kaynak adı** HLS yayınıdır. İkisi de izlenebilir; dosya indirme için indirilebilir etiketi olanı seçin.

Alt satırda kalite, piksel, GB, ses ve altyazı bilgileri bulunur. Örneğin `1080p · 1920×800 · 1,80 GB · Ses: EN · TR/EN altyazı`. Ses kodları ve altyazı kodları ayrı alanlardır. `TR altyazı yok` çalışan videoyu varsayılan olarak gizlemez.

Gerçek dosyada boyut byte olarak okunur. Online yayındaki GB, mevcut bitrate ve süreye göre hesaplanır; seçilen kaliteye göre gerçekleşen aktarım değişebilir. Hiç dayanağı olmayan bilgi gizlenir. Bir dosya adında 4K yazması, gerçek piksellerinin 4K olduğunun doğrulaması değildir.

## Dublaj ve altyazı

TR ses bulunan bir kaynağı seçtikten sonra oynatıcının ses menüsünden Türkçeyi seçebilirsiniz. Eklenti farklı bir ses dosyasını videoya birleştirmez.

Türkçe ve İngilizce altyazılar, varsa farklı sürüm alternatifleriyle sunulur. Önce hash veya tam sürüm eşleşmeleri, sonra benzer sürümler ve süre uyumu gelir. Bazı alternatiflerde elle gecikme ayarı gerekebilir; eklenti sahne senkronunu ölçüp otomatik kaydırma yapmaz.

İndirme ve altyazının çevrimdışı kullanılabilmesi Nuvio'nun indirme işleminin tamamlanmasına bağlıdır. Fiziksel iPhone'da tam video + TR/EN offline akışı bu projede henüz sınanmadı.

## Daha fazla seçenek veya daha hızlı arama

Kaynak ayarlarında gerekli sağlayıcıların açık olduğunu kontrol edin. Yalnız indirilebilir sonuç istiyorsanız HLS'yi kapatabilirsiniz; bu durumda online alternatifler görünmez. Kaliteye göre sıralamayı veya önce indirilebilir gruplamasını seçebilirsiniz.

Her yapım, bölüm ve kalitede kaynak bulunacağı garantisi yoktur. 20 ayarı liste üst sınırıdır. Bölgesel engel, silinmiş dosya ve sağlayıcının ağ durumu sonucu değiştirebilir. [Sorun giderme](SORUN_GIDERME.md) · [Ayarlar](AYARLAR.md).
