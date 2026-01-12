"use client";
import { useCourseDetailStore } from "@/lib/store/courseDetail";

export default function StudentCourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const studentData = useCourseDetailStore((s) => s.studentData);

  if (!currentCourse) return null;

  return (
    <div className="p-6 space-y-6">
      This is the student view for the course: <strong>{currentCourse.name}</strong>
    </div>
  );
}
