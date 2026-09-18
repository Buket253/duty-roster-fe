import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client.js';
import { AYLAR, GUNLER, donemBaslik, haftaninGunu, haftaSonuMu, isoDay } from '../utils.js';

const simdi = new Date();

/** Auth gerektirmeyen, telefon genişliğine göre tasarlanmış salt-okunur görünüm. */
export default function PublicView() {
  const { token } = useParams();
  const [yil, setYil] = useState(simdi.getFullYear());
  const [ay, setAy] = useState(simdi.getMonth() + 1);
  const [veri, setVeri] = useState(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);
    setHata('');
    api
      .publicSchedule(token, yil, ay)
      .then((d) => { if (!iptal) setVeri(d); })
      .catch((e) => { if (!iptal) { setHata(e.message); setVeri(null); } })
      .finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, [token, yil, ay]);

  const ayDegistir = (delta) => {
    const d = new Date(Date.UTC(yil, ay - 1 + delta, 1));
    setYil(d.getUTCFullYear());
    setAy(d.getUTCMonth() + 1);
  };

  return (
    <div className="public">
      <header className="public-head">
        <div className="public-unit">{veri?.unit?.name ?? 'Nöbet Listesi'}</div>
        <div className="public-nav">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => ayDegistir(-1)} aria-label="Önceki ay">←</button>
          <span className="mono" style={{ fontWeight: 600 }}>{donemBaslik(yil, ay)}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => ayDegistir(1)} aria-label="Sonraki ay">→</button>
        </div>
      </header>

      <main className="public-body">
        {yukleniyor && <p className="muted">Yükleniyor…</p>}
        {!yukleniyor && hata && <div className="alert alert-warn">{hata}</div>}

        {!yukleniyor && veri && veri.days.map((g) => {
          const gun = Number(isoDay(g.date).slice(8));
          const hafta = haftaSonuMu(yil, ay, gun);
          return (
            <div key={g.date} className={`public-row${hafta ? ' public-weekend' : ''}`}>
              <div className="public-date">
                <div className="mono public-day">{String(gun).padStart(2, '0')}</div>
                <div className="muted">{GUNLER[haftaninGunu(yil, ay, gun)]}</div>
              </div>

              <div className="public-people">
                {g.nobet.length === 0 && <span className="muted">Nöbetçi atanmadı</span>}
                {g.nobet.map((p, i) => (
                  <div key={`n-${i}`} className="public-person">
                    <span className="badge badge-accent">Nöbet</span>
                    <span>{p ? p.name : 'Boş'}</span>
                  </div>
                ))}
                {g.mesai.map((p, i) => (
                  <div key={`m-${i}`} className="public-person">
                    <span className="badge badge-dim">Mesai</span>
                    <span className="dim">{p ? p.name : 'Boş'}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <footer className="public-foot muted">
        {AYLAR[ay - 1]} {yil} · Salt okunur görünüm
      </footer>
    </div>
  );
}
