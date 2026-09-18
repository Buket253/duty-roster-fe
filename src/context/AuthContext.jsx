import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client.js';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());

  // Token süresi dolduğunda (API 401 döndüğünde) oturumu kapat.
  useEffect(() => {
    setUnauthorizedHandler(() => setTokenState(null));
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      async login(email, password) {
        const { token: fresh } = await api.login(email, password);
        setToken(fresh);
        setTokenState(fresh);
      },
      logout() {
        clearToken();
        setTokenState(null);
      },
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
