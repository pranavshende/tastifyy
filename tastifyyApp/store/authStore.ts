import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

export type UserRole = 'customer' | 'restaurant_partner' | 'delivery_partner' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  profile_photo_url?: string;
  is_active: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  setAuth: (user: AuthUser, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  setAuth: async (user, token) => {
    await AsyncStorage.setItem('token', token);
    set({ user, token, initialized: true });
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, initialized: true });
  },

  initAuth: async () => {
    set({ loading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        set({ initialized: true, loading: false });
        return;
      }
      set({ token });
      const response = await api.get('/auth/me');
      if (response.data.success) {
        set({ user: response.data.user, loading: false, initialized: true });
      } else {
        await get().clearAuth();
        set({ loading: false });
      }
    } catch (err: any) {
      // Expired or invalid token
      await get().clearAuth();
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    await get().clearAuth();
  },
}));
