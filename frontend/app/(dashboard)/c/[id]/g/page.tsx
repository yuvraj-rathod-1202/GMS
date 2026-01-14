"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserRoleInCourse } from "@/hooks/useUserRoleInCourse";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useTACourse } from "@/hooks/useTACourse";
import TANavbar from "@/components/Course/TANavbar";
import AssessmentCard from "@/components/ui/AssessmentCard";

export default function GradesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const { role, course, isLoading } = useUserRoleInCourse(courseId);
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const taData = useCourseDetailStore((s) => s.taData);
  const { GetAllAssessments, loading: taLoading } = useTACourse();

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

  // Fetch assessments and course roles when TA role is confirmed
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoading && role === 'ta' && !isFetchingData) {
        setIsFetchingData(true);
        try {
          await GetAllAssessments(courseId);
        } catch (error) {
          if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
            console.error("Error fetching TA data:", error);
          }
        } finally {
          setIsFetchingData(false);
        }
      }
    };

    fetchData();
  }, [role, isLoading, courseId]);

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

  const isLoadingData = taLoading || isFetchingData;

  const handlePublishToggle = async () => {
    // Refresh assessments after publish/unpublish
    try {
      await GetAllAssessments(courseId, true);
    } catch (error) {
      if(process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'){
        console.error("Error refreshing assessments:", error);
      }
    }
  };

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

          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Course Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Total Students
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {currentCourse?.total_students || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Total Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {taData?.assessments?.length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Published Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {taData?.assessments?.filter(a => a.is_marks_published).length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Unpublished Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {taData?.assessments?.filter(a => !a.is_marks_published).length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Assessments Section */}
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Assessments</h2>
            {isLoadingData ? (
              <div className="border border-gray-300 rounded-2xl bg-white px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                <div className="animate-pulse">Loading assessments...</div>
              </div>
            ) : !taData?.assessments || taData.assessments.length === 0 ? (
              <div className="border border-gray-300 rounded-2xl bg-white px-4 sm:px-6 py-6 sm:py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
                No assessments available yet
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {taData.assessments.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    onClick={() => {
                      // Handle assessment click - navigate to assessment details or marks entry
                    }}
                    onPublishToggle={handlePublishToggle}
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
