# evolve-konsept · WeEvolveIT

[WeEvolveIT](https://weevolveit.com/) sitesinin Next.js 16 App Router ve React 19 ile yeniden kurulmuş konsept çalışması. 307 içerik rotası statik React sayfası olarak üretilir; WebGL küre, yorum şeridi, kaydırmaya bağlı metot sahnesi, tanı akışı ve footer hareketleri düzenlenebilir React / GSAP / Three.js / Matter.js bileşenleridir.

**Canlı önizleme:** [evolve-konsept.vercel.app](https://evolve-konsept.vercel.app/)

## Öne çıkanlar

- **WebGL küre** (Three.js): noktalı dünya, konum rozeti ve logo birleşme animasyonu.
- **Yatay metot sahnesi**: kaydırmaya bağlı beş aşamalı GSAP ScrollTrigger animasyonu.
- **Yorum şeridi**: sürekli akış, hover'da duraklama, sürükleme (sürükleme tıklamayı tetiklemez).
- **Tanı akışı**: problem → isim → şirket → parçacıklı sonuç → iletişim; React durumuyla çalışır.
- **Footer**: Matter.js fizikli manifesto ve parçacık torusu.
- **Arama**: `/search?q=` Next router ile, sayfa yenilemeden.
- Lenis yumuşak kaydırma, masaüstü/mobil menüler, noktalı arka plan dalgaları.

## Çalıştırma

Node.js 20.9 veya üzeri gerekir.

```bash
npm install
npm run dev -- --port 4173
```

Önizleme: [localhost:4173](http://localhost:4173/)

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve sunucusu |
| `npm run typecheck` | TypeScript kontrolü |
| `npm test` | Üretim derlemesini geçici portta açar; tüm rotaları, form API sınırını ve arşiv betiklerinin yüklenmediğini denetler |
| `npm run verify` | Arşivdeki bağlantı/varlık referanslarını, dosya boyutlarını ve SHA-256 bütünlüğünü doğrular |

Ortam değişkeni, veritabanı veya CMS bağlantısı gerekmez.

## Yapı

```text
app/                    App Router: anasayfa, [...slug] içerik rotaları, /api, /llms.txt
components/home/        WebGL küre, hero, yorumlar, metot animasyonu
components/site/        Menüler, arama, noktalı arka plan, yumuşak kaydırma, footer
components/diagnosis/   Tanı ve iletişim akışı
components/content/     Arşivlenmiş editoryal HTML'i sunucuda React düğümlerine çevirir
lib/reference.ts        İçerik yükleyici (iç bağlantılar Next Link'e çevrilir)
reference/              307 rotanın içerik kaynağı ve routes.json
public/                 Stiller, fontlar, görseller, logolar, coğrafi veri
scripts/                Test, doğrulama ve varlık yansıtma yardımcıları
verification/           Doğrulama raporları ve ekran görüntüleri
```

`server.mjs` ve `public/local/runtime.js` önceki arşiv sunucusundan kalmadır; Next.js uygulaması bunları kullanmaz. Referansın JavaScript paketleri de yüklenmez, `/_next/` yalnızca yeni derlemeye aittir.

## Demo sınırları

- Form adımları ve doğrulama yerelde çalışır. `/api/lead` başarılı yanıtta `local: true, delivered: false` döner; kişisel bilgi saklanmaz, e-posta/CRM/WhatsApp'a gönderilmez.
- Canlı analiz gerektiren diğer API çağrıları 503 ile yerel önizleme sınırını bildirir.
- İçerik 12 Ekim 2026 tarihli anlık arşivdir. Analytics betikleri yüklenmez; küredeki konum Ankara olarak sabittir.

## Doğrulama

Ayrıntılı sonuçlar: [verification/next-migration.md](verification/next-migration.md)

- `typecheck`, `build` (311 statik çıktı), `npm test` (4/4) ve `npm run verify` (307 belge, 472 dosya) geçti.
- 390×844 mobilde başlık, tanı bölümü ve sayfa yüksekliği ölçümleri referansla bire bir eşleşti.
- Yorum şeridi hızı 70,22 px/sn (referans 70,24 px/sn).

## Deploy

Vercel'de Next.js ön ayarıyla, ek yapılandırma olmadan yayınlanır.

## Haklar

Marka, metinler, görseller ve özgün tasarım WeEvolveIT'e aittir. Bu repository bağımsız bir konsept ve teknik çalışmadır; WeEvolveIT ile bir bağı yoktur.
