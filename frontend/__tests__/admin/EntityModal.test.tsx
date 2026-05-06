import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EntityModal from '../../app/admin/entities/components/EntityModal';
import { PolicyApi } from '../../lib/api/policy';
import '@testing-library/jest-dom';

// Mock PolicyApi
jest.mock('../../lib/api/policy', () => ({
  PolicyApi: {
    FetchAssessmentCategories: jest.fn(),
  },
}));

describe('EntityModal component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (PolicyApi.FetchAssessmentCategories as jest.Mock).mockResolvedValue({
      categories: [
        { id: 1, type: 'Quiz' },
        { id: 2, type: 'Exam' },
      ],
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EntityModal 
        isOpen={false} 
        onClose={mockOnClose} 
        entityType="users" 
        onSave={mockOnSave} 
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders user fields correctly for adding a new user', () => {
    render(
      <EntityModal 
        isOpen={true} 
        onClose={mockOnClose} 
        entityType="users" 
        onSave={mockOnSave} 
      />
    );

    expect(screen.getByText('Add New user')).toBeInTheDocument();
    expect(screen.getByLabelText(/User ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('populates fields when initialData is provided (edit mode)', () => {
    const initialData = { id: 123, email: 'test@example.com' };
    render(
      <EntityModal 
        isOpen={true} 
        onClose={mockOnClose} 
        entityType="users" 
        onSave={mockOnSave} 
        initialData={initialData}
      />
    );

    expect(screen.getByText('Edit user')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    // Password field should be hidden in edit mode
    expect(screen.queryByLabelText(/Password/i)).not.toBeInTheDocument();
  });

  it('calls onSave with correct data when form is submitted for users', async () => {
    render(
      <EntityModal 
        isOpen={true} 
        onClose={mockOnClose} 
        entityType="users" 
        onSave={mockOnSave} 
      />
    );

    fireEvent.change(screen.getByLabelText(/User ID/i), { target: { value: '456' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create user/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: 456,
        email: 'new@example.com',
        password: 'password123',
      });
    });
  });

  it('fetches assessment categories and sets default category for assessments', async () => {
    render(
      <EntityModal 
        isOpen={true} 
        onClose={mockOnClose} 
        entityType="assessments" 
        onSave={mockOnSave} 
      />
    );

    await waitFor(() => {
      expect(PolicyApi.FetchAssessmentCategories).toHaveBeenCalled();
    });

    // Check if categories are loaded in the select
    const select = screen.getByLabelText(/Assessment Category/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('Exam')).toBeInTheDocument();
    
    // Should default to first category ID
    expect(select).toHaveValue('1');
  });

  it('renders enrollment fields correctly', () => {
    render(
      <EntityModal 
        isOpen={true} 
        onClose={mockOnClose} 
        entityType="enrollments" 
        onSave={mockOnSave} 
      />
    );

    expect(screen.getByLabelText(/Course ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/User ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
  });
});
