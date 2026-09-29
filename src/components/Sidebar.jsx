import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

const SON_BIRIM = 'nobet-son-birim';

/** Birim bağlamında çalışan ekranlar; menüde seçili birimin altında durur. */
const BIRIM_EKRANLARI = [
  ['/nobet-listesi', 'Nöbet Listesi'],
  ['/kurallar', 'Kural Ayarları'],
  ['/calisanlar', 'Çalışanlar & İzin'],
];

const hatirla = (id) => {
  try {
    localStorage.setItem(SON_BIRIM, id);
  } catch {
    /* depolama kapalıysa yalnızca hatırlanmaz */
  }
};

const hatirlanan = () => {
  try {
    return localStorage.getItem(SON_BIRIM);
  } catch {
    return null;
  }
};

/**
 * Sol kalıcı nav. Panel birimden bağımsızdır ve en üstte tek başına durur;
 * birime bağlı ekranlar ise bir "Birim" grubunun içinde, seçili birimin
 * altında listelenir. Birim değiştirilince aynı ekranın o birimdeki hâline
 * gidilir. Panel gibi birimsiz ekranlarda son açılan birim hatırlanır.
 */
export default function Sidebar({ unitId }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [birimler, setBirimler] = useState([]);

  useEffect(() => {
    api.listUnits().then(setBirimler).catch(() => setBirimler([]));
  }, []);

  // Bir birim ekranındayken hatırla ki Panel'e dönünce aynı birim seçili kalsın.
  useEffect(() => {
    if (unitId) hatirla(unitId);
  }, [unitId]);

  const kayitli = unitId ?? hatirlanan();
  // Hatırlanan birim silinmiş olabilir; o zaman ilk birime düşülür.
  const aktif =
    birimler.length === 0 || birimler.some((b) => b._id === kayitli)
      ? kayitli
      : birimler[0]._id;

  const cls = ({ isActive }) => `navlink${isActive ? ' active' : ''}`;

  const birimDegistir = (yeni) => {
    hatirla(yeni);
    const ekran = BIRIM_EKRANLARI.find(([onek]) => pathname.startsWith(`${onek}/`));
    navigate(`${ekran ? ekran[0] : '/nobet-listesi'}/${yeni}`);
  };

  return (
    <nav className="sidebar">
      <div className="brand">
        <div className="brand-name">Nöbet Sistemi</div>
        <div className="muted">Yönetim paneli</div>
      </div>

      <NavLink to="/dashboard" className={cls}>Panel</NavLink>

      <div className="nav-grup">
        <label className="nav-grup-baslik" htmlFor="nav-birim">Birim</label>
        {birimler.length > 0 ? (
          <select
            id="nav-birim"
            className="select nav-birim"
            value={aktif ?? ''}
            onChange={(e) => birimDegistir(e.target.value)}
          >
            {birimler.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        ) : (
          <div className="muted nav-birim-bos">Henüz birim yok</div>
        )}

        <div className="nav-alt">
          {BIRIM_EKRANLARI.map(([onek, etiket]) =>
            aktif ? (
              <NavLink key={onek} to={`${onek}/${aktif}`} className={cls}>{etiket}</NavLink>
            ) : (
              <span key={onek} className="navlink navlink-disabled" title="Önce panelden bir birim oluşturun">
                {etiket}
              </span>
            )
          )}
        </div>
      </div>

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
