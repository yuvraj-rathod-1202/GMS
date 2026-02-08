import { GradeSheetColumn } from '@/lib/types/grade/gradesheet';
import React from 'react';

export default function GradeSheetCell({
  row,
  rowIndex,
  column,
  isEditing,
  editValue,
  setEditValue,
  handleEditStart,
  handleEditSave,
  handleEditCancel,
  isProcessing,
  validationError,
  changedCells,
  max_marks,
}: {
  row: any;
  rowIndex: number;
  column: GradeSheetColumn<any>;
  isEditing: boolean;
  editValue: any;
  setEditValue: React.Dispatch<React.SetStateAction<any>>;
  handleEditStart: (rowIndex: number, column: GradeSheetColumn<any>, currentValue: any) => void;
  handleEditSave: (rowIndex: number, column: GradeSheetColumn<any>) => Promise<void>;
  handleEditCancel: () => void;
  isProcessing: boolean;
  validationError: string;
  changedCells?: Set<string>;
  max_marks?: number;
}) {
  const cellValue = row[column.key];

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    column: GradeSheetColumn<any>
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleEditSave(rowIndex, column);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

  return (
    <div className="text-gray-700">
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
          {validationError && <div className="text-xs text-red-600">{validationError}</div>}
        </div>
      ) : (
        // View Mode
        <div
          className={`group ${
            column.editable ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleEditStart(rowIndex, column, cellValue);
          }}
        >
          {(() => {
            const isChanged = changedCells?.has(`${row.student_id}`);
            const content = column.render
              ? column.render(cellValue, row, rowIndex)
              : (cellValue ?? '-');

            return (
              <span className={isChanged && column.editable ? 'text-red-600 font-semibold' : ''}>
                {content}
              </span>
            );
          })()}

          {column.editable && max_marks !== undefined && (
            <span className="ml-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              / {max_marks}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
