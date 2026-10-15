# Next.js geçişi — doğrulama raporu

Tarih: 15 Ekim 2026. Referans: https://weevolveit.com/. Üretim önizlemesi: http://localhost:4173/.

## Mimari

Uygulama Next.js 16.4 App Router ve React 19 ile derlenir. 306 HTML içerik rotası statik React sayfası olarak üretilir; /llms.txt ayrı bir metin Route Handler üzerinden sunulur. Arşivdeki editoryal HTML sunucuda React düğümlerine dönüştürülür. İç gezinme Next Link/router ile yapılır. Eski uygulamanın JavaScript/Flight paketleri ve public/local/runtime.js yüklenmez. Referansın CSS ve fontları /reference-assets altında tutulur; /_next yeni derlemeye ayrılmıştır.

Astra koordinasyonunda paralel bileşen ve etkileşim ajanları çalıştı. Küre, logo birleşmesi, yorum şeridi, yatay metot sahnesi, tanı akışı, parçacık/shader efektleri ve footer React/GSAP/Three.js/Matter.js kaynaklarına taşındı. Lenis 1.3.25 ile özgün kaydırma yumuşatması korunur.

## Otomatik kontroller

- npm run typecheck: geçti.
- npm run build: başarılı; 311 statik çıktı (uygulamanın ek rotaları dahil).
- npm test: 4/4 geçti. 307 içerik rotası HTTP üzerinden tarandı; yerel form API doğrulaması, 404, metin uç noktası ve arşiv betiklerinin kullanılmaması denetlendi.
- npm run verify: 307 belge, 472 dosyanın SHA-256 bütünlüğü ve 241.941 kaynak referansı doğrulandı.
- git diff --check: geçti.

## Tarayıcı kanıtları

- 390 × 844 mobilde referans ve üretim sürümü: başlık üstü 477.421875 px, başlık yüksekliği 162 px, genişliği 347 px; tanı bölümünün belge üzerindeki başlangıcı 6553.3046875 px ve görünür durumdaki yüksekliği 577.59375 px; sayfa yüksekliği 9198 px. Tarayıcı 11 px kaydırma çubuğu ayırdığı için içerik genişliği 379 px. İki sürümün ölçümleri bire bir eşleşti: next-mobile-comparison.json.
- İlk karşılaştırmada referansın henüz görünür olmayan scramble etiketleri boştu; bölüm görünür olduktan sonra yükseklikler eşleşti. Bu geçici durum CSS ile zorlanmadı.
- Masaüstü başlık konumu ve metin geometrisi önceki referans ölçümleriyle eşleşti. Yerel dünya, Ankara rozeti, noktalı arka plan ve logo animasyonu çalıştı.
- Yorum şeridi sabit dış alanla gözlemlenir; bir ekran genişliğini geçince durmaz. 59.031 saniyelik örnekte 3512 px döngü dahil toplam yaklaşık 4145.3 px hareket, 70.22 px/sn (özgün hedef 70.24 px/sn) ölçüldü. Hover duraklaması ve kart genişletme korunur; kart üzerinden sürükleme tıklamayı tetiklemez.
- Mobil menü açma/kapatma görünür ve kullanılabilir. StrictMode nedeniyle mobil panelin masaüstü menü listesine karışması düzeltildi; kapalı alt menüler inert tutulur.
- Hizmetlerde Cloud, Data & AI filtresi beş kart gösterdi; liste görünümü çalıştı.
- Başlık araması /search?q=seo adresine Next router ile geçti ve 16 sonuç verdi. Aynı sayfada ikinci sorgu cloud olarak yenilendi.
- Tanı akışı problem → isim → şirket/site → parçacıklı sonuç → iletişim → tamamlandı durumuna ulaştı. demo@example.com ve örnek telefonla yerel doğrulama yapıldı; arayüz veri gönderilmediğini açıkça gösterdi. Aurora/partikül ve sonuç ekranında konsol hatası görülmedi.
- Footer iletişim kartları, sosyal bağlantılar, saatler ve parçacık torusu render edildi. Manifestoyu sürüklemek SVG metin başlangıcını -181.9484% değerinden -147.8623% değerine taşıdı; torus tıklaması sonrasında konsol hatası oluşmadı.
- Masaüstü üretim ekranında 1440 × 900 başlık kutusu: x=16, y=660, genişlik=1397, yükseklik=222 px. Metot sahnesi ve footer ekran görüntüleri kaydedildi. Yorum sürüklemesinde 250 px yer değiştirme (döngü sarması dahil) ölçüldü; sürükleme kartı açmadı, sonraki tıklama açtı.

## Sınırlar

İçerik kaynağı 12 Ekim tarihli arşivdir; CMS veya referansın canlı veri servisleri bağlı değildir. Form demo uç noktası veriyi saklamaz veya dışarı göndermez; canlı analiz API'leri 503 döndürür. Rastgele parçacıklar, değişen etiketler, saatler ve şeritler anlık ekran görüntülerinde farklı olabilir. 307 rotanın tamamı HTTP kontrolünden geçti; her iç sayfanın bütün animasyon durumlarının piksel düzeyinde eşitliği iddia edilmez. screenshots/next-* dosyaları geçiş sonrası kanıtları içerir.
