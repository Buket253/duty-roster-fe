import { useState } from 'react';
import api from '../api/client.js';
import { GUNLER, ayGunSayisi, donemBaslik, gunNo, haftaninGunu, haftaSonuMu } from '../utils.js';

/**
 * Kişinin nöbete yazılamayacağı günler. İzin değildir: kişi o gün gündüz
 * mesaisine yazılabilir, yalnızca nöbet alamaz. Tipik sebep eşinin de nöbet
 * tutması — ikisi aynı gün nöbette olmamalı.
 *
 * Kişi seçilir, ay takviminde günlere tıklanır; her tıklama anında kaydedilir.
 * Liste varsa sunucu kural kontrolünü yeniden çalıştırır, o gün zaten nöbete
 * yazılmış kişinin ataması uyarıyla işaretlenir.
 */
export default function NobetEngelleri({ veri, unitId, onGuncellendi }) {
  const { year, month } = veri;
  const engeller = veri.dutyBlocks ?? [];
  // Nöbete hiç girmeyen personel için engel anlamsız; listede yalnızca nöbet
  // alabilenler var.
  const kisiler = (veri.employees ?? []).filter(
    (e) => e.canTakeDuty !== false && e.staffType !== 'sadece-gunduz'
  );

  const [kisi, setKisi] = useState('');
  const [not, setNot] = useState('Eşi nöbette');
  const [mesgul, setMesgul] = useState('');
  const [hata, setHata] = useState('');

  const gunSayisi = ayGunSayisi(year, month);
  const bosluk = haftaninGunu(year, month, 1);
  const gunIso = (gun) =>
    `${year}-${String(month).padStart(2, '0')}-${String(gun).padStart(2, '0')}`;

  const kisininEngeli = (gun) =>
    engeller.find((b) => b.employee === kisi && gunNo(b.date) === gun);

  const degistir = async (gun) => {
    if (!kisi) return;
    setMesgul(String(gun));
    setHata('');
    try {
      const mevcut = kisininEngeli(gun);
      onGuncellendi(
        mevcut
          ? await api.removeDutyBlock(mevcut._id)
          : await api.addDutyBlocks(unitId, year, month, {
              employee: kisi,
              dates: [gunIso(gun)],
              note: not,
            })
      );
    } catch (e) {
      setHata(e.message);
    } finally {
      setMesgul('');
    }
  };

  const sil = async (b) => {
    setMesgul(b._id);
    setHata('');
    try {
      onGuncellendi(await api.removeDutyBlock(b._id));
    } catch (e) {
      setHata(e.message);
    } finally {
      setMesgul('');
    }
  };

  // Özet: kişi başına günler, ay sırasıyla.
  const kisiye = new Map();
  for (const b of [...engeller].sort((x, y) => String(x.date).localeCompare(String(y.date)))) {
    if (!kisiye.has(b.employee)) kisiye.set(b.employee, []);
    kisiye.get(b.employee).push(b);
  }
  const adi = (id) => veri.employees.find((e) => e.employee === id)?.name ?? '—';

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h2>Nöbet yazılamaz günler</h2>
        <span className="muted">
          İzin değildir: kişi o gün gündüz mesaisine yazılabilir, nöbete yazılmaz
          (ör. eşi aynı gün nöbette). Otomatik taslak bu günlere uyar.
        </span>
      </div>

      <div className="card-pad engel-duzen">
        <div className="engel-form">
          <div className="field">
            <label htmlFor="engel-kisi">Personel</label>
            <select
              id="engel-kisi"
              className="select"
              value={kisi}
              onChange={(e) => setKisi(e.target.value)}
            >
              <option value="">— Personel seçin —</option>
              {kisiler.map((e) => (
                <option key={e.employee} value={e.employee}>
                  {e.name}
                  {kisiye.has(e.employee) ? ` (${kisiye.get(e.employee).length} gün)` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="engel-not">Sebep (isteğe bağlı)</label>
            <input
              id="engel-not"
              className="input"
              value={not}
              onChange={(e) => setNot(e.target.value)}
              placeholder="Eşi nöbette"
            />
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {kisi
              ? `${donemBaslik(year, month)} takviminde günlere tıklayın; tekrar tıklamak kaldırır.`
              : 'Önce personeli seçin, sonra takvimde günleri işaretleyin.'}
          </p>
        </div>

        <div className={`engel-takvim${kisi ? '' : ' pasif'}`} aria-disabled={!kisi}>
          {GUNLER.map((g) => (
            <div key={g} className="takvim-gun-adi">{g}</div>
          ))}
          {Array.from({ length: bosluk }, (_, i) => <div key={`bos-${i}`} />)}
          {Array.from({ length: gunSayisi }, (_, i) => {
            const gun = i + 1;
            const secili = Boolean(kisi && kisininEngeli(gun));
            return (
              <button
                key={gun}
                type="button"
                className={`engel-gun${secili ? ' secili' : ''}${haftaSonuMu(year, month, gun) ? ' hafta-sonu' : ''}`}
                disabled={!kisi || mesgul !== ''}
                aria-pressed={secili}
                title={secili ? 'Nöbet yazılamaz — kaldırmak için tıklayın' : 'Nöbet yazılamaz olarak işaretle'}
                onClick={() => degistir(gun)}
              >
                {mesgul === String(gun) ? <span className="donen" aria-label="Kaydediliyor" /> : gun}
              </button>
            );
          })}
        </div>
      </div>

      {hata && (
        <div className="alert alert-danger" style={{ margin: '0 18px 14px' }}>{hata}</div>
      )}

      {kisiye.size > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Personel</th>
              <th>Günler</th>
            </tr>
          </thead>
          <tbody>
            {[...kisiye].map(([id, liste]) => (
              <tr key={id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setKisi(id)}>
                    {adi(id)}
                  </button>
                </td>
                <td>
                  <div className="engel-rozetler">
                    {liste.map((b) => (
                      <span key={b._id} className="badge badge-warn tatil-rozet" title={b.note || undefined}>
                        <span className="mono">{gunNo(b.date)}</span>
                        {b.note && <span>· {b.note}</span>}
                        <button
                          type="button"
                          aria-label={`${gunNo(b.date)}. günü kaldır`}
                          disabled={mesgul === b._id}
                          onClick={() => sil(b)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
