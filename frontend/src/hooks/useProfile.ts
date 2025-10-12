import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/infrastructure/http-client';

export interface UserProfileData {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    experienceLevel: string;
    avatar?: string;
    phoneNumber?: string;
    location?: string;
    linkedinProfile?: string;
    githubProfile?: string;
    portfolioWebsite?: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    interviewReminders: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
    skillTags: string[];
    createdAt: Date;
    lastLoginAt?: Date;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    bio?: string;
    experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    phoneNumber?: string;
    location?: string;
    linkedinProfile?: string;
    githubProfile?: string;
    portfolioWebsite?: string;
    timezone?: string;
}

export interface UpdateNotificationRequest {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    interviewReminders?: boolean;
    weeklyReports?: boolean;
    marketingEmails?: boolean;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateSkillsRequest {
    skillTags: string[];
}

// Custom hook to fetch user profile
export const useUserProfile = (userId: number | undefined) => {
    return useQuery<UserProfileData>({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const data = await httpClient.get<UserProfileData>(`/profile/user/${userId}`);
            return data;
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

// Custom hook to update user profile
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, data }: { userId: number; data: UpdateProfileRequest }) => {
            return await httpClient.put(`/profile/user/${userId}`, data);
        },
        onSuccess: (_, { userId }) => {
            // Invalidate and refetch profile data
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            // Also invalidate dashboard data as it might include profile info
            queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
        },
    });
};

// Custom hook to update notification settings
export const useUpdateNotifications = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, data }: { userId: number; data: UpdateNotificationRequest }) => {
            return await httpClient.put(`/profile/user/${userId}/notifications`, data);
        },
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        },
    });
};

// Custom hook to change password
export const useChangePassword = () => {
    return useMutation({
        mutationFn: async ({ userId, data }: { userId: number; data: ChangePasswordRequest }) => {
            return await httpClient.put(`/profile/user/${userId}/password`, data);
        },
    });
};

// Custom hook to update user skills
export const useUpdateSkills = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, data }: { userId: number; data: UpdateSkillsRequest }) => {
            return await httpClient.put(`/profile/user/${userId}/skills`, data);
        },
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            // Also invalidate dashboard and progress data as they include skill info
            queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
            queryClient.invalidateQueries({ queryKey: ['progress', userId] });
        },
    });
};

// Custom hook to delete account
export const useDeleteAccount = () => {
    return useMutation({
        mutationFn: async (userId: number) => {
            return await httpClient.delete(`/profile/user/${userId}`);
        },
    });
};