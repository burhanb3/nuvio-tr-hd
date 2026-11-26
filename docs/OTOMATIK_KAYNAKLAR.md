# Kaynaklar ve arama akışı

## Yerleşik sağlayıcılar

| Sağlayıcı | Alan | Sonuç türü |
| --- | --- | --- |
| Internet Archive | Film/dizi | MP4/MKV; kimlik ve dosya kontrolüne bağlı |
| 4KHDHub / HubCloud | Film/dizi | FSL/Pixeldrain MP4/MKV; uygun kayıtlarda 1080p/4K |
| Goojara (bağımsız sağlayıcı) | Film/dizi | Küçük MP4 alternatifleri; bölüm ve gerçek dosya kontrolü |
| FzTvSeries | Dizi | Küçük MP4 bölümler (çoğunlukla 360p–480p); IMDb, tam bölüm ve gerçek dosya kontrolü |
| FzMovies | Film | Küçük MP4 (çoğunlukla 360p) ve 720p MKV; IMDb, dosya adı/yıl ve gerçek dosya kontrolü |
| HDRezka (bağımsız sağlayıcı) | Film/dizi | Ücretsiz MP4 kaliteleri; özgün ses, IMDb ve bölüm kontrolü |
| MoviesDrive / Pixeldrain | Film, anime filmi ve doğrulanabilen dizi bölümleri | Ek MP4/MKV; gerçek boyut, piksel, süre ve ses kontrolü |
| Waploaded | Film/dizi | MP4/MKV; son güncellenen kısmi katalog |
| CizgiMax (bağımsız sağlayıcı) | Animasyon dizileri (anime hariç) | Türkçe dublajlı MP4 bölümler (sitenin Drive sunucusu); ad, ilk yayın yılı, sezon bölüm sayısı ve gerçek dosya kontrolü; kısmi kapsam |
| RareFilmm | Eski/az bulunan filmler | Küçük MP4 alternatifleri; bazı sürümlerde EN görüntüde |
| PlayIMDb, VixSrc | Film/dizi | Online HLS |
| DiziYou, DiziBak | Dizi | Genellikle online HLS |
| FilmModu, HDFilmDelisi | Film | Dublaj/altyazılı online alternatifler |
| DiziBal | Film/dizi/anime | Dublaj/altyazılı online HLS |
| Purstream | Film/dizi | Ek online HLS; oynatma listesindeki sesler ve harici TR/EN altyazılar |
| FilmEkseni | Film | Online HLS; kaynakla eşlenmiş TR/EN altyazı ve mevcut ses izleri |
| KultFilmler | Film | Online HLS; altyazılı ve ayrı Türkçe dublaj seçeneği, oynatıcıyla eşlenmiş TR altyazı |
| DiziBox | Dizi | Online HLS; sitenin "Türkçe altyazılı" etiketi (ayrı altyazı izi yok, görüntüye işlenmiş olabilir; doğrulanmadı) |
| Anizone (Ek Anime, isteğe bağlı, varsayılan kapalı) | Anime dizilerinin ilk sezonu | Online HLS; tam bölüm doğrulaması ve mevcut altyazı araması |
| Animecix, SonAnime | Anime | Gerçek dosya seçenekleri |
| SeiCode (tau-video / MP4Upload); AniMOM isteğe bağlı, varsayılan kapalı | Anime bölümleri (Ek Anime) | Ek, kısmi MP4 kaynakları; SeiCode çoğunlukla son sezonları taşır |

Liste çalışan bütün katalog garantisi değildir. Kaynağın bir bölümde çalışması diğer bölümde çalışacağını göstermez. Yalnız embed sayfası, HTML hata yanıtı veya HLS bulunan sonuç yeni bir indirme dosyası sayılmaz.

## Seçimden sonuca

1. TMDB kimliğinden özgün ad, yıl, IMDb ve bölüm bilgisi alınır.
2. Uygun sağlayıcılar sınırlı paralellikle aranır. Türkçe katalog adı gerekiyorsa aynı TMDB kimliğinin TR/EN çeviri adları istenir.
3. Adaylar bulunur bulunmaz dosya/oynatma listesi kontrol kuyruğuna geçer. Bu kuyruk kaynak keşfini bekletmez.
4. MP4/MKV byte aralıkları ve konteyner başlığı okunur. HLS'de gerçek oynatma listesi ve mevcut kalite/dil izleri incelenir.
5. Mevcut TR/EN altyazılar kimlik, bölüm, sürüm, hash ve süreye göre eşleştirilir; gövdeleri doğrulanır.
6. Aynı dosya aynaları birleştirilir; kullanıcı sırası ve gruplamasına göre sunulur.

İndirme önceliği varsayılan açıktır. Küçük boyutlu HLS satırları, büyük indirilebilir dosyaları 20 sonuç sınırının dışına itmez. Dosyalar ve online yayınlar kendi içinde seçilen sırayla gösterilir; karışık sıralama için bu ayar kapatılabilir.

4KHDHub, terminal sayfasında yayımlanan FSL ve Pixeldrain bağlantılarını ayrı değerlendirir. Filmde TMDB kimliği/ad/yıl; dizide kanonik ad/yıl/poster ve tam sezon/bölüm kontrol edilir. Dosya sunucusunun adı, boyutu ve formatı gerçek medya verisiyle karşılaştırılır; uygun ses ve süre aranır. Kaynakta gömülü TR/EN varsa dosyayla birlikte gelir; mevcut harici altyazı alternatifleri de sunulur. Yeni Pixeldrain yolu için adlandırma servisi veya hesap gerekmez. Eski ayna yavaşsa yeni dosyanın kontrolü onu beklemez; toplam arama bütçesi aynı kalır.

Internet Archive, aynı TMDB film kaydındaki özgün ve gösterim adlarını birlikte arar. Yıl alanı olmayan kayıtlarda tam ad/yıl içeren arşiv kimliği de aranır; aynı ad/yılın dosyada bulunması ve gerçek sürenin uyuşması gerekir. Bu, Japonca özgün adı olan bir filmin İngilizce başlıkla yayımlanan dosyalarını da bulmasını sağlar. Türkçe ve özgün adı birlikte içeren film sürümlerini de arar. Ayrı yıl alanı yoksa kayıt başlığı ve dosya adında aynı özgün ad/yıl aranır; gerçek video süresi ayrıca denetlenir. Yerel adın farklı olması yanlış kimlik/yıl kabulüne yol açmaz. İngilizce kimlikli bir kayıtta dosya resmî Türkçe adıyla saklanmışsa aynı TMDB kaydının çeviri adları gerektiğinde istenir. Mevcut İngilizce dosyalar bu alternatifleri gizlemez. Küçük MP4 türevleri ve HD MKV asılları birlikte değerlendirilir; gerçek ses izleri okunamadığında dosya adındaki dil, doğrulanmış dublaj kanıtı sayılmaz. Bu yol genel film aramasını geliştirir; dizi kuralları değişmez. Yalnız Hintçe ses dosyadan doğrulanırsa o kaynak ve açıkça ondan türetilmiş, sesi okunamayan sürümler listelenmez. Türevde başka dil gerçekten ölçülmüşse korunur.

RareFilmm bütün film kataloğunu kapsamaz. Genel aramada tam başlık/yıl, makale içindeki oynatıcı, oynatıcının kendi film kimliği/başlığı ve süre denetlenir. Kalite başına gerçek MP4 boyutu ve pikseli okunur. EN görüntüde etiketi, silinemeyen İngilizce altyazı bulunduğunu belirtir; mevcut harici TR/EN dosyaları ayrıca sunulur. Yeni bir sunucu veya hesap gerekmez.

Goojara, kendi bağımsız sağlayıcısında film ve bölüm dosyaları arar. Tam başlık/yıl, filmlerde IMDb, dizilerde seçilen sezon listesi ve bölüm sayfası birlikte denetlenir. Dosya adındaki 720p/1080p etiketi ölçülen pikselin yerine geçmez. Kaynak bir dosyayı HCSubs gibi sabit altyazı işaretiyle sunuyorsa kartta Sabit altyazı yazılır; dili bilinmeden EN/TR diye etiketlenmez. Sunucuya ve bölüme göre erişim değişebilir; her yapım veya 4K garantisi değildir.

FzTvSeries yalnız dizi bölümleri arar. Arama kartındaki ad, dizi sayfasındaki tek IMDb kimliği, sezon bağlantısı, tam SxxEyy bölüm kartı ve dosya adındaki bölüm birlikte tutmalıdır. Bölüm sayfasının verdiği anonim oturum yalnız aynı sitedeki indirme sayfasında kullanılır; video adresi oturum taşımaz. Site aynı dosyayı iki sunucuda listeler; ilki açılmazsa aynı yol ve aynı alan adındaki ikincisi denenir. İndirme bağlantıları kaynağa göre yaklaşık 12 saat geçerlidir. Çözünürlük dosyadan okunur; eski bölümlerin sunucuları kapalı olabilir. Her dizi veya bölüm garantisi değildir.

FzMovies yalnız filmler için arar. Arama kartındaki ad yalnız aday seçer; film sayfasındaki tek IMDb kimliği hedefle aynı olmalı ve dosya adında başlığın hemen ardından aynı yıl gelmelidir. Dublajlı sayfalar açılmaz. Sayfanın anonim oturumu yalnız aynı sitedeki indirme sayfalarında kullanılır; video adresi oturum taşımaz. Site aynı dosyayı üç sunucuda listeler; ilki açılmazsa aynı yol ve aynı alan adındaki diğerleri denenir. Çözünürlük ve süre dosyadan okunur; dosya adındaki 720p etiketi doğrulama sayılmaz. İndirme bağlantıları kaynağa göre yaklaşık 12 saat geçerlidir. Her film garantisi değildir.

CizgiMax yalnız animasyon dizilerinde (TMDB'de Animasyon türü; Japonca anime hariç) aranır. Arama sonucundaki Türkçe veya alternatif ad ile dizi sayfasındaki ad ve ilk yayın yılı TMDB kaydıyla aynı olmalıdır. Sitenin o sezonda listelediği bölüm sayısı, TMDB'de yayınlanmış bölüm sayısıyla birebir aynı olmalıdır. Birçok çizgi dizi TMDB'de yarım bölümler halinde numaralandığı için (ör. SpongeBob) bu diziler eklenmez. Bölüm sayfasının kendi sezon/bölüm bilgisi de tutmalıdır. Yalnız sitenin "Drive" dublaj sunucusu okunur. Dosya Google Drive'ın herkese açık indirme adresinden alınır; hesap veya çerez gerekmez. Drive'daki dosya adı `.mp4` ile bitmeli ve parça ("Part") olmamalıdır; `.ts` gibi başka biçimler eklenmez. Çözünürlük ve süre dosyadan okunur. Türkçe ses sitenin dublaj listesine dayanır; dosyada dil etiketi yoktur. CizgiMax 2.0.2'den beri ayrı sağlayıcıdır: sitenin sunucusu çöktüğünde istek yanıtsız kalabilir, iPhone bunu 60 sn bekler ve yalnız bu sağlayıcının satırları düşer.

HDRezka'da aynı IMDb, kanonik başlık ve yıl birlikte aranır. Farklı başlık gerekiyorsa yalnız aynı TMDB kaydının alternatif başlıkları kabul edilir. Dizilerde seçilen ses sürümünün kendi bölüm listesinde tam sezon ve bölüm bulunmalıdır. Hesap, kullanıcı çerezi veya yeni sunucu gerekmez. Ücretli işaretli kalite ve kısa örnek videolar atlanır; ücretsiz 4K bulunduğu varsayılmaz. Mevcut TR/EN altyazı araması dosya bazında devam eder. HDRezka 1.9.8'den beri ayrı sağlayıcıdır: dosyanın yönlendirildiği CDN düğümü yanıt vermezse iPhone isteği 60 sn bekler ve yalnız bu sağlayıcının satırları düşer.

MoviesDrive'da tam film adı/yıl, varsa IMDb ve dosyanın kendi adı birlikte denetlenir. Gerektiğinde aynı TMDB kaydının resmî alternatif başlıkları kullanılır; franchise öneki veya benzer başlık tek başına eşleşme sayılmaz. Yayımlanmış indirme bağlantısından Pixeldrain'in public dosya bilgisine gidilir; erişim kısıtlıysa sonuç atlanır. Gerçek byte boyutu, video pikseli, süre ve ses parçaları okunur. Sadece HI sesi bulunan dosyalar eklenmez; TR/EN veya yapımın Hintçe dışındaki özgün sesi aranır. Dört sürüm için küçük, 1080p ve yüksek kalite dengesi kullanılır; kaynak etiketleri doğrulanmış kalite sayılmaz.

Uzantısız MKV'lerde Nuvio'nun `.mp4` kayıt adı gerçek formatı değiştirmez. Dahili MPV içerikten tanır; sonuçtaki tür MKV olarak korunur. Bu istisna yalnız boyutu/formatı ayrıca kontrol edilen kaynak adaylarına açıktır. Genel katalog format kontrolleri ve HLS indirme yasağı korunur. Telefon dışında açarken dosyayı `.mkv` olarak yeniden adlandırmak gerekebilir. Yeni sunucu veya hesap gerekmez.

Hızlı İzle, HDFilmDelisi, DiziBal, Purstream, FilmEkseni, KultFilmler ve DiziBox kaynaklarını bağımsız tarar; ana sağlayıcıda aynı işler tekrarlanmaz. Eski üç sağlayıcının kimlikleri korunur. Ana sağlayıcıdaki PlayIMDb/VixSrc ve diğer online yollar çalışmaya devam eder; HDFilmDelisi Hızlı İzle grubundadır.

Purstream aynı TMDB kimliği, tür, yıl ve resmi başlıkla eşleşir. Fransızca katalog adı gerekiyorsa aynı TMDB kaydının çevirileri kullanılır. Dizinin genel sayfasındaki karışık bölüm bağlantıları yerine istenen sezon/bölüm yanıtı ve video yolu birlikte kontrol edilir. Kaynağın 1080p/1440p etiketi kullanılmaz; gerçek HLS çözünürlüğü ve dil izleri esas alınır. Bu kaynak online alternatif sağlar; yeni indirme, Türkçe dublaj veya 4K garantisi değildir.

Nuvio her scraper tamamlandığında sonuçlarını birleştirir. Eklenti içinde hazır adayların korunması, Nuvio'ya satır satır canlı sonuç callback'i eklendiği anlamına gelmez.

MoviesDrive sonraki sezonlarda aynı TMDB kaydının sezon yılını ve istenen bölümün süresini ayrıca doğrular. Dizinin ilk yayın yılı korunur; kaynak sayfasının sezon yılı kanonik sezonla eşleşmelidir. Arama ve sayfada aynı IMDb/seri adı; arşivde istenen bölüm ve dosyada tam sezon/bölüm birlikte denetlenir. Eksik sezon metadata’sıyla sonuç eklenmez. Aynı sınırlı bağlantı planında ayrı bir ikinci 4K sürümü de kontrol edilebilir. ZIP paketleri sunulmaz. Kaynakta yalnız İngilizce/Hintçe varsa Türkçe dublaj etiketi verilmez; mevcut harici Türkçe altyazılar ayrıca eşleştirilir.

## Kapsam ve sınırlar

720p/1080p/4K gibi bir kalite ancak kaynakta varsa sunulabilir. Dosya adındaki etiket, doğrulanmış piksel sayılmaz. HLS'de gerçek dosya boyutu yoktur; aktarım hesabı kullanılır. Ayrı ses grubu olan master'ın video parçasını tek başına sunup sesi kaybetmeyiz.

Yanlış film, yıl veya bölüm eşleşmesi kabul edilmez. Bir sağlayıcı bozulduğunda diğer geçerli sonuçlar korunur. Ücretsiz/hesapsız kaynaklar tercih edilir; torrent/magnet, ayrı ses birleştirme ve yeni kullanıcı sunucusu kurulumu bu projenin akışı değildir.

Kaynak testi, fiziksel telefonun tam oynatma/indirme ve offline senkron testi yerine geçmez. [Doğrulama](UYUMLULUK.md) · [Geliştirme](GELISTIRME.md).

FilmEkseni yalnız aynı film/yıl/IMDb ve oynatıcı bağı doğrulandığında HLS sunar. KultFilmler'de arama kartındaki özgün ad ve yıl eşleşmeli, oynatıcının bildirdiği IMDb kimliği de aynı olmalıdır. İngilizce olmayan filmler sitede İngilizce adla listelendiği için bu filmlerde TMDB'deki İngilizce adla ikinci arama yapılır. Dublaj, sayfa etiketi ve oynatıcıdaki dublaj işareti birlikte varsa gösterilir. Tek ses izi olduğu için bu bilgi sitenin beyanıdır, ses izinden doğrulanmış değildir. Paketli oynatıcı betiği çalıştırılmaz, yalnız sınırlı sözlükle çözülür. DiziBox'ta bölüm sayfasındaki dizi adı ve sezon/bölüm, dizi sayfasındaki ilk yayın yılıyla birlikte eşleşmelidir; aynı adlı yeniden çevrimler (ör. Shameless 2004/2011) yıldan ayrılır. Yalnız sitenin "DBX Pro" oynatıcısı okunur. Oynatıcı yapılandırması sayfanın kendi verdiği parolayla metin olarak çözülür; betik çalıştırılmaz. Türkçe altyazı sitenin etiketidir: akışta ayrı altyazı izi yoktur, görüntüye işlendiği doğrulanmadı. Anizone ilk sezonun tam bölümünü doğrular; sonraki sezonlarda mutlak bölüm numarası varsayılmaz. Her iki kaynak online izleme içindir, indirilebilir dosya olarak gösterilmez. MoviesDrive alan adı değişiminde arama sorgusu kaybolursa aynı yayıncının yeni adresine bir kez yeniden gönderilir.
