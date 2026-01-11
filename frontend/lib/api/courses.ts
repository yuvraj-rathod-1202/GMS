import { apiClient } from "./client";
import { handleRequest } from "./utils";
import {AddCourseRequest, UpdateCourseRequest} from "@/lib/types/courses";
import {CreateAssessmentRequest} from "@/lib/types/assessments";

export const CoursesApi = {
    CreateCourse: async (CourseData: AddCourseRequest) => {
        return handleRequest(
            apiClient.post('/courses/', CourseData)
        );
    },

    GetAllCourse: async () => {
        return handleRequest(
            apiClient.get('/courses')
        );
    },

    GetCourseById: async (courseId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}`)
        );
    },

    UpdateCourse: async (data: UpdateCourseRequest, courseId: number) => {
        return handleRequest(
            apiClient.put(`/courses/${courseId}`, data)
        )
    },

    DeleteCourse: async (courseId: number) => {
        return handleRequest(
            apiClient.delete(`/courses/${courseId}`)
        )
    },

    GetCourseRoles: async (courseId: number, role: 'student' | 'ta' | 'instructor') => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/roles/${role}`)
        )
    },

    EnrollStudent: async (courseId: number, studentId: number) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/enroll`, { student_id: studentId })
        )
    },

    UnEnrollStudent: async (courseId: number, studentId: number) => {
        return handleRequest(
            apiClient.delete(`/courses/${courseId}/enroll`, { data: { student_id: studentId } })
        )
    },

    AddTa: async (courseId: number, taId: number) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/tas`, { "ta_id": taId })
        )
    },

    RemoveTa: async (courseId: number, taId: number) => {
        return handleRequest(
            apiClient.delete(`/courses/${courseId}/tas`, { data: { "ta_id": taId } })
        )
    },

    AddInstructor: async (courseId: number, instructorId: number) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/instructors`, { "instructor_id": instructorId })
        )
    },

    RemoveInstructor: async (courseId: number, instructorId: number) => {
        return handleRequest(
            apiClient.delete(`/courses/${courseId}/instructors`, { data: { "instructor_id": instructorId } })
        )
    },

    CreateAssessment: async (courseId: number, AssessmentData: CreateAssessmentRequest) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/assessments`, AssessmentData)
        );
    },

    GetAllAssessments: async (courseId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/assessments`)
        );
    },

    GetStudentMarks: async (courseId: number, studentId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/marks/${studentId}`)
        );
    }
}