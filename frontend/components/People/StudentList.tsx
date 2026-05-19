import { StudentListProps } from '@/lib/types/people/studentlist';
import RosterList from './RosterList';

export default function StudentList({
  students,
  onRemoveStudent,
  isLoading = false,
  searchQuery = '',
}: {
  students: any[];
  onRemoveStudent: (id: number) => Promise<void>;
  isLoading?: boolean;
  searchQuery?: string;
}) {
  return (
    <RosterList
      items={students}
      emptyMessage="No students enrolled yet"
      searchEmptyMessage="No students found matching your search"
      searchQuery={searchQuery}
      onRemove={onRemoveStudent}
      isLoading={isLoading}
      label="student"
    />
  );
}
