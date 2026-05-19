import React, { useMemo, useState } from 'react';
import TANavbar from '../Course/TANavbar';
import EnrollStudentDialog from './Dialogs/EnrollStudentDialog';
import BulkEnrollDialog from './Dialogs/BulkEnrollDialog';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
// import { StatCard } from './Cards/StateCard';
import { StudentSection } from './StudentSection';

interface Student {
  user_id: number;
  email: string | null;
}

export function TAPeopleView({
  setShowEnrollDialog,
  showEnrollDialog,
  showBulkEnrollDialog,
  setShowBulkEnrollDialog,
  handleEnrollStudent,
  handleRemoveStudent,
  handleBulkEnroll,
  managementLoading,
}: {
  setShowEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showEnrollDialog: boolean;
  showBulkEnrollDialog: boolean;
  setShowBulkEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleEnrollStudent: (studentId: string, email: string) => Promise<void>;
  handleRemoveStudent: (studentId: number) => Promise<void>;
  handleBulkEnroll: (file: File) => Promise<void>;
  managementLoading: boolean;
}) {
  const taData = useCourseDetailStore((s) => s.taData);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="h-[calc(100vh-48px)] flex flex-col overflow-hidden">
      <TANavbar />

      <div className="flex-1 flex flex-col min-h-0 w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 shrink-0"> */}
        {/* <StatCard label="Total Enrolled Students" count={students.length} /> */}
        {/* </div> */}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <StudentSection
            students={students}
            onEnroll={() => setShowEnrollDialog(true)}
            onBulk={() => setShowBulkEnrollDialog(true)}
            onRemoveStudent={handleRemoveStudent}
            onUnenrollAll={async () => {}} // TA usually can't unenroll all
            isLoading={managementLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <EnrollStudentDialog
          isOpen={showEnrollDialog}
          onClose={() => setShowEnrollDialog(false)}
          onSubmit={handleEnrollStudent}
          isLoading={managementLoading}
        />

        <BulkEnrollDialog
          isOpen={showBulkEnrollDialog}
          onClose={() => setShowBulkEnrollDialog(false)}
          onUpload={handleBulkEnroll}
        />
      </div>
    </div>
  );
}
