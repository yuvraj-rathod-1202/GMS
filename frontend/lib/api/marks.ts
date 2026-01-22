import { apiClient } from './client';
import { handleRequest } from './utils';
import { CreateAssessmentRequest, UpdateAssessmentRequest } from '@/lib/types/assessments';
import { AddMarksRequest } from '@/lib/types/marks';

export const MarksApi = {
  CreateAssessment: async (courseId: number, AssessmentData: CreateAssessmentRequest) => {
    return handleRequest(apiClient.post(`/courses/${courseId}/assessments`, AssessmentData));
  },

  GetAllAssessments: async (courseId: number) => {
    return handleRequest(apiClient.get(`/courses/${courseId}/assessments`));
  },

  GetAssessmentById: async (courseId: number, assessmentId: number) => {
    return handleRequest(apiClient.get(`/assessments/${courseId}/${assessmentId}`));
  },

  UpdateAssessment: async (
    courseId: number,
    assessmentId: number,
    data: UpdateAssessmentRequest
  ) => {
    return handleRequest(apiClient.put(`/assessments/${courseId}/${assessmentId}`, data));
  },

  DeleteAssessment: async (courseId: number, assessmentId: number) => {
    return handleRequest(apiClient.delete(`/assessments/${courseId}/${assessmentId}`));
  },

  AddMarks: async (courseId: number, assessmentId: number, MarksData: AddMarksRequest) => {
    return handleRequest(
      apiClient.post(`/assessments/${courseId}/${assessmentId}/marks`, MarksData)
    );
  },

  GetAllMarks: async (courseId: number, assessmentId: number) => {
    return handleRequest(apiClient.get(`/assessments/${courseId}/${assessmentId}/marks`));
  },

  GetAllAssessmentMarks: async (courseId: number) => {
    return handleRequest(apiClient.get(`/courses/${courseId}/all/assessment/marks`));
  },

  GetMarksById: async (courseId: number, assessmentId: number, studentId: number) => {
    return handleRequest(
      apiClient.get(`/assessments/${courseId}/${assessmentId}/marks/${studentId}`)
    );
  },

  DeleteMarks: async (courseId: number, assessmentId: number, studentId: number) => {
    return handleRequest(
      apiClient.delete(`/assessments/${courseId}/${assessmentId}/marks/${studentId}`)
    );
  },

  PublishMarks: async (courseId: number, assessmentId: number) => {
    return handleRequest(apiClient.put(`/assessments/${courseId}/${assessmentId}/publish`));
  },

  UnpublishMarks: async (courseId: number, assessmentId: number) => {
    return handleRequest(apiClient.put(`/assessments/${courseId}/${assessmentId}/unpublish`));
  },

  GetStudentMarks: async (courseId: number, studentId: number) => {
    return handleRequest(apiClient.get(`/courses/${courseId}/marks/${studentId}`));
  },
};
