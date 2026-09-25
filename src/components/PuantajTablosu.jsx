import { NOBET_KATEGORI, personelTipi, tarihYaz } from '../utils.js';

/**
 * Ay sonu puantajı: kişi başına gündüz gün sayısı, üç kategoride nöbet sayısı ve
 * toplam çalışma saati (gündüz 8, nöbet 24 saat).
 * Haftalık hedefin altında kalan haftalar satırın altında ayrıca işaretlenir.
 */
export default function PuantajTablosu({ puantaj, rule, donem }) {
  if (!puantaj?.satirlar?.length) return null;
  const { satirlar, toplam } = puantaj;

  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="card-head">
        <h2>Puantaj</h2>
        <span className="muted">Ay sonu dökümü — gün sayıları ve toplam çalışma saati</span>
        <span className="muted mono" style={{ marginLeft: 'auto' }}>{donem}</span>
      </div>

      <table className="table puantaj">
        {/* İki satırlı başlık: ortadaki üç sütunun nöbet sayısı olduğu,
            tek tek "Hafta içi / Perşembe-Cuma / Hafta sonu" yazınca kaybolmasın. */}
        <thead>
          <tr>
            <th rowSpan="2">Ad soyad</th>
            <th rowSpan="2">Personel tipi</th>
            <th rowSpan="2" className="say">Gündüz mesaisi<br /><span className="muted">gün</span></th>
            <th colSpan={Object.keys(NOBET_KATEGORI).length} className="say grup-baslik">
              Nöbet sayısı
            </th>
            <th rowSpan="2" className="say">Toplam nöbet<br /><span className="muted">gün</span></th>
            <th rowSpan="2" className="say">Toplam çalışma<br /><span className="muted">saat</span></th>
          </tr>
          <tr>
            {Object.entries(NOBET_KATEGORI).map(([k, v]) => (
              <th key={k} className="say alt-baslik">{v}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {satirlar.map((r) => (
            <tr key={r.employee}>
              <td style={{ fontWeight: 500 }}>
                {r.name}
                {r.eksikHafta.length > 0 && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    Haftalık {rule.minWeeklyHours} saat altı:{' '}
                    {r.eksikHafta.map((h) => `${tarihYaz(h.week)} haftası (${h.hours} saat)`).join(', ')}
                  </div>
                )}
              </td>
              <td className="dim">{personelTipi(r.staffType)}</td>
              <td className="say mono">{r.gunduzGun}</td>
              {Object.keys(NOBET_KATEGORI).map((k) => (
                <td key={k} className="say mono">{r.nobet[k]}</td>
              ))}
              <td className="say mono" style={{ fontWeight: 600 }}>{r.nobetToplam}</td>
              <td className="say mono" style={{ fontWeight: 600 }}>{r.toplamSaat}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan="2" style={{ fontWeight: 600 }}>Ekip toplamı</td>
            <td className="say mono">{toplam.gunduzGun}</td>
            <td colSpan={Object.keys(NOBET_KATEGORI).length} />
            <td className="say mono" style={{ fontWeight: 600 }}>{toplam.nobetToplam}</td>
            <td className="say mono" style={{ fontWeight: 600 }}>{toplam.toplamSaat}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
