import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {AuthState} from '@/lib/types/auth';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => {
                localStorage.setItem('authToken', token);
                set({user, token});
            },
            logout: () => {
                localStorage.removeItem('authToken');
                set({user: null, token: null});
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);