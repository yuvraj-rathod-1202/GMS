import React, { useMemo, useState } from "react";
import CoursesStatusSelection from "./ui/CoursesStatusSelection";
import { useCoursesStore } from "@/lib/store/courses";
import { useAuthStore } from "@/lib/store/auth";
import { useCourses } from "@/hooks/useCourses";
import CourseCard from "./CourseCard";

export default function DashboardCourses() {
  const [statusFilter, setStatusFilter] = useState<"ongoing" | "completed">("ongoing");
  const [open, setOpen] = useState(false);
  const { fetchCourses, loading, error } = useCourses();
  const courses = useCoursesStore((s) => s.courses);
  const user = useAuthStore((s) => s.user);

  const filteredCourses = useMemo(() => {
    const coursesList = Array.isArray(courses) ? courses : [];
    return coursesList.filter((course) => course.status.toLowerCase() === statusFilter);
  }, [courses, statusFilter]);

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="justify-between flex items-center mb-6">
        <h4 className="text-md md:text-lg font-semibold">Courses</h4>
        <CoursesStatusSelection setOpen={setOpen} open={open} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading courses...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {!loading && !error && filteredCourses.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-sm">No {statusFilter} courses found</div>
        </div>
      )}

      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}