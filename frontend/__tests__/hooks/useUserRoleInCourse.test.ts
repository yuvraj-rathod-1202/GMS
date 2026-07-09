import { renderHook } from '@testing-library/react';
import { useUserRoleInCourse } from '../../hooks/useUserRoleInCourse';
import { useCoursesStore } from '@/lib/store/courses';
import { useCourseDetailStore } from '@/lib/store/courseDetail';

// Mocks
jest.mock('@/lib/store/courses');
jest.mock('@/lib/store/courseDetail');

describe('useUserRoleInCourse hook', () => {
  const mockSetCurrentCourse = jest.fn();
  const mockSetCurrentAssessment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCoursesStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { courses: [{ id: 101, role: 'instructor' }] };
      return selector(state);
    });
    (useCourseDetailStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        taData: { assessments: [{ id: 1 }] },
        setCurrentCourse: mockSetCurrentCourse,
        setCurrentAssessment: mockSetCurrentAssessment,
      };
      return selector(state);
    });
  });

  it('returns role and course correctly', () => {
    const { result } = renderHook(() => useUserRoleInCourse(101));

    expect(result.current.role).toBe('instructor');
    expect(result.current.course?.id).toBe(101);
    expect(mockSetCurrentCourse).toHaveBeenCalledWith(expect.objectContaining({ id: 101 }));
  });

  it('returns assessment correctly if assessmentId provided', () => {
    const { result } = renderHook(() => useUserRoleInCourse(101, 1));

    expect(result.current.assessment?.id).toBe(1);
    expect(mockSetCurrentAssessment).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('returns loading true if no courses', () => {
    (useCoursesStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { courses: [] };
      return selector(state);
    });

    const { result } = renderHook(() => useUserRoleInCourse(101));
    expect(result.current.isLoading).toBe(true);
  });
});
