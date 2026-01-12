"use client";
import { useCourseDetailStore } from "@/lib/store/courseDetail";

export default function TACourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const taData = useCourseDetailStore((s) => s.taData);

  if (!currentCourse) return null;

  return (
    <div className="p-6 space-y-6">
        This is the TA view for the course: <strong>{currentCourse.name}</strong>
    </div>
  );
}
