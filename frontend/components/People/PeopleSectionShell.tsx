import React from 'react';
import Button from '@/components/ui/Button';
import { EmptyState } from './Cards/EmptyState';

export type PeopleAction = {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
};

interface PeopleSectionShellProps {
  title: string;
  description: string;
  hasItems: boolean;
  itemsLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  primaryAction: PeopleAction;
  secondaryAction?: PeopleAction;
  headerActions?: PeopleAction[];
  showSecondaryEmptyAction?: boolean;
  children: React.ReactNode;
}

export default function PeopleSectionShell({
  title,
  description,
  hasItems,
  itemsLabel,
  emptyTitle,
  emptyDescription,
  primaryAction,
  secondaryAction,
  headerActions = [],
  showSecondaryEmptyAction = true,
  children,
}: PeopleSectionShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          {headerActions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
              disabled={action.disabled}
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
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        </div>
      </div>

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

      <div className="sr-only">{itemsLabel}</div>
    </div>
  );
}
