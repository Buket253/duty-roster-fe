import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import RuleForm from '../components/RuleForm.jsx';
import api from '../api/client.js';
import { donemBaslik, flagMetni } from '../utils.js';

const simdi = new Date();
const YIL = simdi.getFullYear();
const AY = simdi.getMonth() + 1;

export default function KuralAyarlari() {
  const { unitId } = useParams();
  const [rule, setRule] = useState(null);
  const [liste, setListe] = useState(null);
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');

  const yukle = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api.getRule(unitId), api.getSchedule(unitId, YIL, AY)]);
      setRule(r);
      setListe(s);
    } catch (e) {
      setHata(e.message);
    }
  }, [unitId]);

  useEffect(() => { yukle(); }, [yukle]);

  const degistir = (alan, deger) => {
    setRule((r) => ({ ...r, [alan]: deger }));
    setDurum('');
  };

  const kaydet = async (e) => {
    e.preventDefault();
    setDurum('kaydediliyor');
    setHata('');
    try {
      setRule(await api.updateRule(unitId, rule));
      setListe(await api.getSchedule(unitId, YIL, AY));
      setDurum('kaydedildi');
    } catch (err) {
      setHata(err.message);
      setDurum('');
    }
  };

  const uyari = liste?.warnings;

  return (
    <div className="app">
      <Sidebar unitId={unitId} />
      <div className="main">
        <header className="topbar">
          <h1>Kural Ayarları</h1>
          <span className="badge badge-dim">{liste?.unit?.name}</span>
        </header>

        <div className="content">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}
          {!rule && <p className="muted">Yükleniyor…</p>}

          {rule && (
            <div className="split" style={{ gridTemplateColumns: '1fr 340px' }}>
              <form className="card" onSubmit={kaydet}>
                <div className="card-head">
                  <h2>Nöbet kuralları</h2>
                  {durum === 'kaydedildi' && <span className="badge badge-accent">Kaydedildi</span>}
                </div>

                <div className="card-pad">
                  <RuleForm rule={rule} onChange={degistir} />

                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button type="submit" className="btn btn-primary" disabled={durum === 'kaydediliyor'}>
                      {durum === 'kaydediliyor' ? 'Kaydediliyor…' : 'Kaydet'}
                    </button>
                    <span className="muted" style={{ alignSelf: 'center' }}>
                      Değişiklik bir sonraki taslak üretiminde etkili olur.
                    </span>
                  </div>
                </div>
              </form>

              <section className="card">
                <div className="card-head">
                  <h2>Bu ayın etkisi</h2>
                  <span className="muted mono">{donemBaslik(YIL, AY)}</span>
                </div>

                <div className="card-pad">
                  {!liste?.schedule && <p className="muted">Bu dönem için henüz liste oluşturulmadı.</p>}

                  {liste?.schedule && uyari?.total === 0 && (
                    <div className="alert alert-ok">Mevcut listede kural ihlali yok.</div>
                  )}

                  {liste?.schedule && uyari?.total > 0 && (
                    <>
                      <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                        Toplam {uyari.total} uyarı
                      </div>

                      {Object.entries(uyari.byFlag).map(([f, n]) => (
                        <div key={f} className="etki-satir">
                          <span>{flagMetni(f)}</span>
                          <span className="mono badge badge-danger">{n}</span>
                        </div>
                      ))}

                      {uyari.belowMin.map((e) => (
                        <div key={e.employee} className="etki-satir">
                          <span>{e.name} — aylık minimum altı</span>
                          <span className="mono badge badge-warn">{e.duties}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
