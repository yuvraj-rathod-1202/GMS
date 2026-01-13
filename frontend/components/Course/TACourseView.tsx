"use client";
import { useCourseDetailStore } from "@/lib/store/courseDetail";

export default function TACourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const taData = useCourseDetailStore((s) => s.taData);

  if (!currentCourse) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4">{currentCourse.name}</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Course Code</p>
            <p className="text-sm md:text-lg font-semibold">{currentCourse.course_code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Semester</p>
            <p className="text-sm md:text-lg font-semibold">{currentCourse.semester}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Credits</p>
            <p className="text-sm md:text-lg font-semibold">{currentCourse.credits}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-sm md:text-lg font-semibold">{currentCourse.total_students}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
