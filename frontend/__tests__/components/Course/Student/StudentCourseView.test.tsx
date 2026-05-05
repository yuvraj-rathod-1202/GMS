import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StudentCourseView from '../../../../components/Course/Student/StudentCourseView';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useStudentCourse } from '@/hooks/useStudentCourse';
import '@testing-library/jest-dom';

// Mocks
jest.mock('@/lib/store/courseDetail');
jest.mock('@/hooks/useStudentCourse');
jest.mock('../../../../components/ui/AssessmentTable', () => ({
    __esModule: true,
    default: ({ data }: any) => <div data-testid="assessment-table">{data.length} rows</div>
}));

describe('StudentCourseView component', () => {
    const mockFetch = jest.fn().mockResolvedValue({});

    beforeEach(() => {
        jest.clearAllMocks();
        (useCourseDetailStore as unknown as jest.Mock).mockImplementation((selector) => {
            return selector({
                currentCourse: { id: 101, name: 'CS101' },
                studentData: { marks: [{ id: 1 }], analytics: [] }
            });
        });
        (useStudentCourse as jest.Mock).mockReturnValue({
            fetchStudentCourseData: mockFetch,
            loading: false,
            error: null
        });
    });

    it('renders course title', () => {
        render(<StudentCourseView />);
        expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    it('calls fetchStudentCourseData on mount', () => {
        render(<StudentCourseView />);
        expect(mockFetch).toHaveBeenCalledWith(101);
    });

    it('shows loading state', () => {
        (useStudentCourse as jest.Mock).mockReturnValue({
            fetchStudentCourseData: mockFetch,
            loading: true,
            error: null
        });
        render(<StudentCourseView />);
        expect(screen.getByText(/Loading assessments/i)).toBeInTheDocument();
    });

    it('shows error state', () => {
        (useStudentCourse as jest.Mock).mockReturnValue({
            fetchStudentCourseData: mockFetch,
            loading: false,
            error: 'Some error'
        });
        render(<StudentCourseView />);
        expect(screen.getByText('Some error')).toBeInTheDocument();
    });

    it('renders AssessmentTable with data', () => {
        render(<StudentCourseView />);
        expect(screen.getByTestId('assessment-table')).toHaveTextContent('1 rows');
    });
});
