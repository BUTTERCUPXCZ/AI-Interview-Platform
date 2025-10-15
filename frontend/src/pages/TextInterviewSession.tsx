import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useGetInterviewProgress, useCompleteTextInterview } from '../hooks/useInterview'
import {
    useOptimizedStartTextInterview,
    useFastNextQuestion,
    useFastSubmitAnswer
} from '../hooks/useOptimizedInterview'
import { useAuth } from '../contexts/useAuthContext'
import type { InterviewConfig } from '../domain/entities'
import type { TextInterviewQuestion, SubmitAnswerResponse, NextQuestionResponse, StartTextInterviewResponse } from '@/application/services'
import InterviewLoading from '@/components/InterviewLoading'
import {
    Clock,
    ArrowRight,
    CheckCircle,
    SkipForward
} from 'lucide-react'

interface TextInterviewSessionConfig extends InterviewConfig {
    sessionId?: number
    currentQuestion?: TextInterviewQuestion
    isLoading?: boolean
    userId?: number
}

const TextInterviewSession = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const config = location.state as TextInterviewSessionConfig

    // Hooks
    // use optimized hooks for faster UX
    const startTextInterview = useOptimizedStartTextInterview() // optimized start
    const getNextQuestion = useFastNextQuestion()
    const submitAnswer = useFastSubmitAnswer()
    const completeInterview = useCompleteTextInterview()

    // State
    const [sessionId, setSessionId] = useState<number | null>(config?.sessionId || null)
    const [currentQuestion, setCurrentQuestion] = useState<TextInterviewQuestion | null>(config?.currentQuestion || null)
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [questionNumber, setQuestionNumber] = useState(1)
    const [totalQuestions, setTotalQuestions] = useState(5)
    const [timeRemaining, setTimeRemaining] = useState((config?.duration || 30) * 60) // Convert to seconds
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null)
    const [isCompleted, setIsCompleted] = useState(false)

    // Get interview progress
    const { data: progressData } = useGetInterviewProgress(sessionId || 0, !!sessionId)

    const handleCompleteInterview = useCallback(async () => {
        if (!sessionId) return

        try {
            await new Promise((resolve, reject) => {
                completeInterview.mutate(sessionId, {
                    onSuccess: (data) => resolve(data),
                    onError: (error) => reject(error)
                })
            })

            setIsCompleted(true)

            // Navigate to enhanced feedback page
            setTimeout(() => {
                navigate('/enhanced-feedback', {
                    state: {
                        sessionId,
                        type: 'text',
                        config
                    }
                })
            }, 2000)
        } catch (error) {
            console.error('Failed to complete interview:', error)
        }
    }, [sessionId, completeInterview, navigate, config])

    const startTextInterviewCallback = useCallback(() => {
        if (user) {
            startTextInterview.mutate(
                { config, userId: user.id },
                {
                    onSuccess: (data) => {
                        const typedData = data as StartTextInterviewResponse
                        setSessionId(typedData.session.id)
                        setCurrentQuestion(typedData.currentQuestion)
                        setQuestionNumber(1)
                        setTotalQuestions(typedData.currentQuestion?.totalQuestions || 5)
                    },
                    onError: (error) => {
                        console.error('Failed to start optimized text interview:', error)
                        // Navigate back to setup on error
                        navigate('/interview-setup')
                    }
                }
            )
        }
    }, [config, user, startTextInterview, navigate])

    // Start interview if not already started
    useEffect(() => {
        if (!sessionId && config && user) {
            // Check if we have a loading state from navigation
            if (config.isLoading || !config.sessionId) {
                startTextInterviewCallback()
            } else {
                // Use existing session data
                setSessionId(config.sessionId)
                setCurrentQuestion(config.currentQuestion || null)
            }
        }
    }, [config, user, sessionId, startTextInterviewCallback])

    // Timer countdown
    useEffect(() => {
        if (timeRemaining > 0 && !isCompleted) {
            const timer = setTimeout(() => {
                setTimeRemaining(prev => prev - 1)
            }, 1000)
            return () => clearTimeout(timer)
        } else if (timeRemaining === 0) {
            handleCompleteInterview()
        }
    }, [timeRemaining, isCompleted, handleCompleteInterview])

    // Update progress from API
    useEffect(() => {
        if (progressData) {
            setQuestionNumber(progressData.answeredQuestions + 1)
            setTotalQuestions(progressData.totalQuestions)
            setTimeRemaining(progressData.remainingTime * 60) // Convert minutes to seconds
        }
    }, [progressData])

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim() || !sessionId || !currentQuestion) return

        setIsSubmitting(true)
        try {
            const result = await new Promise<SubmitAnswerResponse>((resolve, reject) => {
                submitAnswer.mutate(
                    {
                        sessionId,
                        questionId: currentQuestion.id,
                        answer: currentAnswer.trim()
                    },
                    {
                        onSuccess: (data) => resolve(data as SubmitAnswerResponse),
                        onError: (error) => reject(error)
                    }
                )
            })

            setFeedback(result)
            setCurrentAnswer('')

            // Get next question immediately without delay
            handleNextQuestion()

        } catch (error) {
            console.error('Failed to submit answer:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleNextQuestion = async () => {
        if (!sessionId || !currentQuestion) return

        try {
            console.log('Fetching next question after question:', currentQuestion.id, 'Question number:', questionNumber)

            const result = await new Promise<NextQuestionResponse>((resolve, reject) => {
                getNextQuestion.mutate(
                    { sessionId, currentQuestionId: currentQuestion.id },
                    {
                        onSuccess: (data) => resolve(data as NextQuestionResponse),
                        onError: (error) => reject(error)
                    }
                )
            })

            console.log('Next question response:', result)

            if (result.completed) {
                console.log('Interview completed, proceeding to complete interview')
                handleCompleteInterview()
            } else if (result.currentQuestion) {
                console.log('Moving to next question:', result.currentQuestion.questionNumber)
                setCurrentQuestion(result.currentQuestion)
                setQuestionNumber(result.currentQuestion.questionNumber)
                setFeedback(null)
            }
        } catch (error) {
            console.error('Failed to get next question:', error)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const progress = totalQuestions > 0 ? ((questionNumber - 1) / totalQuestions) * 100 : 0

    if (!currentQuestion && !isCompleted) {
        return (
            <InterviewLoading
                type="text"
                message={config?.isLoading ? "Setting up your interview session..." : "Loading next question..."}
            />
        )
    }

    if (isCompleted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="p-8 text-center max-w-md">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Interview Completed!</h2>
                    <p className="text-muted-foreground mb-4">
                        Great job! Your interview has been completed successfully.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Redirecting to feedback page...
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Text Interview</h1>
                            <p className="text-muted-foreground">
                                {config?.domain} • {config?.difficulty} Level • {config?.interviewType}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4" />
                                <span className={timeRemaining < 300 ? 'text-red-500' : ''}>
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Question {questionNumber} of {totalQuestions}</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Question */}
                <Card className="p-6 mb-6">
                    <h2 className="text-lg font-medium mb-4">
                        Question {questionNumber}
                    </h2>
                    <p className="text-base leading-relaxed">
                        {currentQuestion?.questionText}
                    </p>
                </Card>

                {/* Feedback */}
                {feedback && (
                    <Card className="p-4 mb-6 border-green-200 bg-green-50">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-green-800">Answer Submitted!</p>
                                <p className="text-green-700 text-sm mt-1">
                                    Score: {feedback.score}/10
                                </p>
                                {feedback.aiEvaluation && (
                                    <p className="text-green-600 text-sm mt-2">
                                        {feedback.aiEvaluation}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Answer Input */}
                <Card className="p-6 mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Your Answer
                    </label>
                    <textarea
                        value={currentAnswer}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting || !!feedback}
                    />
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            {currentAnswer.length} characters
                        </p>
                        {!feedback ? (
                            <Button
                                onClick={handleSubmitAnswer}
                                disabled={!currentAnswer.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Answer
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button onClick={handleNextQuestion}>
                                Next Question
                                <SkipForward className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/interview-setup')}
                    >
                        Exit Interview
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={handleCompleteInterview}
                    >
                        Complete Interview
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default TextInterviewSession