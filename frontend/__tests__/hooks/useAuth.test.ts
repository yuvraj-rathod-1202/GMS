import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { Authapi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';
import { useCoursesStore } from '@/lib/store/courses';
import { useCourseDetailStore } from '@/lib/store/courseDetail';

// Mocks
jest.mock('@/lib/api/auth');
jest.mock('@/lib/store/auth');
jest.mock('@/lib/store/courses');
jest.mock('@/lib/store/courseDetail');

// Mock fetch for /api/session
global.fetch = jest.fn() as jest.Mock;

describe('useAuth hook', () => {
    const mockSetAuth = jest.fn();
    const mockLogoutStore = jest.fn();
    const mockClearCourses = jest.fn();
    const mockClearCourseDetail = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { setAuth: mockSetAuth, logout: mockLogoutStore };
            return selector(state);
        });
        (useCoursesStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { clearCourses: mockClearCourses };
            return selector(state);
        });
        (useCourseDetailStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { clearCourseDetail: mockClearCourseDetail };
            return selector(state);
        });
        (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    });

    it('login sets auth on success', async () => {
        const mockUser = { id: 123, name: 'Test' };
        const mockToken = 'test-token';
        (Authapi.login as jest.Mock).mockResolvedValue({ user: mockUser, token: mockToken });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            await result.current.login(123, 'password');
        });

        expect(mockSetAuth).toHaveBeenCalledWith(mockUser, mockToken);
        expect(global.fetch).toHaveBeenCalledWith('/api/session', expect.anything());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(null);
    });

    it('login sets error on failure', async () => {
        (Authapi.login as jest.Mock).mockRejectedValue(new Error('Login failed'));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            try {
                await result.current.login(123, 'wrong');
            } catch (e: any) {
                expect(e.message).toBe('Login failed');
            }
        });

        expect(result.current.error).toBe('Login failed');
        expect(result.current.loading).toBe(false);
    });

    it('logout clears stores and removes session', async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
            await result.current.logout();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/session', { method: 'DELETE' });
        expect(mockClearCourses).toHaveBeenCalled();
        expect(mockClearCourseDetail).toHaveBeenCalled();
        expect(mockLogoutStore).toHaveBeenCalled();
    });
});
