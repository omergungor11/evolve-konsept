# WeEvolveIT — Next.js konsept çalışması

WeEvolveIT sitesinin yerel kopyası, Next.js 16 App Router ve React 19 üzerinde çalışır. Masaüstü ve mobil tasarım, fontlar ve görseller referansın 12 Ekim 2026 tarihli arşivinden gelir. Küre, yorum şeridi, yatay metot sahnesi, arka plan dalgaları ve footer hareketleri düzenlenebilir React/GSAP/Three.js bileşenleridir.

## Çalıştırma

Node.js 20.9 veya üstü gerekir.

```sh
npm install
npm run dev -- --port 4173
```

Üretim sürümü:

```sh
npm run build
npm start -- --port 4173
```

Önizleme: [localhost:4173](http://localhost:4173/)

## Yapı

- `app/`: App Router sayfaları, layout ve yerel API uç noktaları.
- `components/home/`: WebGL küresi, hero, yorumlar ve kaydırmaya bağlı beş aşamalı metot animasyonu.
- `components/site/`: menüler, arama, noktalı arka plan, yumuşak kaydırma ve footer.
- `components/diagnosis/`: React durumuyla çalışan tanı ve iletişim akışları.
- `components/content/` ve `lib/reference.ts`: arşivlenmiş editoryal içeriği sunucuda React düğümlerine dönüştürür; iç bağlantılar Next.js Link kullanır.
- `reference/pages/` ve `reference/routes.json`: 307 rotanın içerik kaynağı. İçerik anlık arşivdir; CMS bağlantısı yoktur.
- `public/reference-assets/`: referansın stilleri, fontları ve araştırma için saklanan dağıtım paketleri. Arşiv JavaScript paketleri uygulamada çalıştırılmaz; /_next/ yalnızca yeni Next.js derlemesine aittir.
- `public/images/`, `public/logos/`, `public/brand/`, `public/data/`: yerel görsel ve coğrafi varlıklar.
- `server.mjs` ve `public/local/runtime.js`: önceki arşiv sunucusu; Next.js uygulamasının çalıştırma yolunda kullanılmaz.

## Kontroller

```sh
npm run typecheck
npm run build
npm test
npm run verify
```

npm test, üretim derlemesini geçici bir portta açar; tüm rotaları, yerel API sınırını ve arşiv betiklerinin yüklenmediğini kontrol eder. npm run verify, arşivdeki bağlantı ve varlık referanslarını, dosya boyutlarını ve SHA-256 bütünlüğünü doğrular. Tarayıcı kontrol notları verification/ klasöründedir.

Güncel sonuçlar: [Next.js geçiş raporu](verification/next-migration.md).

## Yerel demo davranışı

Form adımları ve doğrulama yerelde çalışır. /api/lead başarılı demo yanıtında local: true, delivered: false döndürür; kişisel bilgiler saklanmaz veya e-posta/CRM/WhatsApp üzerinden gönderilmez. Canlı analiz gerektiren diğer API işlemleri 503 ile açıkça yerel önizleme sınırını bildirir. Arşivdeki analytics betikleri yüklenmez. Küre üzerindeki konum Ankara olarak sabittir; dış sosyal medya bağlantıları normal bağlantılardır.

Referansın marka ve içerik hakları ilgili sahiplerine aittir.
