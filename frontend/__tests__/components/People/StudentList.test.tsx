import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentList from '../../../components/People/StudentList';
import '@testing-library/jest-dom';

describe('StudentList component', () => {
  const mockStudents = [
    { index: 1, id: '2021001', email: 's1@test.com' },
    { index: 2, id: '2021002', email: 's2@test.com' },
  ];
  const mockRemove = jest.fn();

  it('renders list of students', () => {
    render(<StudentList students={mockStudents} onRemoveStudent={mockRemove} />);
    expect(screen.getByText('2021001')).toBeInTheDocument();
    expect(screen.getByText('2021002')).toBeInTheDocument();
  });

  it('filters students by search query', () => {
    render(<StudentList students={mockStudents} onRemoveStudent={mockRemove} />);
    const searchInput = screen.getByPlaceholderText(/Search/i);

    fireEvent.change(searchInput, { target: { value: '2021001' } });

    expect(screen.getByText('2021001')).toBeInTheDocument();
    expect(screen.queryByText('2021002')).not.toBeInTheDocument();
  });

  it('shows action menu when clicking pencil icon', () => {
    render(<StudentList students={mockStudents} onRemoveStudent={mockRemove} />);
    const pencilButtons = screen.getAllByTitle('Manage student');

    fireEvent.click(pencilButtons[0]);

    expect(screen.getByText(/Remove from course/i)).toBeInTheDocument();
  });

  it('calls onRemoveStudent when remove button is clicked', () => {
    render(<StudentList students={mockStudents} onRemoveStudent={mockRemove} />);
    const pencilButtons = screen.getAllByTitle('Manage student');

    fireEvent.click(pencilButtons[0]);
    const removeButton = screen.getByText(/Remove from course/i);
    fireEvent.click(removeButton);

    expect(mockRemove).toHaveBeenCalledWith(2021001);
  });
});
