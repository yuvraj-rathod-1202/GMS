import { renderHook, act } from '@testing-library/react';
import { usePeopleManagement } from '../../hooks/usePeopleManagement';
import { useCourseManagement } from '../../hooks/useCourseManagement';

// Mocks
jest.mock('../../hooks/useCourseManagement');

describe('usePeopleManagement hook', () => {
  const mockEnrollStudent = jest.fn();
  const mockFetchRoles = jest.fn();
  const mockSetShowEnroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCourseManagement as jest.Mock).mockReturnValue({
      enrollStudent: mockEnrollStudent,
      fetchCourseRoles: mockFetchRoles,
      loading: false,
    });
    window.confirm = jest.fn().mockReturnValue(true);
    window.alert = jest.fn();
  });

  it('handleEnrollStudent calls enrollStudent and fetchCourseRoles', async () => {
    mockEnrollStudent.mockResolvedValue({});

    const { result } = renderHook(() =>
      usePeopleManagement(101, 'instructor', mockSetShowEnroll, jest.fn(), jest.fn())
    );

    await act(async () => {
      await result.current.handleEnrollStudent('123', 'test@test.com');
    });

    expect(mockEnrollStudent).toHaveBeenCalledWith(101, {
      student_id: 123,
      email: 'test@test.com',
    });
    expect(mockFetchRoles).toHaveBeenCalledWith(101, true, true);
    expect(mockSetShowEnroll).toHaveBeenCalledWith(false);
  });

  it('does nothing if user cancels confirmation', async () => {
    window.confirm = jest.fn().mockReturnValue(false);

    const { result } = renderHook(() =>
      usePeopleManagement(101, 'instructor', mockSetShowEnroll, jest.fn(), jest.fn())
    );

    await act(async () => {
      await result.current.handleEnrollStudent('123', 'test@test.com');
    });

    expect(mockEnrollStudent).not.toHaveBeenCalled();
  });

  it('alerts if studentId is empty', async () => {
    const { result } = renderHook(() =>
      usePeopleManagement(101, 'instructor', jest.fn(), jest.fn(), jest.fn())
    );

    await act(async () => {
      await result.current.handleEnrollStudent(' ', '');
    });

    expect(window.alert).toHaveBeenCalledWith('Please enter a student ID');
  });
});
