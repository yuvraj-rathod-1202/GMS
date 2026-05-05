import { renderHook, act } from '@testing-library/react';
import { useTACourse } from '../../hooks/useTACourse';
import { CoursesApi } from '@/lib/api/courses';
import { MarksApi } from '@/lib/api/marks';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useAuthStore } from '@/lib/store/auth';

// Mocks
jest.mock('@/lib/api/courses');
jest.mock('@/lib/api/marks');
jest.mock('@/lib/store/courseDetail');
jest.mock('@/lib/store/auth');

describe('useTACourse hook', () => {
    const mockSetTAData = jest.fn();
    const mockSetHasFetched = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
            return selector({ user: { id: 1 } });
        });
        (useCourseDetailStore as unknown as jest.Mock).mockImplementation((selector) => {
            return selector({
                taData: { CourseRoles: null, assessments: [] },
                setTAData: mockSetTAData,
                hasFetchedTADataInSession: {},
                setHasFetchedTADataInSession: mockSetHasFetched
            });
        });
        (useCourseDetailStore.getState as jest.Mock).mockReturnValue({
            taData: { CourseRoles: null }
        });
    });

    it('CourseRoles calls API and updates store', async () => {
        const mockRoles = [{ user_id: 1, email: 's@s.com' }];
        (CoursesApi.GetCourseRoles as jest.Mock).mockResolvedValue(mockRoles);

        const { result } = renderHook(() => useTACourse());

        await act(async () => {
            await result.current.CourseRoles(101);
        });

        expect(CoursesApi.GetCourseRoles).toHaveBeenCalledWith(101, 'student');
        expect(mockSetTAData).toHaveBeenCalledWith(expect.objectContaining({
            CourseRoles: { students: mockRoles }
        }));
    });

    it('AddMarks calls MarksApi', async () => {
        const marksData = { marks: 80 } as any;
        (MarksApi.AddMarks as jest.Mock).mockResolvedValue({});

        const { result } = renderHook(() => useTACourse());

        await act(async () => {
            await result.current.AddMarks(101, 1, marksData);
        });

        expect(MarksApi.AddMarks).toHaveBeenCalledWith(101, 1, marksData);
    });

    it('GetAllAssessments updates store', async () => {
        const mockAssessments = [{ id: 1, name: 'A1' }];
        (MarksApi.GetAllAssessments as jest.Mock).mockResolvedValue(mockAssessments);

        const { result } = renderHook(() => useTACourse());

        await act(async () => {
            await result.current.GetAllAssessments(101);
        });

        expect(mockSetTAData).toHaveBeenCalledWith(expect.objectContaining({
            assessments: mockAssessments
        }));
    });
});
