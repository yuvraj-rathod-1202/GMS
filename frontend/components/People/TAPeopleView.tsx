import React, { useMemo } from 'react';
import TANavbar from '../Course/TANavbar';
import PageHeader from '../Course/PageHeader';
import EnrollStudentDialog from './EnrollStudentDialog';
import StudentList from './StudentList';
import { useCourseDetailStore } from '@/lib/store/courseDetail';

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

  return (
    <div>
      <TANavbar />
      <div className="h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-6 md:space-y-8">
          <PageHeader
            title="Students"
            description="Manage students enrolled in this course."
            buttonText="Enroll Student"
            onButtonClick={() => setShowEnrollDialog(true)}
          />

          <EnrollStudentDialog
            isOpen={showEnrollDialog}
            onClose={() => setShowEnrollDialog(false)}
            onSubmit={handleEnrollStudent}
            isLoading={managementLoading}
          />

          <StudentList
            students={students}
            onRemoveStudent={handleRemoveStudent}
            isLoading={managementLoading}
          />
        </div>
      </div>
    </div>
  );
}
