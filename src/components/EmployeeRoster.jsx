import { isoDay } from '../utils.js';

/**
 * Ekip listesi: ad, unvan, "x/y nöbet" sayacı ve ilerleme çubuğu.
 * Çubuk limitte amber, normalde teal; min nöbetin altında kalanlar ayrıca işaretlenir.
 */
export default function EmployeeRoster({ employees, rule, leaves = [] }) {
  const izinliler = new Map();
  for (const leave of leaves) {
    const id = String(leave.employee?._id ?? leave.employee);
    if (!izinliler.has(id)) izinliler.set(id, []);
    izinliler.get(id).push(leave);
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Ekip</h2>
        <span className="muted mono">{employees.length} kişi</span>
      </div>

      <div style={{ padding: '6px 0' }}>
        {employees.length === 0 && <p className="muted" style={{ padding: '14px 18px' }}>Bu birimde çalışan yok.</p>}

        {employees.map((e) => {
          const oran = rule.maxDutiesPerMonth ? Math.min(100, (e.duties / rule.maxDutiesPerMonth) * 100) : 0;
          const renk = e.atLimit ? 'var(--warn)' : 'var(--accent)';
          const izin = izinliler.get(String(e.employee)) ?? [];

          return (
            <div key={e.employee} className="roster-row">
              <div className="roster-top">
                <div>
                  <div style={{ fontWeight: 500 }}>{e.name}</div>
                  <div className="muted">{e.title || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 600, color: renk }}>
                    {e.duties}/{rule.maxDutiesPerMonth}
                  </span>
                  <div className="muted">nöbet</div>
                </div>
              </div>

              <div className="bar">
                <div className="bar-fill" style={{ width: `${oran}%`, background: renk }} />
              </div>

              <div className="roster-tags">
                <span className="muted mono">h.sonu {e.weekendDuties}</span>
                <span className="muted mono">mesai {e.shifts}</span>
                {e.belowMin && (
                  <span className="badge badge-warn">min {rule.minDutiesPerMonth} altı</span>
                )}
                {izin.map((l) => (
                  <span key={l._id} className="badge badge-dim" title={`${isoDay(l.startDate)} → ${isoDay(l.endDate)}`}>
                    İzinli {isoDay(l.startDate).slice(8)}–{isoDay(l.endDate).slice(8)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
