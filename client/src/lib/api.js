import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((r) => r, (error) => {
  if (error.response?.status === 401 && localStorage.getItem('aa_token')) {
    localStorage.removeItem('aa_token'); localStorage.removeItem('aa_user');
    if (!location.pathname.startsWith('/login')) location.href = '/login';
  }
  return Promise.reject(error);
});
export const errMsg = (e) => e.response?.data?.message || (e.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running on port 5000?' : e.message);
export default api;
