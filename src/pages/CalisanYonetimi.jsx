import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import TarihGirdisi from '../components/TarihGirdisi.jsx';
import { DugmeDonen, Iskelet, Yukleniyor } from '../components/Yukleniyor.jsx';
import api from '../api/client.js';
import {
  IZIN_TIPI,
  PERSONEL_TIPI,
  PERSONEL_TIPI_ACIKLAMA,
  ayAnahtari,
  ayBaslik,
  donemBaslik,
  isoDay,
  izinUyarisi,
  tarihUzun,
} from '../utils.js';

const simdi = new Date();
const YIL = simdi.getFullYear();
const AY = simdi.getMonth() + 1;
const bugun = isoDay(new Date().toISOString());

/** İzin dönüş günü: bitişin ertesi günü. Kural gereği Pazartesi olması beklenir. */
/** İzin gün sayısı, başlangıç ve bitiş dahil. */
const izinGunSayisi = (l) => {
  const bas = new Date(`${isoDay(l.startDate)}T00:00:00Z`);
  const bit = new Date(`${isoDay(l.endDate)}T00:00:00Z`);
  return Math.round((bit - bas) / 86400000) + 1;
};

const donusGunu = (bitis) => {
  const d = new Date(`${isoDay(bitis)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
};

export default function CalisanYonetimi() {
  const { unitId } = useParams();
  const [calisanlar, setCalisanlar] = useState([]);
  const [izinler, setIzinler] = useState([]);
  const [liste, setListe] = useState(null);
  const [hata, setHata] = useState('');
  // Sayfa açılırken çalışanlar, izinler ve bu ayın listesi birlikte çekiliyor.
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ekleniyor, setEkleniyor] = useState('');
  const [yeniCalisan, setYeniCalisan] = useState({ name: '', title: '', staffType: 'standart', canTakeDuty: true });
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
    } finally {
      setYukleniyor(false);
    }
  }, [unitId]);

  useEffect(() => { yukle(); }, [yukle]);

  const nobetSayisi = (id) => liste?.employees.find((e) => e.employee === id)?.duties ?? 0;
  const izinUyarilari = liste?.leaveWarnings ?? [];

  // Başlangıç ayına göre grupla, ay ve tarih sırasına diz.
  const aylikIzinler = useMemo(() => {
    const gruplar = new Map();
    for (const l of [...izinler].sort((a, b) => isoDay(a.startDate).localeCompare(isoDay(b.startDate)))) {
      const ay = ayAnahtari(l.startDate);
      if (!gruplar.has(ay)) gruplar.set(ay, []);
      gruplar.get(ay).push(l);
    }
    return [...gruplar.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [izinler]);

  const calisanEkle = async (e) => {
    e.preventDefault();
    setHata('');
    setEkleniyor('calisan');
    try {
      await api.createEmployee({ ...yeniCalisan, unit: unitId });
      setYeniCalisan({ name: '', title: '', staffType: 'standart', canTakeDuty: true });
      await yukle();
    } catch (err) {
      setHata(err.message);
    } finally {
      setEkleniyor('');
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

  const calisanGuncelle = async (id, degisiklik) => {
    setHata('');
    try {
      await api.updateEmployee(id, degisiklik);
      await yukle();
    } catch (err) {
      setHata(err.message);
    }
  };

  const durumDegistir = (c) => calisanGuncelle(c._id, { active: !c.active });

  const izinEkle = async (e) => {
    e.preventDefault();
    setHata('');
    setEkleniyor('izin');
    try {
      await api.createLeave(yeniIzin);
      setYeniIzin({ employee: '', startDate: '', endDate: '', type: 'yillik' });
      await yukle();
    } catch (err) {
      setHata(err.message);
    } finally {
      setEkleniyor('');
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
          <span className="muted mono">{donemBaslik(YIL, AY)}</span>
        </header>

        <div className="content">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}

          {yukleniyor && (
            <div className="card card-pad" style={{ marginBottom: 18 }}>
              <Yukleniyor metin="Çalışanlar ve izinler yükleniyor…" />
              <div style={{ marginTop: 14 }}>
                <Iskelet satir={5} yukseklik={44} />
              </div>
            </div>
          )}

          <section className="card" style={{ marginBottom: 18, display: yukleniyor ? 'none' : undefined }}>
            <div className="card-head">
              <h2>Çalışanlar</h2>
              <span className="muted">
                Nöbet sayıları {donemBaslik(YIL, AY)} dönemine aittir
              </span>
              <span className="muted mono" style={{ marginLeft: 'auto' }}>{calisanlar.length} kişi</span>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Ad soyad</th>
                  <th>Unvan</th>
                  <th>Personel tipi</th>
                  <th>Nöbete başlama tarihi</th>
                  <th className="say">Nöbete girebilir</th>
                  <th className="say">Bu ay nöbet sayısı</th>
                  <th className="say">Kayıt durumu</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {calisanlar.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="dim">{c.title || '—'}</td>
                    <td>
                      <select
                        className="select"
                        value={c.staffType ?? 'standart'}
                        title={PERSONEL_TIPI_ACIKLAMA[c.staffType ?? 'standart']}
                        onChange={(e) => calisanGuncelle(c._id, { staffType: e.target.value })}
                      >
                        {Object.entries(PERSONEL_TIPI).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {/* Sadece-gündüz personeli bu tarihten itibaren nöbet
                          rotasyonuna katılır; boşsa statü süresizdir. */}
                      {(c.staffType ?? 'standart') === 'sadece-gunduz' ? (
                        <TarihGirdisi
                          aria-label={`${c.name} nöbete başlama tarihi`}
                          value={c.dutyStartDate ? isoDay(c.dutyStartDate) : ''}
                          onChange={(v) => calisanGuncelle(c._id, { dutyStartDate: v || null })}
                        />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="say">
                      {/* Nöbet anahtarı yalnızca standart tipte anlamlı; diğer tiplerin
                          nöbet davranışını tipin kendisi belirler. */}
                      {(c.staffType ?? 'standart') === 'standart' ? (
                        <input
                          type="checkbox"
                          checked={c.canTakeDuty !== false}
                          aria-label={`${c.name} nöbete girebilir`}
                          onChange={(e) => calisanGuncelle(c._id, { canTakeDuty: e.target.checked })}
                        />
                      ) : (
                        <span className="muted" title={PERSONEL_TIPI_ACIKLAMA[c.staffType]}>
                          {c.staffType === 'sorumlu' ? 'yedek' : '—'}
                        </span>
                      )}
                    </td>
                    <td className="say mono">{nobetSayisi(c._id)}</td>
                    <td className="say">
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
                  <tr><td colSpan="8" className="muted">Bu birimde çalışan yok.</td></tr>
                )}
              </tbody>
            </table>

            <form className="card-pad calisan-form" onSubmit={calisanEkle}>
              <div className="field">
                <label htmlFor="ad">Ad soyad</label>
                <input id="ad" className="input" value={yeniCalisan.name} required
                  onChange={(e) => setYeniCalisan({ ...yeniCalisan, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="unvan">Unvan</label>
                <input id="unvan" className="input" value={yeniCalisan.title} placeholder="Hemşire"
                  onChange={(e) => setYeniCalisan({ ...yeniCalisan, title: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="tip">Personel tipi</label>
                <select id="tip" className="select" value={yeniCalisan.staffType}
                  onChange={(e) => setYeniCalisan({ ...yeniCalisan, staffType: e.target.value })}>
                  {Object.entries(PERSONEL_TIPI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field izin-form-eylem">
                <button type="submit" className="btn btn-primary" disabled={ekleniyor === 'calisan'}>
                {ekleniyor === 'calisan' && <DugmeDonen />}
                {ekleniyor === 'calisan' ? 'Ekleniyor…' : '+ Çalışan Ekle'}
              </button>
              </div>
            </form>
            <p className="muted card-pad" style={{ margin: 0, paddingTop: 0 }}>
              {PERSONEL_TIPI_ACIKLAMA[yeniCalisan.staffType]}
              {yeniCalisan.staffType === 'sadece-gunduz' &&
                ' — nöbete başlama tarihi eklendikten sonra tablodan girilebilir.'}
            </p>
          </section>

          <section className="card" style={{ display: yukleniyor ? 'none' : undefined }}>
            <div className="card-head">
              <h2>İzinler</h2>
              <span className="muted mono">{izinler.length} kayıt</span>
            </div>

            {/* Pazartesi kuralı engelleyici değil; yalnızca uyarı olarak gösterilir. */}
            {izinUyarilari.length > 0 && (
              <div className="alert alert-warn card-pad" style={{ margin: '0 18px 12px' }}>
                {izinUyarilari.map((u) => (
                  <div key={u.leave}>
                    <strong>{u.name}</strong> ({tarihUzun(u.startDate)} → {tarihUzun(u.endDate)}):{' '}
                    {u.warnings.map(izinUyarisi).join(' · ')}
                  </div>
                ))}
              </div>
            )}

            {/* Form tablonun ÜSTÜNDE: sayfanın en altındayken tarih alanlarının
                açılır takvimi ekranın dışında kalıp görünmüyordu. */}
            <form className="card-pad izin-form" onSubmit={izinEkle}>
              <div className="field">
                <label htmlFor="izin-calisan">Çalışan</label>
                <select id="izin-calisan" className="select" value={yeniIzin.employee} required
                  onChange={(e) => setYeniIzin({ ...yeniIzin, employee: e.target.value })}>
                  <option value="">Seçin…</option>
                  {calisanlar.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="field">
                <label htmlFor="izin-tip">İzin tipi</label>
                <select id="izin-tip" className="select" value={yeniIzin.type}
                  onChange={(e) => setYeniIzin({ ...yeniIzin, type: e.target.value })}>
                  {Object.entries(IZIN_TIPI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="field">
                <label htmlFor="izin-bas">İlk izin günü</label>
                <TarihGirdisi id="izin-bas" value={yeniIzin.startDate} required
                  onChange={(v) => setYeniIzin({ ...yeniIzin, startDate: v })} />
              </div>

              <div className="field">
                <label htmlFor="izin-bit">Son izin günü</label>
                <TarihGirdisi id="izin-bit" value={yeniIzin.endDate} required
                  onChange={(v) => setYeniIzin({ ...yeniIzin, endDate: v })} />
              </div>

              <div className="field izin-form-eylem">
                <button type="submit" className="btn btn-primary" disabled={ekleniyor === 'izin'}>
                  {ekleniyor === 'izin' && <DugmeDonen />}
                  {ekleniyor === 'izin' ? 'Ekleniyor…' : '+ İzin Ekle'}
                </button>
              </div>
            </form>

            {/* İzinler ay ay gruplanır: liste büyüdükçe hangi dönemde kimin
                izinli olduğu tek bakışta görünsün. */}
            {aylikIzinler.map(([ay, kayitlar]) => (
              <div key={ay}>
                <div className="ay-baslik">
                  <strong>{ayBaslik(ay)}</strong>
                  <span className="muted mono">{kayitlar.length} izin</span>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Çalışan</th>
                      <th>İzin tipi</th>
                      <th>İlk izin günü</th>
                      <th>Son izin günü</th>
                      <th>İşe dönüş günü</th>
                      <th className="say">Gün sayısı</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {kayitlar.map((l) => {
                      const aktif = isoDay(l.startDate) <= bugun && isoDay(l.endDate) >= bugun;
                      return (
                        <tr key={l._id}>
                          <td style={{ fontWeight: 500 }}>
                            {l.employee?.name ?? '—'}{' '}
                            {aktif && <span className="badge badge-warn">Şu an izinli</span>}
                          </td>
                          <td><span className="badge badge-dim">{IZIN_TIPI[l.type] ?? l.type}</span></td>
                          <td>{tarihUzun(l.startDate)}</td>
                          <td>{tarihUzun(l.endDate)}</td>
                          <td className="dim">{tarihUzun(donusGunu(l.endDate))}</td>
                          <td className="say mono">{izinGunSayisi(l)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => izinSil(l._id)}>Sil</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {izinler.length === 0 && (
              <p className="muted card-pad" style={{ margin: 0 }}>İzin kaydı yok.</p>
            )}


          </section>
        </div>
      </div>
    </div>
  );
}
