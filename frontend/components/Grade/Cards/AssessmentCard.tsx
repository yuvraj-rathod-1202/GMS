'use client';

import React, { useState } from 'react';
import { BiEdit, BiHide, BiShow, BiSpreadsheet } from 'react-icons/bi';
import { AssessmentDBObject } from '@/lib/types/assessments';
import { useTACourse } from '@/hooks/useTACourse';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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
  onEnterMarks,
  onEdit,
}: AssessmentCardProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { PublishMarks, UnpublishMarks } = useTACourse();

  const formattedDate = formatDate(assessment.assessment_date);

  return (
    <div
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className="grow px-6 py-5">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="line-clamp-1 text-lg font-bold text-gray-900" title={assessment.name}>
            {assessment.name}
          </h3>
          <Badge variant="default">Max: {assessment.max_marks}</Badge>
        </div>

        <div className="mb-4 text-sm text-gray-500">
          <span>{getAssessmentTypeLabel(assessment.assessment_type_id)}</span> • Created on {formattedDate}
        </div>

        <div
          className={`flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            assessment.is_marks_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
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

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 p-4">
        {isInstructor && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            title="Edit Details"
          >
            <BiEdit className="text-xl" />
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handlePublishToggle(
                event,
                assessment,
                setIsPublishing,
                UnpublishMarks,
                PublishMarks,
                onPublishToggle
              );
            }}
            disabled={isPublishing}
            variant={assessment.is_marks_published ? 'secondary' : 'primary'}
            className="px-3 py-2 text-xs"
            title={
              assessment.is_marks_published ? 'Hide marks from students' : 'Show marks to students'
            }
          >
            {isPublishing ? '...' : assessment.is_marks_published ? 'Hide Marks' : 'Publish Marks'}
          </Button>

          <Button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEnterMarks?.();
            }}
            className="flex items-center gap-2 bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-black sm:text-sm"
          >
            <BiSpreadsheet className="text-lg" />
            Enter Marks
          </Button>
        </div>
      </div>
    </div>
  );
}