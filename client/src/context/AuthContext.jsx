import { createContext, useContext, useState } from 'react';
import api from '../lib/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('aa_user')); } catch { return null; } });
  const save = (token, u) => { localStorage.setItem('aa_token', token); localStorage.setItem('aa_user', JSON.stringify(u)); setUser(u); };
  const login = async (email, password) => { const { data } = await api.post('/auth/login', { email, password }); save(data.token, data.user); return data.user; };
  const register = async (payload) => { const { data } = await api.post('/auth/register', payload); save(data.token, data.user); return data.user; };
  const logout = () => { localStorage.removeItem('aa_token'); localStorage.removeItem('aa_user'); setUser(null); };
  const setUserAndStore = (u) => { localStorage.setItem('aa_user', JSON.stringify(u)); setUser(u); };
  return <AuthContext.Provider value={{ user, login, register, logout, setUser: setUserAndStore }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
export const formatSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
export const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
