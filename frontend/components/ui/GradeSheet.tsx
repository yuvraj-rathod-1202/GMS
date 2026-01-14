"use client";

import React, { useState, useMemo } from "react";

export interface GradeSheetColumn<T = any> {
  header: string;
  key: keyof T | string;
  width?: string;
  editable?: boolean;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  onEdit?: (value: any, row: T, rowIndex: number) => void | Promise<void>;
  onEditComplete?: (newValue: any, oldValue: any, row: T, rowIndex: number) => void | Promise<void>;
}

export interface GradeSheetProps<T = any> {
  columns: GradeSheetColumn<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T | string)[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T, rowIndex: number) => void;
}

export default function GradeSheet<T extends Record<string, any>>({
  columns,
  data = [],
  searchable = true,
  searchKeys,
  emptyMessage = "No data available",
  className = "",
  onRowClick,
}: GradeSheetProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    
    if (!searchable || !searchTerm.trim()) {
      return data;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const keysToSearch = searchKeys || columns.map((col) => col.key as string);

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
    setEditValue(currentValue ?? "");
  };

  // Handle edit save
  const handleEditSave = async (rowIndex: number, column: GradeSheetColumn<T>) => {
    if (!editingCell) return;

    const row = filteredData[rowIndex];
    const oldValue = row[column.key];

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
      setEditValue("");
    } catch (error) {
      console.error("Error saving edit:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Handle keyboard events in edit mode
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, column: GradeSheetColumn<T>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSave(rowIndex, column);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleEditCancel();
    }
  };

  // Calculate grid template columns
  const gridTemplateColumns = columns
    .map((col) => col.width || "1fr")
    .join(" ");

    {filteredData === undefined && (
        <div className="px-6 py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
        Loading...
        </div>
    )}

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
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
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
                rowIndex !== filteredData.length - 1 ? "border-b border-gray-200" : ""
              } ${onRowClick ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
              style={{ gridTemplateColumns }}
              onClick={() => onRowClick && onRowClick(row, rowIndex)}
            >
              {columns.map((column, colIndex) => {
                const cellValue = row[column.key];
                const isEditing =
                  editingCell?.rowIndex === rowIndex &&
                  editingCell?.columnKey === column.key;

                return (
                  <div key={colIndex} className="text-gray-700">
                    {isEditing ? (
                      // Edit Mode
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, column)}
                          onBlur={() => !isProcessing && handleEditCancel()}
                          autoFocus
                          disabled={isProcessing}
                          className="flex-1 px-2 py-1 rounded outline-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSave(rowIndex, column);
                          }}
                          disabled={isProcessing}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCancel();
                          }}
                          disabled={isProcessing}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      // View Mode
                      <div
                        className={`${column.editable ? "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStart(rowIndex, column, cellValue);
                        }}
                      >
                        {column.render
                          ? column.render(cellValue, row, rowIndex)
                          : cellValue ?? "-"}
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
