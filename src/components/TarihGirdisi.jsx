import { useEffect, useRef, useState } from 'react';
import Takvim from './Takvim.jsx';

/**
 * GG.AA.YYYY biçiminde tarih alanı + kendi takvimimiz.
 *
 * Yerleşik `<input type="date">` kullanılmıyor: biçimini (aa/gg/yyyy) işletim
 * sistemi yereli belirliyor, açılır takviminin fontu ve açılma yönü tarayıcıya
 * ait ve sayfa altındayken ekran dışında kalıyordu. Burada görünen alan düz
 * metin, takvim ise yukarı doğru açılan kendi bileşenimiz.
 */

// Esnek okuma: '5.9.2026' de '05.09.2026' da kabul edilir.
const isoyaCevir = (metin) => {
  const m = /^\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*$/.exec(String(metin ?? ''));
  if (!m) return null;
  const gun = m[1].padStart(2, '0');
  const ay = m[2].padStart(2, '0');
  const yil = m[3];
  const d = new Date(`${yil}-${ay}-${gun}T00:00:00Z`);
  // Ay/gün taşmasını yakala: 31.02.2026 gibi girişler Date tarafından kaydırılır.
  if (
    Number.isNaN(d.getTime()) ||
    d.getUTCDate() !== Number(gun) ||
    d.getUTCMonth() + 1 !== Number(ay)
  ) {
    return null;
  }
  return `${yil}-${ay}-${gun}`;
};

const metneCevir = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
};

/**
 * Yazarken kolaylık: rakam eklendikçe 2. ve 4. rakamdan sonra nokta düşer.
 * Kullanıcı kendi noktasını yazdıysa ya da yapıştırdıysa metne dokunulmaz —
 * '5.10.2026' gibi girişlerin bozulmaması için.
 */
const yazarkenBicimle = (ham, onceki) => {
  const temiz = ham.replace(/[^\d.]/g, '').slice(0, 10);
  const ekleniyor = temiz.length > onceki.length;
  if (!temiz.includes('.')) {
    const rakam = temiz.replace(/\D/g, '');
    return ekleniyor && (rakam.length === 2 || rakam.length === 4) ? `${temiz}.` : temiz;
  }
  const bolumler = temiz.split('.');
  if (ekleniyor && bolumler.length === 2 && bolumler[1].length === 2) return `${temiz}.`;
  return temiz;
};

const normalize = (metin) => {
  const iso = isoyaCevir(metin);
  return iso ? metneCevir(iso) : metin;
};

export default function TarihGirdisi({ id, value, onChange, required = false, ...rest }) {
  const [metin, setMetin] = useState(() => metneCevir(value));
  const [acik, setAcik] = useState(false);
  const girisRef = useRef(null);

  // Dışarıdan sıfırlanınca (ör. form temizlenince) alan da sıfırlansın.
  useEffect(() => {
    setMetin((mevcut) => (isoyaCevir(mevcut) === (value || null) ? mevcut : metneCevir(value)));
  }, [value]);

  const yaz = (ham) => {
    const yeni = yazarkenBicimle(ham, metin);
    setMetin(yeni);
    onChange(isoyaCevir(yeni) ?? '');
  };

  const takvimdenSec = (iso) => {
    setMetin(metneCevir(iso));
    onChange(iso);
    setAcik(false);
    girisRef.current?.focus();
  };

  const eksik = metin.length > 0 && isoyaCevir(metin) === null;

  return (
    <div className="tarih-girdi">
      <input
        ref={girisRef}
        id={id}
        className="input mono"
        type="text"
        inputMode="numeric"
        placeholder="GG.AA.YYYY"
        maxLength={10}
        value={metin}
        aria-invalid={eksik || undefined}
        required={required}
        onChange={(e) => yaz(e.target.value)}
        onBlur={() => setMetin(normalize)}
        {...rest}
      />

      <button
        type="button"
        className="tarih-takvim-btn"
        onClick={() => setAcik((a) => !a)}
        aria-label="Takvimden seç"
        aria-expanded={acik}
        title="Takvimden seç"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="2" y="3" width="12" height="11" rx="2" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
        </svg>
      </button>

      {acik && (
        <Takvim
          value={isoyaCevir(metin)}
          onSec={takvimdenSec}
          onKapat={() => setAcik(false)}
        />
      )}

      {eksik && <span className="alan-hata">Tarihi GG.AA.YYYY olarak yazın</span>}
    </div>
  );
}
