import { apiClient } from './client';
import { handleRequest } from './utils';

export const AnalyticsApi = {
  GetCourseAnalytics: async (courseId: number) => {
    return handleRequest(apiClient.get(`/courses/${courseId}/analytics/overview`));
  },

  GetAssessmentAnalytics: async (courseId: number, assessmentId: number) => {
    return handleRequest(
      apiClient.get(`/courses/${courseId}/assessments/${assessmentId}/analytics`)
    );
  },

  GetAssessmentFrequencies: async (courseId: number, assessmentId: number) => {
    return handleRequest(
      apiClient.get(`/courses/${courseId}/assessments/${assessmentId}/frequencies`)
    );
  },

  GetSystemOverview: async () => {
    return handleRequest(apiClient.get(`/analytics/system/overview`));
  },
};
