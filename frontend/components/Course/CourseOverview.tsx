import { CourseDBObject } from "@/lib/types/courses";
import Link from "next/link";

interface CourseOverviewProps {
  course: CourseDBObject;
}

export default function CourseOverview({ course }: CourseOverviewProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-gray-200">
          <div>
            <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 border-t border-gray-200">
              <Link href={`/c/${course.id}/g`}>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                  Grade Assessments
                </h2>
              </Link>
              <p className="text-sm text-gray-600">
                View and manage all grade assessments for this course, including
                assignments, quizzes, and exams. Track student performance and
                generate reports to analyze overall class progress.
              </p>
            </div>
          </div>
          <div>
            <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 border-t border-gray-200">
              <Link href={`/c/${course.id}/p`}>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                  Manage Students
                </h2>
              </Link>
              <p className="text-sm text-gray-600">
                Access the student roster for this course, view individual student
                profiles, and manage enrollments. Communicate with students and
                monitor their academic progress throughout the semester.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
