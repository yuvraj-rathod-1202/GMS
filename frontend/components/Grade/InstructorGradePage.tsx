'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourseDetailStore } from '@/lib/store/courseDetail';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import InstructorNavbar from '../Course/InstructorNavbar';
import InstructorAssessmentCard from './InstructorAssessmentCard';
import AssessmentDialog, { AssessmentFormData } from './AssessmentDialog';
import { MarksApi } from '@/lib/api/marks';
import { AssessmentDBObject } from '@/lib/types/assessments';
import Link from 'next/link';
import { BiSpreadsheet } from 'react-icons/bi';

export default function InstructorGradePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentDBObject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { role, course, isLoading, hasAccess } = useRoleAccess({
    allowedRoles: ['instructor'],
    courseId,
  });

  const currentCourse = useCourseDetailStore((s) => s.currentCourse);
  const instructorData = useCourseDetailStore((s) => s.instructorData);
  const { loading: managementLoading, fetchAllAssessments } = useCourseManagement(
    role || 'instructor'
  );

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

  if (role !== 'instructor') {
    return null;
  }

  const isLoadingData = managementLoading || isFetchingData;

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

  const handleOnEnterMarks = () => {
    router.push(`/c/${courseId}/gb`);
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
        // Update existing assessment
        await MarksApi.UpdateAssessment(courseId, editingAssessment.id, assessmentData);
      } else {
        // Create new assessment
        await MarksApi.CreateAssessment(courseId, assessmentData);
      }

      // Refresh assessments list
      await fetchAllAssessments(courseId, true);
      setShowAssessmentDialog(false);
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      alert('Failed to save assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <InstructorNavbar />
      <div className="max-h-[calc(100vh-96px)] overflow-y-auto w-full md:max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-6 md:space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Grades & Assessments</h1>
              <p className="text-gray-500 mt-1">Create assessments and manage student results.</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/c/${courseId}/gb`}>
                <button
                  title="View Master Gradebook"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  <BiSpreadsheet /> View Master Gradebook
                </button>
              </Link>
              <button
                onClick={handleCreateAssessment}
                title="Create Assessment"
                className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium transition-colors shadow-sm"
              >
                + Create Assessment
              </button>
            </div>
          </div>

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
                  {instructorData?.assessments?.length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Published Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {instructorData?.assessments?.filter((a) => a.is_marks_published).length || 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-2xl bg-white p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-medium text-gray-500 tracking-wide mb-2">
                  Unpublished Assessments
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {instructorData?.assessments?.filter((a) => !a.is_marks_published).length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Assessments Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Assessments</h2>

            {isLoadingData ? (
              <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                Loading...
              </div>
            ) : !instructorData?.assessments?.length ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <h3 className="font-medium text-gray-900">No assessments yet</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">
                  Create your first quiz or exam to start grading.
                </p>
                <button
                  onClick={handleCreateAssessment}
                  className="text-gray-300 font-medium hover:underline"
                >
                  Create Assessment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {instructorData.assessments.map((assessment) => (
                  <InstructorAssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    onPublishToggle={handlePublishToggle}
                    onEdit={() => handleEditAssessment(assessment)}
                    onEnterMarks={() => handleOnEnterMarks()}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Dialog */}
      <AssessmentDialog
        isOpen={showAssessmentDialog}
        onClose={() => setShowAssessmentDialog(false)}
        onSubmit={handleSubmitAssessment}
        assessment={editingAssessment}
        isLoading={isSubmitting}
      />
    </div>
  );
}
