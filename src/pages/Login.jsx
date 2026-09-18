import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const gonder = async (e) => {
    e.preventDefault();
    setHata('');
    setBekliyor(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setHata(err.message);
    } finally {
      setBekliyor(false);
    }
  };

  return (
    <div className="login-bg">
      <form className="card card-pad login-card" onSubmit={gonder}>
        <h1 style={{ marginBottom: 4 }}>Nöbet Sistemi</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 22 }}>Yönetici girişi</p>

        {hata && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{hata}</div>}

        <div className="field">
          <label htmlFor="email">E-posta</label>
          <input
            id="email" className="input" type="email" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Şifre</label>
          <input
            id="password" className="input" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={bekliyor}>
          {bekliyor ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}
