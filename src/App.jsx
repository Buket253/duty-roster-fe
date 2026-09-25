import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import IstekCubugu from './components/IstekCubugu.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NobetListesi from './pages/NobetListesi.jsx';
import KuralAyarlari from './pages/KuralAyarlari.jsx';
import CalisanYonetimi from './pages/CalisanYonetimi.jsx';
import PublicView from './pages/PublicView.jsx';

/** Token yoksa girişe yönlendirir. */
function Korumali({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* API'den yanıt beklenen her an sayfanın üstünde görünür. */}
      <IstekCubugu />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Auth gerektirmeyen paylaşım görünümü */}
          <Route path="/paylasim/:token" element={<PublicView />} />

          <Route path="/dashboard" element={<Korumali><Dashboard /></Korumali>} />
          <Route path="/nobet-listesi/:unitId" element={<Korumali><NobetListesi /></Korumali>} />
          <Route path="/kurallar/:unitId" element={<Korumali><KuralAyarlari /></Korumali>} />
          <Route path="/calisanlar/:unitId" element={<Korumali><CalisanYonetimi /></Korumali>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
