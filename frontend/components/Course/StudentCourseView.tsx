"use client";
import { useEffect, useState } from "react";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useStudentCourse } from "@/hooks/useStudentCourse";
import AssessmentTable from "../ui/AssessmentTable";
import { AssessmentAnalyticsDBObject } from "@/lib/types/analytics";

export default function StudentCourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const studentData = useCourseDetailStore((s) => s.studentData);
  const { fetchStudentCourseData, loading, error } = useStudentCourse();
  const [selectedAnalytics, setSelectedAnalytics] = useState<AssessmentAnalyticsDBObject | null>(null);

  useEffect(() => {
    if (currentCourse?.id) {
      fetchStudentCourseData(currentCourse.id).catch(() => {});
    }
  }, [currentCourse?.id, fetchStudentCourseData]);

  if (!currentCourse) return null;

  const handleShowDetails = (assessmentId: number) => {
    const analytics = studentData?.analytics?.find((a) => a.assessment_id === assessmentId);
    if (analytics) {
      setSelectedAnalytics(analytics);
    }
  };

  const columns = [
    { header: "Assessment Name", key: "assessment_name"},
    { header: "Date", key: "assessment_date", render: (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric",}),},
    { header: "Score", key: "marks_obtained", render: (score: number, row: any) => `${score}/${row.max_marks}` },
    { header: "", key: "action", render: (_: any, row: any) => (
      <button
        onClick={() => handleShowDetails(row.assessment_id)}
        className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        Detail
      </button>
    )},
  ]

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-48px)] overflow-y-auto">
      <h4 className="text-md md:text-2xl font-semibold">{currentCourse.name}</h4>
      
      {loading && (
        <div className="text-center py-8 text-gray-600 animate-pulse">
          Loading assessments...
        </div>
      )}
      
      {error && (
        <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <AssessmentTable columns={columns} data={studentData?.marks || []} emptyMessage="No assessments found." />
      )}

      {/* Analytics Modal */}
      {selectedAnalytics && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedAnalytics(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assessment Analytics</h3>
              <button
                onClick={() => setSelectedAnalytics(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Minimum</span>
                <span className="font-medium text-gray-900">{selectedAnalytics.min.toFixed(1)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Maximum</span>
                <span className="font-medium text-gray-900">{selectedAnalytics.max.toFixed(1)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Mean</span>
                <span className="font-medium text-gray-900">{selectedAnalytics.mean.toFixed(1)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Median</span>
                <span className="font-medium text-gray-900">{selectedAnalytics.median.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
