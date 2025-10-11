import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/Sidebar'
import CodeEditor from '@/components/CodeEditor'
import {
    useGenerateCodingQuestion,
    useEvaluateCode,
    useSubmitAnswer,
    useStartTextInterview,
    useGetNextTextQuestion,
    useSubmitTextAnswer,
    useCompleteTextInterview
} from '../hooks/useInterview'
import { useAuth } from '../contexts/AuthContext'
import type { InterviewConfig, CodingQuestion } from '../domain/entities'
import {
    MessageSquare,
    Lightbulb,
    CheckCircle2,
    ArrowRight,
    Mic,
    MicOff,
    Code,
    Timer,
    Loader2,
    AlertCircle,
    Play
} from 'lucide-react'

interface SessionConfig extends InterviewConfig {
    sessionId?: number
    language?: string
    initialQuestion?: CodingQuestion
}

const InterviewSession = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const config = location.state as SessionConfig

    // Get hooks for managing the interview session
    const generateQuestion = useGenerateCodingQuestion()
    const evaluateCode = useEvaluateCode()
    const submitAnswer = useSubmitAnswer()

    // State management
    const [currentQuestion, setCurrentQuestion] = useState<CodingQuestion | null>(null)
    const [answer, setAnswer] = useState('')
    const [codeAnswer, setCodeAnswer] = useState('')
    const [showHints, setShowHints] = useState(false)
    const [currentHintIndex, setCurrentHintIndex] = useState(0)
    const [questionNumber, setQuestionNumber] = useState(1)
    const [totalQuestions] = useState(10)
    const [timeRemaining, setTimeRemaining] = useState(config?.duration ? config.duration * 60 : 1200)
    const [isRecording, setIsRecording] = useState(false)
    const [executionResult, setExecutionResult] = useState<any>(null)
    const [evaluationResult, setEvaluationResult] = useState<any>(null)

    // Generate initial question when component mounts
    useEffect(() => {
        // If we have an initial question from the setup, use it
        if (config && config.initialQuestion) {
            setCurrentQuestion(config.initialQuestion)
            setCodeAnswer(config.initialQuestion.starterCode || '')
        } else if (config && config.enableCodingSandbox && config.interviewType === 'technical') {
            // Otherwise, generate a new question
            const language = config.language ||
                (config.domain === 'frontend' ? 'javascript' :
                    config.domain === 'backend' ? 'python' : 'javascript')

            generateQuestion.mutate({
                domain: config.domain,
                difficulty: config.difficulty,
                language,
                sessionId: config.sessionId
            })
        }
    }, [config])

    // Update current question when generation is successful
    useEffect(() => {
        if (generateQuestion.data) {
            setCurrentQuestion(generateQuestion.data)
            setCodeAnswer(generateQuestion.data.starterCode || '')
        }
    }, [generateQuestion.data])

    // Timer effect
    useEffect(() => {
        if (timeRemaining > 0) {
            const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            // Time's up, navigate to feedback
            navigate('/feedback', {
                state: {
                    sessionId: config?.sessionId,
                    config
                }
            })
        }
    }, [timeRemaining, navigate, config])

    // Get next question
    const getNextQuestion = () => {
        if (questionNumber < totalQuestions) {
            setQuestionNumber(prev => prev + 1)
            setAnswer('')
            setCodeAnswer('')
            setShowHints(false)
            setCurrentHintIndex(0)
            setExecutionResult(null)
            setEvaluationResult(null)

            // Generate new coding question if applicable
            if (config?.enableCodingSandbox && config?.interviewType === 'technical') {
                const language = config.domain === 'frontend' ? 'javascript' :
                    config.domain === 'backend' ? 'python' : 'javascript'

                generateQuestion.mutate({
                    domain: config.domain,
                    difficulty: config.difficulty,
                    language,
                    sessionId: config.sessionId
                })
            }
        } else {
            // Navigate to feedback page
            navigate('/feedback', {
                state: {
                    sessionId: config?.sessionId,
                    config
                }
            })
        }
    }

    // Handle code execution and evaluation
    const handleCodeExecution = async (code: string, language: string) => {
        if (!currentQuestion) return

        try {
            const result = await new Promise((resolve, reject) => {
                evaluateCode.mutate(
                    {
                        code,
                        language,
                        questionText: currentQuestion.description,
                        questionId: currentQuestion.id,
                        testCases: currentQuestion.testCases?.map(tc => ({
                            input: tc.input,
                            expectedOutput: tc.expectedOutput,
                            description: tc.description || ''
                        }))
                    },
                    {
                        onSuccess: resolve,
                        onError: reject
                    }
                )
            })

            setExecutionResult((result as any).execution)
            setEvaluationResult((result as any).evaluation)
        } catch (error) {
            console.error('Code execution failed:', error)
        }
    }

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleSubmitAnswer = () => {
        if (currentQuestion?.isCodingQuestion) {
            // For coding questions, submit the code
            if (currentQuestion.id) {
                submitAnswer.mutate({
                    questionId: currentQuestion.id,
                    answer: codeAnswer
                })
            }
        } else {
            // For regular questions, submit the text answer
            if (currentQuestion?.id) {
                submitAnswer.mutate({
                    questionId: currentQuestion.id,
                    answer
                })
            }
        }
        getNextQuestion()
    }

    if (!config) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Interview Configuration</h2>
                    <p className="text-gray-600 mb-4">Please start an interview from the setup page.</p>
                    <Button onClick={() => navigate('/interview-setup')}>
                        Go to Setup
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-card border-b border-border p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Timer className="h-5 w-5 text-blue-500" />
                                <span className="font-mono text-lg">
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Question {questionNumber} of {totalQuestions}
                                </span>
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {config.format === 'Voice' && (
                            <Button
                                variant={isRecording ? "destructive" : "default"}
                                size="sm"
                                onClick={() => setIsRecording(!isRecording)}
                                className="gap-2"
                            >
                                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </Button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Question Section */}
                        <Card className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-blue-500" />
                                    <span className="font-semibold text-blue-600">Question {questionNumber}</span>
                                </div>

                                {generateQuestion.isPending ? (
                                    <div className="flex items-center gap-3 p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                        <span>Generating your coding question...</span>
                                    </div>
                                ) : generateQuestion.isError ? (
                                    <div className="flex items-center gap-3 p-8 text-red-600">
                                        <AlertCircle className="h-6 w-6" />
                                        <span>Failed to generate question. Please try again.</span>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                const language = config.domain === 'frontend' ? 'javascript' :
                                                    config.domain === 'backend' ? 'python' : 'javascript'
                                                generateQuestion.mutate({
                                                    domain: config.domain,
                                                    difficulty: config.difficulty,
                                                    language,
                                                    sessionId: config.sessionId
                                                })
                                            }}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                ) : currentQuestion ? (
                                    <>
                                        <h3 className="text-xl font-semibold">{currentQuestion.title}</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {currentQuestion.description}
                                        </p>

                                        {/* Complexity Information */}
                                        {currentQuestion.timeComplexityExpected && (
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-blue-900 mb-2">Expected Complexity</h4>
                                                <div className="space-y-1 text-sm text-blue-700">
                                                    <p>Time: {currentQuestion.timeComplexityExpected}</p>
                                                    <p>Space: {currentQuestion.spaceComplexityExpected}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Test Cases */}
                                        {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-3">Test Cases</h4>
                                                <div className="space-y-3">
                                                    {currentQuestion.testCases.map((testCase, index) => (
                                                        <div key={index} className="bg-white p-3 rounded border">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    Test Case {index + 1}
                                                                </span>
                                                                {testCase.description && (
                                                                    <span className="text-xs text-gray-500">
                                                                        - {testCase.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                                <div>
                                                                    <span className="font-medium text-gray-600">Input:</span>
                                                                    <pre className="mt-1 bg-gray-100 p-2 rounded border font-mono">
                                                                        {testCase.input}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-600">Expected Output:</span>
                                                                    <pre className="mt-1 bg-gray-100 p-2 rounded border font-mono">
                                                                        {testCase.expectedOutput}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-700">
                                        Can you explain the difference between var, let, and const in JavaScript?
                                    </p>
                                )}
                            </div>
                        </Card>

                        {/* Coding Section */}
                        {currentQuestion && config.enableCodingSandbox && (
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Code className="h-5 w-5 text-green-500" />
                                    <span className="font-semibold text-green-600">Code Editor</span>
                                </div>

                                <div className="space-y-4">
                                    <CodeEditor
                                        defaultValue={codeAnswer}
                                        defaultLanguage={currentQuestion.language || 'javascript'}
                                        height="300px"
                                        onCodeChange={setCodeAnswer}
                                    />

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleCodeExecution(codeAnswer, currentQuestion.language)}
                                            disabled={evaluateCode.isPending}
                                            className="gap-2"
                                        >
                                            {evaluateCode.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                            Run & Evaluate Code
                                        </Button>
                                    </div>
                                </div>

                                {/* Execution Results */}
                                {executionResult && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium mb-2">Execution Results</h4>
                                        <div className="space-y-2 text-sm">
                                            <p>Status: {executionResult.success ? '✅ Success' : '❌ Failed'}</p>
                                            <p>Time: {executionResult.executionTime}ms</p>
                                            {executionResult.output && (
                                                <div>
                                                    <p className="font-medium">Output:</p>
                                                    <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
                                                        {executionResult.output}
                                                    </pre>
                                                </div>
                                            )}
                                            {executionResult.error && (
                                                <div>
                                                    <p className="font-medium text-red-600">Error:</p>
                                                    <pre className="bg-red-50 p-2 rounded border text-xs overflow-x-auto text-red-700">
                                                        {executionResult.error}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* AI Evaluation Results */}
                                {evaluationResult && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium mb-2">AI Evaluation</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Overall Score:</span>
                                                <span className="text-2xl font-bold text-blue-600">
                                                    {evaluationResult.overallScore}/100
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">Correctness:</span>
                                                    <span className="ml-2">{evaluationResult.breakdown.correctness}/100</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Code Quality:</span>
                                                    <span className="ml-2">{evaluationResult.breakdown.codeQuality}/100</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Efficiency:</span>
                                                    <span className="ml-2">{evaluationResult.breakdown.efficiency}/100</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Edge Cases:</span>
                                                    <span className="ml-2">{evaluationResult.breakdown.edgeCaseHandling}/100</span>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="font-medium mb-1">Feedback:</p>
                                                <p className="text-sm text-gray-700">{evaluationResult.feedback}</p>
                                            </div>

                                            {evaluationResult.strengths.length > 0 && (
                                                <div>
                                                    <p className="font-medium mb-1 text-green-700">Strengths:</p>
                                                    <ul className="text-sm text-green-600 list-disc list-inside">
                                                        {evaluationResult.strengths.map((strength: string, index: number) => (
                                                            <li key={index}>{strength}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {evaluationResult.improvements.length > 0 && (
                                                <div>
                                                    <p className="font-medium mb-1 text-amber-700">Improvements:</p>
                                                    <ul className="text-sm text-amber-600 list-disc list-inside">
                                                        {evaluationResult.improvements.map((improvement: string, index: number) => (
                                                            <li key={index}>{improvement}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Text Answer Section (for non-coding questions) */}
                        {!config.enableCodingSandbox && (
                            <Card className="p-6">
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium">Your Answer</label>
                                    <textarea
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Type your answer here..."
                                    />
                                </div>
                            </Card>
                        )}

                        {/* Hints Section */}
                        {currentQuestion?.hints && currentQuestion.hints.length > 0 && (
                            <Card className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                                            <span className="font-semibold text-yellow-600">Hints</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowHints(!showHints)}
                                        >
                                            {showHints ? 'Hide Hints' : 'Show Hints'}
                                        </Button>
                                    </div>

                                    {showHints && (
                                        <div className="space-y-3">
                                            {currentQuestion.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </span>
                                                    <p className="text-yellow-800">{hint}</p>
                                                </div>
                                            ))}

                                            {currentHintIndex < currentQuestion.hints.length - 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentHintIndex(prev => prev + 1)}
                                                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                                                >
                                                    Show Next Hint
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center">
                            <Button variant="outline" onClick={() => navigate('/interview-setup')}>
                                End Interview
                            </Button>

                            <Button
                                onClick={handleSubmitAnswer}
                                disabled={
                                    submitAnswer.isPending ||
                                    (!config.enableCodingSandbox && !answer.trim()) ||
                                    (config.enableCodingSandbox && !codeAnswer.trim())
                                }
                                className="gap-2"
                            >
                                {submitAnswer.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                {questionNumber === totalQuestions ? 'Finish Interview' : 'Next Question'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default InterviewSession