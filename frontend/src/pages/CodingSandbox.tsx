import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CodeEditor from '@/components/CodeEditor'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { useGenerateCodingQuestion, useExecuteCode, useSubmitAnswer } from '../hooks/useInterview'
import {
    Play,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Code,
    FileText,
    Lightbulb,
    ArrowRight,
    Clock,
    AlertTriangle
} from 'lucide-react'

interface TestCase {
    input: string
    expectedOutput: string
    description?: string
    actualOutput?: string
    passed?: boolean
    error?: string
}

interface CodingQuestion {
    id?: number
    title: string
    description: string
    difficulty: string
    language: string
    starterCode: string
    testCases: TestCase[]
    hints?: string[]
    timeComplexityExpected?: string
    spaceComplexityExpected?: string
}

interface CodingSandboxState {
    sessionId: number
    domain: string
    difficulty: string
    language: string
    duration: number
    question?: CodingQuestion
}

interface ExecutionResult {
    success: boolean
    output?: string
    error?: string
    executionTime: number
    testResults?: TestCase[]
    isSimulated?: boolean
    installationGuide?: string
    runtimeMissing?: boolean
}

const CodingSandbox = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const state = location.state as CodingSandboxState

    // Hooks
    const generateCodingQuestion = useGenerateCodingQuestion()
    const executeCode = useExecuteCode()
    const submitAnswer = useSubmitAnswer()

    // State management
    const [question, setQuestion] = useState<CodingQuestion | null>(state?.question || null)
    const [code, setCode] = useState<string>('')
    const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
    const [isExecuting, setIsExecuting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(!state?.question)
    const [timeRemaining, setTimeRemaining] = useState(state?.duration * 60 || 1800) // Convert minutes to seconds

    // Redirect if no session state
    useEffect(() => {
        if (!state || !user) {
            navigate('/interview-setup')
            return
        }
    }, [state, user, navigate])

    // Load coding question if not provided
    useEffect(() => {
        const loadQuestion = async () => {
            if (!state?.question && state?.sessionId) {
                try {
                    setIsLoadingQuestion(true)
                    generateCodingQuestion.mutate({
                        domain: state.domain,
                        difficulty: state.difficulty,
                        language: state.language,
                        sessionId: state.sessionId
                    }, {
                        onSuccess: (questionData) => {
                            setQuestion(questionData)
                            setCode(questionData.starterCode || `// Write your ${state.language} solution here\n`)
                            setIsLoadingQuestion(false)
                        },
                        onError: (error) => {
                            console.error('Error loading question:', error)
                            setIsLoadingQuestion(false)
                        }
                    })
                } catch (error) {
                    console.error('Error loading question:', error)
                    setIsLoadingQuestion(false)
                }
            } else if (state?.question) {
                setCode(state.question.starterCode || `// Write your ${state.language} solution here\n`)
            }
        }

        loadQuestion()
    }, [state, generateCodingQuestion])

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) return

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Time's up - auto submit
                    handleSubmitSolution()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [timeRemaining])

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const handleRunCode = async () => {
        if (!question || !code.trim()) return

        try {
            setIsExecuting(true)
            executeCode.mutate({
                code,
                language: state.language,
                testCases: question.testCases
            }, {
                onSuccess: (result) => {
                    setExecutionResult(result)
                    setIsExecuting(false)
                },
                onError: (error) => {
                    console.error('Code execution error:', error)
                    setExecutionResult({
                        success: false,
                        error: 'Failed to execute code',
                        executionTime: 0
                    })
                    setIsExecuting(false)
                }
            })
        } catch (error) {
            console.error('Code execution error:', error)
            setExecutionResult({
                success: false,
                error: 'Failed to execute code',
                executionTime: 0
            })
            setIsExecuting(false)
        }
    }



    const handleSubmitSolution = async () => {
        if (!question || !code.trim()) return

        try {
            setIsSubmitting(true)

            // First run the code to get execution results if not already done
            if (!executionResult) {
                await handleRunCode()
            }

            // Submit the solution
            submitAnswer.mutate({
                questionId: question.id!,
                answer: code
            }, {
                onSuccess: () => {
                    // Navigate to enhanced feedback page
                    navigate('/enhanced-feedback', {
                        state: {
                            sessionId: state.sessionId,
                            type: 'coding',
                            question: question,
                            solution: code,
                            executionResult: executionResult
                        }
                    })
                    setIsSubmitting(false)
                },
                onError: (error) => {
                    console.error('Submit solution error:', error)
                    setIsSubmitting(false)
                }
            })
        } catch (error) {
            console.error('Submit solution error:', error)
            setIsSubmitting(false)
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'beginner': return 'bg-green-100 text-green-800'
            case 'intermediate': return 'bg-yellow-100 text-yellow-800'
            case 'advanced': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (!state || !user) {
        return null // Will redirect in useEffect
    }

    if (isLoadingQuestion) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p className="text-lg font-medium">Generating your coding challenge...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            AI is creating a {state.difficulty} {state.domain} question
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (!question) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-medium">Failed to load question</p>
                        <Button onClick={() => navigate('/interview-setup')} className="mt-4">
                            Back to Setup
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="border-b p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Code className="w-5 h-5" />
                                <h1 className="text-xl font-semibold">Coding Challenge</h1>
                            </div>
                            <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                            </Badge>
                            <Badge variant="outline">
                                {state.language}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4" />
                                <span className={timeRemaining < 300 ? 'text-red-600 font-semibold' : ''}>
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleRunCode}
                                disabled={isExecuting || !code.trim()}
                            >
                                {isExecuting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Run Code
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleSubmitSolution}
                                disabled={isSubmitting || !code.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Solution
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Problem Description */}
                    <div className="w-1/2 border-r overflow-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">{question.title}</h2>

                            <Tabs defaultValue="description" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="description">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Description
                                    </TabsTrigger>
                                    <TabsTrigger value="testcases">
                                        <Code className="w-4 h-4 mr-2" />
                                        Test Cases
                                    </TabsTrigger>
                                    <TabsTrigger value="hints">
                                        <Lightbulb className="w-4 h-4 mr-2" />
                                        Hints
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="description" className="mt-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="prose prose-sm max-w-none">
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                                    {question.description}
                                                </p>
                                            </div>
                                            {(question.timeComplexityExpected || question.spaceComplexityExpected) && (
                                                <div className="mt-6 pt-4 border-t">
                                                    <h4 className="font-medium mb-2">Expected Complexity:</h4>
                                                    {question.timeComplexityExpected && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Time: {question.timeComplexityExpected}
                                                        </p>
                                                    )}
                                                    {question.spaceComplexityExpected && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Space: {question.spaceComplexityExpected}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="testcases" className="mt-4">
                                    <div className="space-y-4">
                                        {question.testCases.map((testCase, index) => (
                                            <Card key={index}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        Test Case {index + 1}
                                                        {executionResult?.testResults?.[index] && (
                                                            executionResult.testResults[index].passed ? (
                                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                                            )
                                                        )}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="text-sm">
                                                    {testCase.description && (
                                                        <p className="mb-3 text-muted-foreground">
                                                            {testCase.description}
                                                        </p>
                                                    )}
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <span className="font-medium">Input:</span>
                                                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                                                {testCase.input}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Expected Output:</span>
                                                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                                                {testCase.expectedOutput}
                                                            </pre>
                                                        </div>
                                                        {executionResult?.testResults?.[index]?.actualOutput && (
                                                            <div>
                                                                <span className="font-medium">Your Output:</span>
                                                                <pre className={`mt-1 p-2 rounded text-xs overflow-auto ${executionResult.testResults[index].passed
                                                                    ? 'bg-green-50 border border-green-200'
                                                                    : 'bg-red-50 border border-red-200'
                                                                    }`}>
                                                                    {executionResult.testResults[index].actualOutput}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="hints" className="mt-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            {question.hints && question.hints.length > 0 ? (
                                                <div className="space-y-3">
                                                    {question.hints.map((hint, index) => (
                                                        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                                                            <p className="text-sm">{hint}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-center text-muted-foreground py-8">
                                                    No hints available for this question.
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div className="w-1/2 flex flex-col">
                        <div className="flex-1">
                            <CodeEditor
                                defaultValue={code}
                                onCodeChange={setCode}
                                defaultLanguage={state.language}
                            />
                        </div>

                        {/* Execution Results */}
                        {executionResult && (
                            <div className="border-t p-4 bg-gray-50 max-h-64 overflow-auto">
                                <div className="flex items-center gap-2 mb-3">
                                    {executionResult.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="font-medium">
                                        {executionResult.isSimulated
                                            ? 'Code validated (simulated)'
                                            : executionResult.success
                                                ? 'Code executed successfully'
                                                : 'Execution failed'
                                        }
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        ({executionResult.executionTime}ms)
                                    </span>
                                    {executionResult.isSimulated && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Simulated
                                        </Badge>
                                    )}
                                </div>

                                {executionResult.runtimeMissing && (
                                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                            <span className="text-sm font-medium text-yellow-800">
                                                Language Runtime Not Available
                                            </span>
                                        </div>
                                        <p className="text-xs text-yellow-700 mb-2">
                                            The {state.language} runtime is not installed on the server.
                                            Your code has been validated for syntax and structure.
                                        </p>
                                        {executionResult.installationGuide && (
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-yellow-700 hover:text-yellow-800">
                                                    View installation guide
                                                </summary>
                                                <pre className="mt-2 p-2 bg-yellow-100 border rounded text-yellow-800 whitespace-pre-wrap">
                                                    {executionResult.installationGuide}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                )}

                                {executionResult.output && (
                                    <div className="mb-3">
                                        <span className="text-sm font-medium">Output:</span>
                                        <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-auto">
                                            {executionResult.output}
                                        </pre>
                                    </div>
                                )}

                                {executionResult.error && (
                                    <div className="mb-3">
                                        <span className="text-sm font-medium text-red-600">Error:</span>
                                        <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto">
                                            {executionResult.error}
                                        </pre>
                                    </div>
                                )}

                                {executionResult.testResults && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium">Test Results:</span>
                                            <span className="text-xs text-muted-foreground">
                                                {executionResult.testResults.filter(r => r.passed).length} / {executionResult.testResults.length} passed
                                            </span>
                                        </div>

                                        {/* Simple Test Case Results */}
                                        <div className="space-y-2">
                                            {executionResult.testResults.map((result, index) => (
                                                <div key={index} className={`p-2 rounded-md flex items-center gap-2 text-sm ${result.passed
                                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                                    : 'bg-red-50 text-red-800 border border-red-200'
                                                    }`}>
                                                    {result.passed ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <span className="font-medium">
                                                        Test case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {executionResult.isSimulated && (
                                            <p className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                                ℹ️ Test results are estimated based on code analysis since the runtime is not available
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CodingSandbox