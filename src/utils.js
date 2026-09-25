export const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const GUNLER_UZUN = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar',
];

/** '2026-10-05T00:00:00.000Z' -> '2026-10-05' */
export const isoDay = (value) => String(value).slice(0, 10);

export const gunNo = (value) => Number(isoDay(value).slice(8, 10));

/** Pazartesi = 0 olacak şekilde haftanın günü. */
export const haftaninGunu = (year, month, day) => (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;

export const haftaSonuMu = (year, month, day) => haftaninGunu(year, month, day) >= 5;

export const ayGunSayisi = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const donemBaslik = (year, month) => `${AYLAR[month - 1]} ${year}`;

/** '2026-10-05T…' -> '05.10.2026' */
export const tarihYaz = (value) => {
  const [y, m, d] = isoDay(value).split('-');
  return `${d}.${m}.${y}`;
};

/** '2026-09-09T…' -> '9 Eylül 2026' — izin listeleri gibi okunan yerlerde. */
export const tarihUzun = (value) => {
  const [y, m, d] = isoDay(value).split('-');
  return `${Number(d)} ${AYLAR[Number(m) - 1]} ${y}`;
};

/** '2026-10-05T…' -> '05.10.2026 Pazartesi' */
export const tarihGunAdiyla = (value) => {
  const [y, m, d] = isoDay(value).split('-');
  return `${tarihYaz(value)} ${GUNLER_UZUN[haftaninGunu(Number(y), Number(m), Number(d))]}`;
};

/** '2026-10' -> 'Ekim 2026' — izinleri ay ay gruplarken kullanılır. */
export const ayBaslik = (yilAy) => {
  const [y, m] = String(yilAy).split('-');
  return `${AYLAR[Number(m) - 1]} ${y}`;
};

/** Bir tarihin ait olduğu ay anahtarı: '2026-10'. */
export const ayAnahtari = (value) => isoDay(value).slice(0, 7);

export const FLAG_METIN = {
  doldurulamadi: 'Doldurulamadı',
  'yetersiz-dinlenme': 'Yetersiz dinlenme',
  'gun-asiri-limit': 'Gün aşırı nöbet limiti aşıldı',
  'cifte-atama': 'Çifte atama',
  izinli: 'İzinli personel',
  'izin-oncesi-hafta-sonu': 'İzin öncesi hafta sonu boş kalmalı',
  'limit-asildi': 'Aylık limit aşıldı',
  'nobete-giremez': 'Nöbete giremez',
  'sorumlu-yedek': 'Sorumlu hemşire yedek olarak yazıldı',
  pasif: 'Pasif personel',
};

export const flagMetni = (flag) => FLAG_METIN[flag] ?? flag;

export const IZIN_TIPI = { yillik: 'Yıllık izin', rapor: 'Rapor', mazeret: 'Mazeret' };

export const PERSONEL_TIPI = {
  standart: 'Standart',
  'sadece-gunduz': 'Sadece gündüz',
  sorumlu: 'Sorumlu hemşire',
};

export const PERSONEL_TIPI_ACIKLAMA = {
  standart: 'Gündüz mesaisine ve nöbete girer, adil rotasyona dahildir',
  'sadece-gunduz': 'Nöbete hiç girmez, gündüz öngörülen her gün otomatik yazılır',
  sorumlu: 'Her gün gündüzde; nöbete yalnızca başka aday kalmadığında yedek olarak girer',
};

export const personelTipi = (tip) => PERSONEL_TIPI[tip] ?? PERSONEL_TIPI.standart;

export const IZIN_UYARI = {
  'izin-pazartesi-baslamiyor': 'İzin Pazartesi başlamıyor',
  'donus-pazartesi-degil': 'Dönüş günü Pazartesi değil',
  'izin-oncesi-persembe-nobeti-yok': 'İzin öncesi Perşembe nöbeti yok',
};

export const izinUyarisi = (kod) => IZIN_UYARI[kod] ?? kod;

/** Nöbet adaletinin dengelendiği üç kategori. */
export const NOBET_KATEGORI = {
  'hafta-ici': 'Hafta içi',
  persembe: 'Perşembe',
  cuma: 'Cuma',
  'hafta-sonu': 'Hafta sonu / tatil',
};

/** 'HH:MM' -> dakika; geçersizse null. */
export const saatiDakika = (deger) => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(deger ?? '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/**
 * İki saat arasındaki süre (saat cinsinden). Bitiş başlangıca eşit ya da ondan
 * küçükse vardiya ertesi güne sarkar: 16:00 → 08:00 = 16, 08:00 → 08:00 = 24.
 */
export const vardiyaSuresi = (bas, bit) => {
  const a = saatiDakika(bas);
  const b = saatiDakika(bit);
  if (a === null || b === null) return null;
  return ((b > a ? b - a : b - a + 24 * 60) / 60);
};

/** "08:00 – 16:00 · 8 saat" */
export const vardiyaMetni = (bas, bit) => {
  const sure = vardiyaSuresi(bas, bit);
  if (sure === null) return '—';
  const yazi = Number.isInteger(sure) ? sure : sure.toFixed(1);
  return `${bas} – ${bit} · ${yazi} saat`;
};

export const VARDIYA_ADI = { 'nobet-24': 'Nöbet', 'mesai-8': 'Gündüz mesaisi' };

/** Arşiv kopyasını hangi işlemin bıraktığı. */
export const KOPYA_SEBEBI = {
  'otomatik-uretim': 'Otomatik taslak oluşturulmadan önce',
  'listeyi-bosalt': 'Liste boşaltılmadan önce',
  'geri-alma': 'Geri alma yapılmadan önce',
};

export const kopyaSebebi = (kod) => KOPYA_SEBEBI[kod] ?? kod;

/** '2026-09-23T14:05:00Z' -> '23.09.2026 14:05' */
export const zamanYaz = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const iki = (n) => String(n).padStart(2, '0');
  return `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()} ${iki(d.getHours())}:${iki(d.getMinutes())}`;
};
