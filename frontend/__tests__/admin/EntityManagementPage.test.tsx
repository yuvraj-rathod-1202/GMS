import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EntityManagementPage from '../../app/admin/entities/page';
import { AdminApi } from '../../lib/api/admin';
import '@testing-library/jest-dom';

// Mock AdminApi
jest.mock('../../lib/api/admin', () => ({
  AdminApi: {
    FetchAllUsers: jest.fn(),
    FetchAllEnrollments: jest.fn(),
    FetchAllAssessments: jest.fn(),
    CreateAssessment: jest.fn(),
    UpdateAssessment: jest.fn(),
    DeleteAssessment: jest.fn(),
    CreateEnrollment: jest.fn(),
    UnenrollStudent: jest.fn(),
  },
}));

// Mock react-icons to avoid issues in tests
jest.mock('react-icons/bi', () => ({
  BiUser: () => <div data-testid="icon-user" />,
  BiBookBookmark: () => <div data-testid="icon-book" />,
  BiShieldQuarter: () => <div data-testid="icon-shield" />,
  BiSpreadsheet: () => <div data-testid="icon-spreadsheet" />,
  BiGroup: () => <div data-testid="icon-group" />,
  BiSearch: () => <div data-testid="icon-search" />,
  BiPlus: () => <div data-testid="icon-plus" />,
  BiDotsHorizontalRounded: () => <div data-testid="icon-dots" />,
  BiTrash: () => <div data-testid="icon-trash" />,
  BiEditAlt: () => <div data-testid="icon-edit" />,
  BiX: () => <div data-testid="icon-x" />,
}));

describe('EntityManagementPage component', () => {
  const mockUsers = [
    { id: 1, email: 'user1@test.com', role: 'student' },
    { id: 2, email: 'user2@test.com', role: 'instructor' },
  ];

  const mockAssessments = [{ id: 101, course_id: 1, name: 'Quiz 1', max_marks: 20 }];

  beforeEach(() => {
    jest.clearAllMocks();
    (AdminApi.FetchAllUsers as jest.Mock).mockResolvedValue({ users: mockUsers });
    (AdminApi.FetchAllEnrollments as jest.Mock).mockResolvedValue({ enrollments: [] });
    (AdminApi.FetchAllAssessments as jest.Mock).mockResolvedValue({ assessments: mockAssessments });
  });

  it('renders correctly and fetches users by default', async () => {
    render(<EntityManagementPage />);

    expect(screen.getByText('System Entity Manager')).toBeInTheDocument();

    await waitFor(() => {
      expect(AdminApi.FetchAllUsers).toHaveBeenCalled();
    });

    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
  });

  it('switches entity tabs and fetches corresponding data', async () => {
    render(<EntityManagementPage />);

    const assessmentsTab = screen.getByRole('button', { name: /Assessments/i });
    fireEvent.click(assessmentsTab);

    await waitFor(() => {
      expect(AdminApi.FetchAllAssessments).toHaveBeenCalled();
    });

    expect(screen.getByText('Quiz 1')).toBeInTheDocument();
  });

  it('filters data based on search query', async () => {
    render(<EntityManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search users.../i);
    fireEvent.change(searchInput, { target: { value: 'user2' } });

    expect(screen.queryByText('user1@test.com')).not.toBeInTheDocument();
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
  });

  it('opens modal when "Add" button is clicked', async () => {
    render(<EntityManagementPage />);

    const addButton = screen.getByRole('button', { name: /Add user/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Add New user')).toBeInTheDocument();
  });

  it('calls DeleteAssessment when an assessment is deleted', async () => {
    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);

    render(<EntityManagementPage />);

    // Switch to assessments
    fireEvent.click(screen.getByRole('button', { name: /Assessments/i }));

    await waitFor(() => {
      expect(screen.getByText('Quiz 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTestId('icon-trash');
    fireEvent.click(deleteButtons[0].parentElement!);

    expect(AdminApi.DeleteAssessment).toHaveBeenCalledWith(1, 101);
  });
});
