import { apiClient } from './client';
import { handleRequest } from './utils';
import { SignUpRequest, ChangePasswordRequest, ForgotPasswordRequest, FeedBackSubmitRequest } from '@/lib/types/auth';

export const Authapi = {
  login: async (username: number, password: string) => {
    return handleRequest(
      apiClient.post('/auth/login', null, {
        auth: { username: String(username), password },
      })
    );
  },

  signup: async (userData: SignUpRequest) => {
    return handleRequest(apiClient.post('/auth/signup', userData));
  },

  logout: async () => {
    return handleRequest(apiClient.post('/auth/logout'));
  },

  changePassword: async (data: ChangePasswordRequest) => {
    return handleRequest(apiClient.post('/auth/change-password', data));
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    return handleRequest(apiClient.post('/auth/forgot-password', data));
  },

  feedBack: async (data: FeedBackSubmitRequest) => {
    return handleRequest(apiClient.post('/auth/feedback', data));
  },
};
