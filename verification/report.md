# WeEvolveIT kopyası — kontrol notları

Bu, Next.js geçişinden önceki arşiv sürümünün tarihsel raporudur. Güncel uygulama ve kontroller [Next.js geçiş raporunda](next-migration.md) açıklanır.

Kontrol tarihi: 13 Ekim 2026. Referans: https://weevolveit.com/. Yerel önizleme: http://localhost:4173/.

## Kapsam ve yöntem

307 sayfanın özgün HTML belgeleri ve tarayıcıya sunulan uygulama paketleri yerelleştirildi. Yazı tipleri, görseller, CSS, React/GSAP/Three.js animasyonları ve coğrafi veri yerel dosyalardan yüklenir. Kaynak sitenin düzenini ve etkileşimlerini korumak için özgün dağıtım kodu kullanıldı; bu klasör özgün, düzenlenebilir React/TypeScript kaynak projesi değildir.

Astra koordinasyonunda eş zamanlı sayfa/bağlantı ve dosya/bağımlılık ajanları çalıştı. Son görsel kontrol Chrome üzerinden yapıldı.

## Tarayıcıda doğrulananlar

- Masaüstü 1440 × 900: parçacıklı dünya, otomatik dönüş, sürükleyerek döndürme, Ankara konum rozeti, noktalı arka plan ve açılış metinleri.
- Koyudan açığa sıvı geçiş, sabitlenen yatay beş aşama sahnesi, büyük aşama numaraları ve ilerleme grafiği.
- Mobil 390 × 844: referans ve kopyanın başlık kutusu, bölüm konumları, sayfa yüksekliği ve yatay genişliği eşleşti. Ölçümler `mobile-comparison.json` içinde.
- Mobil 375 × 812: yatay sayfa taşması yok; dünya, başlık, menü, yatay aşamalar ve footer kontrol edildi.
- Mobil menü açma/kapatma ve İngilizce → İspanyolca dil geçişi.
- Başlıktan `seo` araması: yerel `/search?q=seo` sayfasında referansla aynı 16 sonuç.
- Hizmetlerde Cloud, Data & AI filtresi: ilgili beş kart. Liste görünümüne geçiş.
- Yorum şeridinde kart tıklaması: uzun yorum genişledi, daraltma kontrolü göründü.
- Takip kontrolü: yorum şeridi bir ekran genişliği ilerleyince duruyordu. Görünürlük gözlemcisi hareketli şeritten sabit dış alana taşındı. Uygulama içi önizlemede 478 px genişlikte, 34,8 saniyede 2.445 px hareket (70,25 px/sn; özgün hız) ölçüldü; şeridin kendi kutusu ekran dışına çıktıktan sonra da kayma sürdü. Sunucu testleri tekrar 9/9 geçti.
- Tanı akışı: problem → isim → şirket → parçacık animasyonlu sonuç → iletişim alanları → yerel demo gönderim bildirimi. Test verileri `demo@example.com` ve örnek telefon numarasıydı.
- Kontrol edilen ana sayfa/mobil görünümlerde bozuk görsel yok; dünya sürükleme kontrolünde konsol hatası yok.

## Dosya ve bağlantı denetimi

- 307 sayfa, 472 dosya, 322 görsel eşlemesi.
- 36.292 iç bağlantı kayıtlı rotalara çözülüyor; açıkta kalan rota yok.
- `npm run build`: 241.941 belge, görsel, CSS, font, dinamik paket ve veri referansı ile dosya SHA-256 bütünlük kontrolleri geçti.
- `npm test`: 9/9 geçti; bütün rotalar, dosyalar, görsel uç noktaları, dünya verisi ve arama uyarlaması kapsanıyor.
- Son taramada eksik iki İspanyolca makale görseli eklendi. Dünya için GeoJSON bağımlılığı ve aramanın URL sorgusuyla başlaması düzeltildi.

## Bilinen farklar

İç sayfalar arasında gezinme, kaydedilen Next.js belgelerini tam yükleyerek çalışır. Son form gönderimi yerel demo olarak tamamlanır; gerçek e-posta/CRM/WhatsApp mesajı gönderilmez. Canlı analiz araçlarının sunucu işlemleri kopyada mevcut değildir. Konum Ankara olarak sabittir; analytics ve üçüncü taraf veri istekleri engellenir. Hareketli parçacıklar, kayan şeritler ve saatler zamana bağlı olduğundan iki ekran görüntüsünün anlık pikselleri farklı olabilir.

307 sayfanın tamamı HTTP/dosya/bağlantı kontrolünden geçti; her sayfanın bütün animasyon durumları tek tek görsel olarak karşılaştırılmadı. `screenshots/` klasörü ana masaüstü, mobil, metot, menü, tanı ve arama kontrollerinin görüntülerini içerir.
