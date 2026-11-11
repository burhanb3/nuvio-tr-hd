# Nuvio Desktop ikili HTTP yanıtı düzeltmesi

Nuvio Desktop 1.1.35'in incelenen Windows paketinde `httpRequestRaw`, video
yanıtını `String` olarak okuyor. `RawHttpResponse.bodyBytes` alanının varsayılanı
bu metni UTF-8 ile yeniden kodluyor. Geçersiz UTF-8 dizileri bu sırada kayboluyor.
MP4/MKV aralık kontrolleri uzunluk veya konteyner uyuşmazlığı nedeniyle eleniyor.

Yerel kontrollü testte 131.072 byte gönderildi. Asıl paketin eklenti motoru
262.144 byte ve 97.536 farklı konum döndürdü. Düzeltme aynı testte 131.072 byte
ve sıfır fark döndürdü. Türkçe UTF-8 metin, boş gövde, tam boyut ve kesilmiş yanıt
testleri de geçti.

Yerel ham HTTP çağrısına toplam 10 saniye sınırı eklenir. Önceki socket
zaman aşımı her IP adresi için yeniden bekleyebiliyordu. Bu toplam süre
bağlantı tekrarlarını ve gövde okumasını birlikte kapsar. Kontrollü cevap
vermeyen sunucu testi JVM başlangıcı dahil yaklaşık 11,4 saniyede sonlandı.

## Uygulama sınırı

Bu kaynaklar yalnız SHA-256 değeri aşağıdaki olan kurulum JAR'ından düzeltilmiş
bir kopya üretir. Başka sürüm veya derleme reddedilir.

```text
c96931a3aac6572b45db5655738cfbd325cd718cf8438cfd20fe53e1787e7933
```

`BinaryResponseFix` yanıtın sınırlı ham byte'larını ve charset ile çözülen metni
birlikte tutar. Bytecode düzenlemesi yalnız `httpRequestRaw` coroutine sınıfında
bu byte'ları `RawHttpResponse` kurucusuna açıkça verir. Yanıt boyutu sınırı ve
kesilme işareti uygulanır. Aynı sınıftaki `newCall` dönüşüne toplam süre sınırı
eklenir. Normal metin isteklerinin ayrı yolu aynı kalır.

## Geliştirici derlemesi

JDK 21 araçları kullanılabilir. Uygulamaya giren yardımcı sınıflar Nuvio'nun
gömülü Java 17 motoruna uygun derlenmelidir. Aşağıdaki örnekte `<app>`,
kurulu Nuvio'nun `app` dizinidir. `<classes>` ve `<output.jar>` yeni derleme
yollarıdır.

```powershell
javac --release 17 -cp "<app>/*" -d "<classes>" BinaryResponseFix.java BinaryResponseFixTest.java
javac --add-exports java.base/jdk.internal.org.objectweb.asm=ALL-UNNAMED --add-exports java.base/jdk.internal.org.objectweb.asm.tree=ALL-UNNAMED -cp "<app>/*" -d "<classes>" PatchDesktopJar.java
java -cp "<classes>;<app>/*" BinaryResponseFixTest
java --add-exports java.base/jdk.internal.org.objectweb.asm=ALL-UNNAMED --add-exports java.base/jdk.internal.org.objectweb.asm.tree=ALL-UNNAMED -cp "<classes>;<app>/*" PatchDesktopJar "<original.jar>" "<output.jar>" "<classes>"
```

Çalışan uygulamanın JAR dosyası değiştirilmez. Bu bilgisayarda sistem kurulumuna
yazma izni olmadığı için kullanıcı klasöründe düzeltilmiş başlatıcı hazırlandı.
Masaüstündeki **Nuvio TR HD** kısayolu onu açar. Mevcut kurulumun runtime'ı,
diğer kütüphaneleri ve kullanıcı ayarları kullanılır. Kullanıcı Başlat menüsüne
de düzeltilmiş kopyayı açan Nuvio kısayolu eklendi. Ortak kurulumun veya önceden
sabitlenmiş bağlantıların asıl uygulamayı açması mümkündür. Zaten açık eski
uygulama tamamen kapatıldıktan sonra masaüstündeki **Nuvio TR HD** ile açılmalıdır.
Resmî uygulama güncellenirse bu düzeltmenin uyumluluğu
yeniden incelenmelidir.

Tam bölüm oynatımı, tam indirme, çevrimdışı altyazı ve fiziksel telefon
kontrolleri ayrıca yapılmalıdır.

## Kontrollü yerel açılış

`Start-NuvioTRHD.ps1` kullanıcı kopyasının köküne yerleştirilir. Aynı dizinde
`Nuvio TR HD.exe`, `app/Nuvio TR HD.cfg` ve yukarıdaki düzeltilmiş JAR bulunur.
Exe asıl başlatıcının kopyasıdır; cfg mevcut düzeltilmiş cfg'nin kopyasıdır.
Betik yalnız belirtilen final JAR SHA'sını ve ilk classpath girdisini kabul eder.
Başka Nuvio kopyası açıksa onay sorar ve normal pencere kapatma dener. Onay
verilmezse veya eski işlem kapanmazsa yeni uygulama başlatılmaz; zorla kapatma
yapılmaz. `-CheckOnly` uygulama açmadan paket/işlem kontrolü yapar.

Bu bilgisayardaki masaüstü ve kullanıcı Başlat menüsü kısayolları bu betiğe
yönlendirildi. Betik yerel süreç için RemoteSigned politikasıyla çalışır;
kalıcı execution policy değiştirilmez. Ayrı penceresiz başlatıcı kontrolünde
gömülü Java 17.0.20.1 düzeltilmiş JAR'ı ilk sıradan yükledi. Bu kontrol kaynak
ekranının veya oynatmanın çalıştığı anlamına gelmez.
