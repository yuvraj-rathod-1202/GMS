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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
            Total Students
          </p>
          <h3 className="text-xl font-bold text-gray-900 leading-none">
            {currentCourse?.total_students || 0}
          </h3>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
            Total Assessments
          </p>
          <h3 className="text-xl font-bold text-gray-900 leading-none">
            {assessments?.length || 0}
          </h3>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
            Published Assessments
          </p>
          <h3 className="text-xl font-bold text-gray-900 leading-none">
            {assessments?.filter((a) => a.is_marks_published).length || 0}
          </h3>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
            Unpublished Assessments
          </p>
          <h3 className="text-xl font-bold text-gray-900 leading-none">
            {assessments?.filter((a) => !a.is_marks_published).length || 0}
          </h3>
        </div>
      </div>
    </div>
  );
}
