# 1.7.1 indirme araştırması

Bu turdaki hedef yeni HLS seçenekleri saymak değil, ücretsiz/hesapsız gerçek MP4/MKV kaynaklarını artırmaktı. Yeni PC servisi, proxy/decrypt backend, hesap veya manuel film/bölüm pini oluşturulmadı. Harici dublaj birleştirme işi kullanıcı tercihiyle bırakıldı; kendi içinde uygun ses bulunan dosyalar aranır.

## Kaynaklarda ne bulundu?

| İnceleme | Gözlem | Sonuç |
| --- | --- | --- |
| Topluluk manifestleri | Bazı MP4 ilanları gerçekte oynatıcı sayfası veya HLS; bazı ilan edilen JS dosyaları 404 | İlan edilen format kaynak artışı sayılmaz |
| RedFlix | Film/dizi sayfaları yanıt verdi; sonuçlar 12 farklı embed oynatıcısına adres | Doğrudan dosya sağlayıcısı olarak eklenmedi |
| ShowBox / FebBox | Public arama, paylaşım ve dosya listeleri çalışıyor. Public indirme isteği “Please log in first”; kalite API’si login_required | Hesapsız koşulumuza uymuyor; hesap/token oluşturulmadı |
| MoviesDrive | Güncel public `/search.php?q=…` araması çalışıyor; küçük sürüm ilanları mevcut | İlan tek başına çalışan dosya değil |
| HubCloud link kurtarma | Sayfanın kendi bağlantısı ve geçici form parametreleriyle normal arama denendi. Matrix 1999 480p isteği Harry Potter 2009 dosyası döndürdü | Yanlış yapım reddedildi; kurtarılan link otomatik doğru sayılmadı |
| HDHub / Worker dosya uçları | Dune/Matrix için normal dosya URL’leri var; örnek altı uç gerçek kontrolde ağ/zaman aşımı verdi | Çalışan yeni dosya diye sayılmadı |
| Archive | Daha geniş film/dizi metadata taraması yapıldı. Matrix adaylarında fragman, ZIP, kısa kesit veya beklenen süreden belirgin kısa dosya bulundu | Kimlik/süre/Range şartları gevşetilmedi; yeni pin yok |
| Webteizle / CinemaCity / HDHub4u arama | Normal HTTP yolu challenge/403 verdi | Challenge çözülmedi, başka anahtar/proxy kullanılmadı |
| DiziBoxİzle | İncelenen eski dizi sayfaları bulunuyor ama istenen bölümler 404/boş | Katalog başlığı oynatılabilir bölüm sayılmadı |
| MovieBlast / bazı diğer API adaptörleri | İncelenen istemci yöntemleri gömülü token/imza sabiti veya harici yardımcı API gerektiriyor | Özel sabitler kopyalanmadı; yeni bağımlılık eklenmedi |

**Bu turda yeni çalışan indirme sağlayıcısı doğrulanmadı.** Var olan örneklerin metadata incelemesi yeni dosya bulunmuş gibi raporlanmaz. Araştırmanın olumlu kazanımı, yanlış/hesap isteyen/HTML olan sonuçların neden kapsam artışı sayılmadığının ve mevcut kontrollerdeki gereksiz bekleme noktalarının netleşmesidir.

## Gerçek kod değişiklikleri

1. **Ayrı HEAD kalktı.** Dosyanın MIME, toplam boyut ve gerçek konteyner bilgisi zaten sınırlı Range GET yanıtından alınıyor. Her dosya için gereksiz ek native iş açılmıyor. GET 401/403/429, HTML, yanlış Range, büyük Range200 ve konteyner kontrolleri sürüyor.
2. **Alttaki bitmemiş dosya fetch’leri en çok 3.** Mantıksal timeout bir işi bitmiş sayıp yeni native fetch yağmuruna dönüştürmüyor. Mevcut altyazı limiti ayrı 4 olarak kalıyor. Bu, iPhone’un fiziksel dönüş süresi garantisi değildir; native fetch hâlâ iptal olmayabilir.
3. **Uzantısız gerçek MP4 köprüsüz doğrulanabilir.** Kaynak dosya adı MP4 diyorsa, Nuvio’nun varsayılan MP4 uzantısına uygun aday doğrudan gerçek probe’a girer. Köprü başarısını beklemez. Gerçekte MKV, HTML veya HLS ise MP4 diye sunulmaz. Uzantısız MKV için mevcut ad köprüsü gereksinimi devam eder.

Bu düzeltmeler erişilebilir dosyayı korumak ve gereksiz işi azaltmak içindir; olmayan dosyayı üretmez, HLS’yi MP4’e dönüştürmez. Yeni kaynak eklenmesinin eski kaynakların kotasını veya online seçenekleri azaltmaması kuralı korunur.

## Bundan sonra verimli araştırma

- Önce adayın **hesapsız dosya GET/Range** yolunu doğrula; bu başarısızsa uzun katalog entegrasyonu yazma.
- Ardından kanonik kimlik/özgün ad/yıl ve tam bölüm bağını doğrula. Kaynak kurtarma/aramanın döndürdüğü ilk sonucu kabul etme.
- Çalışan dosya hostunu bulduktan sonra onu kullanan **genel katalogları** genişlet. Aynı binary aynasını yeni dosya sayma.
- Ses kendi içinde olmalı; konteynerden okunan dil ile kaynak iddiasını ayır. Mevcut TR altyazı alternatiflerini hash/release/süre tahminiyle sırala; her yapımda pahalı ses/görüntü karşılaştırması yapma.
- Sırf kaynak sayısını artırmak için hesap, yardımcı sunucu, challenge çözümü veya daha zayıf kimlik kontrolü ekleme.

Araştırma özeti `compatibility/download-research-171.json`; kaynak/QuickJS testi fiziksel iPhone tam oynatma/indirme/offline/senkron testi değildir.

## Son regresyon kontrolü

Dune:2 gerçek dosya+TR; Fleabag S01E01:2 gerçek dosya+TR; Shameless S01E01:online+TR var, indirme0. Anime ek kontrolünde Attack on Titan S01E01:9 MP4/TR,853×480 ✓ / 1280×720 ✓ / 1920×1080 ✓. Bunlar aynı ağırlıkta bir hız karşılaştırması değildir. [Film/dizi](../compatibility/coverage-171.json), [anime](../compatibility/anime-aot-171.json).156 test/QuickJS geçti;20 upstreamdosya drift yok. Fiziksel iPhone/tam indirme/offline/senkron/VLC font kontrolü yapılmadı.
