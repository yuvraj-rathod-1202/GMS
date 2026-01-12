"use client";
import { useCourseDetailStore } from "@/lib/store/courseDetail";

export default function InstructorCourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const instructorData = useCourseDetailStore((s) => s.instructorData);

  if (!currentCourse) return null;

  return (
    <div className="p-6 space-y-6">
        This is the instructor view for the course: <strong>{currentCourse.name}</strong>
    </div>
  );
}
