"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserRoleInCourse } from "@/hooks/useUserRoleInCourse";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import TANavbar from "@/components/Course/TANavbar";

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
            <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300">
                <div className="font-semibold text-gray-900">Assessment Name</div>
                <div className="font-semibold text-gray-900">Type</div>
                <div className="font-semibold text-gray-900">Max Marks</div>
                <div className="font-semibold text-gray-900">Date</div>
              </div>
              {/* Body */}
              {!taData?.assessments || taData.assessments.length === 0 ? (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                  No assessments available yet
                </div>
              ) : (
                taData.assessments.map((assessment, index) => (
                  <div
                    key={assessment.id}
                    className={`grid grid-cols-4 gap-4 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base items-center hover:bg-gray-50 transition-colors cursor-pointer ${
                      index !== taData.assessments.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                  >
                    <div className="text-gray-900 font-medium">{assessment.name}</div>
                    <div className="text-gray-700">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                        Type {assessment.assessment_type_id}
                      </span>
                    </div>
                    <div className="text-gray-700">{assessment.max_marks}</div>
                    <div className="text-gray-600">
                      {new Date(assessment.assessment_date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grade Statistics */}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Grade Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Total Marks Recorded
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {taData?.totalMarks?.length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Total Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {taData?.assessments?.length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Marks Changes
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {Object.values(taData?.marksChanges || {}).reduce((acc, changes) => acc + changes.length, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Marks Changes */}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Recent Activity</h2>
            <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white">
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                Recent marks changes will be displayed here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
