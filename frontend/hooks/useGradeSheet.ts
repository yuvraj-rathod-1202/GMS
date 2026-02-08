import { GradeSheetColumn, IGradeSheetColumn } from '@/lib/types/grade/gradesheet';
import { useMemo, useState } from 'react';

export function useGradeSheet({
  data = [],
  searchable = true,
  searchKeys,
  columns,
  max_marks,
}: {
  data: any[];
  searchable?: boolean;
  searchKeys?: (keyof any | string)[];
  columns: GradeSheetColumn<any>[] | IGradeSheetColumn<any>[];
  max_marks?: number;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(
    null
  );
  const [editValue, setEditValue] = useState<any>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    if (!searchable || !searchTerm.trim()) {
      return data;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const keysToSearch = searchKeys || ['student_id', 'email'];

    return data.filter((row) => {
      return keysToSearch.some((key) => {
        const value = row[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [data, searchTerm, searchable, searchKeys, columns]);

  const handleEditStart = (
    rowIndex: number,
    column: GradeSheetColumn<any> | IGradeSheetColumn<any>,
    currentValue: any
  ) => {
    if (!column.editable) return;
    setEditingCell({ rowIndex, columnKey: column.key as string });
    setEditValue(currentValue ?? '');
  };

  const handleEditSave = async (
    rowIndex: number,
    column: GradeSheetColumn<any> | IGradeSheetColumn<any>
  ) => {
    if (!editingCell) return;

    const row = filteredData[rowIndex];
    const oldValue = row[column.key];
    const maxMarks = max_marks !== undefined ? max_marks : (column as any)?.max_marks;
    const numericValue = Number(editValue);
    if (!isNaN(numericValue) && maxMarks !== undefined && numericValue > maxMarks) {
      setValidationError(`Marks cannot exceed ${maxMarks}`);
      return;
    }
    setValidationError('');

    // Prevent multiple saves
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Call onEdit if provided
      if (column.onEdit) {
        await column.onEdit(editValue, row, rowIndex);
      }

      // Call onEditComplete if provided
      if (column.onEditComplete) {
        await column.onEditComplete(editValue, oldValue, row, rowIndex);
      }

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving edit:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
    setValidationError('');
  };

  return {
    searchTerm,
    setSearchTerm,
    isProcessing,
    filteredData,
    editingCell,
    editValue,
    setEditValue,
    handleEditSave,
    handleEditCancel,
    validationError,
    handleEditStart,
  };
}
