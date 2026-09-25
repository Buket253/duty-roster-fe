import { ayGunSayisi, haftaSonuMu, haftaninGunu, isoDay, vardiyaSuresi } from '../utils.js';

/**
 * Serviste kullanılan kâğıt puantaj çizelgesinin ekran karşılığı: satırlar kişi,
 * sütunlar ayın günleri, hücrelerde o günün saati (gündüz/nöbet) ya da izin
 * işareti. Sağda ay sonu toplamları, altta günlük mesaiye gelen sayısı.
 */

const iki = (n) => String(n).padStart(2, '0');

/** Günün kâğıttaki harfi: T tatil (hafta sonu/resmi tatil), C Cuma, M mesai günü. */
const gunHarfi = (yil, ay, gun, tatilMi) => {
  if (tatilMi || haftaSonuMu(yil, ay, gun)) return 'T';
  return haftaninGunu(yil, ay, gun) === 4 ? 'C' : 'M';
};

export default function PuantajCizelgesi({
  year,
  month,
  employees,
  assignments,
  leaves = [],
  holidays = [],
  rule = {},
  unitName,
}) {
  const gunSayisi = ayGunSayisi(year, month);
  const gunler = Array.from({ length: gunSayisi }, (_, i) => i + 1);

  const gunduzSaat = vardiyaSuresi(rule.dayShiftStart, rule.dayShiftEnd) ?? 8;
  const nobetSaat = vardiyaSuresi(rule.dutyStart, rule.dutyEnd) ?? 24;

  const tatiller = new Set(holidays.map((h) => h.date));
  const iso = (gun) => `${year}-${iki(month)}-${iki(gun)}`;
  const tatilMi = (gun) => tatiller.has(iso(gun));
  const harf = (gun) => gunHarfi(year, month, gun, tatilMi(gun));

  // Gün -> kişi -> atama. Tek geçişte kurulur.
  const atamalar = new Map();
  for (const a of assignments) {
    if (!a.employee) continue;
    const anahtar = `${isoDay(a.date)}|${a.employee._id ?? a.employee}`;
    atamalar.set(anahtar, a);
  }

  /** Kişinin o gündeki izni (varsa). */
  const izinBul = (employeeId, gun) => {
    const g = iso(gun);
    return leaves.find(
      (l) =>
        String(l.employee?._id ?? l.employee) === String(employeeId) &&
        isoDay(l.startDate) <= g &&
        isoDay(l.endDate) >= g
    );
  };

  const hucre = (employeeId, gun) => {
    const izin = izinBul(employeeId, gun);
    if (izin) return { tip: izin.type === 'rapor' ? 'rapor' : 'izin', metin: izin.type === 'rapor' ? 'R' : 'İ' };

    const a = atamalar.get(`${iso(gun)}|${employeeId}`);
    if (!a) return null;
    return a.shiftType === 'nobet-24'
      ? { tip: 'nobet', metin: String(nobetSaat) }
      : { tip: 'mesai', metin: String(gunduzSaat) };
  };

  // Aydaki mesai günü sayısı (tatil ve hafta sonu hariç) — çalışılacak saatin temeli.
  const mesaiGunleri = gunler.filter((g) => harf(g) !== 'T');

  const satirlar = employees.map((e) => {
    const id = e.employee ?? e._id;
    const hucreler = gunler.map((g) => hucre(id, g));

    const calisilan = hucreler.reduce(
      (t, h) => t + (h?.tip === 'nobet' ? nobetSaat : h?.tip === 'mesai' ? gunduzSaat : 0),
      0
    );
    const izinGunu = mesaiGunleri.filter((g) => hucre(id, g)?.tip === 'izin').length;
    const raporGunu = mesaiGunleri.filter((g) => hucre(id, g)?.tip === 'rapor').length;
    // İzinli/raporlu mesai günleri kişinin çalışması gereken saatten düşülür.
    const calisilacak = (mesaiGunleri.length - izinGunu - raporGunu) * gunduzSaat;

    const nobetGunleri = gunler.filter((g) => hucreler[g - 1]?.tip === 'nobet');

    return {
      id,
      ad: e.name,
      unvan: e.title,
      hucreler,
      calisilacak,
      calisilan,
      fark: calisilan - calisilacak,
      bayramNobet: nobetGunleri.filter((g) => tatilMi(g)).length,
      normalNobet: nobetGunleri.filter((g) => !tatilMi(g)).length,
      izinGunu,
      raporGunu,
    };
  });

  const mesaiyeGelen = gunler.map(
    (g) =>
      assignments.filter(
        (a) => a.employee && a.shiftType === 'mesai-8' && isoDay(a.date) === iso(g)
      ).length
  );

  const toplam = (alan) => satirlar.reduce((t, r) => t + r[alan], 0);

  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="card-head">
        <h2>Puantaj çizelgesi</h2>
        <span className="muted">
          Gündüz {gunduzSaat} saat · Nöbet {nobetSaat} saat · İ izin, R rapor
        </span>
        <span className="muted mono" style={{ marginLeft: 'auto' }}>{unitName}</span>
      </div>

      <div className="cizelge-kaydir">
        <table className="cizelge">
          <thead>
            <tr>
              <th className="cizelge-ad" rowSpan="3">Ad soyad</th>
              {gunler.map((g) => (
                <th key={g} className={harf(g) === 'T' ? 'tatil' : undefined}>
                  {iki(g)}.{iki(month)}
                </th>
              ))}
              <th rowSpan="3" className="ozet">Çalışılacak<br />saat</th>
              <th rowSpan="3" className="ozet">Çalışılan<br />saat</th>
              <th rowSpan="3" className="ozet">Fazla /<br />eksik</th>
              <th rowSpan="3" className="ozet">Bayram<br />nöbet</th>
              <th rowSpan="3" className="ozet">Normal<br />nöbet</th>
              <th rowSpan="3" className="ozet">İzin<br />günü</th>
              <th rowSpan="3" className="ozet">Rapor<br />günü</th>
            </tr>
            <tr>
              {gunler.map((g) => (
                <th key={g} className={harf(g) === 'T' ? 'tatil' : undefined}>{harf(g)}</th>
              ))}
            </tr>
            <tr>
              {gunler.map((g) => (
                <th key={g} className={harf(g) === 'T' ? 'tatil' : undefined}>
                  {harf(g) === 'T' ? 'T' : gunduzSaat}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {satirlar.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="cizelge-ad" title={r.unvan || undefined}>{r.ad}</th>
                {r.hucreler.map((h, i) => (
                  <td
                    key={gunler[i]}
                    className={[h ? `h-${h.tip}` : '', harf(gunler[i]) === 'T' ? 'tatil' : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {h?.metin ?? ''}
                  </td>
                ))}
                <td className="ozet mono">{r.calisilacak}</td>
                <td className="ozet mono">{r.calisilan}</td>
                <td
                  className="ozet mono"
                  style={{ color: r.fark < 0 ? 'var(--danger)' : undefined, fontWeight: 600 }}
                >
                  {r.fark > 0 ? `+${r.fark}` : r.fark}
                </td>
                <td className="ozet mono">{r.bayramNobet}</td>
                <td className="ozet mono">{r.normalNobet}</td>
                <td className="ozet mono">{r.izinGunu}</td>
                <td className="ozet mono">{r.raporGunu}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th scope="row" className="cizelge-ad">Mesaiye gelenler</th>
              {mesaiyeGelen.map((n, i) => (
                <td key={gunler[i]} className={harf(gunler[i]) === 'T' ? 'tatil mono' : 'mono'}>
                  {n || ''}
                </td>
              ))}
              <td className="ozet mono">{toplam('calisilacak')}</td>
              <td className="ozet mono">{toplam('calisilan')}</td>
              <td className="ozet mono">{toplam('fark')}</td>
              <td className="ozet mono">{toplam('bayramNobet')}</td>
              <td className="ozet mono">{toplam('normalNobet')}</td>
              <td className="ozet mono">{toplam('izinGunu')}</td>
              <td className="ozet mono">{toplam('raporGunu')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
