import { BiUserPlus, BiTrash } from 'react-icons/bi';
import StudentList from './StudentList';
import PeopleSectionShell from './PeopleSectionShell';

export function StudentSection({
  students,
  onEnroll,
  onBulk,
  onRemoveStudent,
  onUnenrollAll,
  isLoading,
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: {
  students: Array<{ index: number; id: string; email: string }>;
  onEnroll: () => void;
  onBulk: () => void;
  onRemoveStudent: (studentId: number) => Promise<void>;
  onUnenrollAll: () => Promise<void>;
  isLoading?: boolean;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: any) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}) {
  const hasStudents = students.length > 0;

  return (
    <PeopleSectionShell
      hasItems={hasStudents}
      itemsLabel="student roster"
      emptyTitle="No students yet"
      emptyDescription="Get started by enrolling students manually or importing a class list."
      primaryAction={{ label: 'Enroll Student', onClick: onEnroll, icon: <BiUserPlus /> }}
      headerActions={[
        ...(hasStudents
          ? [
              {
                label: 'Unenroll All',
                onClick: onUnenrollAll,
                variant: 'secondary' as const,
                icon: <BiTrash className="text-red-500" />,
                disabled: isLoading,
              },
            ]
          : []),
      ]}
      secondaryAction={{
        label: 'Import Excel',
        onClick: onBulk,
        variant: 'secondary',
      }}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by Roll No or Email..."
    >
      {hasStudents ? (
        <StudentList
          students={students}
          onRemoveStudent={onRemoveStudent}
          isLoading={isLoading}
          searchQuery={searchQuery || ''}
        />
      ) : null}
    </PeopleSectionShell>
  );
}
