import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import api from '../api/client.js';
import { IZIN_TIPI, donemBaslik, isoDay, tarihYaz } from '../utils.js';

const simdi = new Date();
const YIL = simdi.getFullYear();
const AY = simdi.getMonth() + 1;
const bugun = isoDay(new Date().toISOString());

export default function CalisanYonetimi() {
  const { unitId } = useParams();
  const [calisanlar, setCalisanlar] = useState([]);
  const [izinler, setIzinler] = useState([]);
  const [liste, setListe] = useState(null);
  const [hata, setHata] = useState('');
  const [yeniCalisan, setYeniCalisan] = useState({ name: '', title: '' });
  const [yeniIzin, setYeniIzin] = useState({ employee: '', startDate: '', endDate: '', type: 'yillik' });

  const yukle = useCallback(async () => {
    try {
      const [c, i, s] = await Promise.all([
        api.listEmployees(unitId),
        api.listLeaves(unitId),
        api.getSchedule(unitId, YIL, AY).catch(() => null),
      ]);
      setCalisanlar(c);
      setIzinler(i);
      setListe(s);
    } catch (e) {
      setHata(e.message);
    }
  }, [unitId]);

  useEffect(() => { yukle(); }, [yukle]);

  const nobetSayisi = (id) => liste?.employees.find((e) => e.employee === id)?.duties ?? 0;

  const calisanEkle = async (e) => {
    e.preventDefault();
    setHata('');
    try {
      await api.createEmployee({ ...yeniCalisan, unit: unitId });
      setYeniCalisan({ name: '', title: '' });
      await yukle();
    } catch (err) {
      setHata(err.message);
    }
  };

  const calisanSil = async (id) => {
    setHata('');
    try {
      await api.deleteEmployee(id);
      await yukle();
    } catch (err) {
      setHata(err.message);
    }
  };

  const durumDegistir = async (c) => {
    setHata('');
    try {
      await api.updateEmployee(c._id, { active: !c.active });
      await yukle();
    } catch (err) {
      setHata(err.message);
    }
  };

  const izinEkle = async (e) => {
    e.preventDefault();
    setHata('');
    try {
      await api.createLeave(yeniIzin);
      setYeniIzin({ employee: '', startDate: '', endDate: '', type: 'yillik' });
      await yukle();
    } catch (err) {
      setHata(err.message);
    }
  };

  const izinSil = async (id) => {
    setHata('');
    try {
      await api.deleteLeave(id);
      await yukle();
    } catch (err) {
      setHata(err.message);
    }
  };

  return (
    <div className="app">
      <Sidebar unitId={unitId} />
      <div className="main">
        <header className="topbar">
          <h1>Çalışanlar &amp; İzin</h1>
          <span className="badge badge-dim">{liste?.unit?.name}</span>
          <span className="muted mono">{donemBaslik(YIL, AY)} nöbet sayıları</span>
        </header>

        <div className="content">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}

          <section className="card" style={{ marginBottom: 18 }}>
            <div className="card-head">
              <h2>Çalışanlar</h2>
              <span className="muted mono">{calisanlar.length} kişi</span>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Ad</th><th>Unvan</th><th>Bu ay nöbet</th><th>Durum</th><th />
                </tr>
              </thead>
              <tbody>
                {calisanlar.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="dim">{c.title || '—'}</td>
                    <td className="mono">{nobetSayisi(c._id)}</td>
                    <td>
                      <span className={`badge ${c.active ? 'badge-accent' : 'badge-dim'}`}>
                        {c.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => durumDegistir(c)}>
                        {c.active ? 'Pasifleştir' : 'Aktifleştir'}
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" style={{ marginLeft: 6 }} onClick={() => calisanSil(c._id)}>
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {calisanlar.length === 0 && (
                  <tr><td colSpan="5" className="muted">Bu birimde çalışan yok.</td></tr>
                )}
              </tbody>
            </table>

            <form className="card-pad" style={{ borderTop: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'flex-end' }} onSubmit={calisanEkle}>
              <div className="field" style={{ flex: 2, marginBottom: 0 }}>
                <label htmlFor="ad">Ad</label>
                <input id="ad" className="input" value={yeniCalisan.name} required
                  onChange={(e) => setYeniCalisan({ ...yeniCalisan, name: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="unvan">Unvan</label>
                <input id="unvan" className="input" value={yeniCalisan.title} placeholder="Uzman / Asistan"
                  onChange={(e) => setYeniCalisan({ ...yeniCalisan, title: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">+ Çalışan Ekle</button>
            </form>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>İzinler</h2>
              <span className="muted mono">{izinler.length} kayıt</span>
            </div>

            <table className="table">
              <thead>
                <tr><th>Çalışan</th><th>Tip</th><th>Başlangıç</th><th>Bitiş</th><th /></tr>
              </thead>
              <tbody>
                {izinler.map((l) => {
                  const aktif = isoDay(l.startDate) <= bugun && isoDay(l.endDate) >= bugun;
                  return (
                    <tr key={l._id}>
                      <td style={{ fontWeight: 500 }}>
                        {l.employee?.name ?? '—'}{' '}
                        {aktif && <span className="badge badge-warn">Şu an izinli</span>}
                      </td>
                      <td><span className="badge badge-dim">{IZIN_TIPI[l.type] ?? l.type}</span></td>
                      <td className="mono">{tarihYaz(l.startDate)}</td>
                      <td className="mono">{tarihYaz(l.endDate)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => izinSil(l._id)}>Sil</button>
                      </td>
                    </tr>
                  );
                })}
                {izinler.length === 0 && <tr><td colSpan="5" className="muted">İzin kaydı yok.</td></tr>}
              </tbody>
            </table>

            <form className="card-pad" style={{ borderTop: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }} onSubmit={izinEkle}>
              <div className="field" style={{ flex: 2, minWidth: 160, marginBottom: 0 }}>
                <label htmlFor="izin-calisan">Çalışan</label>
                <select id="izin-calisan" className="select" value={yeniIzin.employee} required
                  onChange={(e) => setYeniIzin({ ...yeniIzin, employee: e.target.value })}>
                  <option value="">Seçin…</option>
                  {calisanlar.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}>
                <label htmlFor="izin-tip">Tip</label>
                <select id="izin-tip" className="select" value={yeniIzin.type}
                  onChange={(e) => setYeniIzin({ ...yeniIzin, type: e.target.value })}>
                  {Object.entries(IZIN_TIPI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field" style={{ flex: 1, minWidth: 130, marginBottom: 0 }}>
                <label htmlFor="izin-bas">Başlangıç</label>
                <input id="izin-bas" className="input mono" type="date" value={yeniIzin.startDate} required
                  onChange={(e) => setYeniIzin({ ...yeniIzin, startDate: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 130, marginBottom: 0 }}>
                <label htmlFor="izin-bit">Bitiş</label>
                <input id="izin-bit" className="input mono" type="date" value={yeniIzin.endDate} required
                  onChange={(e) => setYeniIzin({ ...yeniIzin, endDate: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">+ İzin Ekle</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
