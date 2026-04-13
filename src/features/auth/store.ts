import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'mh-auth',
      // Only persist token and user — actions are recreated on hydration.
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

// Register store on window so the API client can read the token without
// a static circular import (apiClient ← auth/store ← apiClient).
window.__mhAuthStore = useAuthStore;
