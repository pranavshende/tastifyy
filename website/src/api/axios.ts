import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://tastifyy.onrender.com/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
