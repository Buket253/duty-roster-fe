import { useState } from 'react';
import TarihGirdisi from './TarihGirdisi.jsx';
import { tarihUzun, vardiyaMetni, vardiyaSuresi } from '../utils.js';

/** Birimin vardiya saatleri, kadro, nöbet kuralları ve resmi tatillerinin form hâli. */
export default function RuleForm({ rule, onChange }) {
  const [yeniTatil, setYeniTatil] = useState('');
  const tatiller = rule.holidays ?? [];

  const saat = (alan, etiket) => (
    <div className="field">
      <label htmlFor={alan}>{etiket}</label>
      <input
        id={alan}
        className="input mono"
        type="time"
        value={rule[alan] ?? ''}
        onChange={(e) => onChange(alan, e.target.value)}
      />
    </div>
  );

  const sayi = (alan, etiket, ipucu, ekstra = {}) => (
    <div className="field">
      <label htmlFor={alan}>{etiket}</label>
      <input
        id={alan}
        className="input mono"
        type="number"
        value={rule[alan] ?? ''}
        onChange={(e) => onChange(alan, e.target.value === '' ? '' : Number(e.target.value))}
        {...ekstra}
      />
      {ipucu && <span className="muted">{ipucu}</span>}
    </div>
  );

  const anahtar = (alan, etiket, ipucu) => (
    <div className="field">
      <label className="switch" htmlFor={alan}>
        <input
          id={alan}
          type="checkbox"
          checked={Boolean(rule[alan])}
          onChange={(e) => onChange(alan, e.target.checked)}
        />
        <span className="switch-track" />
        <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{etiket}</span>
      </label>
      {ipucu && <span className="muted">{ipucu}</span>}
    </div>
  );

  const kaydirici = (alan, etiket, ipucu) => (
    <div className="field">
      <label htmlFor={alan}>
        {etiket} — <span className="mono">%{rule[alan] ?? 0}</span>
      </label>
      <input
        id={alan}
        className="slider"
        type="range"
        min="0"
        max="100"
        value={rule[alan] ?? 0}
        onChange={(e) => onChange(alan, Number(e.target.value))}
      />
      {ipucu && <span className="muted">{ipucu}</span>}
    </div>
  );

  const ikili = (sol, sag) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {sol}
      {sag}
    </div>
  );

  const gunduzSure = vardiyaSuresi(rule.dayShiftStart, rule.dayShiftEnd);
  const nobetSure = vardiyaSuresi(rule.dutyStart, rule.dutyEnd);

  return (
    <>
      <h3 className="kural-baslik">Vardiya saatleri</h3>
      <p className="muted" style={{ marginTop: -4 }}>
        Her departmanın çalışma prensibi farklı olabilir. Buradaki süreler haftalık
        saat hesabına ve puantaja doğrudan yansır. Bitiş saati başlangıca eşit ya da
        ondan küçükse vardiya ertesi güne sarkar.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
        {saat('dayShiftStart', 'Gündüz mesaisi başlangıç')}
        {saat('dayShiftEnd', 'Gündüz mesaisi bitiş')}
        <div className="field">
          <span className="badge badge-dim mono">
            {gunduzSure === null ? 'geçersiz' : `${gunduzSure} saat`}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
        {saat('dutyStart', 'Nöbet başlangıç')}
        {saat('dutyEnd', 'Nöbet bitiş')}
        <div className="field">
          <span className="badge badge-dim mono">
            {nobetSure === null ? 'geçersiz' : `${nobetSure} saat`}
          </span>
        </div>
      </div>

      <p className="muted">
        Gündüz {vardiyaMetni(rule.dayShiftStart, rule.dayShiftEnd)} · Nöbet{' '}
        {vardiyaMetni(rule.dutyStart, rule.dutyEnd)}
      </p>

      <h3 className="kural-baslik">Kadro</h3>
      <p className="muted" style={{ marginTop: -4 }}>
        Bir güne yazılacak toplam kişi sayısı. Her gün gündüze gelen personel
        (sadece-gündüz, sorumlu) bu sayının içinden sayılır; rotasyon kalan yerleri
        doldurur.
      </p>

      {ikili(
        sayi('weekdayDayStaff', 'Hafta içi gündüz', 'Gündeki toplam mesai sayısı', { min: 0 }),
        sayi('weekdayDutyStaff', 'Hafta içi nöbetçi', '24 saatlik nöbet', { min: 0 })
      )}
      {ikili(
        sayi('weekendDayStaff', 'Hafta sonu gündüz', '0 ise hafta sonu mesai açılmaz', { min: 0 }),
        sayi('weekendDutyStaff', 'Hafta sonu nöbetçi', null, { min: 0 })
      )}

      <h3 className="kural-baslik">Dinlenme ve boşluk</h3>

      {sayi('minRestDaysAfterDuty', 'Nöbet sonrası dinlenme (gün)', 'Bu kadar gün ne nöbet ne mesai verilir; 1 = ertesi gün boş', { min: 0 })}
      {sayi('maxTightGapsPerMonth', 'Aylık gün aşırı nöbet hakkı', 'Gün aşırı nöbet son çare olarak kullanılır: başka uygun aday varken verilmez. Bu değer, mecbur kalındığında ayda kaç kez izin verileceğidir.', { min: 0 })}
      {sayi(
        'maxIdleDays',
        'En fazla boş bekleme (gün)',
        'Kişinin hastaneye hiç gelmeden geçirebileceği en fazla gün. Nöbet de gündüz mesaisi de gelme sayılır ve süreyi sıfırlar; nöbet sonrası dinlenme günü beklemeye dahildir. Hedeftir, sert kural değil: kadro elvermiyorsa sağlanamayan durumlar listede uyarı olarak çıkar.',
        { min: 1 }
      )}

      <h3 className="kural-baslik">Nöbet sınırları</h3>

      {ikili(
        sayi('minDutiesPerMonth', 'Aylık min nöbet', null, { min: 0 }),
        sayi('maxDutiesPerMonth', 'Aylık maks nöbet', null, { min: 1 })
      )}

      <h3 className="kural-baslik">Adil dağıtım</h3>

      {kaydirici(
        'weekendFairnessWeight',
        'Hafta sonu ağırlığı',
        'Nöbetler hafta içi / Perşembe / Cuma / hafta sonu olarak ayrı ayrı dengelenir; Perşembe ve Cuma kendi içlerinde değerlendirilir. Bu değer hafta sonu bileşenini ağırlıklandırır.'
      )}
      {kaydirici(
        'hoursFairnessWeight',
        'Toplam saat ağırlığı',
        'Ay sonunda kişilerin toplam çalışma saatini birbirine yaklaştırır'
      )}
      {sayi('minWeeklyHours', 'Haftalık alt sınır (saat)', 'Gündüz + nöbet toplamı bu değerin altına düşmemeye çalışılır. Ayın kesildiği yarım haftalar ve kişinin izinli olduğu haftalar hesaba katılmaz; kadro yetmezse kalan açık uyarı olarak listelenir.', { min: 0 })}

      {anahtar('excludeOnLeave', 'İzinli personeli otomatik hariç tut', 'İzin tarihleriyle çakışan kişiler hem nöbetten hem mesaiden çıkarılır')}

      <h3 className="kural-baslik">Resmi tatiller</h3>
      <p className="muted" style={{ marginTop: -4 }}>
        Tatil günlerinde gündüz kadrosu açılmaz, yalnızca nöbetçi yazılır. Her gün
        gündüze gelen personel de (sadece-gündüz, sorumlu) çağrılmaz. Nöbet
        adaletinde hafta sonu sayılırlar.
      </p>

      {anahtar(
        'useNationalHolidays',
        'Sabit resmi tatiller hazır gelsin',
        '1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos ve 29 Ekim otomatik tatil sayılır. Dinî bayramlar ay takvimine göre kaydığı için aşağıdan elle eklenir.'
      )}

      <label className="field-etiket" htmlFor="tatil-tarih">Ek tatil ekle</label>

      <div className="tatil-ekle">
        <TarihGirdisi
          id="tatil-tarih"
          value={yeniTatil}
          onChange={setYeniTatil}
          aria-label="Resmi tatil tarihi"
        />
        <button
          type="button"
          className="btn"
          disabled={!yeniTatil || tatiller.includes(yeniTatil)}
          onClick={() => {
            onChange('holidays', [...tatiller, yeniTatil].sort());
            setYeniTatil('');
          }}
        >
          + Tatil Ekle
        </button>
      </div>

      <div className="roster-tags" style={{ marginBottom: 14 }}>
        {tatiller.length === 0 && <span className="muted">Tanımlı resmi tatil yok.</span>}
        {tatiller.map((g) => (
          <span key={g} className="badge badge-dim tatil-rozet">
            {tarihUzun(g)}
            <button
              type="button"
              aria-label={`${tarihUzun(g)} tatilini kaldır`}
              onClick={() => onChange('holidays', tatiller.filter((x) => x !== g))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </>
  );
}
