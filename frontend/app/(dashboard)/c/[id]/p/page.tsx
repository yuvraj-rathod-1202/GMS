"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useCourseManagement } from "@/hooks/useCourseManagement";
import { TAPeopleView } from "@/components/People/TAPeopleView";
import { InstructorPeopleView } from "@/components/People/InstructorPeopleView";

export default function PeoplePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta', 'instructor'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  
  const {
    loading: managementLoading,
    fetchCourseRoles,
    enrollStudent,
    unenrollStudent,
    AddTA,
    RemoveTA
  } = useCourseManagement(role || 'ta');

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingData) {
      const fetchStudents = async () => {
        setIsFetchingData(true);
        try {
          await fetchCourseRoles(courseId, false, role=== 'instructor');
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error("Error fetching students:", error);
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

  const handleEnrollStudent = async (studentId: string, email: string) => {
    if (!studentId.trim()) {
      alert("Please enter a student ID");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to enroll student with ID: ${studentId}?`);
    if (!confirmed) return;

    try {
      await enrollStudent(courseId, { student_id: Number(studentId), email: email.trim() });
      alert("Student enrolled successfully!");
      setShowEnrollDialog(false);
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error enrolling student:", error);
      }
      alert(error?.message || "Failed to enroll student");
    }
  };

  const handleRemoveStudent = async (studentIdToRemove: number) => {
    const confirmed = window.confirm(`Are you sure you want to remove student with ID: ${studentIdToRemove} from the course?`);
    if (!confirmed) return;
    try {
      await unenrollStudent(courseId, studentIdToRemove);
      await fetchCourseRoles(courseId, true);
      alert("Student removed successfully!");
    } catch (error: any) {
      alert(error?.message || "Failed to remove student");
    }
  };

  const handleAddTA = async (taId: string, email: string) => {
    if (!taId.trim()) {
      alert("Please enter a TA ID");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to add TA with ID: ${taId}?`);
    if (!confirmed) return;

    try {

      await AddTA(courseId, { ta_id: Number(taId), email: email.trim() });
      alert("TA added successfully!");
      setShowAddDialog(false);
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error("Error adding TA:", error);
      }
      alert(error?.message || "Failed to add TA");
    }
  };

  const handleRemoveTA = async (taId: number) => {
    const confirmed = window.confirm(`Are you sure you want to remove TA with ID: ${taId} from the course?`);
    if (!confirmed) return;
    try {
      await RemoveTA(courseId, taId);
      await fetchCourseRoles(courseId, true);
      alert("TA removed successfully!");
    } catch (error: any) {
      alert(error?.message || "Failed to remove TA");
    }
  };

  switch (role) {
    case 'ta':
      return <TAPeopleView 
                setShowEnrollDialog={setShowEnrollDialog}
                showEnrollDialog={showEnrollDialog}
                handleEnrollStudent={handleEnrollStudent}
                handleRemoveStudent={handleRemoveStudent}
                managementLoading={managementLoading}
              />;
    case 'instructor':
      return <InstructorPeopleView
                setShowEnrollDialog={setShowEnrollDialog}
                showEnrollDialog={showEnrollDialog}
                showAddDialog={showAddDialog}
                setShowAddDialog={setShowAddDialog}
                handleEnrollStudent={handleEnrollStudent}
                handleRemoveStudent={handleRemoveStudent}
                handleAddTA={handleAddTA}
                handleRemoveTA={handleRemoveTA}
                managementLoading={managementLoading}
              />;
  }
}