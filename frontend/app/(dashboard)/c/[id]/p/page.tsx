"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useCourseManagement } from "@/hooks/useCourseManagement";
import TANavbar from "@/components/Course/TANavbar";
import PageHeader from "@/components/Course/PageHeader";
import EnrollStudentDialog from "@/components/Course/EnrollStudentDialog";
import StudentList from "@/components/Course/StudentList";

interface Student {
  user_id: number;
  email: string | null;
}

export default function PeoplePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta', 'instructor'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const taData = useCourseDetailStore((s) => s.taData);
  
  const {
    loading: managementLoading,
    fetchCourseRoles,
    enrollStudent,
    unenrollStudent,
  } = useCourseManagement(role || 'ta');

  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingData) {
      const fetchStudents = async () => {
        setIsFetchingData(true);
        try {
          await fetchCourseRoles(courseId);
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

  const students = useMemo(() => {
    return (taData?.CourseRoles?.students || [])
      .filter((student: Student) => student?.user_id !== undefined)
      .map((student: Student, index: number) => ({
        index,
        id: student.user_id.toString(),
        email: student.email || "N/A",
      }));
  }, [taData]);

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
      await fetchCourseRoles(courseId, true);
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
