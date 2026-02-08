import React, { useState } from 'react';
import { AssessmentDBObject } from '@/lib/types/assessments';
import { useTACourse } from '@/hooks/useTACourse';
import { BiEdit, BiHide, BiShow, BiSpreadsheet } from 'react-icons/bi';
import { getAssessmentTypeLabel } from '@/lib/utils/assessmentlabel';
import { formatDate, handlePublishToggle } from '@/services/grades';

interface AssessmentCardProps {
  assessment: AssessmentDBObject;
  isInstructor: boolean;
  onClick?: () => void;
  onPublishToggle?: () => void;
  onEnterMarks?: () => void;
  onEdit?: () => void;
}

export default function AssessmentCard({
  assessment,
  isInstructor,
  onClick,
  onPublishToggle,
  onEnterMarks: onEnterMarks,
  onEdit,
}: AssessmentCardProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { PublishMarks, UnpublishMarks } = useTACourse();

  const formattedDate = formatDate(assessment.assessment_date);

  return (
    <div onClick={onClick} className="flex flex-col border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="px-6 py-5 grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={assessment.name}>
            {assessment.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Max: {assessment.max_marks}
          </span>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          <span>{getAssessmentTypeLabel(assessment.assessment_type_id)}</span> • Created on{' '}
          {formattedDate}
        </div>

        <div
          className={`text-xs px-3 py-2 rounded-lg flex w-fit items-center gap-2 ${
            assessment.is_marks_published
              ? 'bg-green-50 text-green-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {assessment.is_marks_published ? (
            <>
              <BiShow className="text-lg" /> Marks are visible to students
            </>
          ) : (
            <>
              <BiHide className="text-lg" /> Marks are hidden from students
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between gap-3">
        {isInstructor && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Edit Details"
          >
            <BiEdit className="text-xl" />
          </button>
        )}
        

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePublishToggle(e, assessment, setIsPublishing, UnpublishMarks, PublishMarks, onPublishToggle);
            }}
            disabled={isPublishing}
            className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              assessment.is_marks_published
                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-100'
                : 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
            title={
              assessment.is_marks_published ? 'Hide marks from students' : 'Show marks to students'
            }
          >
            {isPublishing ? '...' : assessment.is_marks_published ? 'Hide Marks' : 'Publish Marks'}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnterMarks?.();
            }}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <BiSpreadsheet className="text-lg" />
            Enter Marks
          </button>
        </div>
      </div>
    </div>
  );
}
