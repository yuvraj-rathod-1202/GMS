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
}

export default function TAList({ students, onRemoveStudent, isLoading = false }: TAListProps) {
  return (
    <RosterList
      items={students}
      emptyMessage="No TAs enrolled yet"
      searchPlaceholder="Search by Roll No or Email..."
      searchEmptyMessage="No TAs found matching your search"
      onRemove={onRemoveStudent}
      isLoading={isLoading}
      label="TA"
    />
  );
}
