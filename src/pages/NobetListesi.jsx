import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CalendarGrid from '../components/CalendarGrid.jsx';
import PuantajCizelgesi from '../components/PuantajCizelgesi.jsx';
import { DugmeDonen, Iskelet, Yukleniyor } from '../components/Yukleniyor.jsx';
import PuantajTablosu from '../components/PuantajTablosu.jsx';
import api from '../api/client.js';
import {
  VARDIYA_ADI,
  donemBaslik,
  flagMetni,
  gunNo,
  kopyaSebebi,
  tarihGunAdiyla,
  tarihYaz,
  zamanYaz,
  vardiyaMetni,
} from '../utils.js';

const simdi = new Date();

/** Her uyarı için "ne yapmalı" satırı; kod adı tek başına bir şey anlatmıyor. */
const UYARI_NE_YAPMALI = {
  doldurulamadi: 'Kurallara uyan aday kalmamış. Gün üzerine tıklayıp elle atayabilir ya da kadro/kural sınırlarını gevşetebilirsiniz.',
  'yetersiz-dinlenme': 'Nöbet sonrası zorunlu dinlenme dolmadan atama yapılmış.',
  'gun-asiri-limit': 'Aylık gün aşırı nöbet hakkı aşılmış.',
  'cifte-atama': 'Aynı kişi aynı gün iki vardiyada.',
  izinli: 'Kişi o tarihte izinli.',
  'limit-asildi': 'Aylık nöbet limiti aşılmış.',
  'nobete-giremez': 'Nöbete giremeyen personel nöbete yazılmış.',
  'sorumlu-yedek': 'Başka aday kalmadığı için sorumlu hemşire nöbete girmiş. İhlal değil, bilgi.',
};

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
  // Geri alınabilir kopyalar; yalnızca panel açıkken yüklenir.
  const [kopyalar, setKopyalar] = useState(null);

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

  /**
   * Kadro kadar boş slot açar. Liste yokken "elle doldurmaya başla", varken
   * "içindekileri sil ve baştan doldur" anlamına gelir — ikincisi onay ister.
   */
  const bosListe = async (varOlan) => {
    if (varOlan) {
      const dolu = veri.assignments.filter((a) => a.employee).length;
      const onay = window.confirm(
        `${donemBaslik(yil, ay)} listesindeki ${dolu} atama silinecek ve kadro kadar boş slot açılacak. Bu işlem geri alınamaz. Devam edilsin mi?`
      );
      if (!onay) return;
    }
    setMesgul('bos');
    setHata('');
    try {
      setVeri(await api.createBlank(unitId, yil, ay, { force: Boolean(varOlan) }));
    } catch (e) {
      setHata(e.message);
    } finally {
      setMesgul('');
    }
  };

  const kopyalariAc = async () => {
    if (kopyalar) {
      setKopyalar(null);
      return;
    }
    setMesgul('kopya');
    setHata('');
    try {
      setKopyalar(await api.scheduleArchives(unitId, yil, ay));
    } catch (e) {
      setHata(e.message);
    } finally {
      setMesgul('');
    }
  };

  const geriAl = async (kopya) => {
    const onay = window.confirm(
      `${donemBaslik(yil, ay)} listesi, ${zamanYaz(kopya.createdAt)} tarihli ${kopya.filledCount} atamalık kopyayla değiştirilecek. Mevcut hâl de kopyalanacağı için bu işlem geri alınabilir. Devam edilsin mi?`
    );
    if (!onay) return;

    setMesgul('kopya');
    setHata('');
    try {
      setVeri(await api.restoreSchedule(unitId, yil, ay, kopya._id));
      setKopyalar(await api.scheduleArchives(unitId, yil, ay));
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
  // Liste var ve içinde en az bir atama varsa eylem "boşaltma"ya döner.
  const dolulukVar = Boolean(veri?.assignments?.some((a) => a.employee));

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

          {/* Birincil eylem solda; liste üzerinde çalışan ikincil eylemler ayrı
              grupta, yıkıcı olan (boşaltma) en sonda. */}
          <button type="button" className="btn btn-primary" onClick={uret} disabled={mesgul === 'uret'}>
            {mesgul === 'uret' && <DugmeDonen />}
            {mesgul === 'uret' ? 'Oluşturuluyor…' : 'Otomatik Taslak Oluştur'}
          </button>

          <div className="btn-grup">
            <button
              type="button" className="btn" onClick={yayinla}
              disabled={!veri?.schedule || veri.schedule.status === 'yayinda' || mesgul === 'yayin'}
              title={!veri?.schedule ? 'Önce bir liste oluşturun' : 'Listeyi paylaşıma aç'}
            >
              {mesgul === 'yayin' && <DugmeDonen />}
              {mesgul === 'yayin' ? 'Yayınlanıyor…' : 'Yayınla'}
            </button>
            <button type="button" className="btn" onClick={linkAl} disabled={mesgul === 'link'}>
              {mesgul === 'link' && <DugmeDonen />}
              {mesgul === 'link' ? 'Hazırlanıyor…' : 'Paylaşım linki'}
            </button>
          </div>

          <div className="btn-grup">
            <button type="button" className="btn" onClick={kopyalariAc} disabled={mesgul === 'kopya'}>
              {mesgul === 'kopya' && <DugmeDonen />}
              {kopyalar ? 'Kopyaları Gizle' : 'Geri Al…'}
            </button>
            <button
              type="button"
              className={dolulukVar ? 'btn btn-danger' : 'btn'}
              onClick={() => bosListe(dolulukVar)}
              disabled={mesgul === 'bos'}
              title={
                dolulukVar
                  ? 'Atamaları siler, kadro kadar boş slot bırakır'
                  : 'Kadro kadar boş slot açar; geçmiş bir ayı elle girmek için'
              }
            >
              {mesgul === 'bos' && <DugmeDonen />}
              {mesgul === 'bos'
                ? 'Hazırlanıyor…'
                : dolulukVar
                  ? 'Listeyi Boşalt'
                  : 'Boş Liste (elle doldur)'}
            </button>
          </div>
        </header>

        <div className="content">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{hata}</div>}

          {kopyalar && (
            <section className="card" style={{ marginBottom: 16 }}>
              <div className="card-head">
                <h2>Geri alınabilir kopyalar</h2>
                <span className="muted">
                  Otomatik üretim ve liste boşaltma, öncesindeki hâli buraya kopyalar
                </span>
              </div>

              {kopyalar.length === 0 ? (
                <p className="muted card-pad" style={{ margin: 0 }}>
                  Bu dönem için saklanan kopya yok. Kopyalar yalnızca üzerine yazılan
                  dolu listeler için alınır.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kopya zamanı</th>
                      <th>Hangi işlemden önce</th>
                      <th className="say">Dolu atama</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {kopyalar.map((k) => (
                      <tr key={k._id}>
                        <td className="mono">{zamanYaz(k.createdAt)}</td>
                        <td>{kopyaSebebi(k.reason)}</td>
                        <td className="say mono">{k.filledCount}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            disabled={mesgul === 'kopya'}
                            onClick={() => geriAl(k)}
                          >
                            Bu kopyaya dön
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {paylasim && (
            <div className="alert alert-ok" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="mono" style={{ flex: 1, wordBreak: 'break-all' }}>{paylasim.url}</span>
              <button type="button" className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(paylasim.url)}>Kopyala</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPaylasim(null)}>Kapat</button>
            </div>
          )}

          {/* Uyarılar tek blok yerine satır satır: her satır neyin sorun olduğunu
              ve ne yapılabileceğini söylüyor. */}
          {uyari?.total > 0 && (
            <div className="card uyari-kart" style={{ marginBottom: 16 }}>
              <div className="card-head">
                <h2>{uyari.total} uyarı</h2>
                <span className="muted">Liste yine de kaydedildi; hiçbiri yayınlamayı engellemez.</span>
              </div>

              <div className="uyari-liste">
                {Object.entries(uyari.byFlag).map(([f, n]) => (
                  <div key={f} className="uyari-satir">
                    <span className="badge badge-danger mono">{n}</span>
                    <div>
                      <strong>{flagMetni(f)}</strong>
                      <div className="muted">{UYARI_NE_YAPMALI[f] ?? 'Gün üzerine tıklayıp atamayı düzeltebilirsiniz.'}</div>
                    </div>
                  </div>
                ))}

                {uyari.belowMin.length > 0 && (
                  <div className="uyari-satir">
                    <span className="badge badge-warn mono">{uyari.belowMin.length}</span>
                    <div>
                      <strong>Aylık minimum nöbetin altında</strong>
                      <div className="muted">
                        {uyari.belowMin.map((e) => e.name).join(', ')} — aylık min nöbet{' '}
                        {rule.minDutiesPerMonth}. Kadroyu ya da minimumu Kural Ayarları’ndan değiştirin.
                      </div>
                    </div>
                  </div>
                )}

                {uyari.weeklyShort?.length > 0 && (
                  <div className="uyari-satir">
                    <span className="badge badge-warn mono">{uyari.weeklyShort.length}</span>
                    <div>
                      <strong>Haftalık {rule.minWeeklyHours} saatin altında</strong>
                      <div className="muted">
                        {uyari.weeklyShort
                          .slice(0, 4)
                          .map((w) => `${w.name} (${tarihYaz(w.week)} haftası, ${w.hours} saat)`)
                          .join(', ')}
                        {uyari.weeklyShort.length > 4 && ` +${uyari.weeklyShort.length - 4} tane daha`}
                        {' '}— gündüz kadrosunu artırmak en doğrudan çözüm.
                      </div>
                    </div>
                  </div>
                )}

                {uyari.idleExceeded?.length > 0 && (
                <div className="uyari-satir">
                  <span className="badge badge-warn mono">{uyari.idleExceeded.length}</span>
                  <div>
                    <strong>Boş bekleme sınırı aşıldı</strong>
                    <div className="muted">
                      {uyari.idleExceeded
                        .slice(0, 4)
                        .map((r) => `${r.name} (${r.days} gün)`)
                        .join(', ')}
                      {uyari.idleExceeded.length > 4 &&
                        ` +${uyari.idleExceeded.length - 4} kişi daha`}
                      {' '}— sınır {rule.maxIdleDays} gün. Hastaneye gelmeden geçen gün
                      sayısıdır; nöbet de gündüz mesaisi de süreyi sıfırlar. Hafta sonu
                      gündüz kadrosu 0 ise Cumartesi-Pazar zaten 2 gün boşluk demektir.
                      Kadroyu artırın ya da sınırı yükseltin.
                    </div>
                  </div>
                </div>
              )}
              {uyari.overCapacity?.length > 0 && (
                  <div className="uyari-satir">
                    <span className="badge badge-warn mono">{uyari.overCapacity.length}</span>
                    <div>
                      <strong>Gündüz kadrosu aşıldı</strong>
                      <div className="muted">
                        O günlerde {uyari.overCapacity[0].count} kişi var, kadro{' '}
                        {uyari.overCapacity[0].kadro}. Her gün gündüze gelen personel
                        (sadece-gündüz, sorumlu) kadrodan fazla; kadroyu artırın ya da
                        personel tiplerini gözden geçirin.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {yukleniyor && (
            <div className="card card-pad">
              <Yukleniyor metin={`${donemBaslik(yil, ay)} listesi yükleniyor…`} />
              <div style={{ marginTop: 14 }}>
                <Iskelet satir={5} yukseklik={46} />
              </div>
            </div>
          )}

          {/* Takvim tam genişlikte; ekip ve puantaj altında yatay olarak akıyor. */}
          {!yukleniyor && veri && (
            veri.assignments.length === 0 ? (
              <div className="card card-pad">
                <h3>{donemBaslik(yil, ay)} için liste yok</h3>
                <p className="muted" style={{ maxWidth: 620 }}>
                  <strong>Otomatik Taslak Oluştur</strong> — kural setine göre ayın
                  tamamını üretir.
                </p>
                <p className="muted" style={{ maxWidth: 620 }}>
                  <strong>Boş Liste (elle doldur)</strong> — kadro kadar boş slot açar,
                  günlere tıklayıp kendiniz doldurursunuz. Otomasyona geçtiğiniz aydan
                  bir önceki ayı bu şekilde girin: ay geçişi kuralları (dinlenme, gün
                  aşırı nöbet, bekleme süresi) bir sonraki ayı üretirken önceki ayın son
                  haftasına bakar.
                </p>
              </div>
            ) : (
              <CalendarGrid
                year={yil}
                month={ay}
                assignments={veri.assignments}
                holidays={veri.holidays ?? []}
                onSelectDay={setSecilenGun}
              />
            )
          )}

          {!yukleniyor && veri && (
            <PuantajCizelgesi
              year={veri.year}
              month={veri.month}
              employees={veri.employees}
              assignments={veri.assignments}
              leaves={veri.leaves}
              holidays={veri.holidays ?? []}
              rule={rule}
              unitName={veri.unit?.name}
            />
          )}

          {!yukleniyor && veri?.assignments.length > 0 && (
            <PuantajTablosu puantaj={veri.puantaj} rule={rule} donem={donemBaslik(yil, ay)} />
          )}
        </div>
      </div>

      {secilenGun && veri && (
        <GunDuzenleyici
          gun={secilenGun}
          veri={veri}
          unitId={unitId}
          onKapat={() => setSecilenGun(null)}
          onKaydedildi={(yeni) => setVeri(yeni)}
        />
      )}
    </div>
  );
}

/**
 * Bir güne tıklanınca açılır. Slotlar vardiya tipine göre gruplanır; her grubun
 * başlığında ne doldurulduğu, saat aralığı ve kaç kişilik kadro olduğu yazar,
 * her satır da "1. nöbetçi" gibi tek tek numaralanır — hangi seçimin neye ait
 * olduğu listeye bakmadan anlaşılsın diye.
 */
function GunDuzenleyici({ gun, veri, unitId, onKapat, onKaydedildi }) {
  const gunAtamalari = veri.assignments.filter((a) => gunNo(a.date) === gun);
  const [adaylar, setAdaylar] = useState({});
  // Kadro dışı ekleme listesi için, henüz var olmayan slotun aday değerlendirmesi.
  const [ekAdaylar, setEkAdaylar] = useState({});
  const [kaydediliyor, setKaydediliyor] = useState('');
  const [ekleniyor, setEkleniyor] = useState('');
  const [hata, setHata] = useState('');
  /**
   * Aday listeleri yalnızca sunucudan onaylı bir değişiklikten sonra tazelenir.
   * Doğrudan `veri.assignments`e bağlıyken iyimser güncelleme de tetikliyor ve
   * her seçimde aday sorguları iki kez gidiyordu.
   */
  const [surum, setSurum] = useState(0);

  const gunIso = `${veri.year}-${String(veri.month).padStart(2, '0')}-${String(gun).padStart(2, '0')}`;

  useEffect(() => {
    let iptal = false;
    Promise.all(
      gunAtamalari.map(async (a) => [a._id, await api.candidates(a._id).catch(() => null)])
    ).then((ciftler) => {
      if (!iptal) setAdaylar(Object.fromEntries(ciftler));
    });
    return () => { iptal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gun, surum]);

  // Ekleme listesi daha açılmadan uygunluk bilgisini hazırla: kim seçilebilir,
  // seçilemeyenler neden seçilemiyor.
  useEffect(() => {
    let iptal = false;
    Promise.all(
      (veri.unit?.shiftTypes ?? []).map(async (shiftType) => [
        shiftType,
        await api
          .slotCandidates(unitId, veri.year, veri.month, { date: gunIso, shiftType })
          .catch(() => null),
      ])
    ).then((ciftler) => {
      if (!iptal) setEkAdaylar(Object.fromEntries(ciftler));
    });
    return () => { iptal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gunIso, surum]);

  const ata = async (assignmentId, employeeId) => {
    setKaydediliyor(assignmentId);
    setHata('');

    // İyimser güncelleme: seçim anında görünsün. Sunucu tüm listenin kural
    // kontrolünü yeniden çalıştırdığı için yanıt uzak veritabanında saniyeler
    // sürebiliyor; kullanıcı o sırada seçiminin kaydolduğunu görmeli.
    const oncekiVeri = veri;
    const kisi = veri.employees.find((e) => e.employee === employeeId);
    onKaydedildi({
      ...veri,
      assignments: veri.assignments.map((a) =>
        a._id === assignmentId
          ? { ...a, employee: employeeId ? { _id: employeeId, name: kisi?.name ?? '' } : null }
          : a
      ),
    });

    try {
      onKaydedildi(await api.updateAssignment(assignmentId, employeeId || null));
      setSurum((s) => s + 1);
    } catch (e) {
      // Kaydedilemedi: iyimser değişikliği geri al.
      onKaydedildi(oncekiVeri);
      setHata(e.message);
    } finally {
      setKaydediliyor('');
    }
  };

  /** O güne, kadro dışı bir kişi ekler. */
  const kisiEkle = async (shiftType, employeeId) => {
    if (!employeeId) return;
    setEkleniyor(shiftType);
    setHata('');
    try {
      onKaydedildi(await api.addAssignment(unitId, veri.year, veri.month, {
        date: gunIso,
        shiftType,
        employee: employeeId,
      }));
      setSurum((s) => s + 1);
    } catch (e) {
      setHata(e.message);
    } finally {
      setEkleniyor('');
    }
  };

  const slotKaldir = async (a) => {
    setKaydediliyor(a._id);
    setHata('');
    try {
      onKaydedildi(await api.removeAssignment(a._id));
      setSurum((s) => s + 1);
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor('');
    }
  };

  const rule = veri.rule ?? {};
  const tarih = gunAtamalari[0]?.date;
  // Slot ve ekleme listelerinden herhangi biri hâlâ bekleniyorsa başlıkta göster.
  const adaylarYukleniyor =
    gunAtamalari.some((a) => !adaylar[a._id]) ||
    (veri.unit?.shiftTypes ?? []).some((tip) => !ekAdaylar[tip]);
  const gunBasligi = tarih
    ? tarihGunAdiyla(tarih)
    : `${String(gun).padStart(2, '0')}.${String(veri.month).padStart(2, '0')}.${veri.year}`;

  const saatAraligi = (shiftType) =>
    shiftType === 'nobet-24'
      ? vardiyaMetni(rule.dutyStart, rule.dutyEnd)
      : vardiyaMetni(rule.dayShiftStart, rule.dayShiftEnd);

  // Birimin kullandığı her vardiya tipi, o gün hiç slotu olmasa bile listelenir:
  // kadrosu 0 olan bir güne (ör. hafta sonu gündüz mesaisi) da kişi eklenebilmeli.
  const gruplar = ['nobet-24', 'mesai-8']
    .filter((type) => veri.unit?.shiftTypes?.includes(type))
    .map((shiftType) => ({ shiftType, slotlar: gunAtamalari.filter((a) => a.shiftType === shiftType) }));

  const bosSayisi = gunAtamalari.filter((a) => !a.employee).length;

  return (
    <div className="modal-backdrop" onClick={onKapat}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <div>
            <h2 style={{ marginBottom: 2 }}>{gunBasligi}</h2>
            <div className="muted">
              {veri.unit?.name} — bu günün kadrosunu doldurun
              {bosSayisi > 0 && ` · ${bosSayisi} boş yer`}
            </div>
            {adaylarYukleniyor && (
              <div style={{ marginTop: 6 }}>
                <Yukleniyor metin="Uygun adaylar yükleniyor…" />
              </div>
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onKapat}>Kapat</button>
        </div>

        <div className="card-pad">
          {hata && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{hata}</div>}

          {gruplar.map(({ shiftType, slotlar }) => (
            <section key={shiftType} className="slot-grup">
              <div className="slot-grup-baslik">
                <strong>{VARDIYA_ADI[shiftType]}</strong>
                <span className="muted mono">{saatAraligi(shiftType)}</span>
                <span className="badge badge-dim">
                  {slotlar.filter((s) => !s.manual).length} kişilik kadro
                  {slotlar.some((s) => s.manual) &&
                    ` + ${slotlar.filter((s) => s.manual).length} ek`}
                </span>
                {slotlar.length === 0 && (
                  <span className="muted">Bu gün için kadro tanımlı değil</span>
                )}
              </div>

              {slotlar.map((a, i) => {
                const rapor = adaylar[a._id];
                const uygun = rapor?.eligible ?? [];
                const sebepler = rapor?.reasons ?? {};
                const etiket =
                  shiftType === 'nobet-24' ? `${i + 1}. nöbetçi` : `${i + 1}. gündüz personeli`;

                return (
                  <div key={a._id} className="field">
                    <label htmlFor={`slot-${a._id}`}>
                      {etiket}
                      {!a.employee && <span className="badge badge-warn" style={{ marginLeft: 8 }}>Boş</span>}
                      {a.manual && (
                        <span className="badge badge-accent" style={{ marginLeft: 8 }}>
                          Bu güne özel
                        </span>
                      )}
                      {a.manual && (
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          style={{ marginLeft: 6 }}
                          disabled={kaydediliyor === a._id}
                          onClick={() => slotKaldir(a)}
                        >
                          Kaldır
                        </button>
                      )}
                      {kaydediliyor === a._id && (
                        <span className="donen" style={{ marginLeft: 8 }} aria-label="Kaydediliyor" />
                      )}
                    </label>

                    {/* Elle girişte kurala uymayanlar da seçilebilir: geçmiş bir ayı
                        sisteme girerken amaç fiilen olanı kaydetmek, kuralı dayatmak
                        değil. Seçilirse atama ilgili uyarıyla etiketlenir. */}
                    <select
                      id={`slot-${a._id}`}
                      className="select"
                      value={a.employee?._id ?? ''}
                      disabled={kaydediliyor === a._id || !rapor}
                      onChange={(e) => ata(a._id, e.target.value)}
                    >
                      <option value="">— Boş bırak —</option>
                      {uygun.length > 0 && (
                        <optgroup label="Kurallara uyan adaylar">
                          {uygun.map((e) => (
                            <option key={e._id} value={e._id}>{e.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {Object.keys(sebepler).length > 0 && (
                        <optgroup label="Kurala uymayanlar — seçilirse uyarıyla kaydedilir">
                          {Object.entries(sebepler).map(([id, sebep]) => {
                            const kisi = veri.employees.find((e) => e.employee === id);
                            return (
                              <option key={id} value={id}>
                                {kisi?.name ?? id} — {flagMetni(sebep)}
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                    </select>

                    {!rapor && <Iskelet satir={1} yukseklik={16} />}

                    {(a.flags ?? []).length > 0 && (
                      <div className="alert alert-danger" style={{ marginTop: 6 }}>
                        {a.flags.map(flagMetni).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Kadro ayın her gününe aynı sayıyı uygular; tek bir günde fazladan
                  kişi gerektiğinde buradan eklenir. */}
              {(() => {
                const rapor = ekAdaylar[shiftType];
                const uygunEk = rapor?.eligible ?? [];
                const sebeplerEk = rapor?.reasons ?? {};

                return (
                  <div className="field slot-ekle">
                    <label htmlFor={`ekle-${shiftType}`}>
                      Bu güne {VARDIYA_ADI[shiftType].toLowerCase()} için kişi ekle
                    </label>
                    <select
                      id={`ekle-${shiftType}`}
                      className="select"
                      value=""
                      disabled={ekleniyor === shiftType || !rapor}
                      onChange={(e) => kisiEkle(shiftType, e.target.value)}
                    >
                      <option value="">
                        {ekleniyor === shiftType
                          ? 'Ekleniyor…'
                          : rapor
                            ? '+ Kadro dışı kişi ekle…'
                            : 'Adaylar yükleniyor…'}
                      </option>
                      {uygunEk.length > 0 && (
                        <optgroup label="Kurallara uyan adaylar">
                          {uygunEk.map((e) => (
                            <option key={e._id} value={e._id}>{e.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {Object.keys(sebeplerEk).length > 0 && (
                        <optgroup label="Kurala uymayanlar — seçilirse uyarıyla kaydedilir">
                          {Object.entries(sebeplerEk).map(([id, sebep]) => {
                            const kisi = veri.employees.find((e) => e.employee === id);
                            return (
                              <option key={id} value={id}>
                                {kisi?.name ?? id} — {flagMetni(sebep)}
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                    </select>
                    {!rapor ? (
                      <Iskelet satir={1} yukseklik={16} />
                    ) : (
                      <span className="muted">
                        Kadronun üstüne, yalnızca bu güne eklenir. Kural ihlali
                        engellemez; atama uyarıyla kaydedilir.
                      </span>
                    )}
                  </div>
                );
              })()}
            </section>
          ))}

          {gruplar.length === 0 && (
            <p className="muted">Birim için vardiya tipi tanımlı değil.</p>
          )}
        </div>
      </div>
    </div>
  );
}
