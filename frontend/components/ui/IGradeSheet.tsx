'use client';

import { useGradeSheet } from '@/hooks/useGradeSheet';
import { IGradeSheetColumn, IGradeSheetProps } from '@/lib/types/grade/gradesheet';
import React, { useState, useMemo } from 'react';
import GradeSheetCell from '../GradeSheet/GradeSheetCell';

export default function IGradeSheet<T extends Record<string, any>>({
  columns,
  searchTerm,
  setSearchTerm,
  data = [],
  searchable = true,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
  changedCells,
}: IGradeSheetProps<T>) {
  const {
    filteredData,
    editingCell,
    editValue,
    setEditValue,
    handleEditSave,
    handleEditStart,
    handleEditCancel,
    isProcessing,
    validationError,
  } = useGradeSheet({ 
    data, 
    searchable, 
    searchKeys: ['student_id', 'email'],
    columns,
    searchTerm,
    setSearchTerm,
  });

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
              {columns.map((column, colIndex) => (
                <GradeSheetCell
                  row={row}
                  rowIndex={rowIndex}
                  column={column}
                  isEditing={
                    editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key
                  }
                  editValue={editValue}
                  setEditValue={setEditValue}
                  handleEditStart={handleEditStart}
                  handleEditSave={handleEditSave}
                  handleEditCancel={handleEditCancel}
                  isProcessing={isProcessing}
                  validationError={validationError}
                  changedCells={changedCells}
                  max_marks={column.key === 'marks_obtained' ? row.max_marks : undefined}
                />
              ))}
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
