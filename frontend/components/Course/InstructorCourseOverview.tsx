import { CourseDBObject } from "@/lib/types/courses";
import Link from "next/link";

interface CourseOverviewProps {
  course: CourseDBObject;
}

export default function InstructorCourseOverview({ course }: CourseOverviewProps) {
  const stats = [
    { label: "Course Code", value: course.course_code },
    { label: "Semester", value: course.semester },
    { label: "Credits", value: course.credits },
    { label: "Total Students", value: course.total_students },
  ];

  return (
    <div className="w-full md:max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-300 overflow-hidden">
        <div className="bg-linear-to-br bg-gray-50 border-b border-gray-300 px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1">
                {course.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">Course Overview</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8">
          {stats.map((stat) => {
            return (
              <div
                key={stat.label}
                className="flex items-start gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-full">
                  <p className="text-xs font-medium text-gray-500 tracking-wide mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xs lg:text-base font-semibold text-gray-900 wrap-break-words">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-gray-200 p-4 sm:p-6 md:p-8 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link 
              href={`/c/${course.id}/gb`}
              className="flex items-center gap-3 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors" />
              <div>
                <p className="font-medium text-gray-900">Open Grade Sheet</p>
                <p className="text-xs text-gray-500">View all student grades</p>
              </div>
            </Link>

            <Link 
              href={`/c/${course.id}/g`}
              className="flex items-center gap-3 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors" />
              <div>
                <p className="font-medium text-gray-900">Manage Assessments</p>
                <p className="text-xs text-gray-500">Create and edit assessments</p>
              </div>
            </Link>

            <Link 
              href={`/c/${course.id}/p`}
              className="flex items-center gap-3 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
            >
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors" />
              <div>
                <p className="font-medium text-gray-900">Manage Students & TAs</p>
                <p className="text-xs text-gray-500">Add or remove participants</p>
              </div>
            </Link>

            <Link 
              href={`/c/${course.id}/gp`}
              className="flex items-center gap-3 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors" />
              <div>
                <p className="font-medium text-gray-900">Grading Policy Settings</p>
                <p className="text-xs text-gray-500">Configure grading rules</p>
              </div>
            </Link>

            <Link 
              href={`/c/${course.id}/a`}
              className="flex items-center gap-3 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors" />
              <div>
                <p className="font-medium text-gray-900">Course Analytics</p>
                <p className="text-xs text-gray-500">View performance insights</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
