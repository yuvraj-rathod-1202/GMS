import { CourseDBObject } from '@/lib/types/courses';
import Link from 'next/link';
import QuickAction from '../ui/Overview/QuickAction';
import StatsComponent from '../ui/Overview/StatsComponent';

interface CourseOverviewProps {
  course: CourseDBObject;
}

export default function InstructorCourseOverview({ course }: CourseOverviewProps) {
  const stats = [
    { label: 'Course Code', value: course.course_code },
    { label: 'Semester', value: course.semester },
    { label: 'Credits', value: course.credits },
    { label: 'Total Students', value: course.total_students },
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
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8">
          {stats.map((stat) => {
            return <StatsComponent key={stat.label} stat={stat} />;
          })}
        </div>
        <div className="border-t border-gray-200 p-4 sm:p-6 md:p-8 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickAction
              href={`/c/${course.id}/gb`}
              title="Open Grade Sheet"
              description="View all student grades"
            />
            <QuickAction
              href={`/c/${course.id}/g`}
              title="Manage Assessments"
              description="Create and edit assessments"
            />
            <QuickAction
              href={`/c/${course.id}/p`}
              title="Manage Students & TAs"
              description="Add or remove participants"
            />
            <QuickAction
              href={`/c/${course.id}/gp`}
              title="Grading Policy Settings"
              description="Configure grading rules"
            />
            <QuickAction
              href={`/c/${course.id}/a`}
              title="Course Analytics"
              description="View performance insights"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
