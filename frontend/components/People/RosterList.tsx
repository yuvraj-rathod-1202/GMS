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
  searchPlaceholder: string;
  searchEmptyMessage: string;
  onRemove: (itemId: number) => Promise<void>;
  isLoading?: boolean;
  label: string;
}

export default function RosterList({
  items,
  emptyMessage,
  searchPlaceholder,
  searchEmptyMessage,
  onRemove,
  isLoading = false,
  label,
}: RosterListProps) {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      <BiSortUp className="text-mms-blue" />
    ) : (
      <BiSortDown className="text-mms-blue" />
    );
  };

  const handleRemove = async (itemId: string) => {
    await onRemove(Number(itemId));
    setSelectedItem(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-12 text-sm outline-none transition focus:border-mms-blue focus:ring-2 focus:ring-mms-blue/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div
          className="grid gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-900 sm:px-6 sm:py-4 sm:text-sm md:text-base"
          style={{ gridTemplateColumns: '2fr 3fr auto' }}
        >
          <button
            type="button"
            onClick={() => handleSort('id')}
            className="flex items-center gap-2 text-left transition hover:text-mms-blue"
          >
            <span>Roll No</span>
            {getSortIcon('id')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('email')}
            className="flex items-center gap-2 text-left transition hover:text-mms-blue"
          >
            <span>Email</span>
            {getSortIcon('email')}
          </button>
          <div>Actions</div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-500 sm:px-6 sm:py-8 sm:text-sm md:text-base">
            {searchQuery ? searchEmptyMessage : emptyMessage}
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.index}
              className={`grid items-center gap-4 px-4 py-3 text-xs sm:px-6 sm:py-4 sm:text-sm md:text-base ${
                index !== filteredItems.length - 1 ? 'border-b border-gray-200' : ''
              }`}
              style={{ gridTemplateColumns: '2fr 3fr auto' }}
            >
              <div className="font-medium text-gray-900">{item.id}</div>
              <div className="truncate text-gray-700">{item.email}</div>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(selectedItem === item.index ? null : item.index)}
                  title={`Manage ${label}`}
                  disabled={isLoading}
                  className="px-2 text-gray-600 hover:bg-gray-100"
                >
                  <BiPencil className="text-lg" />
                </Button>
                {selectedItem === item.index && (
                  <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50"
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

      {searchQuery && filteredItems.length > 0 && (
        <div className="px-2 text-sm text-gray-600">
          Found {filteredItems.length} {label}
          {filteredItems.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
}
