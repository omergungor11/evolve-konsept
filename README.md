# WeEvolveIT — yerel replika

`https://weevolveit.com/` sitesinin 12 Ekim 2026 tarihinde alınmış, yerelde çalışan kopyası. Orijinal HTML, CSS, JavaScript, font ve görseller birlikte saklanır. Böylece masaüstü/mobil düzen, WebGL küresi, GSAP kaydırma animasyonları, yatay metot bölümü, yorum kartları, menüler ve çok adımlı etkileşimler özgün uygulama koduyla çalışır.

## Çalıştırma

Node.js 20 veya üstü yeterlidir; üçüncü parti npm bağımlılığı yoktur.

```sh
npm install
npm run dev -- --port 4173
```

Tarayıcı: http://localhost:4173

`npm start` varsayılan olarak 3000 portunu kullanır. `PORT=4173 npm start` da kullanılabilir. `npm run build` kaydedilen sayfalardaki görsel, betik, stil, font, veri ve dinamik paket referanslarını, ayrıca tüm varlıkların boyut ve SHA-256 bütünlüğünü denetler; ayrıca derleme gerektirmez. `npm test` tüm kayıtlı rotaların, varlıkların ve görsel eşlemelerinin yerel HTTP sunucusunda açıldığını, arama/küre desteğini ve dış servislere veri gönderilmesini önleyen sınırı doğrular.

## Dosyalar

- `reference/pages/`: özgün sayfa belgeleri; `reference/routes.json` rota envanteri.
- `public/_next/static/`: özgün uygulama paketleri, stiller ve fontlar.
- `public/images/`, `public/logos/`, `public/brand/`: yerel görseller.
- `public/asset-manifest.json`: kaynak ve yerel dosya eşlemeleri.
- `public/local/runtime.js`: yerel gezinme, konum verisi ve form demo uyarlaması.
- `server.mjs`: harici ağa bağlanmadan kaydedilmiş sayfaları/görselleri sunan küçük HTTP sunucusu.
- `scripts/mirror-pages.py`, `scripts/mirror-assets.py`: kaynak envanterini yeniden oluşturma araçları; yeniden indirme sırasında internet gerekir.

## Davranış ve sınırlar

Sayfa içindeki animasyon ve durum değişiklikleri özgün React/GSAP uygulamasından gelir. İç bağlantılar yerel belgeleri açar; orijinal sunucuya ihtiyaç olmaması için sayfalar arası gezinme tam belge yüklemesi kullanır. Görseller için Next.js image uç noktası yerel orijinalleri sunar.

Formların adımları ve doğrulaması korunmuştur. Son müşteri talebi gönderimi yerel demo olarak tamamlanır ve verilerin gönderilmediğini belirten bir bildirim gösterilir. E-posta/CRM/WhatsApp mesajı gönderilmez. Canlı analiz servisleri gerektiren araçların sunucu işlemleri çevrimdışı kopyada çalışmaz. Analytics, reklam pikselleri ve üçüncü taraf veri istekleri engellenir. Küre üzerindeki konum Ankara olarak sabitlenmiştir. Harici sosyal medya bağlantıları normal dış bağlantılar olarak kalır.

Kaynak sitenin telif/marka hakları ilgili sahiplerine aittir. Bu çalışma kullanıcı talebi üzerine yerel inceleme ve geliştirme içindir.
