'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import TANavbar from '@/components/Course/TANavbar';
import AssessmentCard from '@/components/Grade/Cards/AssessmentCard';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import OverviewCard from './Cards/OverviewCard';
import AssessmentDialog, { AssessmentFormData } from './Dialogs/AssessmentDialog';
import { MarksApi } from '@/lib/api/marks';
import { AssessmentDBObject } from '@/lib/types/assessments';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function TAGradePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const router = useRouter();

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['ta'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const taData = useCourseDetailStore((s) => s.taData);
  const { loading: managementLoading, fetchAllAssessments } = useCourseManagement(role || 'ta');

  // Fetch assessments and course roles when TA role is confirmed
  useEffect(() => {
    if (!isLoading && hasAccess && !isFetchingData) {
      const fetchData = async () => {
        setIsFetchingData(true);
        try {
          await fetchAllAssessments(courseId);
        } catch (error) {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Error fetching TA data:', error);
          }
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchData();
    }
  }, [role, isLoading, courseId]);

  if (isLoading || !currentCourse || !role) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="text-gray-900 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (role !== 'ta') {
    return null;
  }

  const isLoadingData = managementLoading || isFetchingData;

  // Feature flags for TA management (course-scoped)
  const { isFeatureEnabled } = useFeatureFlags(courseId);
  const canEditAssessment = isFeatureEnabled('course.ta_assessment_management');
  const canCreateAssessment = canEditAssessment;
  const canViewAnalytics = isFeatureEnabled('course.ta_analytics_visibility');

  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentDBObject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnEnterMarks = (assessmentId: number) => {
    router.push(`/c/${courseId}/g/assessment/${assessmentId}`);
  };

  const handlePublishToggle = async () => {
    // Refresh assessments after publish/unpublish
    try {
      await fetchAllAssessments(courseId, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error refreshing assessments:', error);
      }
    }
  };

  const handleCreateAssessment = () => {
    setEditingAssessment(null);
    setShowAssessmentDialog(true);
  };

  const handleEditAssessment = (assessment: AssessmentDBObject) => {
    setEditingAssessment(assessment);
    setShowAssessmentDialog(true);
  };

  const handleSubmitAssessment = async (data: AssessmentFormData) => {
    setIsSubmitting(true);
    try {
      const assessmentData = {
        ...data,
        assessment_date: new Date(data.assessment_date),
      };

      if (editingAssessment) {
        await MarksApi.UpdateAssessment(courseId, editingAssessment.id, assessmentData);
      } else {
        await MarksApi.CreateAssessment(courseId, assessmentData);
      }

      await fetchAllAssessments(courseId, true);
      setShowAssessmentDialog(false);
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error submitting assessment:', error);
      }
      alert('Failed to save assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <TANavbar />
      <div className="max-h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-6 md:space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Grades</h1>
              <p className="text-gray-500 mt-1">View assessments and manage student marks.</p>
            </div>
            <div className="flex gap-3">
              {canViewAnalytics && (
                <Link href={`/c/${courseId}/a`}>
                  <button
                    title="View Detailed Analytics"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    View Analytics
                  </button>
                </Link>
              )}
              {canCreateAssessment && (
                <button
                  onClick={handleCreateAssessment}
                  title="Create Assessment"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium transition-colors shadow-sm"
                >
                  + Create Assessment
                </button>
              )}
            </div>
          </div>

          {canViewAnalytics && (
            <OverviewCard currentCourse={currentCourse} assessments={taData?.assessments || null} />
          )}

          {/* Assessments Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Assessments</h2>

            {isLoadingData ? (
              <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                Loading assessments...
              </div>
            ) : !taData?.assessments || taData.assessments.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <h3 className="font-medium text-gray-900">No assessments found</h3>
                <p className="text-gray-500 text-sm mt-1">
                  The instructor hasn't created any assessments for this course yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {taData.assessments.map((assessment: any) => (
                  <AssessmentCard
                    key={assessment.id}
                    isInstructor={false}
                    canManage={canEditAssessment}
                    onClick={() => handleOnEnterMarks(assessment.id)}
                    assessment={assessment}
                    onPublishToggle={() => handlePublishToggle()}
                    onEnterMarks={() => {
                      handleOnEnterMarks(assessment.id);
                    }}
                    onEdit={() => handleEditAssessment(assessment)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Dialog for TA create/edit (if allowed) */}
      {canEditAssessment && (
        <AssessmentDialog
          isOpen={showAssessmentDialog}
          onClose={() => setShowAssessmentDialog(false)}
          onSubmit={handleSubmitAssessment}
          assessment={editingAssessment}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
