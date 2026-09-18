import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../api/client.js';
import { donemBaslik, isoDay } from '../utils.js';

const bugun = isoDay(new Date().toISOString());
const simdi = new Date();
const YIL = simdi.getFullYear();
const AY = simdi.getMonth() + 1;

export default function Dashboard() {
  const [birimler, setBirimler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const units = await api.listUnits();
        // Her birimin bu döneme ait listesi, durum rozeti ve uyarı sayısı için.
        const detaylar = await Promise.all(
          units.map(async (u) => {
            try {
              const s = await api.getSchedule(u._id, YIL, AY);
              return { ...u, schedule: s.schedule, warnings: s.warnings, employees: s.employees, leaves: s.leaves };
            } catch {
              return { ...u, schedule: null, warnings: { total: 0 }, employees: [], leaves: [] };
            }
          })
        );
        if (!iptal) setBirimler(detaylar);
      } catch (err) {
        if (!iptal) setHata(err.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();
    return () => { iptal = true; };
  }, []);

  const toplamPersonel = birimler.reduce((t, b) => t + (b.employeeCount ?? 0), 0);
  const toplamUyari = birimler.reduce((t, b) => t + (b.warnings?.total ?? 0), 0);
  const toplamNobet = birimler.reduce((t, b) => t + b.employees.reduce((s, e) => s + e.duties, 0), 0);
  const ortNobet = toplamPersonel ? (toplamNobet / toplamPersonel).toFixed(1) : '0.0';
  const izinliSayisi = birimler.reduce(
    (t, b) => t + b.leaves.filter((l) => isoDay(l.startDate) <= bugun && isoDay(l.endDate) >= bugun).length,
    0
  );

  return (
    <div className="app">
      <Sidebar unitId={birimler[0]?._id} />
      <div className="main">
        <header className="topbar">
          <h1>Panel</h1>
          <span className="badge badge-dim mono">{donemBaslik(YIL, AY)}</span>
        </header>

        <div className="content">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}
          {yukleniyor && <p className="muted">Yükleniyor…</p>}

          {!yukleniyor && (
            <>
              <div className="stat-row">
                <div className="card stat">
                  <div className="stat-label">Toplam personel</div>
                  <div className="stat-value">{toplamPersonel}</div>
                </div>
                <div className="card stat">
                  <div className="stat-label">Açık kural uyarısı</div>
                  <div className="stat-value" style={{ color: toplamUyari ? 'var(--danger)' : undefined }}>
                    {toplamUyari}
                  </div>
                </div>
                <div className="card stat">
                  <div className="stat-label">Ort. nöbet / kişi</div>
                  <div className="stat-value">{ortNobet}</div>
                </div>
                <div className="card stat">
                  <div className="stat-label">İzinli personel</div>
                  <div className="stat-value">{izinliSayisi}</div>
                </div>
              </div>

              <h2 style={{ marginBottom: 12 }}>Birimler</h2>

              {birimler.length === 0 && <p className="muted">Henüz birim tanımlı değil.</p>}

              <div className="unit-grid">
                {birimler.map((b) => (
                  <div key={b._id} className="card card-pad">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <h3>{b.name}</h3>
                        <div className="muted mono">{b.employeeCount} kişi</div>
                      </div>
                      <StatusBadge status={b.schedule?.status} />
                    </div>

                    <div style={{ margin: '14px 0 16px' }}>
                      {b.warnings?.total > 0 ? (
                        <span className="badge badge-danger">{b.warnings.total} uyarı</span>
                      ) : (
                        <span className="badge badge-accent">Uyarı yok</span>
                      )}
                    </div>

                    <Link to={`/nobet-listesi/${b._id}`} className="btn btn-sm">Listeyi Aç →</Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
