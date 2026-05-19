import { apiClient } from './client';
import { handleRequest } from './utils';

export const FlagsApi = {
  ListDefinitions: async () => {
    return handleRequest(apiClient.get('/admin/flags/definitions'));
  },

  CreateDefinition: async (data: any) => {
    return handleRequest(apiClient.post('/admin/flags/definitions', data));
  },

  UpdateDefinition: async (id: number, data: any) => {
    return handleRequest(apiClient.put(`/admin/flags/definitions/${id}`, data));
  },

  DeleteDefinition: async (id: number) => {
    return handleRequest(apiClient.delete(`/admin/flags/definitions/${id}`));
  },

  GetCourseFlags: async (courseId: string | number) => {
    return handleRequest(apiClient.get(`/course/${courseId}/flags`));
  },

  SetCourseOverride: async (
    courseId: string | number,
    flagName: string,
    data: { enabled: boolean; config?: any }
  ) => {
    return handleRequest(apiClient.post(`/course/${courseId}/flags/${flagName}/override`, data));
  },

  CreateCourseFlag: async (courseId: string | number, data: any) => {
    return handleRequest(apiClient.post(`/course/${courseId}/flags`, data));
  },

  GetActiveFlags: async (courseId?: string | number | null) => {
    const url = courseId ? `/api/flags?course_id=${courseId}` : '/api/flags';
    return handleRequest(apiClient.get(url));
  },
};
