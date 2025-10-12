import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/infrastructure/http-client';

export interface DashboardStats {
    averageScore: number;
    totalSessions: number;
    strongestSkill: string;
    improvementArea: string;
    completionRate: number;
    totalQuestionsAnswered: number;
}

export interface RecentSession {
    id: number;
    date: string;
    domain: string;
    score: number;
    duration: string;
    questions: number;
    status: string;
}

export interface SkillScore {
    [key: string]: number;
}

export interface RecommendedTopic {
    title: string;
    description: string;
    difficulty: string;
    estimatedTime: string;
    domain: string;
}

export interface UserProfile {
    name: string;
    email: string;
    experienceLevel: string;
    skillTags: string[];
    joinDate: string;
}

export interface DashboardData {
    profile: UserProfile;
    stats: DashboardStats;
    recentSessions: RecentSession[];
    skillScores: SkillScore;
    recommendedTopics: RecommendedTopic[];
}

// Custom hook to fetch dashboard data
export const useDashboardData = (userId: number | undefined) => {
    return useQuery<DashboardData>({
        queryKey: ['dashboard', userId],
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Use shared httpClient which has baseURL '/api' and Vite proxy to backend
            // This avoids issues with double '/api' when VITE_API_BASE_URL already contains '/api'
            const data = await httpClient.get<DashboardData>(`/dashboard/user/${userId}`);
            return data;
        },
        enabled: !!userId, // Only run query if userId is available
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });
};