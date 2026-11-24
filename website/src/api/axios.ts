import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_URL || 'https://tastifyy-ivyy.onrender.com/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 45000, // 45s allows Render free-tier cold starts to complete
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-retry idempotent GET requests on cold start timeout or 502/503/504
const MAX_RETRIES = 2;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as (typeof error.config & { __retryCount?: number }) | undefined;
    if (!config) {
      return Promise.reject(error);
    }

    const isGet = (config.method || 'get').toLowerCase() === 'get';
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      error.message?.toLowerCase().includes('timeout');
    const isServerError =
      Boolean(error.response && [502, 503, 504].includes(error.response.status));

    config.__retryCount = config.__retryCount || 0;

    if (isGet && (isTimeout || isServerError) && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      const delayMs = config.__retryCount * 2000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;

