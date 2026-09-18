import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Sol kalıcı nav. Birim bağlamı olan bağlantılar aktif birimi taşır. */
export default function Sidebar({ unitId }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const cls = ({ isActive }) => `navlink${isActive ? ' active' : ''}`;
  const unitPath = (prefix) => (unitId ? `${prefix}/${unitId}` : '/dashboard');

  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="brand-name">Nöbet Sistemi</div>
        <div className="muted">Yönetim paneli</div>
      </div>

      <NavLink to="/dashboard" className={cls}>Panel</NavLink>
      <NavLink to={unitPath('/nobet-listesi')} className={cls}>Nöbet Listesi</NavLink>
      <NavLink to={unitPath('/kurallar')} className={cls}>Kural Ayarları</NavLink>
      <NavLink to={unitPath('/calisanlar')} className={cls}>Çalışanlar &amp; İzin</NavLink>

      <div className="bottom">
        <button
          type="button"
          className="navlink"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Çıkış
        </button>
      </div>
    </nav>
  );
}
