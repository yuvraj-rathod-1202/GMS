import React, { useMemo, useState } from 'react';
import EnrollStudentDialog from './Dialogs/EnrollStudentDialog';
import InstructorNavbar from '../Course/InstructorNavbar';
import AddTADialog from './Dialogs/AddTADialog';
import BulkEnrollDialog from './Dialogs/BulkEnrollDialog';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
// import { StatCard } from './Cards/StateCard';
import { StudentSection } from './StudentSection';
import { TASection } from './TASection';

interface Student {
  user_id: number;
  email: string | null;
}

export function InstructorPeopleView({
  setShowEnrollDialog,
  showEnrollDialog,
  setShowAddDialog,
  showAddDialog,
  showBulkEnrollDialog,
  setShowBulkEnrollDialog,
  handleEnrollStudent,
  handleRemoveStudent,
  handleUnenrollAllStudents,
  handleAddTA,
  handleRemoveTA,
  handleBulkEnroll,
  managementLoading,
}: {
  setShowEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showEnrollDialog: boolean;
  setShowAddDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showAddDialog: boolean;
  showBulkEnrollDialog: boolean;
  setShowBulkEnrollDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleEnrollStudent: (studentId: string, email: string) => Promise<void>;
  handleRemoveStudent: (studentId: number) => Promise<void>;
  handleUnenrollAllStudents: () => Promise<void>;
  handleAddTA: (taId: string, email: string) => Promise<void>;
  handleRemoveTA: (taId: number) => Promise<void>;
  handleBulkEnroll: (file: File) => Promise<void>;
  managementLoading: boolean;
}) {
  const instructorData = useCourseDetailStore((s) => s.instructorData);
  const [activeTab, setActiveTab] = useState<'students' | 'tas'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  const students = useMemo(() => {
    return (instructorData?.CourseRoles?.students || [])
      .filter((student: Student) => student?.user_id !== undefined)
      .map((student: Student, index: number) => ({
        index,
        id: student.user_id.toString(),
        email: student.email || 'N/A',
      }));
  }, [instructorData]);

  const tas = useMemo(() => {
    return (instructorData?.CourseRoles?.tas || [])
      .filter((ta: Student) => ta?.user_id !== undefined)
      .map((ta: Student, index: number) => ({
        index,
        id: ta.user_id.toString(),
        email: ta.email || 'N/A',
      }));
  }, [instructorData]);

  const tabs = [
    { id: 'students', label: 'Students' },
    { id: 'tas', label: 'Teaching Assistants' },
  ];

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col overflow-hidden">
      <InstructorNavbar />
      <div className="flex-1 flex flex-col min-h-0 w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
        {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 shrink-0">
          <StatCard label="Total Students" count={students.length} />
          <StatCard label="Teaching Assistants" count={tas.length} />
        </div> */}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === 'students' ? (
            <StudentSection
              students={students}
              onEnroll={() => setShowEnrollDialog(true)}
              onBulk={() => setShowBulkEnrollDialog(true)}
              onRemoveStudent={handleRemoveStudent}
              onUnenrollAll={handleUnenrollAllStudents}
              isLoading={managementLoading}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          ) : (
            <TASection
              tas={tas}
              onAdd={() => setShowAddDialog(true)}
              onRemoveTA={handleRemoveTA}
              isLoading={managementLoading}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
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

        <AddTADialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSubmit={handleAddTA}
          isLoading={managementLoading}
        />
      </div>
    </div>
  );
}
