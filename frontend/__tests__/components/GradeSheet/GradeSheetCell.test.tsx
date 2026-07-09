import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GradeSheetCell from '../../../components/GradeSheet/GradeSheetCell';
import '@testing-library/jest-dom';

describe('GradeSheetCell component', () => {
  const mockRow = { student_id: '2021001', marks: 80 };
  const mockColumn = { key: 'marks', title: 'Marks', editable: true } as any;
  const mockProps = {
    row: mockRow,
    rowIndex: 0,
    column: mockColumn,
    isEditing: false,
    editValue: '',
    setEditValue: jest.fn(),
    handleEditStart: jest.fn(),
    handleEditSave: jest.fn().mockResolvedValue(undefined),
    handleEditCancel: jest.fn(),
    isProcessing: false,
    validationError: '',
  };

  it('renders cell value in view mode', () => {
    render(<GradeSheetCell {...mockProps} />);
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('calls handleEditStart when clicked in view mode', () => {
    render(<GradeSheetCell {...mockProps} />);
    fireEvent.click(screen.getByText('80'));
    expect(mockProps.handleEditStart).toHaveBeenCalledWith(0, mockColumn, 80);
  });

  it('renders input in edit mode', () => {
    const editProps = { ...mockProps, isEditing: true, editValue: '85' };
    render(<GradeSheetCell {...editProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('85');
  });

  it('calls setEditValue when typing', () => {
    const editProps = { ...mockProps, isEditing: true, editValue: '85' };
    render(<GradeSheetCell {...editProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '90' } });
    expect(mockProps.setEditValue).toHaveBeenCalled();
  });

  it('calls handleEditSave on Enter key', () => {
    const editProps = { ...mockProps, isEditing: true, editValue: '90' };
    render(<GradeSheetCell {...editProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockProps.handleEditSave).toHaveBeenCalledWith(0, mockColumn);
  });

  it('calls handleEditCancel on Escape key', () => {
    const editProps = { ...mockProps, isEditing: true, editValue: '90' };
    render(<GradeSheetCell {...editProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(mockProps.handleEditCancel).toHaveBeenCalled();
  });

  it('shows validation error in edit mode', () => {
    const errorProps = { ...mockProps, isEditing: true, validationError: 'Exceeds max marks' };
    render(<GradeSheetCell {...errorProps} />);
    expect(screen.getByText('Exceeds max marks')).toBeInTheDocument();
  });
});
