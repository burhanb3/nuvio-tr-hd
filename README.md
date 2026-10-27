# Nuvio TR HD

[![Testler](https://github.com/burhanb3/nuvio-tr-hd/actions/workflows/ci.yml/badge.svg)](https://github.com/burhanb3/nuvio-tr-hd/actions/workflows/ci.yml)

Nuvio için film, dizi ve anime kaynak sağlayıcısı. Farklı sağlayıcılardaki online yayınları ve indirilebilir MP4/MKV dosyalarını arar; ses, kalite ve Türkçe/İngilizce altyazı seçenekleriyle birlikte listeler.

[Kurulum](https://burhanb3.github.io/nuvio-tr-hd/) · [Kullanım rehberi](docs/BASIT_REHBER.md) · [Ayarlar](docs/AYARLAR.md) · [Sorun giderme](docs/SORUN_GIDERME.md)

## Kurulum

Nuvio **Full** sürümünde **Pluginler → Depo ekle** bölümüne şu adresi yapıştırın:

```text
https://burhanb3.github.io/nuvio-tr-hd/manifest.json
```

**Nuvio TR HD**, **Hızlı İzle**, **Anime** ve **Ek Anime** sağlayıcılarını etkinleştirin. Anime bölümlerinde ek sağlayıcılar birlikte kullanılabilir. Güncellemek için mevcut depoyu yenileyin; yeni Hızlı İzle satırının da açık olduğunu kontrol edin.

Başlangıç için önerilen ayarlar: **Tüm çözünürlükler · 20 alternatif · HLS açık**. Nuvio'nun altyazı tercihini Türkçe seçin.

## Özellikler

- Film ve bölüm seçildiğinde otomatik kaynak araması; TMDB kimliği, özgün başlık, yıl ve sezon/bölüm denetimi.
- Gerçek MP4/MKV dosyaları için konteyner, byte boyutu ve okunabildiğinde piksel/süre kontrolü.
- Online HLS yayınları, Türkçe dublaj ve çoklu ses seçenekleri.
- Ana dosya aramasından bağımsız tamamlanan Hızlı İzle sağlayıcısı.
- Dosya hash'i, sürüm adı ve süreye göre sıralanan mevcut TR/EN SRT/VTT altyazıları.
- Küçükten büyüğe, kaliteye veya uygunluğa göre sıralama; kalite, tür ve sağlayıcı gruplaması.
- İsteğe bağlı kişisel JSON katalogları ve Stremio HTTP kaynakları.

**Örnek sonuç**

> İndirilebilir · Kaynak adı<br>
> 1080p · 1920×800 · 1,80 GB · Ses: TR/EN · TR/EN altyazı

Piksel ve gerçek dosya boyutu varsa öncelikle bunlar kullanılır. Eksik bilgiler kaynak, dosya adı ve bitrate/süre ipuçlarıyla tamamlanır. Online yayının GB değeri aktarım hesabıdır; ölçülmüş bir indirme dosyası değildir. Diller TR/EN önceliğiyle, en fazla beş kod ve kalan sayı olarak gösterilir.

## Kaynak kapsamı

| Alan | Sağlayıcılar |
| --- | --- |
| Film ve dizi dosyaları | Internet Archive, 4KHDHub/HubCloud, HDRezka, Goojara, Waploaded; eski filmlerde RareFilmm |
| Online film ve dizi | PlayIMDb, VixSrc, DiziYou, DiziBak, FilmModu, HDFilmDelisi, DiziBal |
| Anime dosyaları | Animecix, SonAnime, AniMOM, SeiCode/MP4Upload |
| Harici altyazı | AltyazıDB, OpenSubtitles ve kaynakla eşlenmiş TR/EN dosyaları |

Kapsam sağlayıcıya ve bölüme göre değişir. Her yapımın indirilebilir sürümü veya her çözünürlüğü bulunamayabilir. 4K yalnız kaynakta mevcutsa sunulur. Kaynak listesi bir erişilebilirlik garantisi değildir; bozuk bağlantılar elenir.

**İndirilebilir** etiketi gerçek MP4/MKV dosyaları içindir. **Online** HLS kaynakları Nuvio'nun dosya indirme yoluna verilmez. Türkçe altyazı bulunması Türkçe ses bulunduğu anlamına gelmez; yakın sürüm eşleşmesi de tam senkron garantisi değildir.

## Belgeler

- [Kullanım ve kurulum](docs/BASIT_REHBER.md)
- [Kaynaklar ve çalışma biçimi](docs/OTOMATIK_KAYNAKLAR.md)
- [Kişisel JSON/Stremio kaynakları](docs/KAYNAKLAR.md)
- [iPhone'da Türkçe altyazı ve font](docs/IPHONE_TURKCE_FONT.md)
- [Uyumluluk ve doğrulama](docs/UYUMLULUK.md)
- [Sürüm notları](CHANGELOG.md)

## Geliştirme

Node.js 22 veya üzeri gerekir.

```sh
npm ci --ignore-scripts
npm run check
```

Kaynak kod `src/` altındadır; `providers/` dosyaları derleme çıktısıdır. `npm run build` Nuvio paketini ve `dist/` yayın dizinini üretir. Testler örnek konteynerler, bozuk bağlantılar, kimlik/altyazı eşleşmesi ve derlenmiş QuickJS çalışmasını kapsar. Cihazda tam oynatma, indirme ve offline senkron ayrı sınanmalıdır.

[Geliştirici rehberi](docs/GELISTIRME.md) · [Katkı rehberi](CONTRIBUTING.md) · [Hata bildir](https://github.com/burhanb3/nuvio-tr-hd/issues/new/choose)

## Lisans

[MIT](LICENSE). Bu depo sağlayıcı kodunu içerir; medya barındırmaz. Nuvio'nun resmî bir ürünü değildir.
