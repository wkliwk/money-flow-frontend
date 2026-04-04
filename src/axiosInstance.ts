import axios, { AxiosError } from 'axios';
import { getToken, clearToken } from './services/auth';
import { emitToast } from './toastEvents';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3101';

const TIMEOUT_MS = 10000;

function getHumanMessage(error: AxiosError<{ message?: string }>): string {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out — please check your connection and try again';
    }
    return 'Network error — please check your internet connection';
  }

  const status = error.response.status;
  const serverMessage = error.response.data?.message;

  if (status === 401) {
    return 'Session expired — please sign in again';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action';
  }
  if (status === 404) {
    return 'The requested resource was not found';
  }
  if (status === 422 || status === 400) {
    return serverMessage || 'Invalid request — please check your input';
  }
  if (status >= 500) {
    return 'Server error — please try again later';
  }

  return serverMessage || `Request failed (${status})`;
}

const axiosInstance = axios.create({
  baseURL,
  timeout: TIMEOUT_MS,
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
  (err: AxiosError<{ message?: string }>) => {
    const message = getHumanMessage(err);
    emitToast(message, 'error');

    if (err.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
