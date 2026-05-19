'use client';

import React, { useMemo, useState } from 'react';
import { BiPencil, BiSearch, BiSortAlt2, BiSortDown, BiSortUp } from 'react-icons/bi';
import Button from '@/components/ui/Button';

export type RosterEntry = {
  index: number;
  id: string;
  email: string;
};

type SortKey = 'id' | 'email';
type SortDirection = 'asc' | 'desc';

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
} | null;

interface RosterListProps {
  items: RosterEntry[];
  emptyMessage: string;
  searchEmptyMessage: string;
  searchQuery: string;
  onRemove: (itemId: number) => Promise<void>;
  isLoading?: boolean;
  label: string;
}

export default function RosterList({
  items,
  emptyMessage,
  searchEmptyMessage,
  searchQuery,
  onRemove,
  isLoading = false,
  label,
}: RosterListProps) {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = !query
      ? [...items]
      : items.filter(
          (item) =>
            item.id.toLowerCase().includes(query) || item.email.toLowerCase().includes(query)
        );

    if (!sortConfig) {
      return filtered;
    }

    return filtered.sort((left, right) => {
      const leftValue = String(left[sortConfig.key]).toLowerCase();
      const rightValue = String(right[sortConfig.key]).toLowerCase();

      if (leftValue < rightValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [items, searchQuery, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }

      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }

      return null;
    });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <BiSortAlt2 className="text-gray-400" />;
    }

    return sortConfig.direction === 'asc' ? (
      <BiSortUp className="text-gms-blue" />
    ) : (
      <BiSortDown className="text-gms-blue" />
    );
  };

  const handleRemove = async (itemId: string) => {
    await onRemove(Number(itemId));
    setSelectedItem(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        {/* Fixed Header */}
        <div
          className="grid gap-4 border-b border-gray-200 bg-gray-50/50 px-4 py-2 text-[10px] font-semibold text-gray-900 sm:px-4 sm:py-2.5 sm:text-xs sticky top-0 z-10"
          style={{ gridTemplateColumns: '2fr 3fr auto' }}
        >
          <button
            type="button"
            onClick={() => handleSort('id')}
            className="flex items-center gap-2 text-left transition hover:text-gms-blue"
          >
            <span>Roll No</span>
            {getSortIcon('id')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('email')}
            className="flex items-center gap-2 text-left transition hover:text-gms-blue"
          >
            <span>Email</span>
            {getSortIcon('email')}
          </button>
          <div className="text-right">Actions</div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 sm:px-6 sm:py-12 text-xs">
              {searchQuery ? searchEmptyMessage : emptyMessage}
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.index}
                className={`group grid items-center gap-4 px-4 py-2 text-xs sm:px-4 sm:py-2.5 hover:bg-gray-50/50 transition-colors ${
                  index !== filteredItems.length - 1 ? 'border-b border-gray-200' : ''
                }`}
                style={{ gridTemplateColumns: '2fr 3fr auto' }}
              >
                <div className="font-medium text-gray-900">{item.id}</div>
                <div className="truncate text-gray-700">{item.email}</div>
                <div className="relative text-right">
                  <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedItem(selectedItem === item.index ? null : item.index)
                      }
                      title={`Manage ${label}`}
                      disabled={isLoading}
                      className="px-2 text-gray-600 hover:bg-white hover:shadow-sm"
                    >
                      <BiPencil className="text-sm" />
                    </Button>
                  </div>
                  {selectedItem === item.index && (
                    <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5">
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="w-full px-3 py-2 text-left text-xs text-red-700 transition hover:bg-red-50"
                        disabled={isLoading}
                      >
                        Remove from course
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer with Total Count */}
      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center shrink-0">
        <span className="text-xs text-gray-600 font-medium">
          Total {label}s: <span className="text-gray-900">{items.length}</span>
        </span>
        {searchQuery && (
          <span className="text-[10px] text-gray-500 italic">
            Showing {filteredItems.length} matching result{filteredItems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
