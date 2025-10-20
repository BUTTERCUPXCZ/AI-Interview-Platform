import React, { createContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { AuthUser } from '../hooks/useAuth';
import api from '@/api/api';
import { getClientTokenCookie } from '@/api/api';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
    refetchUser: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to fetch current user from backend
const fetchCurrentUser = async (): Promise<AuthUser | null> => {
    try {
        console.log('Fetching current user...');
        const response = await api.get(`/auth/me`);
        console.log('User fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        // If token is invalid or expired, return null
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.log('User not authenticated (401)');
            return null;
        }
        // For other errors, also return null to avoid infinite retries
        console.error('Error fetching current user:', error);
        return null;
    }
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const queryClient = useQueryClient();

    // Use React Query to manage user state
    const {
        data: user,
        isLoading,
        isFetching,
        refetch: refetchUser,
    } = useQuery({
        queryKey: ['user'],
        queryFn: fetchCurrentUser,
        retry: false, // Don't retry on 401 errors
        staleTime: 1000 * 60 * 5, // 5 minutes - how long data is considered fresh
        gcTime: 1000 * 60 * 10, // 10 minutes - how long inactive data stays in cache
        refetchOnMount: true, // Always refetch when component mounts
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnReconnect: true, // Refetch when reconnecting
    });

    const logout = () => {
        // Clear user data from cache
        queryClient.setQueryData(['user'], null);
        queryClient.removeQueries({ queryKey: ['user'] });
        queryClient.clear();
    };

    const value: AuthContextType = {
        user: user || null,
        // Consider both initial loading and background fetching as loading. If a client-side
        // token cookie exists we consider the user *optimistically* authenticated while
        // the `/auth/me` request validates it. This avoids instant redirect to login on reload.
        isLoading: isLoading || isFetching,
        isAuthenticated: !!user || !!getClientTokenCookie(),
        logout,
        refetchUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};