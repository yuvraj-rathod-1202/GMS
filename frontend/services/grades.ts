import { AssessmentDBObject } from '@/lib/types/assessments';

export const handlePublishToggle = async (
  e: React.MouseEvent,
  assessment: AssessmentDBObject,
  setIsPublishing: React.Dispatch<React.SetStateAction<boolean>>,
  UnpublishMarks: (courseId: number, assessmentId: number) => Promise<unknown>,
  PublishMarks: (courseId: number, assessmentId: number) => Promise<unknown>,
  onPublishToggle?: () => void
) => {
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

export const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
