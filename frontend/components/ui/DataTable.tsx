'use client';

import React from 'react';

export interface DataTableColumn<T extends object> {
  key: string;
  header: React.ReactNode;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T extends object> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  getRowKey?: (row: T, index: number) => React.Key;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

export default function DataTable<T extends object>({
  columns,
  data,
  emptyMessage = 'No data available',
  loading = false,
  loadingMessage = 'Loading...',
  getRowKey,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900 ${
                    column.align === 'center'
                      ? 'text-center'
                      : column.align === 'right'
                        ? 'text-right'
                        : ''
                  } ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-6 py-8 text-center text-sm text-gray-500"
                  colSpan={columns.length}
                >
                  {loadingMessage}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-8 text-center text-sm text-gray-500"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey = getRowKey ? getRowKey(row, index) : index;

                return (
                  <tr
                    key={rowKey}
                    className={`border-b border-gray-100 transition-colors last:border-b-0 ${
                      onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                    }`}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 text-sm text-gray-700 ${
                          column.align === 'center'
                            ? 'text-center'
                            : column.align === 'right'
                              ? 'text-right'
                              : ''
                        } ${column.className || ''}`}
                      >
                        {(() => {
                          const rowValue = (row as Record<string, unknown>)[column.key];
                          return column.render
                            ? column.render(rowValue, row, index)
                            : (rowValue as React.ReactNode);
                        })()}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
