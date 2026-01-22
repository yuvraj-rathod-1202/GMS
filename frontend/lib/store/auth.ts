import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '@/lib/types/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('authToken', token);
        // Also set cookie for middleware access
        document.cookie = `authToken=${token}; path=/; max-age=86400`;
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('authToken');
        // Clear cookie
        document.cookie = 'authToken=; path=/; max-age=0';
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
