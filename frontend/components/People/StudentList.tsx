import { StudentListProps } from '@/lib/types/people/studentlist';
import RosterList from './RosterList';

export default function StudentList({
  students,
  onRemoveStudent,
  isLoading = false,
}: StudentListProps) {
  return (
    <RosterList
      items={students}
      emptyMessage="No students enrolled yet"
      searchPlaceholder="Search by Roll No or Email..."
      searchEmptyMessage="No students found matching your search"
      onRemove={onRemoveStudent}
      isLoading={isLoading}
      label="student"
    />
  );
}
