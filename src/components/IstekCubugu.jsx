import { useEffect, useState } from 'react';
import { istekleriIzle } from '../api/client.js';

/**
 * Sayfanın en üstünde ince, belirsiz ilerleme çubuğu: API'den yanıt beklenen
 * her an görünür. Tek tek ekranlara bayrak koymak yerine istemcideki uçuştaki
 * istek sayacını dinler.
 *
 * Çok kısa isteklerde yanıp sönmesin diye 150 ms gecikmeyle açılır.
 */
export default function IstekCubugu() {
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    let zamanlayici = null;

    const birak = istekleriIzle((sayi) => {
      if (sayi > 0) {
        if (zamanlayici === null) {
          zamanlayici = setTimeout(() => setGorunur(true), 150);
        }
      } else {
        clearTimeout(zamanlayici);
        zamanlayici = null;
        setGorunur(false);
      }
    });

    return () => {
      clearTimeout(zamanlayici);
      birak();
    };
  }, []);

  if (!gorunur) return null;

  return (
    <div className="istek-cubugu" role="status" aria-live="polite" aria-label="Yükleniyor">
      <div className="istek-cubugu-dolgu" />
    </div>
  );
}
