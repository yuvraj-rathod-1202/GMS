import { apiClient } from './client';
import { handleRequest } from './utils';
import {
  AddCourseRequest,
  UpdateCourseRequest,
  EnrollInstructorRequest,
  EnrollStudentRequest,
  EnrollTaRequest,
  AddTARequest,
} from '@/lib/types/courses';

export const CoursesApi = {
  CreateCourse: async (CourseData: AddCourseRequest) => {
    return handleRequest(apiClient.post('/courses/', CourseData));
  },

  GetAllCourse: async () => {
    return handleRequest(apiClient.get('/courses'));
  },

  GetCourseById: async (courseId: number) => {
    return handleRequest(apiClient.get(`/courses/${courseId}`));
  },

  UpdateCourse: async (data: UpdateCourseRequest, courseId: number) => {
    return handleRequest(apiClient.put(`/courses/${courseId}`, data));
  },

  DeleteCourse: async (courseId: number) => {
    return handleRequest(apiClient.delete(`/courses/${courseId}`));
  },

  GetCourseRoles: async (courseId: number, role: 'student' | 'ta' | 'instructor') => {
    return handleRequest(apiClient.get(`/courses/${courseId}/roles/${role}`));
  },

  EnrollStudent: async (courseId: number, EnrollStudentData: EnrollStudentRequest) => {
    return handleRequest(apiClient.post(`/courses/${courseId}/enroll`, EnrollStudentData));
  },

  BulkEnrollStudents: async (courseId: number, EnrollStudentData: EnrollStudentRequest[]) => {
    return handleRequest(apiClient.post(`/courses/${courseId}/enroll/bulk`, EnrollStudentData));
  },

  UnEnrollStudent: async (courseId: number, studentId: number) => {
    return handleRequest(apiClient.delete(`/courses/${courseId}/enroll?student_id=${studentId}`));
  },

  AddTa: async (courseId: number, EnrollTaData: EnrollTaRequest) => {
    return handleRequest(apiClient.post(`/courses/${courseId}/tas`, EnrollTaData));
  },

  RemoveTa: async (courseId: number, taId: number) => {
    return handleRequest(apiClient.delete(`/courses/${courseId}/tas?ta_id=${taId}`));
  },

  AddInstructor: async (courseId: number, EnrollInstructorData: EnrollInstructorRequest) => {
    return handleRequest(apiClient.post(`/courses/${courseId}/instructors`, EnrollInstructorData));
  },

  RemoveInstructor: async (courseId: number, instructorId: number) => {
    return handleRequest(
      apiClient.delete(`/courses/${courseId}/instructors`, {
        data: { instructor_id: instructorId },
      })
    );
  },

  FetchMyCourses: async () => {
    return handleRequest(apiClient.get('/courses/users/me/courses'));
  },
};
