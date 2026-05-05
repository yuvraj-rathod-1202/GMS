import { handlePublishToggle, formatDate } from '../../services/grades';
import { AssessmentDBObject } from '@/lib/types/assessments';

describe('grades service', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-10-27');
      expect(formatDate(date)).toBe('Oct 27, 2023');
    });
  });

  describe('handlePublishToggle', () => {
    let mockEvent: any;
    let mockAssessment: AssessmentDBObject;
    let mockSetIsPublishing: jest.Mock;
    let mockUnpublishMarks: jest.Mock;
    let mockPublishMarks: jest.Mock;
    let mockOnPublishToggle: jest.Mock;

    beforeEach(() => {
      mockEvent = {
        stopPropagation: jest.fn(),
      };
      mockAssessment = {
        id: 1,
        course_id: 101,
        name: 'Test Assessment',
        is_marks_published: false,
        max_marks: 100,
        weightage: 20,
        assessment_type_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
      mockSetIsPublishing = jest.fn();
      mockUnpublishMarks = jest.fn().mockResolvedValue({});
      mockPublishMarks = jest.fn().mockResolvedValue({});
      mockOnPublishToggle = jest.fn();

      // Mock window.confirm
      window.confirm = jest.fn().mockReturnValue(true);
    });

    it('should stop event propagation', async () => {
      await handlePublishToggle(
        mockEvent,
        mockAssessment,
        mockSetIsPublishing,
        mockUnpublishMarks,
        mockPublishMarks
      );
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not proceed if not confirmed', async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      await handlePublishToggle(
        mockEvent,
        mockAssessment,
        mockSetIsPublishing,
        mockUnpublishMarks,
        mockPublishMarks
      );
      expect(mockSetIsPublishing).not.toHaveBeenCalled();
    });

    it('should call PublishMarks when not published', async () => {
      mockAssessment.is_marks_published = false;
      await handlePublishToggle(
        mockEvent,
        mockAssessment,
        mockSetIsPublishing,
        mockUnpublishMarks,
        mockPublishMarks,
        mockOnPublishToggle
      );

      expect(mockSetIsPublishing).toHaveBeenCalledWith(true);
      expect(mockPublishMarks).toHaveBeenCalledWith(mockAssessment.course_id, mockAssessment.id);
      expect(mockOnPublishToggle).toHaveBeenCalled();
      expect(mockSetIsPublishing).toHaveBeenCalledWith(false);
    });

    it('should call UnpublishMarks when already published', async () => {
      mockAssessment.is_marks_published = true;
      await handlePublishToggle(
        mockEvent,
        mockAssessment,
        mockSetIsPublishing,
        mockUnpublishMarks,
        mockPublishMarks,
        mockOnPublishToggle
      );

      expect(mockSetIsPublishing).toHaveBeenCalledWith(true);
      expect(mockUnpublishMarks).toHaveBeenCalledWith(mockAssessment.course_id, mockAssessment.id);
      expect(mockOnPublishToggle).toHaveBeenCalled();
      expect(mockSetIsPublishing).toHaveBeenCalledWith(false);
    });

    it('should handle errors gracefully', async () => {
      mockPublishMarks.mockRejectedValue(new Error('API Error'));
      console.error = jest.fn(); // Mock console.error to avoid cluttering output

      await handlePublishToggle(
        mockEvent,
        mockAssessment,
        mockSetIsPublishing,
        mockUnpublishMarks,
        mockPublishMarks
      );

      expect(mockSetIsPublishing).toHaveBeenCalledWith(false);
    });
  });
});
