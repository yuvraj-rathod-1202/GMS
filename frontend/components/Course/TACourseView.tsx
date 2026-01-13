"use client";
import { useCourseDetailStore } from "@/lib/store/courseDetail";
import CourseOverview from "./CourseOverview";
import TANavbar from "./TANavbar";

export default function TACourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const taData = useCourseDetailStore((s) => s.taData);

  if (!currentCourse) return null;

  return (
    <div>
      <TANavbar />
      <CourseOverview course={currentCourse} />
    </div>
  );
}