import { create } from 'zustand';
import api, { setAccessToken } from '../api/axios';

import socketService from '../api/socket';

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

let initializationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  setAuth: (user, token) => {
    localStorage.removeItem('token');
    setAccessToken(token);
    socketService.connect(user.role, user.id, token);
    set({ user, token, initialized: true });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    setAccessToken(null);
    set({ user: null, token: null, initialized: true });
    socketService.disconnect();
  },

  // Restore a short-lived access token using the HttpOnly refresh cookie.
  initAuth: async () => {
    if (get().initialized) return;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
      set({ loading: true });
      try {
        const response = await api.post('/auth/refresh');
        const token = response.data?.session?.access_token;
        const user = response.data?.user as AuthUser | undefined;
        if (typeof token !== 'string' || !user?.id || !user.role) {
          throw new Error('Refresh response did not contain a valid user session');
        }

        setAccessToken(token);
        socketService.connect(user.role, user.id, token);
        set({ user, token, loading: false, initialized: true });
      } catch {
        get().clearAuth();
        set({ loading: false, initialized: true });
      }
    })();

    try {
      await initializationPromise;
    } finally {
      initializationPromise = null;
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

if (typeof window !== 'undefined') {
  window.addEventListener('tastifyy:session-expired', () => {
    useAuthStore.getState().clearAuth();
  });
}
