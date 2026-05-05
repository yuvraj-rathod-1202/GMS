import { renderHook, act, waitFor } from '@testing-library/react';
import { useCourses } from '../../hooks/useCourses';
import { CoursesApi } from '@/lib/api/courses';
import { useCoursesStore } from '@/lib/store/courses';

// Mocks
jest.mock('@/lib/api/courses');
jest.mock('@/lib/store/courses');

describe('useCourses hook', () => {
    const mockSetCourses = jest.fn();
    const mockClearCourses = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCoursesStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { setCourses: mockSetCourses, clearCourses: mockClearCourses };
            return selector(state);
        });
    });

    it('fetchCourses updates store on success', async () => {
        const mockCourses = [{ id: 1, name: 'CS101' }];
        (CoursesApi.FetchMyCourses as jest.Mock).mockResolvedValue(mockCourses);

        const { result } = renderHook(() => useCourses());

        await act(async () => {
            await result.current.fetchCourses();
        });

        expect(mockClearCourses).toHaveBeenCalled();
        expect(mockSetCourses).toHaveBeenCalledWith(mockCourses);
        expect(result.current.loading).toBe(false);
    });

    it('fetchCourses handles error', async () => {
        (CoursesApi.FetchMyCourses as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useCourses());

        await act(async () => {
            try {
                await result.current.fetchCourses();
            } catch (e: any) {
                expect(e.message).toBe('Fetch failed');
            }
        });

        expect(result.current.error).toBe('Fetch failed');
        expect(mockClearCourses).toHaveBeenCalledTimes(2); // Initial + Error
    });
});
