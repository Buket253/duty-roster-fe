import { useEffect, useMemo, useRef, useState } from 'react';
import { AYLAR, GUNLER, ayGunSayisi, haftaninGunu, isoDay } from '../utils.js';

/**
 * Site tipografisiyle uyumlu, yukarı doğru açılan ay takvimi.
 *
 * Yerleşik `<input type="date">` seçicisinin fontu, rengi ve açılma yönü
 * tarayıcıya aittir; sayfa altındayken aşağı açılıp ekran dışında kalıyordu.
 * Bu bileşen tamamen kendi işaretlemesi olduğu için ikisi de kontrol edilebiliyor.
 */
export default function Takvim({ value, onSec, onKapat }) {
  const kutuRef = useRef(null);

  const secili = /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? '')) ? value : null;
  const bugun = isoDay(new Date().toISOString());

  const [gosterilen, setGosterilen] = useState(() => {
    const temel = secili ?? bugun;
    return { yil: Number(temel.slice(0, 4)), ay: Number(temel.slice(5, 7)) };
  });

  // Dışarı tıklama ve Esc ile kapanma.
  useEffect(() => {
    const disariTikla = (e) => {
      if (kutuRef.current && !kutuRef.current.contains(e.target)) onKapat();
    };
    const tus = (e) => e.key === 'Escape' && onKapat();
    document.addEventListener('mousedown', disariTikla);
    document.addEventListener('keydown', tus);
    return () => {
      document.removeEventListener('mousedown', disariTikla);
      document.removeEventListener('keydown', tus);
    };
  }, [onKapat]);

  const { yil, ay } = gosterilen;

  const hucreler = useMemo(() => {
    const toplam = ayGunSayisi(yil, ay);
    // Pazartesi = 0 olacak şekilde ayın ilk gününün konumu.
    const bosluk = haftaninGunu(yil, ay, 1);
    return [...Array(bosluk).fill(null), ...Array.from({ length: toplam }, (_, i) => i + 1)];
  }, [yil, ay]);

  const ayDegistir = (delta) => {
    const d = new Date(Date.UTC(yil, ay - 1 + delta, 1));
    setGosterilen({ yil: d.getUTCFullYear(), ay: d.getUTCMonth() + 1 });
  };

  const isoYap = (gun) => `${yil}-${String(ay).padStart(2, '0')}-${String(gun).padStart(2, '0')}`;

  return (
    <div className="takvim" ref={kutuRef} role="dialog" aria-label="Tarih seç">
      <div className="takvim-baslik">
        <button type="button" className="takvim-ok" onClick={() => ayDegistir(-1)} aria-label="Önceki ay">‹</button>
        <span className="takvim-donem">{AYLAR[ay - 1]} {yil}</span>
        <button type="button" className="takvim-ok" onClick={() => ayDegistir(1)} aria-label="Sonraki ay">›</button>
      </div>

      <div className="takvim-gunler">
        {GUNLER.map((g) => <span key={g} className="takvim-gun-adi">{g}</span>)}

        {hucreler.map((gun, i) => {
          if (gun === null) return <span key={`bos-${i}`} />;
          const iso = isoYap(gun);
          const sinif = [
            'takvim-gun',
            iso === secili ? 'secili' : '',
            iso === bugun ? 'bugun' : '',
          ].filter(Boolean).join(' ');

          return (
            <button key={iso} type="button" className={sinif} onClick={() => onSec(iso)}>
              {gun}
            </button>
          );
        })}
      </div>

      <div className="takvim-alt">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => onSec(bugun)}>Bugün</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => onSec('')}>Temizle</button>
      </div>
    </div>
  );
}
