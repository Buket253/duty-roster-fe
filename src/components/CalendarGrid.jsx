import { GUNLER, ayGunSayisi, flagMetni, gunNo, haftaninGunu, haftaSonuMu } from '../utils.js';

/**
 * 7 sütunlu aylık takvim. Her günde nöbet (teal chip) ve varsa mesai (gri-mavi chip)
 * kişisi görünür; flags dolu olan günler kırmızı çerçeve + uyarı etiketiyle vurgulanır.
 * Resmi tatiller ayrıca işaretlenir — o günlerde yalnızca nöbetçi bulunur.
 * Bir güne tıklamak manuel atama düzenleyicisini açar.
 */
export default function CalendarGrid({ year, month, assignments, holidays = [], onSelectDay }) {
  const gunSayisi = ayGunSayisi(year, month);
  const bosluk = haftaninGunu(year, month, 1);
  // holidays: [{ date, name }] — sabit resmi tatiller + kural setine eklenenler.
  const tatilAdlari = new Map(holidays.map((h) => [h.date, h.name]));
  const tatilAdi = (gun) =>
    tatilAdlari.get(`${year}-${String(month).padStart(2, '0')}-${String(gun).padStart(2, '0')}`);
  const tatilMi = (gun) => tatilAdlari.has(`${year}-${String(month).padStart(2, '0')}-${String(gun).padStart(2, '0')}`);

  const gunlere = new Map();
  for (let d = 1; d <= gunSayisi; d += 1) gunlere.set(d, []);
  for (const a of assignments) {
    const d = gunNo(a.date);
    if (gunlere.has(d)) gunlere.get(d).push(a);
  }

  return (
    <section className="card">
      <div className="calendar">
        {GUNLER.map((g) => (
          <div key={g} className="cal-head">{g}</div>
        ))}

        {Array.from({ length: bosluk }, (_, i) => (
          <div key={`bos-${i}`} className="cal-cell cal-empty" />
        ))}

        {Array.from({ length: gunSayisi }, (_, i) => {
          const gun = i + 1;
          const gunAtamalari = gunlere.get(gun) ?? [];
          const uyarilar = [...new Set(gunAtamalari.flatMap((a) => a.flags ?? []))];
          const tatil = tatilMi(gun);
          const hafta = haftaSonuMu(year, month, gun) || tatil;

          return (
            <button
              key={gun}
              type="button"
              onClick={() => onSelectDay(gun)}
              className={`cal-cell${hafta ? ' cal-weekend' : ''}${tatil ? ' cal-holiday' : ''}${uyarilar.length ? ' cal-flagged' : ''}`}
            >
              <div className="cal-daynum mono">
                {gun}
                {tatil && (
                  <span
                    className="cal-tatil"
                    title={`${tatilAdi(gun) ?? 'Resmi tatil'} — bu günde yalnızca nöbetçi bulunur`}
                  >
                    {tatilAdi(gun) ?? 'Tatil'}
                  </span>
                )}
              </div>

              {gunAtamalari.map((a) => (
                <div
                  key={a._id}
                  className={`chip ${a.shiftType === 'nobet-24' ? 'chip-nobet' : 'chip-mesai'}`}
                  title={a.shiftType === 'nobet-24' ? '24 saat nöbet' : '8 saat mesai'}
                >
                  {a.employee ? a.employee.name : 'Boş'}
                </div>
              ))}

              {uyarilar.map((f) => (
                <div key={f} className="cal-flag">{flagMetni(f)}</div>
              ))}
            </button>
          );
        })}
      </div>
    </section>
  );
}
