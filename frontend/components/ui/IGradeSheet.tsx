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

  // Separate sticky and non-sticky columns
  const nonStickyColumns = columns.filter((col) => !col.sticky);
  const stickyRightColumns = columns.filter((col) => col.sticky === 'right');
  const hasStickyRight = stickyRightColumns.length > 0;

  // Calculate grid template columns for non-sticky area
  const gridTemplateColumns = nonStickyColumns.map((col) => col.width || '1fr').join(' ');

  {
    filteredData === undefined && (
      <div className="px-4 py-6 text-[11px] sm:text-xs md:text-[13px] text-center text-gray-500">
        Loading...
      </div>
    );
  }

  const stickyStyle: React.CSSProperties = {
    position: 'sticky',
    right: 0,
    zIndex: 5,
    minWidth: '100px',
  };

  return (
    <div
      className={`flex flex-col overflow-x-auto max-w-[100vw] md:max-w-[calc((5/6)*100vw)] gap-4 ${className}`}
    >
      {/* Table */}
      <div className="border border-gray-300 rounded-2xl overflow-x-auto bg-white shadow-sm">
        {/* Table Header */}
        <div className="flex min-w-max bg-gray-50 border-b border-gray-300 font-semibold">
          <div
            className="grid gap-2 px-4 py-2 text-[11px] sm:text-xs md:text-[13px] flex-1"
            style={{ gridTemplateColumns }}
          >
            {nonStickyColumns.map((column, index) => (
              <div key={index} className="text-gray-900 text-left flex items-center gap-4">
                <span>{column.header}</span>
                {column.headerActions && (
                  <div onClick={(e) => e.stopPropagation()}>{column.headerActions}</div>
                )}
              </div>
            ))}
          </div>
          {hasStickyRight && stickyRightColumns.map((column, index) => (
            <div
              key={`sticky-h-${index}`}
              className="text-gray-900 text-left flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs md:text-[13px] bg-gray-50 border-l border-gray-200 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]"
              style={stickyStyle}
            >
              <span>{column.header}</span>
            </div>
          ))}
        </div>

        {/* Table Body */}
        {filteredData.length === 0 ? (
          <div className="px-4 py-6 text-[11px] sm:text-xs md:text-[13px] text-center text-gray-500">
            {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
          </div>
        ) : (
          filteredData.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`flex min-w-max items-center ${
                rowIndex !== filteredData.length - 1 ? 'border-b border-gray-200' : ''
              } ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''} transition-colors`}
              onClick={() => onRowClick && onRowClick(row, rowIndex)}
            >
              <div
                className="grid gap-2 px-4 py-2 text-[11px] sm:text-xs md:text-[13px] items-center flex-1"
                style={{ gridTemplateColumns }}
              >
                {nonStickyColumns.map((column, colIndex) => (
                  <GradeSheetCell
                    key={`${rowIndex}-${colIndex}`}
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
              {hasStickyRight && stickyRightColumns.map((column, colIndex) => (
                <div
                  key={`sticky-${rowIndex}-${colIndex}`}
                  className="px-3 py-2 text-[11px] sm:text-xs md:text-[13px] bg-white border-l border-gray-200 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]"
                  style={stickyStyle}
                >
                  {column.render
                    ? column.render(row[column.key as string], row, rowIndex)
                    : row[column.key as string]
                  }
                </div>
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
