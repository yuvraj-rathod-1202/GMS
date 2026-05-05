import { renderHook, act, waitFor } from '@testing-library/react';
import { useCourseManagement } from '../../hooks/useCourseManagement';
import { CoursesApi } from '@/lib/api/courses';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useAuthStore } from '@/lib/store/auth';

// Mocks
jest.mock('@/lib/api/courses');
jest.mock('@/lib/store/courseDetail');
jest.mock('@/lib/store/auth');

describe('useCourseManagement hook', () => {
    const mockSetTAData = jest.fn();
    const mockSetHasFetched = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
            return selector({ user: { id: 1 } });
        });
        (useCourseDetailStore as unknown as jest.Mock).mockImplementation((selector) => {
            return selector({
                taData: { CourseRoles: null },
                setTAData: mockSetTAData,
                hasFetchedTADataInSession: {},
                setHasFetchedTADataInSession: mockSetHasFetched
            });
        });
        // Mock getState for the static call inside the hook
        (useCourseDetailStore.getState as jest.Mock).mockReturnValue({
            taData: { CourseRoles: null }
        });
    });

    it('fetchCourseRoles calls API and updates store', async () => {
        const mockRoles = [{ user_id: 1, email: 's@s.com' }];
        (CoursesApi.GetCourseRoles as jest.Mock).mockResolvedValue(mockRoles);

        const { result } = renderHook(() => useCourseManagement('ta'));

        await act(async () => {
            await result.current.fetchCourseRoles(101);
        });

        expect(CoursesApi.GetCourseRoles).toHaveBeenCalledWith(101, 'student');
        expect(mockSetTAData).toHaveBeenCalledWith(expect.objectContaining({
            CourseRoles: { students: mockRoles }
        }));
        expect(mockSetHasFetched).toHaveBeenCalledWith('courseRoles', true);
    });

    it('enrollStudent calls CoursesApi', async () => {
        const enrollData = { student_id: 123 } as any;
        (CoursesApi.EnrollStudent as jest.Mock).mockResolvedValue({});

        const { result } = renderHook(() => useCourseManagement('ta'));

        await act(async () => {
            await result.current.enrollStudent(101, enrollData);
        });

        expect(CoursesApi.EnrollStudent).toHaveBeenCalledWith(101, enrollData);
    });

    it('handles error in executeRequest', async () => {
        (CoursesApi.EnrollStudent as jest.Mock).mockRejectedValue(new Error('Fail'));

        const { result } = renderHook(() => useCourseManagement('ta'));

        await act(async () => {
            try {
                await result.current.enrollStudent(101, {} as any);
            } catch (e) {}
        });

        await waitFor(() => expect(result.current.error).toBe('Fail'));
        expect(result.current.loading).toBe(false);
    });
});
