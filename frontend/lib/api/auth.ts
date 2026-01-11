import { apiClient } from "./client";
import {SignUpRequest, ChangePasswordRequest, ForgotPasswordRequest} from '@/lib/types/auth';

export const Authapi = {
    login: async (username: number, password: string) => {
        const response = await apiClient.post('/auth/login', null, {
            auth: {username: String(username), password}
        });
        return response.data;
    },

    signup: async (userData: SignUpRequest) => {
        const responses = await apiClient.post('/auth/signup', userData);
        return responses.data;
    },

    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },

    changePassword: async (data: ChangePasswordRequest) => {
        const response = await apiClient.post('/auth/change-password', data);
        return response.data;
    },

    forgotPassword: async (data: ForgotPasswordRequest) => {
        const response = await apiClient.post('/auth/forgot-password', data);
        return response.data;
    }
}