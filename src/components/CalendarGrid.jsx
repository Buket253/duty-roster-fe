import { GUNLER, ayGunSayisi, flagMetni, gunNo, haftaninGunu, haftaSonuMu } from '../utils.js';

/**
 * 7 sütunlu aylık takvim. Her günde nöbet (teal chip) ve varsa mesai (gri-mavi chip)
 * kişisi görünür; flags dolu olan günler kırmızı çerçeve + uyarı etiketiyle vurgulanır.
 * Bir güne tıklamak manuel atama düzenleyicisini açar.
 */
export default function CalendarGrid({ year, month, assignments, onSelectDay }) {
  const gunSayisi = ayGunSayisi(year, month);
  const bosluk = haftaninGunu(year, month, 1);

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
          const hafta = haftaSonuMu(year, month, gun);

          return (
            <button
              key={gun}
              type="button"
              onClick={() => onSelectDay(gun)}
              className={`cal-cell${hafta ? ' cal-weekend' : ''}${uyarilar.length ? ' cal-flagged' : ''}`}
            >
              <div className="cal-daynum mono">{gun}</div>

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
