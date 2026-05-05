import { renderHook, waitFor } from '@testing-library/react';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { useUserRoleInCourse } from '../../hooks/useUserRoleInCourse';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('../../hooks/useUserRoleInCourse');
jest.mock('next/navigation');

describe('useRoleAccess hook', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    });

    it('denies access and redirects if role is not allowed', async () => {
        (useUserRoleInCourse as jest.Mock).mockReturnValue({
            role: 'student',
            course: { id: 101 },
            isLoading: false
        });

        const { result } = renderHook(() => useRoleAccess({
            allowedRoles: ['instructor'],
            courseId: 101
        }));

        await waitFor(() => {
            expect(result.current.hasAccess).toBe(false);
            expect(mockPush).toHaveBeenCalledWith('/c/101');
        });
    });

    it('grants access if role is allowed', async () => {
        (useUserRoleInCourse as jest.Mock).mockReturnValue({
            role: 'instructor',
            course: { id: 101 },
            isLoading: false
        });

        const { result } = renderHook(() => useRoleAccess({
            allowedRoles: ['instructor', 'ta'],
            courseId: 101
        }));

        await waitFor(() => {
            expect(result.current.hasAccess).toBe(true);
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    it('redirects to home if course not found', async () => {
        (useUserRoleInCourse as jest.Mock).mockReturnValue({
            role: null,
            course: null,
            isLoading: false
        });

        renderHook(() => useRoleAccess({
            allowedRoles: ['student'],
            courseId: 999
        }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
