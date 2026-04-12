import { apiClient } from './client';
import { handleRequest } from './utils';
import { AddCourseRequest, UpdateCourseRequest } from '@/lib/types/courses';
import { SystemOverviewDBObject } from '@/lib/types/analytics';

export interface CreateCourseAdminRequest extends AddCourseRequest {
  user_id: number;
}

export interface UpdateCourseStatusRequest extends UpdateCourseRequest {
  user_id?: number;
}

export interface AssignInstructorRequest {
  user_id: number;
  instructor_id: number;
  email?: string;
}

export const AdminApi = {
  // Create a new course
  CreateCourse: async (courseData: CreateCourseAdminRequest) => {
    return handleRequest(apiClient.post('/courses/', courseData));
  },

  // Update course status (and other fields)
  UpdateCourseStatus: async (courseId: number, data: UpdateCourseStatusRequest) => {
    const { user_id, ...payload } = data;
    return handleRequest(apiClient.put(`/courses/${courseId}`, payload));
  },

  // Assign instructor to a course
  AssignInstructor: async (courseId: number, data: AssignInstructorRequest) => {
    return handleRequest(apiClient.post(`/courses/${courseId}/instructors`, data));
  },

  // Fetch all courses (admin view)
  FetchAllCourses: async () => {
    return handleRequest(apiClient.get('/courses/'));
  },

  // Fetch system-wide analytics
  FetchSystemAnalytics: async (): Promise<SystemOverviewDBObject> => {
    const response = await handleRequest(apiClient.get('/courses/system/overview'));
    return (response as any).overview;
  },

  // Delete a course
  DeleteCourse: async (courseId: number, userId: number) => {
    return handleRequest(apiClient.delete(`/courses/${courseId}`));
  },

  // Get instructors for a course
  GetCourseInstructors: async (courseId: number) => {
    return handleRequest(apiClient.get(`/courses/${courseId}/roles/instructor`));
  },

  // Remove instructor from a course
  RemoveInstructor: async (courseId: number, instructorId: number, userId: number) => {
    return handleRequest(
      apiClient.delete(`/courses/${courseId}/instructors?user_id=${userId}&instructor_id=${instructorId}`)
    );
  },
};
