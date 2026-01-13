"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserRoleInCourse } from "@/hooks/useUserRoleInCourse";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import TANavbar from "@/components/Course/TANavbar";
import { BiPencil, BiUserPlus } from "react-icons/bi";

export default function PeoplePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [isTimeout, setIsTimeout] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const { role, course, isLoading } = useUserRoleInCourse(courseId);
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);

  useEffect(() => {
    if (!isLoading && !course) {
      router.push("/");
      return;
    }

    if (isLoading) {
      const timer = setTimeout(() => {
        setIsTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, course, router]);

  useEffect(() => {
    if (isTimeout && !course) {
      router.push("/");
    }
  }, [isTimeout, course, router]);

  // Redirect if not TA
  useEffect(() => {
    if (!isLoading && role && role !== 'ta') {
      router.push(`/c/${courseId}`);
    }
  }, [role, isLoading, router, courseId]);

  if (isLoading || !currentCourse || !role) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (role !== 'ta') {
    return null;
  }

  const students = [
    { id: "2411004", email: "studnet@example.com"},
    { id: "2411005", email: "studnet@example.com"},
  ];

  const teachingAssistants = [
    { id: "2421004", email: "ta@example.com"},
  ];

  const instructors = [
    { id: "2431001", email: "instructor@example.com"},
  ];

  return (
    <div>
      <TANavbar />
      <div className="max-h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-6 md:space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">People</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                Manage students and teaching assistants enrolled in this course.
              </p>
            </div>
            <button
              onClick={() => {/* TODO: Implement enroll student modal */}}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <BiUserPlus className="text-lg" />
              Enroll Student
            </button>
          </div>

          {/* Students Section */}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Students</h2>
            <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white">
              {/* Header */}
              <div className="grid gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300" style={{ gridTemplateColumns: '2fr 3fr auto' }}>
                <div className="font-semibold text-gray-900">Roll No</div>
                <div className="font-semibold text-gray-900">Email</div>
                <div className="font-semibold text-gray-900">Actions</div>
              </div>
              {/* Body */}
              {students.length === 0 ? (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                  No students enrolled yet
                </div>
              ) : (
                students.map((student, index) => (
                  <div
                    key={student.id}
                    className={`grid gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base items-center ${
                      index !== students.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                    style={{ gridTemplateColumns: '2fr 3fr auto' }}
                  >
                    <div className="text-gray-900 font-medium">{student.id}</div>
                    <div className="text-gray-700 truncate">{student.email}</div>
                    <div className="relative">
                      <button
                        onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Manage student"
                      >
                        <BiPencil className="text-lg text-gray-600" />
                      </button>
                      {selectedStudent === student.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              // TODO: Implement remove student logic
                              console.log('Remove student:', student.id);
                              setSelectedStudent(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove from course
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teaching Assistants Section */}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Teaching Assistants</h2>
            <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300">
                <div className="font-semibold text-gray-900">Roll No</div>
                <div className="font-semibold text-gray-900">Email</div>
              </div>
              {/* Body */}
              {teachingAssistants.length === 0 ? (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                  No teaching assistants assigned yet
                </div>
              ) : (
                teachingAssistants.map((ta, index) => (
                  <div
                    key={ta.id}
                    className={`grid grid-cols-3 gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base items-center ${
                      index !== teachingAssistants.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                  >
                    <div className="text-gray-900 font-medium">{ta.id}</div>
                    <div className="text-gray-700 truncate">{ta.email}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructors Section */}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Instructors</h2>
            <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300">
                <div className="font-semibold text-gray-900">username</div>
                <div className="font-semibold text-gray-900">Email</div>
              </div>
              {/* Body */}
              {instructors.length === 0 ? (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                  No instructors assigned yet
                </div>
              ) : (
                instructors.map((instructor, index) => (
                  <div
                    key={instructor.id}
                    className={`grid grid-cols-3 gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base items-center ${
                      index !== instructors.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                  >
                    <div className="text-gray-900 font-medium">{instructor.id}</div>
                    <div className="text-gray-700 truncate">{instructor.email}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
