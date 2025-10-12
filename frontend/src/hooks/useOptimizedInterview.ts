// Optimized interview hooks for faster performance
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@/infrastructure/http-client'
import type { InterviewConfig } from '../domain/entities'

// Fast interview session creation with immediate navigation
export const useFastInterviewSession = () => {
    return useMutation({
        mutationFn: async ({ config, userId }: { config: InterviewConfig; userId: number }) => {
            // Use optimized endpoint that returns minimal data for fast response
            const response = await httpClient.post('/text-interview/fast-start', {
                userId,
                domain: config.domain,
                interviewType: config.interviewType,
                difficulty: config.difficulty,
                duration: config.duration,
                enableCodingSandbox: config.enableCodingSandbox
            })
            return response
        },
        onError: (error) => {
            console.error('Failed to start fast interview session:', error)
        },
    })
}

// Optimized text interview start with lazy loading
export const useOptimizedStartTextInterview = () => {
    return useMutation({
        mutationFn: async ({ config, userId }: { config: InterviewConfig; userId: number }) => {
            const response = await httpClient.post('/text-interview/optimized-start', {
                userId,
                domain: config.domain,
                interviewType: config.interviewType,
                difficulty: config.difficulty,
                duration: config.duration,
                enableCodingSandbox: config.enableCodingSandbox
            })
            return response
        },
        onError: (error) => {
            console.error('Failed to start optimized text interview:', error)
        },
    })
}

// Fast answer submission with background processing
export const useFastSubmitAnswer = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ sessionId, questionId, answer }: {
            sessionId: number;
            questionId: number;
            answer: string
        }) => {
            const response = await httpClient.post('/text-interview/fast-submit', {
                sessionId,
                questionId,
                answer
            })
            return response
        },
        onSuccess: (data: any) => {
            // Optimistically update the cache
            queryClient.setQueryData(['interview', data.sessionId], (oldData: any) => {
                if (!oldData) return data
                return { ...oldData, lastAnswer: data }
            })
        },
        onError: (error) => {
            console.error('Failed to submit answer quickly:', error)
        },
    })
}

// Optimized next question fetching
export const useFastNextQuestion = () => {
    return useMutation({
        mutationFn: async ({ sessionId, currentQuestionId }: {
            sessionId: number;
            currentQuestionId: number
        }) => {
            const response = await httpClient.get(`/text-interview/session/${sessionId}/next-question-fast?currentQuestionId=${currentQuestionId}`)
            return response
        },
        onError: (error) => {
            console.error('Failed to get next question quickly:', error)
        },
    })
}

// Background sync for evaluations
export const useBackgroundSync = (sessionId: number, enabled = true) => {
    return useQuery({
        queryKey: ['interview-sync', sessionId],
        queryFn: async () => {
            const response = await httpClient.get(`/text-interview/session/${sessionId}/sync`)
            return response
        },
        enabled: enabled && !!sessionId,
        refetchInterval: 30000, // Sync every 30 seconds
        refetchIntervalInBackground: true,
        staleTime: 25000, // Consider stale after 25 seconds
    })
}

// Prefetch next question
export const usePrefetchNextQuestion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ sessionId, currentQuestionNumber }: {
            sessionId: number;
            currentQuestionNumber: number
        }) => {
            const response = await httpClient.post('/text-interview/prefetch-question', {
                sessionId,
                nextQuestionNumber: currentQuestionNumber + 1
            })

            // Cache the prefetched question
            queryClient.setQueryData(
                ['next-question', sessionId, currentQuestionNumber + 1],
                response
            )

            return response
        },
        onError: (error) => {
            console.error('Failed to prefetch next question:', error)
        },
    })
}

// Get prefetched question from cache
export const useGetPrefetchedQuestion = (sessionId: number, questionNumber: number) => {
    const queryClient = useQueryClient()

    return queryClient.getQueryData(['next-question', sessionId, questionNumber])
}

// Optimized coding question generation with caching
export const useFastCodingQuestion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ domain, difficulty, language }: {
            domain: string;
            difficulty: string;
            language: string
        }) => {
            // Check cache first
            const cacheKey = ['coding-question', domain, difficulty, language]
            const cached = queryClient.getQueryData(cacheKey)

            if (cached) {
                return cached
            }

            const response = await httpClient.post('/coding/fast-question', {
                domain,
                difficulty,
                language
            })

            // Cache the result
            queryClient.setQueryData(cacheKey, response)

            return response
        },
        onError: (error) => {
            console.error('Failed to generate coding question quickly:', error)
        },
    })
}

// Composite hook for optimized interview flow
export const useOptimizedInterviewFlow = (sessionId?: number) => {
    const fastStart = useOptimizedStartTextInterview()
    const fastSubmit = useFastSubmitAnswer()
    const fastNext = useFastNextQuestion()
    const prefetch = usePrefetchNextQuestion()
    const backgroundSync = useBackgroundSync(sessionId || 0, !!sessionId)

    return {
        startInterview: fastStart.mutate,
        submitAnswer: fastSubmit.mutate,
        getNextQuestion: fastNext.mutate,
        prefetchNextQuestion: prefetch.mutate,
        isStarting: fastStart.isPending,
        isSubmitting: fastSubmit.isPending,
        isLoadingNext: fastNext.isPending,
        syncData: backgroundSync.data,
        isOnline: !backgroundSync.isError
    }
}

// Preload common interview data
export const usePreloadInterviewData = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ domains, difficulties }: {
            domains: string[];
            difficulties: string[]
        }) => {
            const promises = domains.flatMap(domain =>
                difficulties.map(difficulty =>
                    httpClient.post('/text-interview/preload', { domain, difficulty })
                        .then(data => {
                            // Cache preloaded questions
                            queryClient.setQueryData(
                                ['preloaded-questions', domain, difficulty],
                                data
                            )
                        })
                        .catch(error => console.warn(`Failed to preload ${domain}-${difficulty}:`, error))
                )
            )

            await Promise.allSettled(promises)
        },
    })
}