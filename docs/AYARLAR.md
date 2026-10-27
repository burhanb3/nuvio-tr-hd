# Ayarlar

Ayarlar her sağlayıcı için ayrı saklanır. Yeni varsayılan değerler önceden kaydettiğiniz tercihi değiştirmez.

| Ayar | Başlangıç önerisi | Etkisi |
| --- | --- | --- |
| Otomatik arama | Açık | Yerleşik sağlayıcıları tarar. |
| En düşük doğrulanmış çözünürlük | Tümü | Ölçülen düşük çözünürlükleri de gösterir. |
| En fazla kaynak | 20 | Mevcut sonuçlar arasından gösterilecek üst sınır. |
| HLS alternatifleri | Açık | Online izleme kaynaklarını da gösterir. |
| Sıralama | Küçükten büyüğe | Kalite veya uygunluk sırası da seçilebilir. |
| İndirilebilir kaynakları önce göster | Açık | Dosyaları online yayınlardan önce tutar; seçilen sıra her bölümün içinde uygulanır. |
| Gruplama | Tercihe bağlı | Tür, kalite veya sağlayıcıya göre gruplar. |
| Türkçe altyazı bulunamazsa | Videoyu göster | Çalışan videoyu korur; TR altyazı yok yazar. |
| Altyazı eşleştirme | Dengeli | Güçlü eşleşmelerin yanında aynı yapıma ait alternatifleri sunar. |

## Kalite ve HLS

Ölçülen piksel yanında p etiketi yazılır. Dosya adındaki kalite, ölçülmüş kalite yerine geçmez. Bilgi eksikse en olası kaynak/bitrate ipucu kullanılır; tamamen dayanağı olmayan alan gizlenir.

HLS kalite seçeneği, ses ve altyazısı korunabiliyorsa ayrı satır olur. Ayrı ses grubu içeren bazı yayınlar otomatik master olarak kalır; mevcut köprü yeteneği doğrulanmadan sesi kaybeden video-only profil sunulmaz. 4K kaynakta yoksa üretilemez.

## Sağlayıcılar

Ana sağlayıcıda film/dizi dosya ve online kaynakları ayrı kapatabilirsiniz. Hızlı İzle, HDFilmDelisi, DiziBal ve Purstream için ayrı ayarlara sahiptir. Anime ve Ek Anime kendi ayarlarını kullanır. Kısmi kataloglar yalnız bazı yapım veya bölümlerde sonuç verir; diğer kaynaklarla birlikte açık tutulabilir.

RareFilmm, eski ve az bulunan filmler için ana sağlayıcıda varsayılan açıktır. Bazı dosyalardaki İngilizce yazı görüntüye işlenmiştir; EN görüntüde etiketi bunun içindir. Türkçe altyazı eşleşmesi veya Türkçe ses garantisi değildir.

Goojara film ve bölüm dosyaları da ana sağlayıcıda varsayılan açıktır. Küçük MP4 seçenekleri mevcut TR/EN altyazı aramasıyla sunulur. Kaynakta yanlış yıl, bölüm veya bozuk dosya varsa o sonuç atlanır; diğer sağlayıcıların sonuçları korunur.

HDRezka, farklı boyutlarda ücretsiz MP4 seçenekleri için varsayılan açıktır. Özgün ses veya açıkça Türkçe olarak belirtilen sürümler seçilir; diğer dublajlar TR diye etiketlenmez. Kaynağın ücretli kalite seçenekleri eklenmez. Dosyadaki gerçek piksel, oynatıcının kalite etiketinden önce gelir.

4KHDHub ayarı FSL ve Pixeldrain film/bölüm aramalarını birlikte yönetir. Uygun kayıtlarda 1080p/4K dosyalar ve gömülü Türkçe altyazılar bulunabilir. Pixeldrain dosyaları, MKV dosya köprüsü kapalıyken de doğrudan değerlendirilir; Nuvio'nun kayıt adı için aşağıdaki uzantısız MKV notu geçerlidir.

MoviesDrive ek film ve anime filmi indirmeleri varsayılan açıktır. Bu kaynak, gerçek ses ve dosya bilgisi doğrulanan seçenekleri sunar. Uzantısız MKV dosyaları Nuvio'da `.mp4` adıyla saklanabilir; dahili MPV bunları içerikten tanır. Dışarı aktarımda `.mkv` olarak yeniden adlandırmak gerekebilir. Bu kaynağı kapatmak diğer indirmeleri veya Hızlı İzle'yi kapatmaz.

MKV dosya köprüsü, desteklediği public uzantısız dosyalara doğru indirme adı sağlar. Bütün hostları desteklemez. Yeni kaynak aramaları için ayrı bir sunucu veya hesap kurmanız gerekmez.

JSON katalog, Stremio ve alternatif altyazı adresleri isteğe bağlıdır. Bunlar olmadan yerleşik arama çalışır. [Kişisel kaynak rehberi](KAYNAKLAR.md).
