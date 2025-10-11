// Custom hooks for interview functionality using TanStack Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { interviewService } from '../application/container'
import { queryKeys, handleQueryError } from '../infrastructure/query-client'
import type {
    InterviewQuestion,
    InterviewConfig,
} from '../domain/entities'
import type {
    GenerateQuestionRequest,
    EvaluateCodeRequest,
    ExecuteCodeRequest,
} from '../application/services'

// Hook for creating an interview session
export const useCreateInterviewSession = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ config, userId }: { config: InterviewConfig; userId: number }) => {
            return interviewService.createInterviewSession(config, userId)
        },
        onSuccess: (data) => {
            // Invalidate and refetch interviews list
            queryClient.invalidateQueries({ queryKey: queryKeys.interviews })

            // Add the new session to the cache
            queryClient.setQueryData(queryKeys.interview(data.id), data)
        },
        onError: (error) => {
            console.error('Failed to create interview session:', handleQueryError(error))
        },
    })
}

// Hook for getting an interview session
export const useInterviewSession = (sessionId: number) => {
    return useQuery({
        queryKey: queryKeys.interview(sessionId),
        queryFn: () => interviewService.getInterviewSession(sessionId),
        enabled: !!sessionId,
    })
}

// Hook for getting session questions
export const useSessionQuestions = (sessionId: number) => {
    return useQuery({
        queryKey: queryKeys.interviewQuestions(sessionId),
        queryFn: () => interviewService.getSessionQuestions(sessionId),
        enabled: !!sessionId,
    })
}

// Hook for generating a coding question
export const useGenerateCodingQuestion = () => {
    return useMutation({
        mutationFn: (request: GenerateQuestionRequest) => {
            return interviewService.generateCodingQuestion(request)
        },
        onError: (error) => {
            console.error('Failed to generate coding question:', handleQueryError(error))
        },
    })
}

// Hook for submitting an answer
export const useSubmitAnswer = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ questionId, answer }: { questionId: number; answer: string }) => {
            return interviewService.submitAnswer(questionId, answer)
        },
        onSuccess: (data, { questionId }) => {
            // Update the specific question in cache
            queryClient.setQueryData(
                queryKeys.interviewQuestions(data.sessionId),
                (oldData: InterviewQuestion[] | undefined) => {
                    if (!oldData) return [data]
                    return oldData.map((q) => (q.id === questionId ? data : q))
                }
            )
        },
        onError: (error) => {
            console.error('Failed to submit answer:', handleQueryError(error))
        },
    })
}

// Hook for executing code
export const useExecuteCode = () => {
    return useMutation({
        mutationFn: (request: ExecuteCodeRequest) => {
            return interviewService.executeCode(request)
        },
        onError: (error) => {
            console.error('Failed to execute code:', handleQueryError(error))
        },
    })
}

// Hook for evaluating code (execution + AI evaluation)
export const useEvaluateCode = () => {
    return useMutation({
        mutationFn: (request: EvaluateCodeRequest) => {
            return interviewService.evaluateCode(request)
        },
        onError: (error) => {
            console.error('Failed to evaluate code:', handleQueryError(error))
        },
    })
}

// Hook for generating session feedback
export const useGenerateSessionFeedback = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (sessionId: number) => {
            return interviewService.completeSession(sessionId)
        },
        onSuccess: (data, sessionId) => {
            // Cache the feedback data
            queryClient.setQueryData(queryKeys.feedback(sessionId), data)

            // Invalidate the session to refetch updated status
            queryClient.invalidateQueries({ queryKey: queryKeys.interview(sessionId) })
        },
        onError: (error) => {
            console.error('Failed to generate feedback:', handleQueryError(error))
        },
    })
}

// Hook for getting feedback
export const useGetSessionFeedback = (sessionId: number, enabled = true) => {
    return useQuery({
        queryKey: queryKeys.feedback(sessionId),
        queryFn: () => interviewService.getSessionFeedback(sessionId),
        enabled: enabled && !!sessionId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
            // Don't retry if feedback doesn't exist yet
            if ((error as any)?.status === 404) return false
            return failureCount < 3
        },
    })
}

// Hook for getting cached feedback
export const useSessionFeedback = (sessionId: number) => {
    return useQuery({
        queryKey: queryKeys.feedback(sessionId),
        queryFn: () => interviewService.generateSessionFeedback(sessionId),
        enabled: !!sessionId,
        staleTime: Infinity, // Feedback doesn't change once generated
    })
}

// Composite hook for interview session management
export const useInterviewSessionManager = (sessionId?: number) => {
    const session = useInterviewSession(sessionId!)
    const questions = useSessionQuestions(sessionId!)
    const createSession = useCreateInterviewSession()
    const submitAnswer = useSubmitAnswer()
    const generateQuestion = useGenerateCodingQuestion()
    const executeCode = useExecuteCode()
    const evaluateCode = useEvaluateCode()
    const generateFeedback = useGenerateSessionFeedback()

    return {
        // Data
        session: session.data,
        questions: questions.data,

        // Loading states
        isLoadingSession: session.isLoading,
        isLoadingQuestions: questions.isLoading,

        // Error states
        sessionError: session.error,
        questionsError: questions.error,

        // Actions
        createSession: createSession.mutate,
        submitAnswer: submitAnswer.mutate,
        generateQuestion: generateQuestion.mutate,
        executeCode: executeCode.mutate,
        evaluateCode: evaluateCode.mutate,
        generateFeedback: generateFeedback.mutate,

        // Mutation states
        isCreatingSession: createSession.isPending,
        isSubmittingAnswer: submitAnswer.isPending,
        isGeneratingQuestion: generateQuestion.isPending,
        isExecutingCode: executeCode.isPending,
        isEvaluatingCode: evaluateCode.isPending,
        isGeneratingFeedback: generateFeedback.isPending,

        // Mutation results
        generatedQuestion: generateQuestion.data,
        executionResult: executeCode.data,
        evaluationResult: evaluateCode.data,
        feedbackResult: generateFeedback.data,

        // Mutation errors
        createSessionError: createSession.error,
        submitAnswerError: submitAnswer.error,
        generateQuestionError: generateQuestion.error,
        executeCodeError: executeCode.error,
        evaluateCodeError: evaluateCode.error,
        generateFeedbackError: generateFeedback.error,
    }
}

// Text Interview Hooks

// Hook for starting a text interview
export const useStartTextInterview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ config, userId }: { config: InterviewConfig; userId: number }) => {
            return interviewService.startTextInterview(config, userId)
        },
        onSuccess: (data) => {
            // Invalidate and refetch interviews list
            queryClient.invalidateQueries({ queryKey: queryKeys.interviews })

            // Add the new session to the cache
            queryClient.setQueryData(queryKeys.interview(data.session.id), data.session)
        },
        onError: (error) => {
            console.error('Failed to start text interview:', handleQueryError(error))
        },
    })
}

// Hook for getting next text question
export const useGetNextTextQuestion = () => {
    return useMutation({
        mutationFn: async ({ sessionId, currentQuestionId }: { sessionId: number; currentQuestionId?: number }) => {
            return interviewService.getNextTextQuestion(sessionId, currentQuestionId)
        },
        onError: (error) => {
            console.error('Failed to get next question:', handleQueryError(error))
        },
    })
}

// Hook for submitting text answer
export const useSubmitTextAnswer = () => {
    return useMutation({
        mutationFn: async ({ sessionId, questionId, answer }: { sessionId: number; questionId: number; answer: string }) => {
            return interviewService.submitTextAnswer(sessionId, questionId, answer)
        },
        onError: (error) => {
            console.error('Failed to submit text answer:', handleQueryError(error))
        },
    })
}

// Hook for getting interview progress
export const useGetInterviewProgress = (sessionId: number, enabled = true) => {
    return useQuery({
        queryKey: ['interview', 'progress', sessionId],
        queryFn: () => interviewService.getInterviewProgress(sessionId),
        enabled: !!sessionId && enabled,
        refetchInterval: 30000, // Refetch every 30 seconds to update progress
    })
}

// Hook for completing text interview
export const useCompleteTextInterview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (sessionId: number) => {
            return interviewService.completeTextInterview(sessionId)
        },
        onSuccess: (_, sessionId) => {
            // Invalidate session data to refresh
            queryClient.invalidateQueries({ queryKey: queryKeys.interview(sessionId) })
        },
        onError: (error) => {
            console.error('Failed to complete interview:', handleQueryError(error))
        },
    })
}

// Hook for getting interview summary
export const useGetInterviewSummary = (sessionId: number, enabled = true) => {
    return useQuery({
        queryKey: ['interview', 'summary', sessionId],
        queryFn: () => interviewService.getInterviewSummary(sessionId),
        enabled: !!sessionId && enabled,
    })
}