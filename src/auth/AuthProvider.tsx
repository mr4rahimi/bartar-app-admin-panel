import { createContext, useContext, useEffect, useState } from 'react';
import client, { setAuthToken } from '../api/client';

type User = { id?: number; name?: string; email?: string; role?: string };

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  initializing: boolean;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      // optionally fetch profile
      client.get('/auth/me').then(res => {
        setUser(res.data);
        localStorage.setItem('admin_user', JSON.stringify(res.data));
      }).catch(()=> {
        // token invalid
        setToken(null);
        setUser(null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAuthToken(undefined);
      }).finally(()=> setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, []);

  async function login(phoneOrEmail: string, password: string) {
    // If your backend login expects phone, adjust. Here try email/phone
    const res = await client.post('/auth/login', { phone: phoneOrEmail, password });
    const t = res.data.token;
    const u = res.data.user;
    localStorage.setItem('admin_token', t);
    localStorage.setItem('admin_user', JSON.stringify(u));
    setAuthToken(t);
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAuthToken(undefined);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}