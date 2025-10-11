// TanStack Query configuration and setup
import { QueryClient } from '@tanstack/react-query'
import { DomainError } from '../domain/entities'

// Query client configuration
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // Don't retry on client errors (4xx) except 401
                if (error instanceof DomainError && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 401) {
                    return false
                }
                // Retry up to 3 times for other errors
                return failureCount < 3
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false, // Don't retry mutations by default
        },
    },
})

// Query keys factory for consistency
export const queryKeys = {
    // Interview related
    interviews: ['interviews'] as const,
    interview: (id: number) => ['interviews', id] as const,
    interviewQuestions: (sessionId: number) => ['interviews', sessionId, 'questions'] as const,

    // Coding related
    codingQuestion: (domain: string, difficulty: string, language: string) =>
        ['coding', 'question', domain, difficulty, language] as const,

    // Feedback related
    feedback: (sessionId: number) => ['feedback', sessionId] as const,

    // User related
    currentUser: ['user', 'current'] as const,
} as const

// Error handling utilities
export const handleQueryError = (error: unknown): string => {
    if (error instanceof DomainError) {
        return error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'An unexpected error occurred'
}

// Loading state utilities
export const createLoadingState = (isLoading: boolean, isError: boolean, error: unknown) => ({
    isLoading,
    isError,
    error: isError ? handleQueryError(error) : null,
})