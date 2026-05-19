import React from 'react';
import Button from '@/components/ui/Button';
import { EmptyState } from './Cards/EmptyState';
import { BiSearch } from 'react-icons/bi';

export type PeopleAction = {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
};

interface PeopleSectionShellProps {
  hasItems: boolean;
  itemsLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  primaryAction: PeopleAction;
  secondaryAction?: PeopleAction;
  headerActions?: PeopleAction[];
  showSecondaryEmptyAction?: boolean;
  children: React.ReactNode;
  // Toolbar props
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: any) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}

export default function PeopleSectionShell({
  hasItems,
  itemsLabel,
  emptyTitle,
  emptyDescription,
  primaryAction,
  secondaryAction,
  headerActions = [],
  showSecondaryEmptyAction = true,
  children,
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
}: PeopleSectionShellProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-hidden">

      {/* Consolidated Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm shrink-0 overflow-hidden">
        {/* Tabs and Search Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 min-w-0">
          {/* Tabs inside toolbar */}
          {tabs && onTabChange && (
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Search Input */}
          {onSearchChange && (
            <div className="relative flex-1 min-w-0">
              <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-lg py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-gms-blue/20 outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Action Buttons - Scrollable on mobile */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide shrink-0">
          <div className="flex items-center gap-2 ml-auto">
            {headerActions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant={action.variant || 'secondary'}
                onClick={action.onClick}
                disabled={action.disabled}
                size="sm"
                className="whitespace-nowrap"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}

            {secondaryAction && (
              <Button
                type="button"
                variant={secondaryAction.variant || 'secondary'}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                size="sm"
                className="whitespace-nowrap"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            )}

            <Button
              type="button"
              variant={primaryAction.variant || 'primary'}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              size="sm"
              className="bg-black hover:bg-gray-800 text-white whitespace-nowrap"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {hasItems ? (
          children
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            primaryActionText={primaryAction.label}
            secondaryActionText={secondaryAction?.label}
            onPrimaryAction={primaryAction.onClick}
            onSecondaryAction={secondaryAction?.onClick}
            showSecondary={showSecondaryEmptyAction && Boolean(secondaryAction)}
          />
        )}
      </div>

      <div className="sr-only">{itemsLabel}</div>
    </div>
  );
}
