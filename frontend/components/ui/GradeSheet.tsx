'use client';

import { useGradeSheet } from '@/hooks/useGradeSheet';
import { GradeSheetColumn, GradeSheetProps } from '@/lib/types/grade/gradesheet';
import React, { useState, useMemo } from 'react';
import { BiSearch } from 'react-icons/bi';
import GradeSheetCell from '../GradeSheet/GradeSheetCell';

export default function GradeSheet<T extends Record<string, any>>({
  columns,
  data = [],
  max_marks,
  searchable = true,
  searchKeys,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
  changedCells,
}: GradeSheetProps<T>) {
  const {
    searchTerm,
    setSearchTerm,
    filteredData,
    editingCell,
    editValue,
    setEditValue,
    handleEditSave,
    handleEditStart,
    handleEditCancel,
    isProcessing,
    validationError,
  } = useGradeSheet({ data, searchable, searchKeys, columns, max_marks });

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
    <div className={`flex flex-col overflow-x-auto w-full gap-4 ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 bg-white outline-none transition-all"
          />
          <BiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* Table Header */}
        <div
          className="grid gap-4 px-6 py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300 font-semibold"
          style={{ gridTemplateColumns }}
        >
          {columns.map((column, index) => (
            <div key={index} className="text-gray-900 text-left">
              {column.header}
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
              className={`grid gap-4 px-6 py-4 text-xs sm:text-sm md:text-base items-center ${
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
                  max_marks={max_marks}
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
