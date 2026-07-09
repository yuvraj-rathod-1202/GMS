import RosterList from './RosterList';

interface TAData {
  index: number;
  id: string;
  email: string;
}

interface TAListProps {
  students: TAData[];
  onRemoveStudent: (studentId: number) => Promise<void>;
  isLoading?: boolean;
  searchQuery: string;
}

export default function TAList({
  students,
  onRemoveStudent,
  isLoading = false,
  searchQuery,
}: TAListProps) {
  return (
    <RosterList
      items={students}
      emptyMessage="No TAs enrolled yet"
      searchEmptyMessage="No TAs found matching your search"
      searchQuery={searchQuery}
      onRemove={onRemoveStudent}
      isLoading={isLoading}
      label="TA"
    />
  );
}
