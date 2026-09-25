/** Metinli dönen gösterge: içerik beklenirken satır içinde kullanılır. */
export function Yukleniyor({ metin = 'Yükleniyor…' }) {
  return (
    <div className="yukleniyor" role="status" aria-live="polite">
      <span className="donen" aria-hidden="true" />
      <span>{metin}</span>
    </div>
  );
}

/** Düğme içindeki dönen gösterge; metin çağıran tarafta kalır. */
export function DugmeDonen() {
  return <span className="donen" aria-hidden="true" />;
}

/**
 * İskelet satırlar: gelecek içeriğin yerini tutar, böylece yükleme bitince
 * sayfa zıplamaz. Tablo ve liste beklerken kullanılır.
 */
export function Iskelet({ satir = 3, yukseklik = 38 }) {
  return (
    <div role="status" aria-label="Yükleniyor" style={{ display: 'grid', gap: 8 }}>
      {Array.from({ length: satir }, (_, i) => (
        <div key={i} className="iskelet" style={{ height: yukseklik }} />
      ))}
    </div>
  );
}

export default Yukleniyor;
