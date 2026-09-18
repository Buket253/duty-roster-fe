# Nöbet Sistemi — Frontend

Hastane nöbet listesi yönetim sisteminin arayüzü. Yönetici paneli (JWT ile korumalı)
ve ekip üyeleri için girişsiz, salt-okunur paylaşım görünümü.

Backend: [duty-roster-api](https://github.com/Buket253/duty-roster-api)

## Kurulum

```bash
npm install
cp .env.example .env     # VITE_API_URL backend adresini göstermeli
npm run dev              # http://localhost:5173
```

Backend'in ayrıca çalışıyor olması gerekir (varsayılan `http://localhost:4000`) ve
backend'in `CORS_ORIGIN` değeri bu adresi içermelidir.

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | `dist/` altına üretim derlemesi |
| `npm run preview` | Derlemeyi yerel olarak sunar |
| `npm run lint` | oxlint |

## Ekranlar

| Yol | Ekran | Auth |
|---|---|---|
| `/login` | Yönetici girişi | — |
| `/dashboard` | Özet istatistikler + birim kartları | JWT |
| `/nobet-listesi/:unitId` | Aylık takvim, ekip sayaçları, manuel düzenleme | JWT |
| `/kurallar/:unitId` | Kural formu + "Bu ayın etkisi" paneli | JWT |
| `/calisanlar/:unitId` | Çalışan tablosu + izin listesi ve formu | JWT |
| `/paylasim/:token` | Salt-okunur, mobil öncelikli görünüm | yok |

Token `localStorage`'da `nobet-token` anahtarında tutulur. API 401 döndüğünde
`api/client.js` token'ı temizler ve `AuthContext` oturumu kapatır.

## Yapı

```
src/
  pages/       Login · Dashboard · NobetListesi · KuralAyarlari · CalisanYonetimi · PublicView
  components/  Sidebar · CalendarGrid · EmployeeRoster · RuleForm · StatusBadge
  api/         client.js — JWT header'ını otomatik ekleyen fetch sarmalayıcı
  context/     AuthContext.jsx
  styles/      tokens.css — tasarım token'ları + tüm bileşen stilleri
  utils.js     Tarih/ay yardımcıları, flag ve izin tipi metinleri
```

Stil düz CSS; harici UI kütüphanesi yok. Yazı tipleri Google Fonts'tan
**IBM Plex Sans** (arayüz) ve **IBM Plex Mono** (sayılar, tarihler, sayaçlar).

## Nöbet Listesi Ekranı

Tek bir API çağrısı (`GET /api/admin/schedules/:unitId/:year/:month`) ekranın
tamamını besler: atamalar, kişi bazlı nöbet sayaçları, kural seti, izinler ve
uyarı özeti aynı yanıtta gelir.

- **Ekip paneli** — "x/y nöbet" sayacı ve ilerleme çubuğu; aylık limite ulaşan
  kişide çubuk amber, normalde teal. Minimumun altında kalanlar ayrıca işaretlenir.
- **Takvim** — Nöbet teal, mesai gri-mavi chip. `flags` dolu günler kırmızı çerçeve
  ve uyarı etiketi alır.
- **Manuel düzenleme** — Bir güne tıklamak o günün slotlarını açar. Açılır listede
  yalnızca kuralları sağlayan adaylar görünür; seçilemeyenler sebebiyle birlikte
  ("Yetersiz dinlenme", "İzinli"…) listelenir. Kayıtta backend tüm listeyi yeniden
  kontrol eder ve dönen yanıt ekranı günceller.
