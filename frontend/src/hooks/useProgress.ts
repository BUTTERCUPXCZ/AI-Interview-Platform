import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/infrastructure/http-client';

export interface SkillTrendData {
    date: string;
    [skillName: string]: number | string;
}

export interface RadarSkillData {
    skill: string;
    current: number;
    previous: number;
    fullMark: number;
}

export interface SessionHistoryData {
    id: number;
    date: string;
    domain: string;
    type: string;
    score: number;
    duration: string;
    questions: number;
    improvement: number;
}

export interface ComparisonData {
    domain: string;
    current: number;
    previous: number;
    sessions: number;
}

export interface RecommendationData {
    title: string;
    description: string;
    difficulty: string;
    estimatedTime: string;
    priority: string;
    category: string;
}

export interface ProgressStats {
    overallScore: number;
    overallImprovement: number;
    totalSessions: number;
    sessionGrowth: number;
    strongestSkill: string;
    strongestSkillScore: number;
    improvementArea: string;
}

export interface ProgressData {
    stats: ProgressStats;
    skillTrends: SkillTrendData[];
    radarData: RadarSkillData[];
    sessionHistory: SessionHistoryData[];
    domainComparison: ComparisonData[];
    recommendations: RecommendationData[];
}

// Custom hook to fetch progress analytics data
export const useProgressData = (userId: number | undefined) => {
    return useQuery<ProgressData>({
        queryKey: ['progress', userId],
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Use shared httpClient which has baseURL '/api' and Vite proxy to backend
            const data = await httpClient.get<ProgressData>(`/progress/user/${userId}`);
            return data;
        },
        enabled: !!userId, // Only run query if userId is available
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });
};