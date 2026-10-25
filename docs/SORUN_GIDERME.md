# “Alınıyor…” uzun sürüyor veya kaynak yok

**1.3.0 GitHub dağıtımı:** Kurulum `https://burhanb3.github.io/nuvio-tr-hd/manifest.json`. Eski Sites kopyasını kapat, Tümü/20/HLS açık; **Ortak tarama kapalı, DahmerMovies kapalı** seç. Hesap değişimi nedeniyle hazırlanan Worker üretime yayımlanamadı. VixSrc bu sürümde sunucu gerektirmeden doğrudan çalışır. Aşağıdaki cache/sunucu bölümleri isteğe bağlı yerel uygulamayı anlatır; canlı özellik değildir.


25 Ekim 2026: Kullanıcı iPhone'da **Dune (2021)** ve **Spider-Man: Brand New Day** için uzun bekleme ve boş sonuç bildirdi. 1.2.0 sonrasında küçük Spider-Man MP4'ü üç Türkçe altyazıyla açıldı; tekrar arama ve Dune hâlâ sorunluydu. **1.3.0**, bu ikinci bildirim üzerine ortak kaynak servisi, kısa önbellek, VixSrc ve çalışan videoyu koruyan altyazı politikası ekler.

## Telefonda güncelle

1. Nuvio **Pluginler → Nuvio TR HD deposu** bölümünden yenileme/güncelleme işlemini çalıştır. Sürüm **1.3.0** olmalı; menü adı Nuvio diline/sürümüne göre değişebilir.
2. Sağlayıcı ayarlarında **HLS çevrimiçi izleme alternatiflerini göster** seçeneğini aç. Önceki sürümün kayıtlı kapalı tercihi korunur. Bu seçenek yeni kurulumda varsayılan açıktır.
3. Nuvio'nun tercih edilen altyazı dilini **Türkçe** seç. Filmi kapatıp yeniden kaynak ara; açık sonuç ekranı önceki aramayı gösterebilir.
4. Yeni varsayılanlar **çözünürlük Tümü / sonuç sınırı 20**. Kayıtlı önceki tercihin varsa elle değiştir. **Ortak tarama** açık olsun. Türkçe bulunamazsa videoyu göster politikası yeni varsayılandır; servis hatasında çalışan video silinmez.
5. Yalnız indirilebilir kaynaklar için **MP4/MKV · Online izlenebilir · İndirilebilir** sonuçlarını kullan. **HLS · Online izlenebilir · İndirilemez** çevrimdışı dosya indirmesi sağlamaz.

Aynı kurulum bağlantısı geçerlidir: `https://burhanb3.github.io/nuvio-tr-hd/manifest.json`. Depo güncellenemiyorsa kaldırıp aynı bağlantıyla ekleme seçeneği yerel sağlayıcı ayarlarını sıfırlayabilir; önce ayarlarını kaydet.

## 1.3.0'da ne değişti?

- Public kaynaklar sunucuda taranır; başarılı çiftler en çok üç dakika tutulur, aynı anda gelen aynı arama birleştirilir. Boş cevap önbelleğe alınmaz. Telefonun yaptığı yavaş native istek sayısı azalır. Servis adresi yine aynı kurulum alan adıdır.
- VixSrc, Dune için ikinci online kaynak ve kaynakla eşlenmiş Türkçe VTT getirir. Otomatik/1080p/720p/480p, master'da gerçekten bulunan profillerdir; dört bağımsız sağlayıcı değildir. Playlist çözünürlüğü gerçek piksel doğrulaması diye etiketlenmez.
- Altyazılarda numara, sürüm ve varsa fps bilgisi görünür; aynı gövdeli aynalar elenir. Genel başlık+yıl, tam sürüm eşleşmesi sayılmaz.
- Sonuç sayısının varsayılanı 20'dir; bu sayı bulunamayan alternatifler uydurularak doldurulmaz. Küçük MP4'ler düşük kalite nedeniyle varsayılan gizlenmez.
- Kişisel katalog/addon adresleri ve anahtarlar telefonda kalır. Servise yalnız kanonik film/bölüm metadatası gider. [Teknik akış](../hosting/README.md).

## 1.2.0 tarihsel gözlemi

| Film | Canlı kaynak gözlemi | Sınır |
| --- | --- | --- |
| Dune (2021), TMDB 438631 | PlayIMDb'den üç doğrulanmış HLS oynatma listesi ve Türkçe VTT; en iyi altyazıda tam sürüm adı eşleşti | DahmerMovies dosya CDN'i 403/429 döndü. İndirilebilir MP4/MKV doğrulanamadı. HLS çözünürlüğü pikselden doğrulanmış değildir. |
| Spider-Man: Brand New Day, TMDB 969681 | Internet Archive'dan 3840×2160 MKV ve Türkçe VTT | Yaklaşık 85,5 GiB/91,8 GB; telefonda büyük. Altyazı kanıtı sürüm benzerliği/süre uyumu; kesin senkron değil. Düşük çözünürlüklü MP4 türevleri HD filtresinde elendi. |

Sonuçlar sabit, bilinen TMDB referans metadatasıyla; diğer ağ istekleri canlı çalıştırılarak alındı. Raporlar `compatibility/pipeline-dune-check.json` ve `compatibility/pipeline-spider-man-check.json` içindedir. Bu test tam video oynatmaz/indirmez. Telefonun native ağı, codec desteği ve sahne sahne altyazı senkronu sınanmadı. Kaynaklar sonraki aramada değişebilir.

## Bekleme nasıl düzeldi?

- Nuvio'nun JavaScript zamanlayıcısında `clearTimeout` native coroutine beklemesini iptal etmiyor. quickjs-kt 1.0.15, JavaScript sonucu yakalansa bile bekleyen native işleri bitirmeden değerlendirmeyi tamamlamıyor. Önceki uzun toplam zamanlayıcı çağrının bitişini geciktirebiliyordu.
- Yeni ortak zamanlayıcı aynı iş için en çok 100 ms'lik native uyku kurar. İptal edilmiş 30–42 saniyelik uyku bırakılmaz. QuickJS testinde iptal edilmeyen native bekleme davranışı ayrıca taklit edilir.
- Kaynaklar buldukları adayları hemen kontrol ettirir; yavaş bir katalog diğer hazır çiftleri engellemez. Video kontrolleri toplam üç eşzamanlı iş ile sınırlıdır.
- Türkçe araması video kontrolüyle örtüşür; altyazı servisi JSON'una 9 saniye tanınır. Başlık/hash sorguları seri zaman aşımı oluşturmaz. Takılan yanıt gövdeleri de zaman aşımına tabidir.
- 429 sonrası aynı kökene tekrar yüklenilmez; dosyanın HEAD isteği 403/404 verirse bir de GET ile zorlanmaz.

1.3.0'da telefon bütçesi 24 saniye, sunucu tarama bütçesi 13 saniyedir. Bunlar **mantıksal** sınırlardır. Nuvio fetch köprüsü AbortSignal'ı native isteğe aktarmadığı için başlamış TMDB/kişisel ağ işlerinin kapanması bu sınırdan uzun sürebilir. Fiziksel iPhone üzerinde ölçülmüş dönüş süresi olarak sunulmaz. Ortak tarama, telefonun kaynak servislerine ayrı ayrı gitme ihtiyacını azaltır.

## Boş sonuçların nedenini bulmak

**Hata ayıklama özeti** ayarı, uygulama günlüklerine `[Nuvio TR HD]` etiketiyle kaynak/adet/HTTP durumlarını yazar. Video veya altyazı URL'si, API anahtarı, Cookie ve Authorization yazılmaz. Bu özet stream listesinde gösterilemez; güncel Nuvio ABI'si hata/ilerleme kartı desteklemiyor. Uygulamanın kendi ağ günlükleri ayrıca hassas bilgi içerebilir; tam günlükleri herkese açık paylaşma.

| Tanı | Anlamı |
| --- | --- |
| `identity_unavailable` | TMDB kimliği/anahtarı/metadata alınamadı; yanlış filme düşmemek için arama durdu |
| `video_unavailable` | Dosya/playlist doğrulanamadı; HTTP durumları erişim veya ağ sorununu ayırmaya yardım eder |
| `quality` | Gerçek video boyutları seçilen alt sınırın altında |
| `subtitle_no_match` | Adaya uygun Türkçe sürüm/hash/süre kanıtı bulunmadı |
| `subtitle_unavailable` | Eşleşme adayı vardı, fakat gerçek SRT/VTT gövdesi doğrulanamadı |
| `hls_disabled` | Sonuç HLS, kullanıcı çevrimiçi alternatifleri kapattı |
| `deadline` | Bütçe doldu; o ana kadar tamamlanan çiftler korundu |

Yerel tekrar:

```powershell
npm run check
npm run verify:upstream
npm run test:live:pipeline -- --film=dune
npm run test:live:pipeline -- --film=spider-man
```

Bu komutlar `.cache/` içine URL/anahtar içermeyen rapor yazar. Sabit TMDB referansı kullandıklarından canlı TMDB erişimini test etmezler. Sonraki geliştirme önceliği, Dune dahil güncel filmler için erişilebilir ve makul boyutlu bağımsız MP4/MKV sağlayıcıları eklemek ve iPhone'da oynatma/indirme kabul testini tamamlamaktır.
