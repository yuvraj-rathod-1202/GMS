import React, { useMemo, useState } from 'react';
import EnrollStudentDialog from './EnrollStudentDialog';
import InstructorNavbar from '../Course/InstructorNavbar';
import AddTADialog from './AddTADialog';
import BulkEnrollDialog from './BulkEnrollDialog';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import TAList from './TAList';
import { StatCard } from './StateCard';
import { EmptyState } from './EmptyState';
import { StudentSection } from './StudentSection';

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
  handleAddTA: (taId: string, email: string) => Promise<void>;
  handleRemoveTA: (taId: number) => Promise<void>;
  handleBulkEnroll: (file: File) => Promise<void>;
  managementLoading: boolean;
}) {
  const instructorData = useCourseDetailStore((s) => s.instructorData);
  const [activeTab, setActiveTab] = useState<'students' | 'tas'>('students');

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

  return (
    <div>
      <InstructorNavbar />
      <div className="h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Students"
            count={students.length}
            isActive={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
          />
          <StatCard
            label="Teaching Assistants"
            count={tas.length}
            isActive={activeTab === 'tas'}
            onClick={() => setActiveTab('tas')}
          />
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('tas')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teaching Assistants
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'students' ? (
            <StudentSection
              students={students}
              onEnroll={() => setShowEnrollDialog(true)}
              onBulk={() => setShowBulkEnrollDialog(true)}
              onRemoveStudent={handleRemoveStudent}
              isLoading={managementLoading}
            />
          ) : (
            <TASection
              tas={tas}
              onAdd={() => setShowAddDialog(true)}
              onRemoveTA={handleRemoveTA}
              isLoading={managementLoading}
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

function TASection({
  tas,
  onAdd,
  onRemoveTA,
  isLoading,
}: {
  tas: Array<{ index: number; id: string; email: string }>;
  onAdd: () => void;
  onRemoveTA: (taId: number) => Promise<void>;
  isLoading?: boolean;
}) {
  const hasTAs = tas.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage TAs</h2>
          <p className="text-gray-500 text-sm">Grant teaching assistant privileges to users.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center gap-2"
          >
            Add TA
          </button>
        </div>
      </div>

      {hasTAs ? (
        <TAList students={tas} onRemoveStudent={onRemoveTA} isLoading={isLoading} />
      ) : (
        <EmptyState
          title="No TAs assigned"
          description="Add teaching assistants to help manage this course."
          primaryActionText="Add TA"
          onPrimaryAction={onAdd}
          showSecondary={false}
        />
      )}
    </div>
  );
}
