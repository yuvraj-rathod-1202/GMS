import React, { useState } from 'react';
import { AssessmentDBObject } from '@/lib/types/assessments';
import Link from 'next/link';
import { useTACourse } from '@/hooks/useTACourse';

interface AssessmentCardProps {
  assessment: AssessmentDBObject;
  onClick?: () => void;
  onPublishToggle?: () => void;
  onEdit?: () => void;
}

const getAssessmentTypeLabel = (typeId: number): string => {
  const types: { [key: number]: string } = {
    1: 'Quiz',
    2: 'Assignment',
    3: 'Midsem',
    4: 'EndSem',
    5: 'Project',
    6: 'Attendance',
    7: 'Lab',
  };
  return types[typeId] || `Type ${typeId}`;
};

export default function InstructorAssessmentCard({
  assessment,
  onClick,
  onPublishToggle,
  onEdit,
}: AssessmentCardProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { PublishMarks, UnpublishMarks } = useTACourse();

  const formattedDate = new Date(assessment.assessment_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handlePublishToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const action = assessment.is_marks_published ? 'unpublish' : 'publish';
    const message = assessment.is_marks_published
      ? `Are you sure you want to unpublish marks for "${assessment.name}"? Students will no longer be able to view their marks.`
      : `Are you sure you want to publish marks for "${assessment.name}"? Students will be able to view their marks.`;

    const confirmed = window.confirm(message);

    if (!confirmed) {
      return;
    }

    setIsPublishing(true);

    try {
      if (assessment.is_marks_published) {
        await UnpublishMarks(assessment.course_id, assessment.id);
      } else {
        await PublishMarks(assessment.course_id, assessment.id);
      }
      onPublishToggle?.();
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Error toggling publish status:', error);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`border border-gray-300 rounded-2xl bg-white overflow-hidden transition-all duration-200 ${
        onClick ? 'hover:border-gray-400' : ''
      }`}
    >
      {/* Header Section */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-row justify-between items-center bg-gray-50 border-b border-gray-300">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
          {assessment.name}
        </h3>
        <div className="flex flex-row gap-2 items-center">
          <div>
            <button
              onClick={handlePublishToggle}
              disabled={isPublishing}
              className={`rounded-lg cursor-pointer bg-gray-300 px-3 py-1 text-xs sm:text-sm font-medium text-black hover:bg-mms-blueDark transition-colors ${
                assessment.is_marks_published
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPublishing
                ? 'Processing...'
                : assessment.is_marks_published
                  ? 'Unpublish Marks'
                  : 'Publish Marks'}
            </button>
          </div>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1 rounded-lg cursor-pointer bg-white border border-gray-300 px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 sm:px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500">Type</span>
          <span className="text-xs sm:text-sm font-medium text-gray-900">
            {getAssessmentTypeLabel(assessment.assessment_type_id)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500">Date</span>
          <span className="text-xs sm:text-sm font-medium text-gray-900">{formattedDate}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500">Max Marks</span>
          <span className="text-base sm:text-lg font-bold text-gray-900">
            {assessment.max_marks}
          </span>
        </div>

        {assessment.is_marks_published && (
          <div className="flex pt-2 border-t border-gray-300">
            <span className="text-xs text-black flex flex-row gap-1 font-medium">
              <p className="text-mms-greenLight font-bold">✓</p> Marks Published
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
