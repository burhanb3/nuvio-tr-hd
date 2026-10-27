# Kişisel kaynak hazırlama

Kişisel kaynaklar yerleşik aramaya isteğe bağlı eklenir. Adres girmeden çalışan yerleşik tarama için [otomatik sistem rehberini](OTOMATIK_KAYNAKLAR.md) okuyun.

## JSON katalog

Kök nesne `version: 1` ve `items` listesi içerir. [Örnek dosyayı](../examples/catalog.example.json) kopyalayın. [Şema](../schemas/catalog.schema.json) editör doğrulaması için kullanılabilir.

| Alan | Açıklama |
| --- | --- |
| `tmdbId` | Pozitif TMDB film/dizi ID'si. IMDb `tt...` kimliği yerine TMDB sayısı. |
| `type` | `movie` veya `tv`. |
| `originalTitle` | TMDB `original_title` / `original_name`; çevrilmiş gösterim başlığı değil. |
| `year` | Filmin çıkış yılı veya dizinin ilk yayın yılı. |
| `season`, `episode` | `tv` kayıtlarında zorunlu pozitif bölüm numaraları. Her bölüm ayrı kayıt. |
| `streams` | Doğrudan dosya URL'leri. En çok ilk 16 akış incelenir. |
| `subtitles` | Kayıt düzeyinde ortak Türkçe/İngilizce altyazılar. Akış düzeyinde de eklenebilir. |

URL'ler HTTPS olmalı; göreli URL'ler katalog adresine göre çözülür. HTTP yalnız kullanıcı ayarı açıkken kabul edilir. `headers` nesnesi her video veya altyazı için ayrı tanımlanır. Video başlıkları altyazı sunucusuna kendiliğinden aktarılmaz. `Authorization`, `Referer` ve gerekli kullanıcı başlıkları korunabilir; `Range`, `Host`, bağlantı ve gövde uzunluğu gibi başlıkları sağlayıcı yönetir.

```json
{
  "url": "https://sunucunuz.example/dosya.mkv",
  "headers": { "Referer": "https://sunucunuz.example/" },
  "subtitles": [{
    "url": "https://altyazi.example/film.tr.vtt",
    "language": "tur",
    "headers": {}
  }]
}
```

Harici altyazıda `language` veya Stremio biçiminde `lang` kullanılabilir: `tr`, `tur`, `tr-TR`, `Turkish`, `Türkçe`. Gerekirse `identity` altında videoyla aynı TMDB/başlık/yıl/tür/bölüm alanları verilebilir; çelişen kimlikte altyazı elenir. Aynı kayıttaki altyazı, o kayda ait kabul edilir. SRT/VTT UTF-8 metin olmalı; ZIP/ASS ve karakter seti dönüştürme bu sürümde yoktur.

## Stremio

Sağlayıcı ayarına HTTPS `.../manifest.json` adresini ekleyin. Yapılandırma/token URL yolunda bulunuyorsa alt kaynak URL'lerine taşınır; manifest URL'sinin sorgu parametreleri diğer uçlara kopyalanmaz. Kaynak video bağlantısını son HTTP dosya adresi olarak vermelidir; sayfa kazıma ve servis özel debrid çözümleme yoktur.

1. Manifestte kaynak/tür/ID önekleri kontrol edilir.
2. Önce `tmdb:ID`, uygunsa TMDB'den bulunan IMDb ID ile sorgulanır.
3. `meta` varsa kimlik, tür, orijinal başlık ve yıl kontrol edilir. Yerelleştirilmiş `name` özgün başlıktan farklıysa meta ayrıca `originalTitle`, `original_title` veya `original_name` sağlamalıdır.
4. `meta` yoksa `behaviorHints.filename`, örneğin `The.Matrix.1999.1080p.mp4`, tam özgün başlık ve yılla başlamalıdır. Dizide `S01E02` de eşleşmelidir. Alternatif olarak akıştaki `identity` nesnesi JSON kayıt kimliğiyle aynı biçimde doğrulanır.
5. Stream sorgusunda dizi kimliğine `:season:episode` eklenir. Mevcut `subtitles` kaynağı ve akıştaki harici altyazılar birleştirilir. Başka ID'ye ait meta veya çelişen yıl kabul edilmez.

Stremio yanıtında `behaviorHints.proxyHeaders.request` video isteğine ve Nuvio sonucuna aktarılır. Torrent, YouTube ve `externalUrl` sonuçları doğrudan dosya sonucu değildir; atlanır. Kaynak yalnız bunları döndürüyorsa sağlayıcı boş sonuç verir. Bu proje ayrıca Stremio addon sunucusu değildir; Nuvio'ya bir JavaScript plugin deposu olarak eklenir.

## Kaynak sunucusundan beklenenler

- Video erişilebilir olmalı; `GET Range: bytes=0-131071` için doğru `206 Content-Range` yanıtı önerilir. HEAD desteklenmiyorsa range denemesi yine yapılır.
- Range'i yok sayan sunucu, küçük ve tam gövde (en çok istenen boyut) dışında doğrulanmaz. Content-Length/Content-Range ile gövde tutarlı olmalıdır.
- Katalog JSON'u en çok 700.000 karakter, ilk 1.000 kayıt; kaynak başına eşit kota ile toplam en çok 40 video adayı değerlendirilir. Küçük kişisel kataloglar kullanın.
- Altyazı başına en çok 256 KiB; ön sıralamadan sonra akış başına en çok 4 benzersiz Türkçe altyazı gövdesi doğrulanır. Altyazı gövdesi için en çok 9 saniye mantıksal süre, toplam iş için 24 saniye mantıksal bütçe geçerlidir.
- Genel isteklerde 4,5 saniye, altyazı JSON/gövdesinde 9 saniye ve toplam 24 saniye mantıksal sağlayıcı bütçesi vardır. Tamamlanan sonuçlar bütçe bitiminde korunur. Alt ağ isteklerinin fiilî iptali Nuvio köprüsüne bağlıdır.
- Doğrulanan dosya başlığı, sunucunun doğru filmi verdiğini kriptografik olarak ispatlamaz. Film kimliği, kaynak metadatası ve TMDB karşılaştırmasına dayanır.
