import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import socketService from './socket';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://tastifyy.onrender.com/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
});

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  const isAuthRequest = config?.url?.startsWith('/auth/') && !config.url.startsWith('/auth/me');
  if (error.response?.status !== 401 || !config || isAuthRequest) {
    return Promise.reject(error);
  }

  if (config._retry) {
    window.dispatchEvent(new Event('tastifyy:session-expired'));
    return Promise.reject(error);
  }

  config._retry = true;
  if (!refreshPromise) {
    const attempt = api.post('/auth/refresh').then((response) => {
      const token = response.data?.session?.access_token;
      if (typeof token !== 'string' || !token) {
        throw new Error('Refresh response did not contain an access token');
      }
      setAccessToken(token);
      socketService.updateToken(token);
      return token;
    });
    refreshPromise = attempt;
    void attempt.then(
      () => {
        if (refreshPromise === attempt) refreshPromise = null;
      },
      () => {
        if (refreshPromise === attempt) refreshPromise = null;
      },
    );
  }

  try {
    const token = await refreshPromise;
    config.headers.Authorization = `Bearer ${token}`;
    return await api(config);
  } catch (refreshError) {
    setAccessToken(null);
    window.dispatchEvent(new Event('tastifyy:session-expired'));
    return Promise.reject(refreshError);
  }
});

export default api;
