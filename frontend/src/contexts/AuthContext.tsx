import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { AuthUser } from '../hooks/useAuth';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
    refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Function to fetch current user from backend
const fetchCurrentUser = async (): Promise<AuthUser | null> => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
            withCredentials: true,
        });
        return response.data;
    } catch (error: any) {
        // If token is invalid or expired, return null
        if (error.response?.status === 401) {
            return null;
        }
        throw error;
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
        refetch: refetchUser,
    } = useQuery({
        queryKey: ['user'],
        queryFn: fetchCurrentUser,
        retry: false, // Don't retry on 401 errors
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const logout = () => {
        // Clear user data from cache
        queryClient.setQueryData(['user'], null);
        queryClient.removeQueries({ queryKey: ['user'] });
        queryClient.clear();
    };

    const value: AuthContextType = {
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refetchUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};