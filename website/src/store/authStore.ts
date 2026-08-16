import { create } from 'zustand';
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
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  initialized: false,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, initialized: true });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, initialized: true });
  },

  // Called on every app mount — validates session with backend
  initAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ initialized: true, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        set({ user: response.data.user, loading: false, initialized: true });
      } else {
        get().clearAuth();
        set({ loading: false });
      }
    } catch (err: any) {
      // 401/403 = expired/invalid token
      if (err.response?.status === 401 || err.response?.status === 403) {
        get().clearAuth();
      }
      set({ loading: false, initialized: true });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Best-effort — clear locally regardless
    }
    get().clearAuth();
  },
}));
