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
  async FetchAllCourses(limit = 50, offset = 0) {
    return handleRequest(apiClient.get(`/courses/?limit=${limit}&offset=${offset}`));
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
  async RemoveInstructor(courseId: number, instructorId: number, userId: number) {
    return handleRequest(
      apiClient.delete(
        `/courses/${courseId}/instructors?user_id=${userId}&instructor_id=${instructorId}`
      )
    );
  },

  // --- Entity Management (Admin) ---

  // Fetch all users across the system
  async FetchAllUsers(limit = 50, offset = 0) {
    return handleRequest(apiClient.get(`/auth/users?limit=${limit}&offset=${offset}`));
  },

  // Fetch all enrollments
  async FetchAllEnrollments(limit = 50, offset = 0) {
    return handleRequest(apiClient.get(`/courses/enrollments/all?limit=${limit}&offset=${offset}`));
  },

  // Fetch all assessments across the system
  async FetchAllAssessments(limit = 50, offset = 0) {
    return handleRequest(apiClient.get(`/assessments/all?limit=${limit}&offset=${offset}`));
  },

  // Create a new assessment
  async CreateAssessment(courseId: number, data: any) {
    return handleRequest(apiClient.post(`/courses/${courseId}/assessments`, data));
  },

  // Update an existing assessment
  async UpdateAssessment(courseId: number, assessmentId: number, data: any) {
    return handleRequest(apiClient.put(`/assessments/${courseId}/${assessmentId}`, data));
  },

  async CreateEnrollment(courseId: number, studentId: number, role: string, email?: string) {
    let endpoint = `/courses/${courseId}/enroll`;
    if (role === 'ta') endpoint = `/courses/${courseId}/tas`;
    if (role === 'instructor') endpoint = `/courses/${courseId}/instructors`;

    const payload: any = {
      student_id: studentId,
      ta_id: studentId,
      instructor_id: studentId,
      email: email,
    };

    return handleRequest(apiClient.post(endpoint, payload));
  },

  // Delete an assessment
  async DeleteAssessment(courseId: number, assessmentId: number) {
    return handleRequest(apiClient.delete(`/assessments/${courseId}/${assessmentId}`));
  },

  // Unenroll a student
  async UnenrollStudent(courseId: number, studentId: number) {
    return handleRequest(apiClient.delete(`/courses/${courseId}/enroll?student_id=${studentId}`));
  },

  // Remove TA
  async RemoveTA(courseId: number, taId: number) {
    return handleRequest(apiClient.delete(`/courses/${courseId}/tas?ta_id=${taId}`));
  },

  // Generic Update (Work in progress)
  async UpdateEntity(entity: string, id: number | string, data: any) {
    return handleRequest(apiClient.put(`/admin/entities/${entity}/${id}`, data));
  },

  // Make a user an admin
  async MakeAdmin(userId: number) {
    return handleRequest(apiClient.post(`/admin/${userId}`));
  },

  // Remove admin status from a user
  async RemoveAdmin(userId: number) {
    return handleRequest(apiClient.delete(`/admin/${userId}`));
  },

  // Fetch all admin user IDs
  async FetchAllAdmins() {
    return handleRequest(apiClient.get('/admin/all'));
  },
};
