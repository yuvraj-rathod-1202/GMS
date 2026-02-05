'use client';

import React, { useState, useMemo } from 'react';

export interface GradeSheetColumn<T = any> {
  header: string | React.ReactNode;
  key: keyof T | string;
  width?: string;
  editable?: boolean;
  max_marks?: number;
  headerActions?: React.ReactNode;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  onEdit?: (value: any, row: T, rowIndex: number) => void | Promise<void>;
  onEditComplete?: (newValue: any, oldValue: any, row: T, rowIndex: number) => void | Promise<void>;
}

export interface GradeSheetProps<T = any> {
  columns: GradeSheetColumn<T>[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T | string)[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T, rowIndex: number) => void;
  changedCells?: Set<string>; // Format: "studentId-columnKey"
}

export default function IGradeSheet<T extends Record<string, any>>({
  columns,
  searchTerm,
  setSearchTerm,
  data = [],
  searchable = true,
  searchKeys,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
  changedCells,
}: GradeSheetProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(
    null
  );
  const [editValue, setEditValue] = useState<any>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Filter data based on search term
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

  // Handle edit start
  const handleEditStart = (rowIndex: number, column: GradeSheetColumn<T>, currentValue: any) => {
    if (!column.editable) return;
    setEditingCell({ rowIndex, columnKey: column.key as string });
    setEditValue(currentValue ?? '');
  };

  // Handle edit save
  const handleEditSave = async (rowIndex: number, column: GradeSheetColumn<T>) => {
    if (!editingCell) return;

    const row = filteredData[rowIndex];
    const oldValue = row[column.key];

    // Validate marks against max_marks
    const numericValue = Number(editValue);
    if (!isNaN(numericValue) && column.max_marks !== undefined && numericValue > column.max_marks) {
      setValidationError(`Marks cannot exceed ${column.max_marks}`);
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

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
    setValidationError('');
  };

  // Handle keyboard events in edit mode
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, column: GradeSheetColumn<T>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleEditSave(rowIndex, column);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

  // Calculate grid template columns
  const gridTemplateColumns = columns.map((col) => col.width || '1fr').join(' ');

  {
    filteredData === undefined && (
      <div className="px-6 py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-x-auto max-w-[100vw] md:max-w-[calc((5/6)*100vw)] gap-4 ${className}`}
    >
      {/* Table */}
      <div className="border border-gray-300 rounded-2xl overflow-x-auto bg-white shadow-sm">
        {/* Table Header */}
        <div
          className="grid gap-4 px-6 py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300 font-semibold min-w-max"
          style={{ gridTemplateColumns }}
        >
          {columns.map((column, index) => (
            <div key={index} className="text-gray-900 text-left flex items-center gap-4">
              <span>{column.header}</span>
              {column.headerActions && (
                <div onClick={(e) => e.stopPropagation()}>{column.headerActions}</div>
              )}
            </div>
          ))}
        </div>

        {/* Table Body */}
        {filteredData.length === 0 ? (
          <div className="px-6 py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
            {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
          </div>
        ) : (
          filteredData.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`grid gap-4 px-6 py-4 text-xs sm:text-sm md:text-base items-center min-w-max ${
                rowIndex !== filteredData.length - 1 ? 'border-b border-gray-200' : ''
              } ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''} transition-colors`}
              style={{ gridTemplateColumns }}
              onClick={() => onRowClick && onRowClick(row, rowIndex)}
            >
              {columns.map((column, colIndex) => {
                const cellValue = row[column.key];
                const isEditing =
                  editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key;

                return (
                  <div key={colIndex} className="text-gray-700">
                    {isEditing ? (
                      // Edit Mode
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, column)}
                            onBlur={() => {
                              if (!isProcessing) {
                                handleEditSave(rowIndex, column);
                              }
                            }}
                            autoFocus
                            disabled={isProcessing}
                            className="flex-1 px-2 py-1 rounded outline-none"
                          />
                        </div>
                        {validationError && (
                          <div className="text-xs text-red-600">{validationError}</div>
                        )}
                      </div>
                    ) : (
                      // View Mode
                      <div
                        className={`group ${
                          column.editable
                            ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded'
                            : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStart(rowIndex, column, cellValue);
                        }}
                      >
                        {(() => {
                          const isChanged = changedCells?.has(
                            `${row.student_id}-${String(column.key)}`
                          );
                          const content = column.render
                            ? column.render(cellValue, row, rowIndex)
                            : (cellValue ?? '-');

                          return (
                            <span className={isChanged ? 'text-red-600 font-semibold' : ''}>
                              {content}
                            </span>
                          );
                        })()}

                        {column.editable && column.max_marks !== undefined && (
                          <span className="ml-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            / {column.max_marks}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      {searchable && searchTerm && (
        <div className="text-sm text-gray-600">
          Showing {filteredData.length} of {data.length} results
        </div>
      )}
    </div>
  );
}
