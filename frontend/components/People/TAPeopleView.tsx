import React, { useMemo } from 'react';
import TANavbar from '../Course/TANavbar';
import EnrollStudentDialog from './Dialogs/EnrollStudentDialog';
import StudentList from './StudentList';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { BiUserPlus } from 'react-icons/bi';
import { StatCard } from './Cards/StateCard';
import { EmptyState } from './Cards/EmptyState';

interface Student {
  user_id: number;
  email: string | null;
}

export function TAPeopleView({
  setShowEnrollDialog,
  showEnrollDialog,
  handleEnrollStudent,
  handleRemoveStudent,
  managementLoading,
}: {
  setShowEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showEnrollDialog: boolean;
  handleEnrollStudent: (studentId: string, email: string) => Promise<void>;
  handleRemoveStudent: (studentId: number) => Promise<void>;
  managementLoading: boolean;
}) {
  const taData = useCourseDetailStore((s) => s.taData);

  const students = useMemo(() => {
    return (taData?.CourseRoles?.students || [])
      .filter((student: Student) => student?.user_id !== undefined)
      .map((student: Student, index: number) => ({
        index,
        id: student.user_id.toString(),
        email: student.email || 'N/A',
      }));
  }, [taData]);

  const hasStudents = students.length > 0;

  return (
    <div>
      <TANavbar />

      <div className="h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Enrolled Students"
            count={students.length}
            isActive={true}
            onClick={() => {}}
          />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Students</h2>
              <p className="text-gray-500 text-sm">View and manage students in this course.</p>
            </div>

            <button
              onClick={() => setShowEnrollDialog(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
              <BiUserPlus className="text-lg" /> Enroll Student
            </button>
          </div>

          {hasStudents ? (
            <StudentList
              students={students}
              onRemoveStudent={handleRemoveStudent}
              isLoading={managementLoading}
            />
          ) : (
            <EmptyState
              title="No students yet"
              description="There are currently no students enrolled in this course."
              primaryActionText="Enroll Student"
              onPrimaryAction={() => setShowEnrollDialog(true)}
              showSecondary={false}
            />
          )}
        </div>

        <EnrollStudentDialog
          isOpen={showEnrollDialog}
          onClose={() => setShowEnrollDialog(false)}
          onSubmit={handleEnrollStudent}
          isLoading={managementLoading}
        />
      </div>
    </div>
  );
}
