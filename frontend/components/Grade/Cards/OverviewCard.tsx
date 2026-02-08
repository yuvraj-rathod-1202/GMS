import { AssessmentDBObject } from '@/lib/types/assessments';
import { CourseDBObject } from '@/lib/types/courses';

export default function OverviewCard({
  currentCourse,
  assessments,
}: {
  currentCourse: CourseDBObject | null;
  assessments: AssessmentDBObject[] | null;
}) {
  return (
    <div>
      <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">
        Course Overview
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
            Total Students
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {currentCourse?.total_students || 0}
          </div>
        </div>
        <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
            Total Assessments
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {assessments?.length || 0}
          </div>
        </div>
        <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
            Published Assessments
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {assessments?.filter((a) => a.is_marks_published).length || 0}
          </div>
        </div>
        <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
            Unpublished Assessments
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {assessments?.filter((a) => !a.is_marks_published).length || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
