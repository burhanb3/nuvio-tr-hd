# Film ve dizi kapsam hedefi

Kullanıcı yalnız birkaç deneme filminde sonuç istemiyor: farklı film/dizilerde küçük ve büyük, farklı gerçek çözünürlükte, online ve indirilebilir Türkçe altyazılı seçenekler istiyor. **Bu hedef tamamlanmadı; 1.6.3 ilk kapsam artışıdır.**

Deneme listesi [validation/titles.json](../validation/titles.json) içinde 14 vaka içerir. Başlıklar ve yıllar 26 Ekim 2026’da TMDB’nin public film/dizi sayfalarıyla karşılaştırıldı. Çalıştırıcı gerçek kaynak ve altyazı istekleri yapar, TMDB API metadata’sını sabit referans verir; telefonun enjekte anahtarını veya native ağ köprüsünü sınamaz.

Çalışma ölçütleri: filmde 3 GiB, bölümde 1 GiB altında en az bir gerçek MP4/MKV + Türkçe altyazı; ayrıca en az iki ölçülen piksel boyutu ve Türkçe altyazılı online seçenek. Bunlar kullanıcı için seçilen ilk ölçüm eşikleridir, her boyutun/kalitenin hazır olduğu anlamına gelmez. İki çözünürlük dosya adından değil, konteynerden okunur. Aynalar aynı hash/boyuta sahipse ayrı dosya başarısı sayılmaz.

**Bu ölçütlerin geçmesi tam oynatma, ses tercihi, doğru sahne senkronu ve uçak modu testi değildir.** Altyazı puanı ayrıca raporlanır; süre uyumu tam senkron diye sunulmaz.

## 1.6.3 kaynak kontrolü

| Deneme | Doğrulanan farklı dosya | Küçük dosya + TR | Ölçülen piksel seçenekleri | Durum |
| --- | ---: | --- | --- | --- |
| Spider-Man: No Way Home (2021) | 1 | Evet, yaklaşık 840 MiB | 720×304 | Daha yüksek kalite eksik; dosya adı Fransızca ses ipucu taşıyor |
| Spider-Man: Into the Spider-Verse (2018) | 1 | Evet, 1,88 GiB | 1920×800 | Başka küçük/kalite seçeneği eksik |
| Dune (2021) | 2 | Evet, yaklaşık 756 / 905 MiB | 1280×536 / 1146×480 | Küçük MKV’nin ses track’i Hintçe; TR harici altyazı var |
| The Matrix (1999) | 0 | Hayır | — | Dosya kaynağı eksik |
| Inception (2010) | 0 | Hayır | — | Dosya kaynağı eksik |
| Interstellar (2014) | 5 | Evet | 1920×1080 / 1152×480 / 853×480 | Kaynak ölçütleri geçti |
| Obsession (2026) | 6 | Evet | 1002×480 / 1280×720 / 1920×920 ve diğerleri | Kaynak ölçütleri geçti; sürüm/senkron her dosyada ayrı değerlendirilir |
| Fleabag S01E01 | 1 | Evet, yaklaşık 99 MiB | 848×354 | İçerik örnekleri doğru bölümle eşleşti; ikinci kalite eksik |
| Fleabag S02E01 | 0 | Hayır | — | Doğrulanmış indirme eksik |
| Shameless (ABD) S01E01 | 0 | Hayır | — | Doğrulanmış indirme eksik |
| Game of Thrones S01E01 | 0 | Hayır | — | Doğrulanmış indirme eksik |
| Breaking Bad S01E01 | 0 | Hayır | — | Doğrulanmış indirme eksik |
| Death Note S01E01 | 4 | Evet | 852×480 / 1280×720 | Kaynak ölçütleri geçti |
| Night of the Living Dead (1968), kontrol | 10 | Evet | Çeşitli gerçek boyutlar | Kaynak ölçütleri geçti; popüler film boşluğunun yerine başarı sayılmaz |

Bu turda 14/14 vaka Türkçe altyazılı online seçenek verdi; 8/14 vakada küçük indirilebilir + TR bulundu, 5/14 vaka ölçülen kaynak ölçütlerini geçti. Önceki 1.6.2 aynı liste kontrolünde küçük indirme + TR 3/14, tüm kaynak ölçütleri 2/14 idi. **Her başlık için sorunsuz indirme hedefi hâlâ açık.** Anlık erişim değişebilir; No Way Home önceki bazı turlarda boş kaldı. Son dosya kontrolünde resmi doğrudan arşiv sunucusu kullanıldı.

Kanıtlar: [1.6.2 başlangıç matrisi](../compatibility/coverage-baseline-163.json), [1.6.3 matrisi](../compatibility/coverage-163.json). Tam film oynatma/indirme, fiziksel iPhone ve çevrimdışı test yapılmadı. Ses dili bulunmadıysa özgün ses varsayılmaz.

## Neler düzeltildi?

- Archive aramasında yalnız `year` alanı dolu kayıtlarla yetinilmez. Yılı eksik kayıtta hem tam başlık+yıl hem tam dosya adı+yıl ve gerçek konteyner süresi gerekir. Açık yanlış yıl/IMDb/TMDB yine reddedilir. Bu yolun süre toleransı daha sıkıdır; belirgin eksik film kabul edilmez.
- Dune kaydındaki `date:2004` çelişkisi ve Fleabag S01E01’deki yıl/ID eksikliği genel kurallar gevşetilerek aşılmadı. Kanonik TMDB/IMDb’ye bağlı bağımsız online sürümle iki ayrı 20 saniyelik görüntü örneği karşılaştırıldı. Yalnız bu kesin dosyalar için kimlik/bölüm, metadata SHA-1/boyut, gerçek Range hash’i/piksel/süre sabitlendi; değişirse reddedilir. Dune MP4’ünün metadata’sı doğrulanan MKV’den türediğini belirtir; MP4’ün görüntüsü ayrıca karşılaştırılmadı. [İçerik kanıtı ve sınırlar](../compatibility/content-163.json). Dune referansının örneklerden hesaplanan hız farkı altyazıya otomatik uygulanmaz. SHA-1 tam dosyayı indirerek yerelde hesaplanmış değildir; OpenSubtitles hash’i kriptografik bütünlük garantisi değildir.
- Başlığı benzeyen röportajlar, incelemeler, fragmanlar metadata kotasını tüketmez. Başlık/yıl ile en ilgili kayıtlar önce, en çok 12 metadata ikişer işlenir. Hazır adaylar kalan metadata’yı beklemeden dosya kontrolüne iletilir; kaynağın toplam aday kotası korunur.
- Archive’ın metadata’da verdiği resmi dosya sunucuları kullanılır. Ana adresteki ek yönlendirmeler azaltılır; varsa aynı dosyanın ikinci resmi kopyası ağ hatasında denenir. 401/403/429 zorlanmaz; farklı dosyaya veya keyfi sunucuya geçilmez. GET Range hem gerçek byte toplamını hem konteyneri denetler.
- HDHub’da uzantısız gösterim başlığı dosya yok sanılmaz. Host başlığındaki uzantı yalnız isim ipucudur; gerçek format yine probe/köprüyle doğrulanır. No Way Home’un `Marvel Phase 4` koleksiyon etiketi, doğru TMDB/başlık/yıl koşullarıyla ayırt edilir. Obsession’ın TMDB’de doğrulanan gösterim yılı farkı burada da uygulanır.
- MP4/MKV ses track dili okunabildiğinde gösterilir. Dosya adından ses ipucu **tahmini** diye yazılır. Film başlığındaki “French” gibi sözcükler ses kanıtı sayılmaz. Bu sürüm mevcut boyut/kalite sıralamasını korur; özgün ses filtresi henüz eklenmedi.

## Araştırıldı, başarı sayılmadı

- MoviesDrive/Pixel’de 566.912.339 byte gerçek Dune MKV’ye ulaşıldı. Resmi Pixel API Range 206 verdi. Uzantısız MKV Nuvio tarafından MP4 adıyla kaydedilebildiğinden, doğru ad sağlayan bir yol doğrulanmadan sunulmadı. Tahmin edilen `.mkv` API yolları 404 döndü. Erişim/limit atlama yapılmadı.
- FilmModu’nun güncel `.one` adresinde iki Spider-Man için 480/720/1080 HLS ve Türkçe altyazı var. İncelenen listeler parçalı HLS; MP4/MKV diye sunulmadı. Eski `.ws` adresi zaman aşımı verdi. Başka eklentinin ayırt etmeden “1080p” yazması dosya kanıtı sayılmadı.
- StreamFlix public metadata’sında doğru TMDB/IMDb/yıl var, ama incelenen dosya sunucuları DNS hatası/404 verdi. Firebase REST izin reddi verdi; başka oturum veya anahtarla etrafından dolaşılmadı.
- HDRezka araması yanıt verdi, film sayfası Anubis bot kontrolü istedi. Kontrol çözülmedi, sağlayıcı çalışan kaynak olarak eklenmedi.
- Archive’daki diğer Fleabag/Breaking Bad bölüm dosyalarında yıl/kimlik eksikliği sürüyor; S01E01 onayı diğer bölümlere taşınmaz. OpenSubtitles’ın hesapsız anonim XML-RPC oturumu ve dosya hash sorgusu incelendi; örnek Fleabag dosyasının hash’i bulunmadı. Dosya adı aramasının hedef diziyi bulması gerçek dosya kimliği kanıtına çevrilmedi. S01E01 daha sonra yukarıdaki bağımsız görüntü karşılaştırmasıyla eklendi. Oturum tokenı yayımlanmaz.

## Yeniden çalıştırma

```sh
npm run test:coverage
npm run test:coverage -- --titles=no-way-home,spider-verse,dune --output=.cache/coverage-selected.json
npm run test:coverage -- --require-all
npm run check
```

Varsayılan rapor `.cache/coverage-live.json` içindedir. `--require-all` yalnız bütün kaynak ölçütleri geçerse başarılı çıkar; CI’da uzak kaynaklara bağlı test çalıştırılmaz. Raporlar erişim URL’si, başlık değeri, kullanıcı anahtarı veya altyazı metni içermez. Tam dosya indirilmez; HTTP gövdeleri sınırlıdır.

Sonraki öncelik normal diziler, Matrix/Inception ve Spider-Man filmlerinin ek kaliteli indirmeleridir. Bir diğer uygulanabilir yol, özgün HLS’yi ayrı bir hazırlama servisinde gerçek MP4’e paketlemektir. Tam dosya hazır olmadan indirilebilir gösterilemez; GitHub Pages bu işlemi yapamaz. Yerel PC prototipi ve kaynak kullanımı ayrıca sınanmalıdır. **Böyle bir hazırlama servisi henüz kurulmadı/yayımlanmadı; mevcut Sites köprüsü 1.4.0’dır.**
