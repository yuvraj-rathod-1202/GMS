export interface SignUpRequest {
    id: number;
    email: string;
    password: string;
};

export interface ChangePasswordRequest {
    id: number;
    old_password: string;
    new_password: string;
};

export interface ForgotPasswordRequest {
    id: number;
};