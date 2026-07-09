import { renderHook, act } from '@testing-library/react';
import { useStudentCourse } from '../../hooks/useStudentCourse';
import { MarksApi } from '@/lib/api/marks';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useAuthStore } from '@/lib/store/auth';

// Mocks
jest.mock('@/lib/api/marks');
jest.mock('@/lib/store/courseDetail');
jest.mock('@/lib/store/auth');

describe('useStudentCourse hook', () => {
  const mockSetStudentData = jest.fn();
  const mockSetHasFetched = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ user: { id: 123 } });
    });
    (useCourseDetailStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        setStudentData: mockSetStudentData,
        hasFetchedStudentDataInSession: false,
        setHasFetchedStudentDataInSession: mockSetHasFetched,
      });
    });
    (useCourseDetailStore.getState as jest.Mock).mockReturnValue({
      studentData: null,
    });
  });

  it('fetchStudentCourseData calls API and updates store', async () => {
    const mockData = { marks: [80], analytics: [] };
    (MarksApi.GetStudentMarks as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useStudentCourse());

    await act(async () => {
      await result.current.fetchStudentCourseData(101);
    });

    expect(MarksApi.GetStudentMarks).toHaveBeenCalledWith(101, 123);
    expect(mockSetStudentData).toHaveBeenCalledWith(expect.objectContaining({ marks: [80] }));
    expect(mockSetHasFetched).toHaveBeenCalledWith(true);
  });

  it('returns early if already fetched', async () => {
    (useCourseDetailStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        hasFetchedStudentDataInSession: true,
      });
    });

    const { result } = renderHook(() => useStudentCourse());

    await act(async () => {
      await result.current.fetchStudentCourseData(101);
    });

    expect(MarksApi.GetStudentMarks).not.toHaveBeenCalled();
  });
});
