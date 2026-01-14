"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUserRoleInCourse } from "@/hooks/useUserRoleInCourse";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useTACourse } from "@/hooks/useTACourse";
import TANavbar from "@/components/Course/TANavbar";
import { BiPencil, BiUserPlus, BiX } from "react-icons/bi";

interface Student {
  user_id: number;
  email: string | null;
}

export default function PeoplePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [isTimeout, setIsTimeout] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const taData = useCourseDetailStore((s) => s.taData);

  const { role, course, isLoading } = useUserRoleInCourse(courseId);
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const { EnrollStudent, UnEnrollStudent, loading: taLoading, CourseRoles } = useTACourse();

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

  useEffect(() => {
    if (!isLoading && role === 'ta' && !isFetchingData) {
      const fetchStudents = async () => {
        setIsFetchingData(true);
        try {
          await CourseRoles(courseId);
        } catch (error) {
          if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
            console.error("Error fetching students:", error);
          }
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchStudents();
    }
  }, [courseId, role, isLoading]);

  const students = useMemo(() => {
    return (taData?.CourseRoles?.students || [])
      .filter((student: Student) => student?.user_id !== undefined)
      .map((student: Student, index: number) => ({
        index,
        id: student.user_id.toString(),
        email: student.email || "N/A",
      }));
  }, [taData]);

  if (isLoading || !currentCourse || !role || isFetchingData) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (role !== 'ta') {
    return null;
  }

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim()) {
      alert("Please enter a student ID");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to enroll student with ID: ${studentId}?`);
    if (!confirmed) return;

    setIsEnrolling(true);
    try {
      await EnrollStudent(courseId, { student_id: Number(studentId), email: email.trim() });
      await CourseRoles(courseId, true);
      alert("Student enrolled successfully!");
      setShowEnrollDialog(false);
      setStudentId("");
      setEmail("");
    } catch (error: any) {
      if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
        console.error("Error enrolling student:", error);
      }
      alert(error?.message || "Failed to enroll student");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentIdToRemove: number) => {
    const confirmed = window.confirm(`Are you sure you want to remove student with ID: ${studentIdToRemove} from the course?`);
    if (!confirmed) return;
    try {
      await UnEnrollStudent(courseId, studentIdToRemove);
      await CourseRoles(courseId, true);
      alert("Student removed successfully!");
      setSelectedStudent(null);
    } catch (error: any) {
      alert(error?.message || "Failed to remove student");
    }
  };

  return (
    <div>
      <TANavbar />
      <div className="h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-6 md:space-y-8">
          {/* Page Header */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Students</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                Manage students enrolled in this course.
              </p>
            </div>
            <button
              onClick={() => setShowEnrollDialog(true)}
              className="max-w-40 flex items-center gap-2 px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <BiUserPlus className="text-lg" />
              Enroll Student
            </button>
          </div>

          {/* Enroll Student Dialog */}
          {showEnrollDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
                <button
                  onClick={() => {
                    setShowEnrollDialog(false);
                    setStudentId("");
                  }}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <BiX className="text-xl text-gray-600" />
                </button>
                
                <h2 className="text-xl font-bold text-gray-900 mb-4">Enroll Student</h2>
                
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID (Roll No)
                    </label>
                    <input
                      type="number"
                      id="studentId"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Enter student ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      disabled={isEnrolling}
                      required
                    />
                    <label htmlFor="emaik" className="block text-sm font-medium text-gray-700 mt-2">
                        Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      disabled={isEnrolling}
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEnrollDialog(false);
                        setStudentId("");
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={isEnrolling}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? "Enrolling..." : "Enroll"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Students Section */}
          <div>
            <div className="border border-gray-300 rounded-2xl bg-white">
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
                students.map((student: any, index: number) => (
                  <div
                    key={student.index}
                    className={`grid gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base items-center ${
                      index !== students.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                    style={{ gridTemplateColumns: '2fr 3fr auto' }}
                  >
                    <div className="text-gray-900 font-medium">{student.id}</div>
                    <div className="text-gray-700 truncate">{student.email}</div>
                    <div className="relative">
                      <button
                        onClick={() => setSelectedStudent(selectedStudent === student.index ? null : student.index)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Manage student"
                      >
                        <BiPencil className="text-lg text-gray-600" />
                      </button>
                      {selectedStudent === student.index && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-30">
                          <button
                            onClick={() => handleRemoveStudent(Number(student.id))}
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
        </div>
      </div>
    </div>
  );
}
