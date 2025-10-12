import { useQuery } from '@tanstack/react-query';
import { generateCareerRecommendations, type AICareerRecommendations, type CareerRecommendationsResponse } from '../api/feedback';

export interface UseCareerRecommendationsResult {
    recommendations: AICareerRecommendations | null;
    isLoading: boolean;
    error: Error | null;
    overallScore: number;
    refetch: () => void;
}

/**
 * Custom hook to fetch AI-powered career recommendations for an interview session
 */
export const useCareerRecommendations = (sessionId: number | string | null): UseCareerRecommendationsResult => {
    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery<CareerRecommendationsResponse>({
        queryKey: ['career-recommendations', sessionId],
        queryFn: () => sessionId ? generateCareerRecommendations(sessionId) : Promise.reject('No session ID'),
        enabled: !!sessionId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (updated property name)
        retry: 2,
        retryDelay: 1000,
    });

    return {
        recommendations: data?.recommendations || null,
        isLoading,
        error: error as Error | null,
        overallScore: data?.overallScore || 0,
        refetch
    };
};