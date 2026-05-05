import { renderHook, waitFor } from '@testing-library/react';
import { useAdminAccess } from '../../hooks/useAdminAccess';
import { CoursesApi } from '@/lib/api/courses';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('@/lib/api/courses');
jest.mock('next/navigation');

describe('useAdminAccess hook', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    });

    it('sets isAdmin to true if verified', async () => {
        (CoursesApi.VerifyAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
        
        const { result } = renderHook(() => useAdminAccess());
        
        await waitFor(() => {
            expect(result.current.isAdmin).toBe(true);
            expect(result.current.isLoading).toBe(false);
        });
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('redirects if not admin', async () => {
        (CoursesApi.VerifyAdmin as jest.Mock).mockResolvedValue({ isAdmin: false });
        
        const { result } = renderHook(() => useAdminAccess('/login'));
        
        await waitFor(() => {
            expect(result.current.isAdmin).toBe(false);
            expect(result.current.isLoading).toBe(false);
        });
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('redirects to dashboard by default if not admin', async () => {
        (CoursesApi.VerifyAdmin as jest.Mock).mockResolvedValue({ isAdmin: false });
        
        const { result } = renderHook(() => useAdminAccess());
        
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });
});
