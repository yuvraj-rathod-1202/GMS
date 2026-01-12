"use client";
import { useEffect } from "react";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import { useStudentCourse } from "@/hooks/useStudentCourse";
import AssessmentTable from "../ui/AssessmentTable";

export default function StudentCourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const studentData = useCourseDetailStore((s) => s.studentData);
  const { fetchStudentCourseData, loading, error } = useStudentCourse();

  useEffect(() => {
    if (currentCourse?.id) {
      fetchStudentCourseData(currentCourse.id).catch(() => {});
    }
  }, [currentCourse?.id, fetchStudentCourseData]);

  if (!currentCourse) return null;

  const columns = [
    { header: "Assessment Name", key: "assessment_name"},
    { header: "Date", key: "assessment_date", render: (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric",}),},
    { header: "Score", key: "marks_obtained", render: (score: number, row: any) => `${score}/${row.max_marks}` },
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
    </div>
  );
}
