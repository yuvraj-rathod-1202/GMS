import { EmptyState } from './Cards/EmptyState';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage TAs</h2>
          <p className="text-gray-500 text-sm">Grant teaching assistant privileges to users.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center gap-2"
          >
            Add TA
          </button>
        </div>
      </div>

      {hasTAs ? (
        <TAList students={tas} onRemoveStudent={onRemoveTA} isLoading={isLoading} />
      ) : (
        <EmptyState
          title="No TAs assigned"
          description="Add teaching assistants to help manage this course."
          primaryActionText="Add TA"
          onPrimaryAction={onAdd}
          showSecondary={false}
        />
      )}
    </div>
  );
}
