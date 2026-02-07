'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { TAPeopleView } from '@/components/People/TAPeopleView';
import { InstructorPeopleView } from '@/components/People/InstructorPeopleView';
import { usePeopleManagement } from '@/hooks/usePeopleManagement';

export default function PeoplePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkEnrollDialog, setShowBulkEnrollDialog] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta', 'instructor'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);

  const {
    managementLoading,
    fetchCourseRoles,
    handleEnrollStudent,
    handleRemoveStudent,
    handleAddTA,
    handleRemoveTA,
    handleUnenrollAllStudents,
    handleBulkEnroll,
  } = usePeopleManagement(courseId, role as 'ta' | 'instructor', setShowEnrollDialog, setShowAddDialog, setShowBulkEnrollDialog);

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingData) {
      const fetchStudents = async () => {
        setIsFetchingData(true);
        try {
          await fetchCourseRoles(courseId, false, role === 'instructor');
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching students:', error);
          }
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchStudents();
    }
  }, [courseId, hasAccess, isLoading, fetchCourseRoles]);

  if (isLoading || !currentCourse || !hasAccess || isFetchingData) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  switch (role) {
    case 'ta':
      return (
        <TAPeopleView
          setShowEnrollDialog={setShowEnrollDialog}
          showEnrollDialog={showEnrollDialog}
          handleEnrollStudent={handleEnrollStudent}
          handleRemoveStudent={handleRemoveStudent}
          managementLoading={managementLoading}
        />
      );
    case 'instructor':
      return (
        <InstructorPeopleView
          setShowEnrollDialog={setShowEnrollDialog}
          showEnrollDialog={showEnrollDialog}
          showAddDialog={showAddDialog}
          setShowAddDialog={setShowAddDialog}
          showBulkEnrollDialog={showBulkEnrollDialog}
          setShowBulkEnrollDialog={setShowBulkEnrollDialog}
          handleEnrollStudent={handleEnrollStudent}
          handleRemoveStudent={handleRemoveStudent}
          handleUnenrollAllStudents={handleUnenrollAllStudents}
          handleAddTA={handleAddTA}
          handleRemoveTA={handleRemoveTA}
          handleBulkEnroll={handleBulkEnroll}
          managementLoading={managementLoading}
        />
      );
  }
}
