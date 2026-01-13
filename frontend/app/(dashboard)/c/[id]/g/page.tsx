"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserRoleInCourse } from "@/hooks/useUserRoleInCourse";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import TANavbar from "@/components/Course/TANavbar";
import AssessmentCard from "@/components/ui/AssessmentCard";

export default function GradesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [isTimeout, setIsTimeout] = useState(false);

  const { role, course, isLoading } = useUserRoleInCourse(courseId);
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const taData = useCourseDetailStore((s) => s.taData);

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

  return (
    <div>
      <TANavbar />
      <div className="max-h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-6 md:space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Grades</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              View and manage student grades for assessments in this course.
            </p>
          </div>

          {/* Assessments Section */}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Assessments</h2>
            {!taData?.assessments || taData.assessments.length === 0 ? (
              <div className="border border-gray-300 rounded-2xl bg-white px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                No assessments available yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {taData.assessments.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    onClick={() => {
                      // Handle assessment click - navigate to assessment details or marks entry
                      console.log("Assessment clicked:", assessment.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
