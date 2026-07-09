'use client';
import { useEffect, useState } from 'react';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useStudentCourse } from '@/hooks/useStudentCourse';
import AssessmentTable from '../../ui/AssessmentTable';
import { AssessmentAnalyticsDBObject } from '@/lib/types/analytics';
import StudentAssessmentAnalytics from './StudentAssessmentAnalytics';
import GetColumns from './columns';

export default function StudentCourseView() {
  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const studentData = useCourseDetailStore((s) => s.studentData);
  const { fetchStudentCourseData, loading, error } = useStudentCourse();
  const [selectedAnalytics, setSelectedAnalytics] = useState<AssessmentAnalyticsDBObject | null>(
    null
  );

  useEffect(() => {
    if (currentCourse?.id) {
      fetchStudentCourseData(currentCourse.id).catch(() => {});
    }
  }, [currentCourse?.id, fetchStudentCourseData]);

  if (!currentCourse) return null;

  const handleShowDetails = (assessmentId: number) => {
    const analytics = studentData?.analytics?.find((a) => a.assessment_id === assessmentId);
    if (analytics) {
      setSelectedAnalytics(analytics);
    }
  };

  const columns = GetColumns(handleShowDetails);

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-48px)] overflow-y-auto">
      <h4 className="text-md md:text-2xl font-semibold">{currentCourse.name}</h4>

      {loading && (
        <div className="text-center py-8 text-gray-600 animate-pulse">Loading assessments...</div>
      )}

      {error && <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg">{error}</div>}

      {!loading && !error && (
        <>
          {studentData?.totalMarks && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Total Marks
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {studentData.totalMarks.total_marks.toFixed(2)}
                </h3>
              </div>
            </div>
          )}
          <AssessmentTable
            columns={columns}
            data={studentData?.marks || []}
            emptyMessage="No assessments found."
          />
        </>
      )}

      {/* Analytics Modal */}
      {selectedAnalytics && (
        <StudentAssessmentAnalytics
          selectedAnalytics={selectedAnalytics}
          setSelectedAnalytics={setSelectedAnalytics}
        />
      )}
    </div>
  );
}
