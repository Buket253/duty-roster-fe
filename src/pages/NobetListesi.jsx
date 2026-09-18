import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CalendarGrid from '../components/CalendarGrid.jsx';
import EmployeeRoster from '../components/EmployeeRoster.jsx';
import api from '../api/client.js';
import { AYLAR, donemBaslik, flagMetni, gunNo, tarihYaz } from '../utils.js';

const simdi = new Date();

export default function NobetListesi() {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [birimler, setBirimler] = useState([]);
  const [yil, setYil] = useState(simdi.getFullYear());
  const [ay, setAy] = useState(simdi.getMonth() + 1);
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesgul, setMesgul] = useState('');
  const [hata, setHata] = useState('');
  const [secilenGun, setSecilenGun] = useState(null);
  const [paylasim, setPaylasim] = useState(null);

  useEffect(() => {
    api.listUnits().then(setBirimler).catch((e) => setHata(e.message));
  }, []);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      setVeri(await api.getSchedule(unitId, yil, ay));
    } catch (e) {
      setHata(e.message);
      setVeri(null);
    } finally {
      setYukleniyor(false);
    }
  }, [unitId, yil, ay]);

  useEffect(() => { yukle(); }, [yukle]);

  const ayDegistir = (delta) => {
    const d = new Date(Date.UTC(yil, ay - 1 + delta, 1));
    setYil(d.getUTCFullYear());
    setAy(d.getUTCMonth() + 1);
  };

  const uret = async () => {
    setMesgul('uret');
    setHata('');
    try {
      setVeri(await api.generate(unitId, yil, ay));
    } catch (e) {
      setHata(e.message);
    } finally {
      setMesgul('');
    }
  };

  const yayinla = async () => {
    setMesgul('yayin');
    try {
      await api.publish(veri.schedule._id);
      await yukle();
    } catch (e) {
      setHata(e.message);
    } finally {
      setMesgul('');
    }
  };

  const linkAl = async () => {
    setMesgul('link');
    try {
      setPaylasim(await api.shareLink(unitId));
    } catch (e) {
      setHata(e.message);
    } finally {
      setMesgul('');
    }
  };

  const rule = veri?.rule ?? {};
  const uyari = veri?.warnings;

  return (
    <div className="app">
      <Sidebar unitId={unitId} />
      <div className="main">
        <header className="topbar">
          <select
            className="select"
            style={{ width: 'auto' }}
            value={unitId}
            onChange={(e) => navigate(`/nobet-listesi/${e.target.value}`)}
          >
            {birimler.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <div className="month-nav">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => ayDegistir(-1)} aria-label="Önceki ay">←</button>
            <span className="mono" style={{ fontWeight: 600, minWidth: 108, textAlign: 'center' }}>
              {donemBaslik(yil, ay)}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => ayDegistir(1)} aria-label="Sonraki ay">→</button>
          </div>

          <StatusBadge status={veri?.schedule?.status} />

          <div className="spacer" />

          <button type="button" className="btn btn-primary" onClick={uret} disabled={mesgul === 'uret'}>
            {mesgul === 'uret' ? 'Oluşturuluyor…' : 'Otomatik Taslak Oluştur'}
          </button>
          <button
            type="button" className="btn" onClick={yayinla}
            disabled={!veri?.schedule || veri.schedule.status === 'yayinda' || mesgul === 'yayin'}
          >
            Yayınla
          </button>
          <button type="button" className="btn" onClick={linkAl} disabled={mesgul === 'link'}>
            Paylaşım linki
          </button>
        </header>

        <div className="content">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}

          {paylasim && (
            <div className="alert alert-ok" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="mono" style={{ flex: 1, wordBreak: 'break-all' }}>{paylasim.url}</span>
              <button type="button" className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(paylasim.url)}>Kopyala</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPaylasim(null)}>Kapat</button>
            </div>
          )}

          {uyari?.total > 0 && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              <strong>{uyari.total} uyarı:</strong>{' '}
              {Object.entries(uyari.byFlag).map(([f, n]) => `${flagMetni(f)} (${n})`).join(' · ')}
              {uyari.belowMin.length > 0 &&
                ` · Aylık minimumun altında: ${uyari.belowMin.map((e) => e.name).join(', ')}`}
            </div>
          )}

          {yukleniyor && <p className="muted">Yükleniyor…</p>}

          {!yukleniyor && veri && (
            <div className="split">
              <EmployeeRoster
                employees={veri.employees}
                rule={rule}
                leaves={veri.leaves}
              />

              {veri.assignments.length === 0 ? (
                <div className="card card-pad">
                  <h3>{donemBaslik(yil, ay)} için liste yok</h3>
                  <p className="muted">
                    “Otomatik Taslak Oluştur” ile kural setine göre bir taslak üretebilirsiniz.
                  </p>
                </div>
              ) : (
                <CalendarGrid
                  year={yil}
                  month={ay}
                  assignments={veri.assignments}
                  onSelectDay={setSecilenGun}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {secilenGun && veri && (
        <GunDuzenleyici
          gun={secilenGun}
          veri={veri}
          onKapat={() => setSecilenGun(null)}
          onKaydedildi={(yeni) => setVeri(yeni)}
        />
      )}
    </div>
  );
}

/** Bir güne tıklanınca açılır: o günün slotları için uygun adaydan seçim. */
function GunDuzenleyici({ gun, veri, onKapat, onKaydedildi }) {
  const gunAtamalari = veri.assignments.filter((a) => gunNo(a.date) === gun);
  const [adaylar, setAdaylar] = useState({});
  const [kaydediliyor, setKaydediliyor] = useState('');
  const [hata, setHata] = useState('');

  useEffect(() => {
    let iptal = false;
    Promise.all(
      gunAtamalari.map(async (a) => [a._id, await api.candidates(a._id).catch(() => null)])
    ).then((ciftler) => {
      if (!iptal) setAdaylar(Object.fromEntries(ciftler));
    });
    return () => { iptal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gun, veri.assignments]);

  const ata = async (assignmentId, employeeId) => {
    setKaydediliyor(assignmentId);
    setHata('');
    try {
      const sonuc = await api.updateAssignment(assignmentId, employeeId || null);
      onKaydedildi(sonuc);
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor('');
    }
  };

  const tarih = gunAtamalari[0]?.date;

  return (
    <div className="modal-backdrop" onClick={onKapat}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h2>{tarih ? tarihYaz(tarih) : `${gun} ${AYLAR[veri.month - 1]}`}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onKapat}>Kapat</button>
        </div>

        <div className="card-pad">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{hata}</div>}

          {gunAtamalari.map((a) => {
            const rapor = adaylar[a._id];
            const uygun = rapor?.eligible ?? [];
            const sebepler = rapor?.reasons ?? {};

            return (
              <div key={a._id} className="field">
                <label htmlFor={`slot-${a._id}`}>
                  {a.shiftType === 'nobet-24' ? '24 saat nöbet' : '8 saat mesai'}
                </label>

                <select
                  id={`slot-${a._id}`}
                  className="select"
                  value={a.employee?._id ?? ''}
                  disabled={kaydediliyor === a._id || !rapor}
                  onChange={(e) => ata(a._id, e.target.value)}
                >
                  <option value="">— Boş bırak —</option>
                  {a.employee && !uygun.some((u) => u._id === a.employee._id) && (
                    <option value={a.employee._id}>{a.employee.name} (mevcut)</option>
                  )}
                  {uygun.map((e) => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>

                {(a.flags ?? []).length > 0 && (
                  <div className="alert alert-danger" style={{ marginTop: 6 }}>
                    {a.flags.map(flagMetni).join(' · ')}
                  </div>
                )}

                {Object.keys(sebepler).length > 0 && (
                  <details style={{ marginTop: 4 }}>
                    <summary className="muted" style={{ cursor: 'pointer' }}>
                      Seçilemeyen {Object.keys(sebepler).length} kişi
                    </summary>
                    <ul className="muted" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {Object.entries(sebepler).map(([id, sebep]) => {
                        const kisi = veri.employees.find((e) => e.employee === id);
                        return <li key={id}>{kisi?.name ?? id} — {flagMetni(sebep)}</li>;
                      })}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}

          {gunAtamalari.length === 0 && <p className="muted">Bu günde slot yok.</p>}
        </div>
      </div>
    </div>
  );
}
