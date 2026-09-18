export const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** '2026-10-05T00:00:00.000Z' -> '2026-10-05' */
export const isoDay = (value) => String(value).slice(0, 10);

export const gunNo = (value) => Number(isoDay(value).slice(8, 10));

/** Pazartesi = 0 olacak şekilde haftanın günü. */
export const haftaninGunu = (year, month, day) => (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;

export const haftaSonuMu = (year, month, day) => haftaninGunu(year, month, day) >= 5;

export const ayGunSayisi = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const donemBaslik = (year, month) => `${AYLAR[month - 1]} ${year}`;

export const tarihYaz = (value) => {
  const [y, m, d] = isoDay(value).split('-');
  return `${d} ${AYLAR[Number(m) - 1]} ${y}`;
};

export const FLAG_METIN = {
  doldurulamadi: 'Doldurulamadı',
  'ardisik-nobet': 'Ardışık nöbet',
  'yetersiz-dinlenme': 'Yetersiz dinlenme',
  'cifte-atama': 'Çifte atama',
  izinli: 'İzinli personel',
  'limit-asildi': 'Aylık limit aşıldı',
};

export const flagMetni = (flag) => FLAG_METIN[flag] ?? flag;

export const IZIN_TIPI = { yillik: 'Yıllık izin', rapor: 'Rapor', mazeret: 'Mazeret' };
