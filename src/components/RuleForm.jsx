/** Bölüm 8'deki kuralların form hâli: sayı girişleri, kaydırıcı, açma/kapama anahtarları. */
export default function RuleForm({ rule, onChange }) {
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

  return (
    <>
      {sayi('minRestHoursAfterDuty', 'Nöbet sonrası zorunlu dinlenme (saat)', '24 saatlik nöbetin bitişinden itibaren sayılır', { min: 0 })}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {sayi('minDutiesPerMonth', 'Aylık min nöbet', null, { min: 0 })}
        {sayi('maxDutiesPerMonth', 'Aylık maks nöbet', null, { min: 1 })}
      </div>

      {sayi('maxConsecutiveDuties', 'Ardışık nöbet limiti', '1 = ardışık nöbet tamamen yasak', { min: 1 })}

      <div className="field">
        <label htmlFor="weekendFairnessWeight">
          Hafta sonu adil dağılım ağırlığı — <span className="mono">%{rule.weekendFairnessWeight ?? 0}</span>
        </label>
        <input
          id="weekendFairnessWeight"
          className="slider"
          type="range"
          min="0"
          max="100"
          value={rule.weekendFairnessWeight ?? 0}
          onChange={(e) => onChange('weekendFairnessWeight', Number(e.target.value))}
        />
        <span className="muted">Yüksek değer, hafta sonu nöbetlerini kişiler arasında daha eşit dağıtır</span>
      </div>

      {anahtar('excludeOnLeave', 'İzinli personeli otomatik hariç tut', 'İzin tarihleriyle çakışan kişiler aday listesinden çıkarılır')}
      {anahtar('requireSeniorPairing', 'Kıdem bazlı eşleştirme zorunlu')}
    </>
  );
}
