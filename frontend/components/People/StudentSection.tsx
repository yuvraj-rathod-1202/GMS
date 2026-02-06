import { BiUserPlus, BiTrash } from 'react-icons/bi';
import StudentList from './StudentList';
import { EmptyState } from './EmptyState';

export function StudentSection({
  students,
  onEnroll,
  onBulk,
  onRemoveStudent,
  onUnenrollAll,
  isLoading,
}: {
  students: Array<{ index: number; id: string; email: string }>;
  onEnroll: () => void;
  onBulk: () => void;
  onRemoveStudent: (studentId: number) => Promise<void>;
  onUnenrollAll: () => Promise<void>;
  isLoading?: boolean;
}) {
  const hasStudents = students.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Students</h2>
          <p className="text-gray-500 text-sm">View and manage enrolled students.</p>
        </div>
        <div className="flex items-center gap-3">
          {hasStudents && (
            <button
              onClick={onUnenrollAll}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BiTrash /> Unenroll All
            </button>
          )}
          <button
            onClick={onBulk}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Import Excel
          </button>
          <button
            onClick={onEnroll}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center gap-2"
          >
            <BiUserPlus /> Enroll Student
          </button>
        </div>
      </div>

      {hasStudents ? (
        <StudentList students={students} onRemoveStudent={onRemoveStudent} isLoading={isLoading} />
      ) : (
        <EmptyState
          title="No students yet"
          description="Get started by enrolling students manually or importing a class list."
          primaryActionText="Manually Enroll"
          secondaryActionText="Import Excel"
          onPrimaryAction={onEnroll}
          onSecondaryAction={onBulk}
        />
      )}
    </div>
  );
}
