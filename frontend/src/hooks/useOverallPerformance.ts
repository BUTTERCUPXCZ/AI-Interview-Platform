import { useQuery } from '@tanstack/react-query';

export interface TechnicalSkillsAssessment {
    knowledgeDepth: number;
    problemSolving: number;
    communication: number;
    technicalAccuracy: number;
}

export interface OverallPerformanceEvaluation {
    overallScore: number;
    performanceRating: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    areasForImprovement: string[];
    technicalSkillsAssessment: TechnicalSkillsAssessment;
    detailedFeedback: string;
    recommendations: string[];
    nextSteps: string[];
    readinessLevel: string;
    sessionInfo?: {
        domain: string;
        difficulty: string;
        interviewType: string;
        startedAt: string;
        endedAt: string;
        totalQuestions: number;
        answeredQuestions: number;
    };
}

export interface UseOverallPerformanceResult {
    evaluation: OverallPerformanceEvaluation | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Custom hook to fetch overall performance evaluation from Gemini AI
 */
export const useOverallPerformance = (sessionId: number | string | null): UseOverallPerformanceResult => {
    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery<{ sessionId: number; evaluation: OverallPerformanceEvaluation }>({
        queryKey: ['overall-performance', sessionId],
        queryFn: async () => {
            if (!sessionId) {
                throw new Error('No session ID provided');
            }

            const response = await fetch(`/api/interview/text/session/${sessionId}/overall-performance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch overall performance: ${response.status} - ${errorText}`);
            }

            return response.json();
        },
        enabled: !!sessionId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 2,
        retryDelay: 1000,
    });

    return {
        evaluation: data?.evaluation || null,
        isLoading,
        error: error as Error | null,
        refetch
    };
};
