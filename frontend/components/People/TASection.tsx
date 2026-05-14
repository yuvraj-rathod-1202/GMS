import PeopleSectionShell from './PeopleSectionShell';
import TAList from './TAList';

export function TASection({
  tas,
  onAdd,
  onRemoveTA,
  isLoading,
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: {
  tas: Array<{ index: number; id: string; email: string }>;
  onAdd: () => void;
  onRemoveTA: (taId: number) => Promise<void>;
  isLoading?: boolean;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: any) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}) {
  const hasTAs = tas.length > 0;

  return (
    <PeopleSectionShell
      title="Manage TAs"
      description="Grant teaching assistant privileges to users."
      hasItems={hasTAs}
      itemsLabel="TA roster"
      emptyTitle="No TAs assigned"
      emptyDescription="Add teaching assistants to help manage this course."
      primaryAction={{ label: 'Add TA', onClick: onAdd }}
      showSecondaryEmptyAction={false}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by Roll No or Email..."
    >
      {hasTAs ? (
        <TAList
          students={tas}
          onRemoveStudent={onRemoveTA}
          isLoading={isLoading}
          searchQuery={searchQuery || ''}
        />
      ) : null}
    </PeopleSectionShell>
  );
}
