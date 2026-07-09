import { renderHook, act } from '@testing-library/react';
import { useGradeSheet } from '../../hooks/useGradeSheet';

describe('useGradeSheet hook', () => {
  const mockData = [
    { student_id: '1', email: 'a@a.com', marks: 80 },
    { student_id: '2', email: 'b@b.com', marks: 90 },
  ];
  const mockColumns = [
    { key: 'student_id', title: 'ID', editable: false },
    { key: 'marks', title: 'Marks', editable: true, onEdit: jest.fn() },
  ] as any;

  it('filters data based on searchTerm', () => {
    const { result } = renderHook(() =>
      useGradeSheet({
        data: mockData,
        columns: mockColumns,
        searchKeys: ['email'],
      })
    );

    act(() => {
      result.current.setSearchTerm('b@b.com');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].student_id).toBe('2');
  });

  it('starts editing cell', () => {
    const { result } = renderHook(() =>
      useGradeSheet({
        data: mockData,
        columns: mockColumns,
      })
    );

    act(() => {
      result.current.handleEditStart(0, mockColumns[1], 80);
    });

    expect(result.current.editingCell).toEqual({ rowIndex: 0, columnKey: 'marks' });
    expect(result.current.editValue).toBe(80);
  });

  it('validates max marks on save', async () => {
    const { result } = renderHook(() =>
      useGradeSheet({
        data: mockData,
        columns: mockColumns,
        max_marks: 100,
      })
    );

    act(() => {
      result.current.handleEditStart(0, mockColumns[1], 80);
      result.current.setEditValue(110);
    });

    await act(async () => {
      await result.current.handleEditSave(0, mockColumns[1]);
    });

    expect(result.current.validationError).toBe('Marks cannot exceed 100');
    expect(result.current.editingCell).not.toBeNull();
  });

  it('calls onEdit on successful save', async () => {
    const onEdit = jest.fn();
    const cols = [...mockColumns];
    cols[1].onEdit = onEdit;

    const { result } = renderHook(() =>
      useGradeSheet({
        data: mockData,
        columns: cols,
        max_marks: 100,
      })
    );

    act(() => {
      result.current.handleEditStart(0, cols[1], 80);
      result.current.setEditValue(85);
    });

    await act(async () => {
      await result.current.handleEditSave(0, cols[1]);
    });

    expect(onEdit).toHaveBeenCalledWith(85, mockData[0], 0);
    expect(result.current.editingCell).toBeNull();
  });
});
