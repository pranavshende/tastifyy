import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: Change this to your machine's local IP address (e.g., 192.168.x.x:5000) when testing on a physical device.
const api = axios.create({
  baseURL: 'http://10.0.2.2:5000/api', // 10.0.2.2 works for Android Emulator
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error reading token', e);
  }
  return config;
});

export default api;
