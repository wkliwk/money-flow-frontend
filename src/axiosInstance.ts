import axios from 'axios';
import { getToken, clearToken } from './services/auth';

const baseURL = process.env.VITE_API_URL || 'http://localhost:3001';

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
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
