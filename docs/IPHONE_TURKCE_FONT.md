# iPhone’da uygulama kodunu değiştirmeden Türkçe font

İki farklı sorunu ayırın:

- `ş` yerine `ÅŸ` gibi metin: dosyanın kodlaması bozulmuştur. Eklenti temiz alternatif seçebilir; mevcut uzak dosyayı yeniden yazmaz.
- `ş` doğru, şekli diğer harflerden farklı: oynatıcı font seçimi/fallback sorunudur. Eklenti Nuvio’nun dahili fontunu seçemez.

## Mevcut alternatif: VLC

Nuvio KMP **0.6.4-beta** iOS kodunda VLC harici oynatıcı desteği vardır. `vlc-x-callback` ile video adresi ve varsa ilk altyazı adresi gönderilebilir. Uygulamayı yeniden derlemek gerekmez; iPhone’a VLC kurmak ve Nuvio’nun mevcut harici oynatıcı ayarını kullanmak gerekir.

1. iPhone’da VLC’yi kurun.
2. Nuvio’nun **Ayarlar → Oynatma** bölümünde harici oynatıcı seçimini VLC yapın. Menü adları uygulamanın diline/sürümüne göre farklı olabilir.
3. Harici oynatıcıya altyazı gönderme seçeneğini açın; tercih edilen altyazı dilini Türkçe seçin.
4. VLC’de **Settings → Subtitles → Font** üzerinden Türkçe harfleri içeren bir font seçin (örneğin Arial).
5. Önce bir videoda `ş Ş ğ Ğ ı İ ç Ç ö Ö ü Ü` içeren bir altyazıyı kontrol edin.

**Fiziksel iPhone’da denenmedi.** Harici oynatıcıya altyazı hazırlama, Nuvio’nun kendi dil tercihi, addon araması ve indirilmiş altyazı yolunu kullanır. Bu yüzden eklentide en üstte sıralanan TR dosyasının her durumda aynen VLC’ye aktarılacağını veya çevrimdışı aktarımın sorunsuz olacağını vaat etmiyoruz. Aktarım çalışmazsa VLC’de uygun SRT/VTT dosyası ayrıca açılabilir. Video ile TR altyazının bir arada otomatik/offline açılması ayrıca cihazda sınanmalıdır.

Nuvio’nun **kendi iOS oynatıcısında** font ailesi için plugin alanı veya mevcut kullanıcı ayarı bulunmadı. Bu yolu kullanırken hazırlanan uygulama yaması hâlâ uygulanmış değildir.

## Kaynaklar

- [Nuvio iOS harici oynatıcı/VLC köprüsü](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/iosMain/kotlin/com/nuvio/app/features/player/ExternalPlayerPlatform.ios.kt)
- [Nuvio altyazı aktarım hazırlığı](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/player/ExternalPlayerLaunchCoordinator.kt)
- [Nuvio oynatma ayarları](https://github.com/NuvioMedia/NuvioMobile/blob/0.6.4-beta/composeApp/src/commonMain/kotlin/com/nuvio/app/features/settings/PlaybackSettingsPage.kt)
- [VLC iOS resmî font ayarı](https://docs.videolan.me/vlc-user/ios/3.X/en/basic/settings.html)
