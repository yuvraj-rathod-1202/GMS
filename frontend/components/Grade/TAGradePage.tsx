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
import Button from '../ui/Button';
import { BiPlus, BiSpreadsheet } from 'react-icons/bi';

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

  const handleDeleteAssessment = async () => {
    if (!editingAssessment) return;

    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await MarksApi.DeleteAssessment(courseId, editingAssessment.id);
      await fetchAllAssessments(courseId, true);
      setShowAssessmentDialog(false);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error deleting assessment:', error);
      }
      alert('Failed to delete assessment');
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="flex items-center gap-3">
              <Link href={`/c/${courseId}/gb`}>
                <Button
                  variant="secondary"
                  size="sm"
                  title="View Master Gradebook"
                  className="flex items-center gap-2"
                >
                  <BiSpreadsheet className="text-lg" />
                  View Master Gradebook
                </Button>
              </Link>
              {canViewAnalytics && (
                <Link href={`/c/${courseId}/a`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    title="View Detailed Analytics"
                    className="flex items-center gap-2"
                  >
                    View Analytics
                  </Button>
                </Link>
              )}
              {canCreateAssessment && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateAssessment}
                  title="Create Assessment"
                  className="bg-black hover:bg-gray-800 text-white flex items-center gap-2"
                >
                  <BiPlus className="text-lg" />
                  Create Assessment
                </Button>
              )}
            </div>
          </div>

          {canViewAnalytics && (
            <OverviewCard currentCourse={currentCourse} assessments={taData?.assessments || null} />
          )}

          {/* Assessments Section */}
          <div>         

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
                    assessment={assessment}
                    onPublishToggle={() => handlePublishToggle()}
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
          onDelete={handleDeleteAssessment}
          assessment={editingAssessment}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
