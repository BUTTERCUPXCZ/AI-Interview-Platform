import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userlogin, userRegister, userlogout } from '../api/auth';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    Firstname: string;
    Lastname: string;
    email: string;
    password: string;
}

export interface AuthUser {
    id: number;
    Firstname: string;
    Lastname: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    message: string;
    user: AuthUser;
}

// Login hook
export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ email, password }: LoginCredentials) => userlogin(email, password),
        onSuccess: (data: AuthResponse) => {
            // Update the user cache
            queryClient.setQueryData(['user'], data.user);

            console.log('Login successful:', data.message);
        },
        onError: (error: any) => {
            // Handle different types of errors
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            console.error('Login error:', errorMessage);
        },
    });
};

// Register hook
export const useRegister = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ Firstname, Lastname, email, password }: RegisterCredentials) =>
            userRegister(Firstname, Lastname, email, password),
        onSuccess: (data: AuthResponse) => {
            // Update the user cache
            queryClient.setQueryData(['user'], data.user);

            console.log('Registration successful:', data.message);
        },
        onError: (error: any) => {
            // Handle different types of errors
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
            console.error('Registration error:', errorMessage);
        },
    });
};

// Logout hook
export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userlogout,
        onSuccess: (data) => {
            // Clear user cache
            queryClient.setQueryData(['user'], null);
            queryClient.removeQueries({ queryKey: ['user'] });

            // Clear all cached data that might be user-specific
            queryClient.clear();

            console.log('Logout successful:', data.message);
        },
        onError: (error: any) => {
            // Even if logout fails on server, clear local state
            queryClient.setQueryData(['user'], null);
            queryClient.clear();

            const errorMessage = error.response?.data?.message || error.message || 'Logout failed';
            console.error('Logout error:', errorMessage);
        },
    });
};