import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { DugmeDonen, Iskelet, Yukleniyor } from '../components/Yukleniyor.jsx';
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
  // Adı düzenlenen birimin id'si ve düzenlenmekte olan metin.
  const [duzenlenen, setDuzenlenen] = useState(null);
  const [yeniAd, setYeniAd] = useState('');
  const [yeniBirim, setYeniBirim] = useState('');
  const [mesgul, setMesgul] = useState(false);

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

  const adiKaydet = async (e, birim) => {
    e.preventDefault();
    const ad = yeniAd.trim();
    if (!ad || ad === birim.name) {
      setDuzenlenen(null);
      return;
    }
    setHata('');
    try {
      const guncel = await api.updateUnit(birim._id, { name: ad });
      setBirimler((liste) => liste.map((b) => (b._id === birim._id ? { ...b, name: guncel.name } : b)));
      setDuzenlenen(null);
    } catch (err) {
      setHata(err.message);
    }
  };

  const birimEkle = async (e) => {
    e.preventDefault();
    const ad = yeniBirim.trim();
    if (!ad) return;
    setMesgul(true);
    setHata('');
    try {
      // Yeni birim kendi kural setiyle doğar; Kural Ayarları'ndan bağımsız düzenlenir.
      const birim = await api.createUnit({ name: ad, shiftTypes: ['nobet-24', 'mesai-8'] });
      setBirimler((liste) => [
        ...liste,
        { ...birim, employeeCount: 0, schedule: null, warnings: { total: 0 }, employees: [], leaves: [] },
      ]);
      setYeniBirim('');
    } catch (err) {
      setHata(err.message);
    } finally {
      setMesgul(false);
    }
  };

  const birimSil = async (birim) => {
    // Birim silmek çalışanlarını, izinlerini ve listelerini de siler — geri alınamaz.
    const onay = window.confirm(
      `“${birim.name}” birimi, ${birim.employeeCount} çalışanı, izinleri ve tüm nöbet listeleriyle birlikte silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`
    );
    if (!onay) return;
    setHata('');
    try {
      await api.deleteUnit(birim._id);
      setBirimler((liste) => liste.filter((b) => b._id !== birim._id));
    } catch (err) {
      setHata(err.message);
    }
  };

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
          {yukleniyor && (
            <>
              <Yukleniyor metin="Birimler ve bu ayın listeleri yükleniyor…" />
              <div className="stat-row" style={{ marginTop: 14 }}>
                <Iskelet satir={1} yukseklik={74} />
                <Iskelet satir={1} yukseklik={74} />
                <Iskelet satir={1} yukseklik={74} />
                <Iskelet satir={1} yukseklik={74} />
              </div>
              <Iskelet satir={2} yukseklik={128} />
            </>
          )}

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

              <div className="card-head" style={{ padding: 0, marginBottom: 12, border: 'none' }}>
                <h2>Birimler</h2>
                <form onSubmit={birimEkle} style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <input
                    className="input"
                    placeholder="Yeni birim adı"
                    aria-label="Yeni birim adı"
                    value={yeniBirim}
                    onChange={(e) => setYeniBirim(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={mesgul || !yeniBirim.trim()}>
                    {mesgul && <DugmeDonen />}
                    {mesgul ? 'Ekleniyor…' : '+ Birim Ekle'}
                  </button>
                </form>
              </div>

              <p className="muted" style={{ marginTop: 0 }}>
                Her birimin kadro ve nöbet kuralları kendine aittir; Kural Ayarları
                sekmesinde ayrı ayrı düzenlenir.
              </p>

              {birimler.length === 0 && <p className="muted">Henüz birim tanımlı değil.</p>}

              <div className="unit-grid">
                {birimler.map((b) => (
                  <div key={b._id} className="card card-pad">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {duzenlenen === b._id ? (
                          <form onSubmit={(e) => adiKaydet(e, b)} style={{ display: 'flex', gap: 6 }}>
                            <input
                              className="input"
                              value={yeniAd}
                              autoFocus
                              aria-label="Birim adı"
                              onChange={(e) => setYeniAd(e.target.value)}
                              onBlur={(e) => adiKaydet(e, b)}
                              onKeyDown={(e) => e.key === 'Escape' && setDuzenlenen(null)}
                            />
                            <button type="submit" className="btn btn-sm btn-primary">Kaydet</button>
                          </form>
                        ) : (
                          <h3>
                            {b.name}{' '}
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              title="Birimi yeniden adlandır"
                              onClick={() => { setDuzenlenen(b._id); setYeniAd(b.name); }}
                            >
                              Adı değiştir
                            </button>
                          </h3>
                        )}
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

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link to={`/nobet-listesi/${b._id}`} className="btn btn-sm">Listeyi Aç →</Link>
                      <Link to={`/kurallar/${b._id}`} className="btn btn-sm btn-ghost">Kurallar</Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => birimSil(b)}
                      >
                        Sil
                      </button>
                    </div>
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
