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

Ana sağlayıcıda film/dizi dosya ve online kaynakları ayrı kapatabilirsiniz. Hızlı İzle, HDFilmDelisi, DiziBal, Purstream, FilmEkseni, KultFilmler ve DiziBox için ayrı ayarlara sahiptir. Anime ve Ek Anime kendi ayarlarını kullanır. Kısmi kataloglar yalnız bazı yapım veya bölümlerde sonuç verir; diğer kaynaklarla birlikte açık tutulabilir.

RareFilmm, eski ve az bulunan filmler için ana sağlayıcıda varsayılan açıktır. Bazı dosyalardaki İngilizce yazı görüntüye işlenmiştir; EN görüntüde etiketi bunun içindir. Türkçe altyazı eşleşmesi veya Türkçe ses garantisi değildir.

Goojara film ve bölüm dosyaları kendi bağımsız sağlayıcısında (Nuvio TR HD · Goojara) varsayılan açıktır. Küçük MP4 seçenekleri mevcut TR/EN altyazı aramasıyla sunulur. Kaynakta yanlış yıl, bölüm veya bozuk dosya varsa o sonuç atlanır; diğer sağlayıcıların sonuçları korunur.

FzTvSeries dizi bölüm dosyaları ana sağlayıcıda varsayılan açıktır. Küçük MP4 bölümler (çoğunlukla 360p–480p) sunar; IMDb ve tam bölüm tutmazsa sonuç eklenmez. Film aramaz.

FzMovies film dosyaları ana sağlayıcıda varsayılan açıktır. Küçük film dosyaları (genelde 360p MP4 ve 720p MKV) sunar; IMDb kimliği veya dosya adındaki yıl tutmazsa sonuç eklenmez. Dizi aramaz. Telefon benzetiminde açıkken MoviesDrive satırları daha seyrek çıktı; MoviesDrive'ın büyük dosyaları görünmüyorsa bu anahtar kapatılıp aynı film yeniden denenebilir.

CizgiMax Türkçe dublajlı çizgi dizi bölümleri (`cizgimaxEnabled`) kendi bağımsız sağlayıcısında (Nuvio TR HD · CizgiMax) varsayılan açıktır. Sitenin sunucusu çöktüğünde istek yanıtsız bekleyebiliyor ve iPhone bunu 60 sn bekliyor. Bu nedenle 2.0.2'de ana sağlayıcıdan ayrıldı: böyle bir durumda yalnız CizgiMax satırları gelmeyebilir, ana liste korunur. Ana sağlayıcıda önceden kaydedilmiş CizgiMax ayarı artık bir şey açmaz. Yalnız animasyon dizilerinde (anime hariç) aranır. Sitenin sezondaki bölüm sayısı TMDB ile aynı değilse sonuç eklenmez. `Türkçe altyazı bulunamazsa` ayarı `Videoyu gizle` ise, harici TR altyazısı bulunamayan dublaj bölümleri de diğer dublaj kaynaklarında olduğu gibi gizlenir.

CizgiMax online Türkçe dublaj (`cizgimaxOnlineEnabled`, 2.0.4) aynı sağlayıcıda varsayılan açıktır. Sitenin kendi oynatıcısındaki HLS akışını "Online" satırı olarak ekler. Bu satır yalnız izleme içindir, indirilemez. Ana liste ve bütün parçalar sitenin kendi alanlarında olmalı, bitmiş bölüm listesinin süresi TMDB bölüm süresine uymalıdır; TMDB süresi yoksa satır eklenmez. Site akışı bir bölüm ilk kez istendiğinde hazırlayabilir; online satır gelmezse kaynak listesinin başındaki yenile düğmesine basın. Nuvio 1.0.1 sonuç bulan aramayı 15 dk bellekte tutar; bu sürede ekranı kapatıp açmak yeniden taramaz. Akış sitenin ek bir alt alanından gelir. O alan yanıt vermezse iPhone isteği 60 sn bekleyebilir ve bu sağlayıcının Drive satırları da gelmeyebilir. Böyle bir sorun görürseniz bu ayarı kapatın: kapalıyken akışa hiç istek gitmez, Drive MP4 satırları aynen aranır.

HDRezka, farklı boyutlarda ücretsiz MP4 seçenekleri için kendi bağımsız sağlayıcısında (Nuvio TR HD · HDRezka) varsayılan açıktır. Kaynak her dosyayı sabit bir CDN düğümüne yönlendirir; bazı düğümler bağlantıya yanıt vermediğinde iPhone bu isteği 60 sn bekler. Bu nedenle ana sağlayıcıdan ayrıldı: böyle bir durumda yalnız HDRezka satırları gelmeyebilir, ana liste korunur. Ana sağlayıcıda önceden kaydedilmiş HDRezka ayarı artık bir şey açmaz. Özgün ses veya açıkça Türkçe olarak belirtilen sürümler seçilir; diğer dublajlar TR diye etiketlenmez. Kaynağın ücretli kalite seçenekleri eklenmez. Dosyadaki gerçek piksel, oynatıcının kalite etiketinden önce gelir.

4KHDHub ayarı FSL ve Pixeldrain film/bölüm aramalarını birlikte yönetir. Uygun kayıtlarda 1080p/4K dosyalar ve gömülü Türkçe altyazılar bulunabilir. Pixeldrain dosyaları, MKV dosya köprüsü kapalıyken de doğrudan değerlendirilir; Nuvio'nun kayıt adı için aşağıdaki uzantısız MKV notu geçerlidir.

MoviesDrive ek film ve anime filmi indirmeleri varsayılan açıktır. Bu kaynak, gerçek ses ve dosya bilgisi doğrulanan seçenekleri sunar. Uzantısız MKV dosyaları Nuvio'da `.mp4` adıyla saklanabilir; dahili MPV bunları içerikten tanır. Dışarı aktarımda `.mkv` olarak yeniden adlandırmak gerekebilir. Bu kaynağı kapatmak diğer indirmeleri veya Hızlı İzle'yi kapatmaz.

MKV dosya köprüsü, desteklediği public uzantısız dosyalara doğru indirme adı sağlar. Bütün hostları desteklemez. Yeni kaynak aramaları için ayrı bir sunucu veya hesap kurmanız gerekmez.

JSON katalog, Stremio ve alternatif altyazı adresleri isteğe bağlıdır. Bunlar olmadan yerleşik arama çalışır. [Kişisel kaynak rehberi](KAYNAKLAR.md).
