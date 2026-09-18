/** Dönem durumu rozeti: Taslak (amber) / Yayında (teal) / Oluşturulmadı (gri). */
export default function StatusBadge({ status }) {
  if (status === 'yayinda') return <span className="badge badge-accent">Yayında</span>;
  if (status === 'taslak') return <span className="badge badge-warn">Taslak</span>;
  return <span className="badge badge-dim">Oluşturulmadı</span>;
}
