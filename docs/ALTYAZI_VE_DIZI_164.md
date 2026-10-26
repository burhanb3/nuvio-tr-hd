# 1.6.4: dizi dosyaları ve altyazının korunması

Bu sürüm daha fazla gerçek dosya getirir; her başlık ve her kalite için sorunsuz indirme hedefi henüz tamamlanmadı. [Kapsam matrisi](KAPSAM_MATRISI.md) bütün eksikleri tutar. Aynı GitHub manifestini yenilemek yeterlidir; scraper kimlikleri ve kullanıcı ayarları değişmez.

## Somut kaynaklar

- Breaking Bad S01E01: yaklaşık 329 MiB MP4 (853×480) ve 465 MiB MKV (1280×720). MKV ses track’i İngilizce. MP4 ses dili okunamadı; özgün ses otomatik varsayılmaz.
- Inception: yaklaşık 830/861 MiB MP4, ikisi de 1280×536. Bunlar iki çözünürlük değildir. Ses dili okunamadı. Portuguese başlıklı kayıt, yalnız başlık benzerliğiyle kabul edilmedi; kanonik filmle iki ayrı hareketli örnek eşleştirildi.
- Fleabag S01E01: önceki 99 MiB MKV yanında 155 MiB MP4; ikisi de 848×354.
- Fleabag S02E01: 147 MiB MP4 / 604 MiB MKV, 853×480 / 1280×720. İspanyolca altyazı görüntüye işlenmiş; kapatılamaz. Türkçe dosya ayrıca verilir ama sabit yabancı yazı kaybolmaz. Kartın dilinde **ES görüntüde**, açıklamada açık Türkçe bilgi vardır. Önerilen sıralamada temiz online önce gelir; boyut/kalite sırası kullanıcı seçimine göre kalır.

Dosya pinleri tam TMDB/IMDb/özgün başlık/yıl ve TV’de tam sezon/bölüme bağlıdır. Archive metadata SHA-1/boyutu, gerçek dosya edge hash’i, piksel ve süre her kullanımda denetlenir. Dosya değişirse atlanır. SHA-1 yerelde tam dosya indirilerek hesaplanmadı; OpenSubtitles hash’i kriptografik bütünlük garantisi değildir. Türev MP4’ün `original` ilişkisi ve ayrı gerçek dosya kontrolleri vardır; her türevin sahnesi ayrıca ölçülmüş değildir.

## Altyazı neden bazen kayboluyordu?

Önceden bütün altyazı servislerinin listesi bekleniyordu. Hızlı geçerli SRT olsa bile yavaş servis veya aynı gruptaki ikinci takılan dosya, sonuçların kaydedilmesini geciktirebiliyordu. Arama bütçesi dolarsa video kalıp altyazı boş çıkabiliyordu.

Şimdi her servis grubu hazır olduğunda denetlenir. İlk geçerli Türkçe gövde hemen video çiftinde korunur. Sonradan gelen güçlü eşleşmeler daha zayıf olanların yerine geçebilir. Aynı gövdenin aynaları birleşir; en çok dört farklı dosya sunulur. Video başına toplam en çok 12 URL kullanılır. Gerçek dosya hash’i varsa başlangıçta genel eşleşmelere sekiz yer ayrılır, kalan kapasite güçlü eşleşmeler içindir. Servisler bitip dört geçerli dosya bulunamamışsa kalan yerler genel alternatiflere açılır. Hash yoksa genel alternatifler baştan 12 yere kadar denenir.

Gövde işleri en çok dört istekle yürür. Ayrıca alttaki native fetch bitmeden ağ kotası bırakılmaz: JS timeout’u iOS isteğini iptal etmiş sayılmaz. Simülasyonda Abort yok sayılırken sınırın aşılmadığı sınandı. **Bu fiziksel iPhone testi veya kesin dönüş süresi garantisi değildir.** Native 60 saniye/pending-job davranışı hâlâ önemlidir. Plugin ABI’sinde tek scraper’dan canlı satır ekleme callback’i yoktur; bu değişiklik uygulamaya böyle bir alan uydurmaz.

## İçerik karşılaştırma aracı

```powershell
npm run test:archive:content -- --title=breaking-bad-s1e1 --item=ARSIV_KIMLIGI "--file=DOSYA_ADI.mkv" "--ffmpeg=C:\tools\ffmpeg.exe" --output=.cache/content-check.json
```

Bu geliştirme aracı, `validation/titles.json` içindeki sabit kanonik referansı ve bağımsız PlayIMDb HLS’sini kullanır; telefonun gerçek TMDB anahtarını sınamaz. FFmpeg sistemde kullanıcı tarafından seçilen mutlak yoldan çalışır; otomatik kurulum yapmaz. Her çalışmanın ayrı UUID klasörü vardır. Tam film yerine iki ayrı 20 saniyelik örnek ve bunlara karşılık gelen kısa referans pencereleri alınır. Karanlık/sabit görüntü kimlik kanıtı sayılmaz. İki hareketli, sıralı örnek gerekir; eşleşme eşiği düşürülmedi.

Referans 25 fps örneklenerek yarım saniyeye yuvarlama azaltılır. Siyah bantlı ve kırpılmış kaynaklar, kare piksel ve gösterim genişliğine göre aynı merkez görüntü alanında karşılaştırılır. Fleabag S02E01’deki ilk zayıf karşılaştırmanın nedeni bu geometri farkıydı. Önceki paralel araştırmadaki geçici dosya çakışması fark edilip o raporlar kullanılmadı; [yayımlanan kanıtlar](../compatibility/content-164.json) ayrı çalışma klasörleriyle yeniden üretildi. Önceki 1.6.3 bu yeni adayları içermiyordu.

Görüntü eşleşmesi film/bölüm kimliğine kanıttır. Tam filmin doğru kurgu olduğu, ses uyumu veya altyazı senkronu kanıtı değildir. Ölçülen başlangıç farkı otomatik altyazı kaydırması olarak uygulanmaz. Görüntüler ve geçici medya bağlantıları commit edilmez; yalnız sayısal özet/hash yayımlanır.

139 önceki test üzerine native fetch sınırı testiyle **140 yerel test**, gerçek QuickJS, kilitli 20 upstream dosya doğrulaması vardır. Tam film oynatma/indirme, fiziksel iPhone ve uçak modu testi yapılmadı. Matrix/GoT ZIP dosyaları ve Shameless eksikleri çözülmüş sayılmaz. Mevcut Sites köprüsü 1.4.0; yeni servis kurulmadı/yayımlanmadı.
