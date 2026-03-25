import axios from 'axios';
import { getToken, clearToken } from './services/auth';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Log expense requests with participants for debugging
  if (config.url?.includes('/expenses') && config.data) {
    console.log('[DEBUG] Expense request:', { url: config.url, method: config.method, data: config.data });
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => {
    // Log expense responses for debugging
    if (res.config.url?.includes('/expenses') && res.data) {
      console.log('[DEBUG] Expense response:', { url: res.config.url, status: res.status, data: res.data });
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
