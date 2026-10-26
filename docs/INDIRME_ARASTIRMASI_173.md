# 1.7.3 indirme araştırması ve dosya doğrulama

Film/dizi indirme kapsamı henüz belirgin biçimde büyümedi. Bu turda varsayılan açılan yeni, kararlı bir film/dizi dosya sağlayıcısı yok. Bir anime adaptörü deneysel olarak hazırlandı; birleşik aramalarda kararlılık koşulunu geçemediği için **varsayılan kapalı**. Aynı kurulum adresi ve sağlayıcı kimlikleri korunur; yeni PC/sunucu, hesap veya film/bölüm pini eklenmedi.

## Gerçek kod kazanımları

- **Daha fazla dosyada gerçek çözünürlük:** MP4 metadata kutusu büyükse son 256 KiB örneğine sığmayabiliyor. Gerçek üst düzey kutu sınırından hesaplanan adrese en fazla bir ek, en çok 256 KiB Range isteği gider. Video handler ve tkhd yapısı doğrulanınca piksel okunur. Medya içinden rastgele moov sözcüğü taranmaz; isim/boyut kalite kanıtı değildir.
- **Aynı dosya sunucusunda devam:** İlk byte örneği hangi gerçek CDN adresinden geldiyse sonraki metadata/hash aralıkları o adrese gider. Dönen yönlendirme hizmetine tekrar tekrar gidilmez. Boyut/URL/ETag tutarlılığı ve bozuk içerik reddi sürer.
- **Deneysel AniMOM:** Anime dizileri için kanonik ad/yıl, ayrı detay doğrulaması ve açık bölüm/üst dizi bağı gerekir. Numarası düz verilen bölümler ilk sezon sayılır; diğer sezonlar tahmin edilmez. Başka sezonda ayrıca açık sezon başlığı gerekir. Public YourUpload sayfasındaki og:video ve player file aynı HTTPS vidcache MP4 adresini vermelidir. Gerçek konteyner/süre/Range kontrolü ve mevcut TR/EN altyazı sistemi uygulanır.

AniMOM isteğe bağlı açılırsa yalnız bu çok adımlı dosya yoluna 7 saniyelik mantıksal istek payı tanınır; toplam arama bütçesi uzamaz. Resmî CDN yönlendirmesi yalnız ağ hatasında bir kez yenilenebilir. HTML/401/403/429 tekrarlanmaz. Bitmemiş fiziksel dosya fetch kotası3, altyazı4/EN1 aynıdır; native iPhone iptal/iş tüketme sınırları devam eder. Fiziksel süre garantisi verilmez.

## Canlı bulgular

AniMOM Death Note S01E01 tekil taramasında **356.493.310 byte (0,36 GB), 1280×720 MP4, 1390,661 saniye** doğrulandı. Yeni metadata okumadan önce piksel bilinmiyordu. Dört temiz Türkçe SRT gövdesi geldi; puan68–69, süre uyumu tahmini. Sahne senkronu ölçülmedi. İngilizce servisler bu tekil turda ağ hatası verdi; EN var diye yazılmadı.

Aynı kaynağın S01E02 dosyası iki denemede ağ hatası verdi. Bütün anime sağlayıcıları birlikte açıkken yeni AniMOM dosyası bu turda listeye yetişmedi; farklı CDN düğümlerinin kararsızlığı gözlendi. Bu nedenle varsayılan kapalı tutuldu. Denemek için **Anime sağlayıcısı ayarları → Deneysel AniMOM anime dosyaları** seçilebilir; kararlı kapsam artışı olarak sayılmaz.

Mevcut kaynaklarla Dune/Fleabag için online+TR/EN ve gerçek dosyalar gelmeye devam etti. İlk tur Dune1/Fleabag2 dosya; tekrar Dune1/Fleabag1 dosya. Archive ağ dalgalanması çözülmüş denmez. Death Note birleşik aramada altı ham çift vardı; aynı binary aynaları birleşince dört farklı seçenek görünüyordu. Altı bağımsız dosya diye raporlanmaz.

## Araştırılıp varsayılan eklenmeyen yollar

| Kaynak | Sonuç |
| --- | --- |
| Webflix | Tek anime MP4 örneği doğrulandı; film/dizi isteklerinde451/502/504 ve zaman aşımı. Genel sağlayıcı olarak eklenmedi. |
| SineWix / Anizium | Normal isteğe401; gömülü kimlik/imza sabitleri kopyalanmadı. |
| Nakios | Dosya API zaman aşımı; depo backend göçünü de belgeliyor. |
| Movix / Uqload / Dood | Kanonik kataloglar çalıştı, oynatıcılar çoğunlukla HLS. Normal indirme formu Security error1; Dood403/ağ hatası. |
| VidZee | Anahtarsız normal TMDB yanıtı HLS verdi; MP4/MKV sayılmadı. |
| Soaper / MP4Hydra | Alan adı satış veya Back soon HTML’i. |
| Anizm / Sibnet | Normal istek403; erişim koruması aşılmadı. |

Topluluk projeleri yalnız yöntem öğrenmek için incelendi; uzaktaki sağlayıcı kodları çalıştırılmadı/kopyalanmadı. Geçici linkler, form hash’leri ve altyazı gövdeleri commit edilmedi.

## Doğrulama ve sıradaki iş

178 yerel/gerçek QuickJS testi: büyük MP4 metadata, yanlış/sahte kutu, aynı ilk-byte sunucusuna devam, ağ/HTML/izin hatasında tekrar davranışı, kanonik ad/yıl/bölüm, güvenli medya hostu, bozuk aramada çökmeden dönüş ve derlenmiş anime ABI’si. Nuvio0.6.4-beta/güncel dalın20 kilitli dosyasında drift yok; kilit güncellenmedi. Kanıt: compatibility/download-research-173.json ve upstream-173-check.json.

Öncelik hâlâ yeni ve genel **ücretsiz/hesapsız film/dizi MP4/MKV hostu** bulmak. Önce dosya GET/Range ve farklı başlıklarda kararlılık, sonra genel katalog entegrasyonu. Başarısız katalog/adaptör sayısını şişirme; aynı engeli yeni kanıt olmadan tekrarlama. Deneysel anime kaynağını varsayılan açmak için birleşik aramada ve birden çok bölümde kararlı sonuç gerekir.

Fiziksel iPhone, tam video oynatma/indirme, çevrimdışı ve altyazı-ses senkronu testi yapılmadı.
