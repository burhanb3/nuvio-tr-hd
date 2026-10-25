# Nuvio TR HD nasıl çalışıyor?

**Güncel GitHub kurulumu:** `https://burhanb3.github.io/nuvio-tr-hd/manifest.json`. Eski Sites kopyasını kapat. Varsayılan Tümü/20/HLS açık; **Ortak tarama kapalı**. Kaynaklar telefondan doğrudan aranır. Ortak servis/üç dakikalık cache yalnız yerelde hazırlanmış seçenektir, üretime yayımlanmadı. Sonraki paragraflardaki sunucu mimarisi bu isteğe bağlı koda aittir.


Bu rehber teknik ayrıntılara girmeden birlikte geliştirebilmek için tutulur.

## 1.3.0 ile değişenler

Varsayılan **Tümü / 20 alternatif**. Kaynaklar **Online izlenebilir** olarak gelir; gerçek MP4/MKV ayrıca **İndirilebilir**, HLS **İndirilemez** yazar. Türkçe servisi aksadığında video gizlenmez. Altyazıların numarası ve sürüm adı farklıdır; aynı dosyanın kopyası tek seçenek sayılır.

Ortak kaynak taraması aynı barındırma adresimizde çalışır; sonuçlar üç dakika tutulur. Telefon aynı filmi tekrar aradığında her kaynağa yeniden yüklenmez. Kişisel kataloglar ve anahtarlar telefonda kalır. VixSrc, Dune için ikinci çevrimiçi kaynak ve videoyla birlikte Türkçe VTT sağlar.

Nuvio deposunu yenile, **1.3.0** sürümünü gör. Kayıtlı eski tercih varsa **Tümü / 20 / Ortak tarama açık / HLS açık** seç.

## Link ekleyince ne kuruluyor?

Nuvio'ya eklenen bağlantı bir `manifest.json` dosyasıdır. Bu küçük dosya eklentinin adını, sürümünü ve JavaScript dosyasının adresini söyler. Nuvio sağlayıcı dosyasını alır ve telefonun içinde çalıştırır. Film dosyaları GitHub'da barındırılmaz; eklenti kaynaklardan bulduğu bağlantıları Nuvio'ya verir.

İlk kurulumda plugin destekli **Full** Nuvio sürümü gerekir. Uygulama mağazası varyantlarında plugin bölümü bulunmayabilir. Ekleme yeri **Pluginler / Plugins → Depo ekle / Add Repository** bölümüdür. JSON bağlantısı Addons bölümüne eklenmez.

Kurulum adresi: `https://burhanb3.github.io/nuvio-tr-hd/manifest.json`. Nuvio TR HD'yi etkinleştirin ve Nuvio'nun tercih edilen altyazı dilini Türkçe yapın. GitHub hesabına giriş veya bilgisayarda çalışan bir sunucu, bu herkese açık bağlantıyı okumak için gerekli değildir.

## Bir filmi seçtiğinde

1. Nuvio seçtiğin filmin TMDB kimliğini eklentiye gönderir. Eklenti özgün adı, yılı, film süresini ve gerekirse IMDb kimliğini alır.
2. DahmerMovies, Internet Archive ve PlayIMDb ayrı ayrı sorgulanır. Kişisel JSON veya Stremio adreslerin varsa onlar da eklenir. Birinin bozulması diğerinin sonucunu düşürmez.
3. Gelen bağlantılar dosya olarak kontrol edilir. Filmle aynı adı taşıyan fragman, yanlış yıl, HTML hata sayfası, bozuk bağlantı ve desteklenmeyen akışlar elenir.
4. MP4/MKV içinden okunabildiğinde gerçek video boyutu ve süre alınır. Dosya adında 4K yazması tek başına 4K etiketi vermeye yetmez.
5. Her video için Türkçe altyazı aranır. Mümkün olduğunda dosyanın parmak izi olan hash, sonra sürüm adı, kaynak bilgisi ve süre karşılaştırılır. Farklı sürümlerde kayma olabileceği açıkça gösterilir.
6. Uygun çiftler sıralanır ve Nuvio'ya verilir. İzleme ve indirme işini Nuvio yapar.

## Altı sınırı var mı?

Nuvio'nun altı kaynak sınırı yoktur. Bu projede listeyi kısa tutmak için varsayılan 20 seçildi. **Sağlayıcı ayarları → Gösterilecek en fazla kaynak** seçeneğinde 6, 10 veya 20 seçilebilir.

Üç farklı sayı birbirinden ayrıdır:

| Sayı | Anlamı |
| --- | --- |
| 3 yerleşik sağlayıcı | Arama yapılan kaynak sistemleri |
| 40 video adayı | Bir aramada en çok doğrulanan farklı bağlantı |
| 6, 10 veya 20 sonuç | Kontrolleri geçenlerden kullanıcıya sunulacak üst sınır |

Bir sağlayıcı on farklı dosya verebilir. On sonuç seçmek on sağlayıcı olduğu anlamına gelmez. İki uygun kaynak varsa iki gösterilir; listeyi doldurmak için aynı bağlantı çoğaltılmaz. Toplam 24 saniye mantıksal bütçe vardır; başlamış native ağ işleri Nuvio tarafından ayrıca bitirilir; sayı artışında bu süre sınırı devam eder. İleride sınırlar değiştirilebilir, ancak önce kaynakların güvenilirliğini artırmak daha çok işe yarar.

## Türkçe altyazı neden her videoda aynı değil?

Aynı filmin sinema, extended, farklı Blu-ray ve WEB sürümleri olabilir. Altyazı doğru filme ait olsa bile sahne zamanları farklı olabilir. Eklenti bu yüzden tüm videolara tek bir altyazıyı körlemesine eklemez.

- **Dosya hash eşleşmesi:** Videonun dosya parmak izi eşleşir; en güçlü kanıttır.
- **Tam sürüm eşleşmesi:** Altyazının hazırlandığı sürüm adı videoyla eşleşir.
- **Kaynakla eşlenmiş:** Kaynak veya kişisel kayıt altyazıyı o videoya bağlamıştır.
- **Sürüm benzerliği / süre uyumu:** Yararlı bir tahmindir; kesin senkron testi değildir.

Eklenti yeni altyazı üretmez veya çeviri yapmaz. Mevcut Türkçe SRT/VTT dosyalarını bulur. Uygun altyazı yoksa video varsayılan olarak TR bulunamadı etiketiyle gösterilir. İstersen **Türkçe altyazı bulunamazsa → Videoyu gizle** seçebilirsin.

## Online ve çevrimdışı izleme

Bir kez Nuvio'nun tercih edilen altyazı dilini **Türkçe** seçmelisin. Plugin bu uygulama ayarını kendi başına değiştiremez. Daha önce bir film için elle seçtiğin altyazı kapatma tercihi de otomatik seçimin önüne geçebilir.

Online oynatırken Nuvio, seçilen videonun yanındaki altyazı listesini alır. İndirirken Nuvio video ile kaynak altyazılarını ayrı dosyalar halinde kaydedebilir. Altyazı hazırlama adımının da tamamlanmasını bekleyip sonra **İndirilenler** bölümünden açmalısın. Sonrasında kaynak sitelere yeniden ulaşmak gerekmemelidir. Fiziksel telefon üzerinde bu yolun kabul testi hâlâ yapılmalıdır.

HLS bir `.m3u8` oynatma listesidir; bu projede doğrudan indirilebilir MP4/MKV diye sunulmaz. 1.2.0 ile çevrimiçi alternatifler varsayılan açıktır; yalnız oynatma etiketiyle gösterilir. Önceden kaydedilmiş kapalı tercihi açmak gerekir.

## Dune / Spider-Man aramasından sonra güncelleme

İlk iPhone bildiriminden sonra 1.2.0 zamanlayıcı ve erken sorgu düzeltmeleri geldi. Tekrar arama sorunları üzerine 1.3.0 ortak kaynak servisi/cache ekledi. Nuvio Pluginler ekranında aynı depoyu yenile, sürümün 1.3.0 olduğunu gör; Tümü/20, ortak tarama ve HLS açık olsun. [Sonuçlar ve adımlar](SORUN_GIDERME.md).

Dune için Türkçe altyazılı HLS döndü; indirilebilir dosya henüz doğrulanamadı. Spider-Man için gerçek 4K MKV + Türkçe VTT geldi, fakat dosya yaklaşık 85,5 GiB olduğundan telefon için ağırdır. Kaynak kapsamını geliştirmek hâlâ gereklidir.

## Şu anki güçlü ve eksik yanlar

Kimlik, dosya türü, çözünürlük, altyazı eşleştirme, hata yönetimi ve sıralama katmanları hazır. Gerçek QuickJS motoru ve örnek verilerle testler var. Canlı referans testinde 1080p MKV ile Türkçe altyazı sonuçları geldi.

Kaynak kapsamı henüz sınırlı. DahmerMovies dosya CDN'i son denemede bu ağdan engellendi. PlayIMDb sonuçları çoğunlukla HLS idi. Internet Archive referans filmde çalıştı, fakat her güncel film için kaynak olacağı anlamına gelmez. Bir filmi bulabilmek, altyazının sahne sahne senkronunun ve bütün telefonlardaki indirme davranışının doğrulandığı anlamına da gelmez.

## Birlikte hangi sırayla geliştirebiliriz?

1. **Telefonda ilk kurulum ve gerçek deneme.** Plugin ekleniyor mu, film açılıyor mu, Türkçe otomatik seçiliyor mu ve uçak modunda çalışıyor mu? Android/iPhone farkı burada belirleyici.
2. **Daha fazla çalışan MP4/MKV sağlayıcı.** Sonuç sayısını büyütmekten önce, farklı filmlerde erişilebilir dosya veren bağımsız kaynakları artırmak gerekir. Her yeni sağlayıcı kendi testi ve başarısızlık davranışıyla eklenir.
3. **Daha kesin altyazı eşleşmesi.** Hash ve tam sürüm kapsamını artırma, farklı film kesimlerini ve fps farklarını daha iyi ayırt etme.
4. **Kaynak bulunamadığında anlaşılır neden.** Kaynak mı engelli, HD dosya mı yok, Türkçe altyazı mı bulunamadı? Gizli URL veya anahtar içermeyen tanı raporu.
5. **Telefona uygun sıralama.** İndirme boyutu, uyumlu codec, doğrulanmış kalite ve altyazı güvenini kullanarak pratik bir üst sıra oluşturma.
6. **Hız ve bakım.** Gereksiz aynı istekleri azaltma, uygun kısa süreli önbellek ve otomatik kaynak sağlık kontrolleri. Süresi dolan indirme bağlantıları uzun süre önbelleğe alınmaz.

Önerilen ilk adım 1 ve 2'dir: çalışan bir kurulum ve güçlü kaynak kapsamı, tek başına daha uzun sonuç listesinden daha değerlidir. Diğer geliştirmeleri telefondaki gözlemlere göre seçebiliriz.
