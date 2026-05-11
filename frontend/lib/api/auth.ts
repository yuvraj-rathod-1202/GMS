import { apiClient } from './client';
import { handleRequest } from './utils';
import {
  SignUpRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  FeedBackSubmitRequest,
  InstructorResetPasswordRequest,
} from '@/lib/types/auth';

export const Authapi = {
  login: async (username: number, password: string) => {
    return handleRequest(
      apiClient.post('/auth/login', null, {
        auth: { username: String(username), password },
      })
    );
  },
  
  googleLogin: async (token: string) => {
    return handleRequest(apiClient.post('/auth/google-login', { token }));
  },

  signup: async (userData: SignUpRequest) => {
    return handleRequest(apiClient.post('/auth/signup', userData));
  },

  logout: async () => {
    return handleRequest(apiClient.post('/auth/logout'));
  },

  /*changePassword: async (data: ChangePasswordRequest) => {
    return handleRequest(apiClient.post('/auth/change-password', data));
  },
  */

  forgotPassword: async (data: ForgotPasswordRequest) => {
    return handleRequest(apiClient.post('/auth/forgot-password', data));
  },

  feedBack: async (data: FeedBackSubmitRequest) => {
    return handleRequest(apiClient.post('/auth/feedback', data));
  },

  instructorResetPassword: async (data: InstructorResetPasswordRequest) => {
    return handleRequest(apiClient.post('/auth/instructor/reset-password', data));
  },
};
