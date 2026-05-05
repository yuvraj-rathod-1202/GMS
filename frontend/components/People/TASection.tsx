import PeopleSectionShell from './PeopleSectionShell';
import TAList from './TAList';

export function TASection({
  tas,
  onAdd,
  onRemoveTA,
  isLoading,
}: {
  tas: Array<{ index: number; id: string; email: string }>;
  onAdd: () => void;
  onRemoveTA: (taId: number) => Promise<void>;
  isLoading?: boolean;
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
    >
      {hasTAs ? <TAList students={tas} onRemoveStudent={onRemoveTA} isLoading={isLoading} /> : null}
    </PeopleSectionShell>
  );
}
