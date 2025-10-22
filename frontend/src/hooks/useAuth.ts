    import { useMutation, useQueryClient } from '@tanstack/react-query';
    import { userlogin, userRegister, userlogout } from '../api/auth';
    import { setClientTokenCookie } from '../api/api';
    import axios from 'axios';

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
        token?: string;
    }

    // Login hook
    export const useLogin = () => {
        const queryClient = useQueryClient();

        return useMutation({
            mutationFn: ({ email, password }: LoginCredentials) => userlogin(email, password),
            onSuccess: (data: AuthResponse) => {
                // Update the user cache
                queryClient.setQueryData(['user'], data.user);

                // Persist a client-side token cookie (in addition to server httpOnly cookie)
                // so that reloads from a different origin can still attach an Authorization header.
                if (data) {
                    const token = (data as AuthResponse).token;
                    if (typeof token === 'string') setClientTokenCookie(token);
                }

                console.log('Login successful:', data.message);
            },
            onError: (error) => {
                // Handle different types of errors
                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.message || error.message || 'Login failed'
                    : 'Login failed';
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
            onError: (error) => {
                // Handle different types of errors
                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.message || error.message || 'Registration failed'
                    : 'Registration failed';
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

                // Clear client-side token cookie as well
                setClientTokenCookie(null);

                console.log('Logout successful:', data.message);
            },
            onError: (error) => {
                // Even if logout fails on server, clear local state
                queryClient.setQueryData(['user'], null);
                queryClient.clear();

                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.message || error.message || 'Logout failed'
                    : 'Logout failed';
                console.error('Logout error:', errorMessage);
            },
        });
    };