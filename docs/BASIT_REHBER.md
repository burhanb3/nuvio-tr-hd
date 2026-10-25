# Nuvio TR HD nasıl çalışır, sırada ne var?

**Güncel sürüm 1.5.0:** dizilerde PlayIMDb yıl filtresi ve VixSrc TV rotası düzeltildi, HDHub tek bölüm dosyaları ve AltyazıDB eklendi. Kısa başlık, küçükten büyüğe varsayılan sıra, kalite/gruplama seçenekleri var. Sesi birlikte gelen HLS ayrı kalite satırlarıdır; ayrı sesli HLS için profil servisi Sites erişimi olmadığı için yayımlanamadı ve otomatik master korunur. Aşağıdaki 1.4.0 notları tarihsel bağlamdır. [Yeni araştırma ve sınırlar](KAYNAK_ARASTIRMASI.md).


1.4.0 kurulum: https://burhanb3.github.io/nuvio-tr-hd/manifest.json . Yalnız ücretsiz, hesapsız kaynaklar kullanılır. Eski Sites kopyasını kapatın; sürüm 1.4.0, Tümü/20/HLS ve MKV dosya köprüsü açık olsun. Nuvio altyazı dili Türkçe seçilmeli.

## Film seçilince

Önce TMDB kimliği, özgün film adı ve yıl alınır. Eklenti birkaç sağlayıcıyı telefondan paralel arar. Başlık, yıl veya bölüm yanlışsa aday elenir. Kaynağın MP4/MKV dediğine güvenmekle yetinmez: dosyadan küçük bir aralık okur, gerçek türünü, byte boyutunu ve okunabilen piksel ölçüsünü çıkarır. Böylece 2160p adlı gerçek 480p dosya 4K diye sunulmaz.

Yeni 4KHDHub/HubCloud adaptörü public bağlantı zincirinden gerçek dosyaya ulaşır. Bazı dosyalar indirilirken HEAD'e 403, GET'e 206 verir; bu artık yanlış erişim reddi sayılmaz. Uzantısız MKV için küçük köprü dosyayı doğrular ve .mkv ile biten adres verir; indirme doğrudan kaynak sunucudan yapılır.

HLS farklıdır: tek indirilebilir dosya yerine parçalar halinde yayın yapar. Oynatma listesindeki 480/720/1080 profilleri ve bitrate × süreyle yaklaşık veri miktarı gösterilebilir. Bu değerler ölçülmüş tek dosya boyutu değildir. HLS etiketi her zaman Online izlenebilir / İndirilemez olur.

## Türkçe altyazı

Mevcut Türkçe SRT/VTT dosyaları aranır. Hash veya tam sürüm eşleşmesi önce, benzer sürüm ve süre daha sonra gelir. Dengeli mod aynı filmden belirsiz alternatifleri de açık etiketle sunar. Yanlış film, yıl ve açık farklı kurgu kabul edilmez. Kaynakta Türkçe bulunmaması çalışan videoyu gizlemez.

Bir altyazının bir saniye kayık olması düzeltilmesi mümkün bir sorundur. Ama önce gerçekten bir saniye kayık olduğunu ölçmek gerekir. Yalnız dosya adı, son konuşma zamanı veya filmin süresi bunu ölçmez. Bu sürüm otomatik zaman düzeltmesi yapmaz. iPhone'da Nuvio AutoSync desteği de yoktur; Android özelliği gömülü referans altyazıya bağlıdır.

İleride güvenilir referans altyazı veya ses karşılaştırmasıyla kaymayı hesaplayan, düzeltilmiş VTT/SRT URL'si veren ayrı bir aşama kurulabilir. Aynı dosya hem online hem offline kullanılmalı. GitHub Pages tek başına bu hesaplamayı yapamaz; mevcut Worker köprüsü de ffmpeg/ffsubsync çalıştıran ses motoru değildir.

## Şimdi hangi sırayla ilerliyoruz?

1. **Kaynak kapsamı:** Her sağlayıcı için birkaç gerçek filmde küçük/orta dosya, erişim, gerçek boyut/piksel kontrolü. 20 liste sınırıdır, 20 bağımsız sağlayıcı garantisi değildir.
2. **Türkçe bulunurluğu:** Ücretsiz servislerden tekrarlanabilir sonuç ve daha iyi sürüm/hash eşleşmesi. Spider-Man 1.4.0 son tam sorguda 10 sonuç verdi; 2,64 GiB MKV dahil Türkçe VTT’ler doğrulandı. Bazı önceki çağrılar boş/zaman aşımı verdi. Tam indirme/senkron hâlâ cihazda sınanmadı.
3. **iPhone kabul testi:** Aynı dosyayı açma, Türkçeyi otomatik seçme, video+altyazı indirme tamamlanınca uçak modunda oynatma. AV1/H.265 cihaz desteği burada doğrulanır.
4. **Senkron ölçme/düzeltme:** Önce sabit kayma, sonra fps farkından büyüyen kayma. Kestirilmiş değerler doğrulanmış diye sunulmayacak.

Dune (2021) için şu anda Türkçe online HLS bulundu; indirilebilir dosya doğrulanamadı. Spider-Man bilgisayar kontrolünde 2,64 GiB / 1920×800 MKV dahil yeni dosyalar verdi; telefon davranışı ve her aramada erişim henüz garanti değil. Güncel kanıt compatibility raporlarında, devam notları docs/hafiza içindedir.

**1.4.0 son canlı kanıt:** public köprü kayıt → HEAD 200 / 2.830.708.974 byte → GET Range 206 / gerçek 1920×800 MKV; tekrar üç kayıt başarılı. Source discovery bilgisayardan, köprü üretimden sınandı. Tam Spider-Man sağlayıcı akışı yaklaşık 13,25 saniyede 10 alternatif ve Türkçe VTT verdi. Raporlar compatibility/download-bridge-live-140.json ve pipeline-spider-man-140.json. Bunlar iPhone/tam film indirme testi değildir.
