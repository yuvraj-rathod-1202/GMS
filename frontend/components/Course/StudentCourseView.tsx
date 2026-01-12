"use client";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import AssessmentTable from "../ui/AssessmentTable";

export default function StudentCourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const studentData = useCourseDetailStore((s) => s.studentData);

  if (!currentCourse) return null;

  const columns = [
    { header: "Assessment Name", key: "assessment_name"},
    { header: "Date", key: "assessment_date"},
    { header: "Score", key: "score", render: (score: number, row: any) => `${score}/${row.max_marks}` },
  ]

  return (
    <div className="p-6 space-y-6">
      <h4 className="text-md md:text-2xl font-semibold">{currentCourse.name}</h4>
        <AssessmentTable columns={columns} data={studentData?.marks || []} emptyMessage="No assessments found." />
    </div>
  );
}
