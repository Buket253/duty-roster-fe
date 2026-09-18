import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const SON_BIRIM = 'nobet-son-birim';

/**
 * Sol kalıcı nav. Birim bağlamı olan bağlantılar aktif birimi taşır.
 * Panel gibi birimsiz ekranlarda son açılan birim hatırlanır; hiç birim
 * yoksa bu bağlantılar pasif görünür.
 */
export default function Sidebar({ unitId }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Bir birim ekranındayken hatırla ki Panel'e dönünce nav çalışmaya devam etsin.
  useEffect(() => {
    if (unitId) localStorage.setItem(SON_BIRIM, unitId);
  }, [unitId]);

  const aktif = unitId ?? localStorage.getItem(SON_BIRIM);
  const cls = ({ isActive }) => `navlink${isActive ? ' active' : ''}`;

  const birimLink = (prefix, etiket) =>
    aktif ? (
      <NavLink to={`${prefix}/${aktif}`} className={cls}>{etiket}</NavLink>
    ) : (
      <span className="navlink navlink-disabled" title="Önce panelden bir birim açın">{etiket}</span>
    );

  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="brand-name">Nöbet Sistemi</div>
        <div className="muted">Yönetim paneli</div>
      </div>

      <NavLink to="/dashboard" className={cls}>Panel</NavLink>
      {birimLink('/nobet-listesi', 'Nöbet Listesi')}
      {birimLink('/kurallar', 'Kural Ayarları')}
      {birimLink('/calisanlar', 'Çalışanlar & İzin')}

      <div className="bottom">
        <button
          type="button"
          className="navlink navlink-btn"
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
