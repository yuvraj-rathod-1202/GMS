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

export interface User {
    id: number;
    email: string;
    last_login: Date | null;
};

export interface AuthState {
    user: User | null;
    token: string | null;
    setAuth : (user: User, token: string) => void;
    logout: () => void;
}