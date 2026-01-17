import { apiClient } from "./client";
import { handleRequest } from "./utils";
import {CreatePolicyRequest, UpdatePolicyRequest, UpdatePolicyComponentsRequest, AssignPolicyRequest, AddPolicyComponentsRequest} from '@/lib/types/policy';

export const PolicyApi = {
    CreatePolicy: async (courseId: number, policyData: CreatePolicyRequest) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/policy`, policyData)
        );
    },

    GetAllPolicy: async (courseId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/policy`)
        );
    },

    GetPolicyById: async (courseId: number, policyId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/policy/${policyId}`)
        );
    },

    DeletePolicy: async (courseId: number, policyId: number) => {
        return handleRequest(
            apiClient.delete(`/courses/${courseId}/policy/${policyId}`)
        );
    },

    UpdatePolicy: async (courseId: number, data: UpdatePolicyRequest) => {
        return handleRequest(
            apiClient.put(`/courses/${courseId}/policy`, data)
        );
    },

    DeletePolicyComponent: async (courseId: number, policyId: number, componentId: number) => {
        return handleRequest(
            apiClient.delete(`/courses/${courseId}/policy/${policyId}/components/${componentId}`)
        );
    },

    AddPolicyComponents: async (courseId: number, policyId: number, data: AddPolicyComponentsRequest) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/policy/${policyId}/components`, data)
        );
    },

    UpdatePolicyComponents: async (courseId: number, policyId: number, componentId: number, data: UpdatePolicyComponentsRequest) => {
        return handleRequest(
            apiClient.put(`/courses/${courseId}/policy/${policyId}/components/${componentId}`, data)
        );
    },

    AssignPolicyToStudent: async (courseId: number, data: AssignPolicyRequest) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/policy-assignments`, data)
        );
    },

    GetPolicyAssignments: async (courseId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/policy-assignments`)
        );
    },

    SetDefaultPolicy: async (courseId: number, policyId: number) => {
        return handleRequest(
            apiClient.put(`/courses/${courseId}/policy/${policyId}/default`)
        );
    },

    RecalculateTotal: async (courseId: number) => {
        return handleRequest(
            apiClient.post(`/courses/${courseId}/policy/recalculate`)
        );
    },

    GetTotalOfAllStudents: async (courseId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/total`)
        );
    },

    GetTotalByStudentId: async (courseId: number, studentId: number) => {
        return handleRequest(
            apiClient.get(`/courses/${courseId}/total/${studentId}`)
        );
    }
}