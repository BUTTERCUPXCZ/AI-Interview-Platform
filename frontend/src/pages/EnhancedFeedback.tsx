import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/Sidebar'
import {
    Brain,
    CheckCircle2,
    AlertCircle,
    Star,
    Loader2,
    Download,
    Award,
    BarChart3,
    Users,
    MessageSquare,
    Activity,
    TrendingDown as Warning,
    Info,
    Target,
    Clock
} from 'lucide-react'

interface LocationState {
    sessionId?: number
    config?: any
}

interface InterviewerPerformance {
    interview_id: string
    interviewer_name: string
    performance_summary: string[]
    overall_impression: string
    categories: {
        clarity_and_tone: string
        question_relevance: string
        candidate_engagement: string
        professionalism: string
        fairness: string
    }
    flags: {
        bias_detected: boolean
        unprofessional_language: boolean
        pacing_issues: boolean
    }
}

const EnhancedFeedback: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as LocationState
    const sessionId = state?.sessionId

    const [interviewerAnalysis, setInterviewerAnalysis] = useState<InterviewerPerformance | null>(null)
    const [isAnalyzingInterviewer, setIsAnalyzingInterviewer] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)

    const analyzeInterviewerBehavior = async () => {
        if (!sessionId) {
            setAnalysisError('No session ID provided')
            return
        }

        try {
            setIsAnalyzingInterviewer(true)
            setAnalysisError(null)

            console.log('Starting analysis for session:', sessionId)

            const response = await fetch(`/api/interview/session/${sessionId}/interviewer-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            })

            console.log('Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Error response:', errorText)
                throw new Error(`Analysis failed: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            console.log('Analysis response:', data)

            if (data.interviewerAnalysis) {
                setInterviewerAnalysis(data.interviewerAnalysis)
            } else {
                throw new Error('No analysis data returned from server')
            }
        } catch (error) {
            console.error('Error analyzing interviewer behavior:', error)
            setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze interviewer behavior')
        } finally {
            setIsAnalyzingInterviewer(false)
        }
    }

    useEffect(() => {
        if (!sessionId) {
            setAnalysisError('No session ID found. Please start from an interview session.')
            return
        }
        console.log('Enhanced Feedback loaded with session ID:', sessionId)
    }, [sessionId])

    if (!sessionId) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No Session Found</h2>
                        <p className="text-muted-foreground mb-4">Please start from an interview session.</p>
                        <Button onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-card border-b border-border p-3">
                    <div className="max-w-6xl">
                        <div className="flex items-center gap-4 mb-2">

                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    Interviewer Performance Analysis
                                </h1>

                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-background to-muted/20">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* Main Content */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <BarChart3 className="w-6 h-6 text-blue-600" />
                                    AI Performance Evaluation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                {!interviewerAnalysis ? (
                                    <div className="text-center py-12">
                                        {analysisError ? (
                                            <div className="space-y-4">
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                                                    <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Failed</h3>
                                                    <p className="text-red-700">{analysisError}</p>
                                                </div>
                                                <Button
                                                    onClick={analyzeInterviewerBehavior}
                                                    disabled={isAnalyzingInterviewer}
                                                    variant="outline"
                                                    size="lg"
                                                >
                                                    {isAnalyzingInterviewer ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                            Retrying Analysis...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Brain className="w-5 h-5 mr-2" />
                                                            Retry Analysis
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                                    <Brain className="w-10 h-10 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-semibold mb-3">Ready to Analyze</h3>
                                                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                                        Click the button below to generate a comprehensive AI-powered analysis of the interviewer's performance, including communication style, question quality, and professional conduct.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={analyzeInterviewerBehavior}
                                                    disabled={isAnalyzingInterviewer}
                                                    size="lg"
                                                    className="text-lg px-8 py-3"
                                                >
                                                    {isAnalyzingInterviewer ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                            Gemini AI Analyzing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Brain className="w-5 h-5 mr-2" />
                                                            Generate AI Analysis
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Overall Impression */}
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold text-blue-900 mb-3">
                                                <Star className="w-5 h-5" />
                                                Overall Impression
                                            </h3>
                                            <p className="text-blue-800 text-lg leading-relaxed">
                                                {interviewerAnalysis.overall_impression}
                                            </p>
                                        </div>

                                        {/* AI Performance Summary */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                            <h3 className="flex items-center gap-2 text-xl font-semibold text-green-900 mb-4">
                                                <CheckCircle2 className="w-5 h-5" />
                                                AI Performance Summary
                                                <Badge variant="outline" className="ml-2 text-green-700 border-green-300">
                                                    Bullet Format
                                                </Badge>
                                            </h3>
                                            <div className="space-y-3">
                                                {interviewerAnalysis.performance_summary && interviewerAnalysis.performance_summary.length > 0 ? (
                                                    interviewerAnalysis.performance_summary.map((point, index) => (
                                                        <div key={index} className="flex items-start gap-3">
                                                            <div className="w-2 h-2 bg-green-600 rounded-full mt-3 flex-shrink-0" />
                                                            <p className="text-green-800 text-base leading-relaxed">{point}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-muted-foreground">No performance summary available</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Category Analysis */}
                                        <div>
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-6">
                                                <BarChart3 className="w-5 h-5 text-purple-600" />
                                                Category Analysis
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <Card className="border-blue-200">
                                                    <CardContent className="p-6">
                                                        <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                                            <MessageSquare className="w-4 h-4" />
                                                            Clarity & Tone
                                                        </h4>
                                                        <p className="text-gray-700 leading-relaxed">
                                                            {interviewerAnalysis.categories?.clarity_and_tone || "No analysis available"}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-green-200">
                                                    <CardContent className="p-6">
                                                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                                            <Target className="w-4 h-4" />
                                                            Question Relevance
                                                        </h4>
                                                        <p className="text-gray-700 leading-relaxed">
                                                            {interviewerAnalysis.categories?.question_relevance || "No analysis available"}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-purple-200">
                                                    <CardContent className="p-6">
                                                        <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            Candidate Engagement
                                                        </h4>
                                                        <p className="text-gray-700 leading-relaxed">
                                                            {interviewerAnalysis.categories?.candidate_engagement || "No analysis available"}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-orange-200">
                                                    <CardContent className="p-6">
                                                        <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                                                            <Award className="w-4 h-4" />
                                                            Professionalism
                                                        </h4>
                                                        <p className="text-gray-700 leading-relaxed">
                                                            {interviewerAnalysis.categories?.professionalism || "No analysis available"}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-indigo-200 md:col-span-2">
                                                    <CardContent className="p-6">
                                                        <h4 className="font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                                                            <Activity className="w-4 h-4" />
                                                            Fairness & Neutrality
                                                        </h4>
                                                        <p className="text-gray-700 leading-relaxed">
                                                            {interviewerAnalysis.categories?.fairness || "No analysis available"}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>

                                        {/* Quality Indicators */}
                                        <div>
                                            <h3 className="flex items-center gap-2 text-xl font-semibold mb-6">
                                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                                Quality Indicators
                                            </h3>
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <Card className={`${interviewerAnalysis.flags?.bias_detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                                    <CardContent className="p-6 text-center">
                                                        {interviewerAnalysis.flags?.bias_detected ?
                                                            <Warning className="w-8 h-8 text-red-600 mx-auto mb-3" /> :
                                                            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                                        }
                                                        <h4 className={`font-semibold mb-2 ${interviewerAnalysis.flags?.bias_detected ? 'text-red-800' : 'text-green-800'}`}>
                                                            Bias Detection
                                                        </h4>
                                                        <p className={`text-sm ${interviewerAnalysis.flags?.bias_detected ? 'text-red-700' : 'text-green-700'}`}>
                                                            {interviewerAnalysis.flags?.bias_detected ? 'Potential bias detected' : 'No bias detected'}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className={`${interviewerAnalysis.flags?.unprofessional_language ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                                    <CardContent className="p-6 text-center">
                                                        {interviewerAnalysis.flags?.unprofessional_language ?
                                                            <Warning className="w-8 h-8 text-red-600 mx-auto mb-3" /> :
                                                            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                                        }
                                                        <h4 className={`font-semibold mb-2 ${interviewerAnalysis.flags?.unprofessional_language ? 'text-red-800' : 'text-green-800'}`}>
                                                            Language Quality
                                                        </h4>
                                                        <p className={`text-sm ${interviewerAnalysis.flags?.unprofessional_language ? 'text-red-700' : 'text-green-700'}`}>
                                                            {interviewerAnalysis.flags?.unprofessional_language ? 'Unprofessional language detected' : 'Professional language maintained'}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className={`${interviewerAnalysis.flags?.pacing_issues ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                                                    <CardContent className="p-6 text-center">
                                                        {interviewerAnalysis.flags?.pacing_issues ?
                                                            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-3" /> :
                                                            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                                        }
                                                        <h4 className={`font-semibold mb-2 ${interviewerAnalysis.flags?.pacing_issues ? 'text-yellow-800' : 'text-green-800'}`}>
                                                            Pacing
                                                        </h4>
                                                        <p className={`text-sm ${interviewerAnalysis.flags?.pacing_issues ? 'text-yellow-700' : 'text-green-700'}`}>
                                                            {interviewerAnalysis.flags?.pacing_issues ? 'Pacing could be improved' : 'Good pacing maintained'}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>

                                        {/* Interview Details */}
                                        <Card className="bg-gray-50 border-gray-200">
                                            <CardContent className="p-6">
                                                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                                                    <Info className="w-5 h-5 text-gray-600" />
                                                    Interview Details
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="font-medium text-gray-600">Interview ID:</span>
                                                        <span className="ml-3 text-gray-800">{interviewerAnalysis.interview_id}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-600">Interviewer:</span>
                                                        <span className="ml-3 text-gray-800">{interviewerAnalysis.interviewer_name}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t">
                            <Button variant="outline" onClick={() => navigate('/dashboard')} size="lg">
                                <Target className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" onClick={() => window.print()} size="lg">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Report
                                </Button>
                                <Button onClick={() => navigate('/interview-setup')} size="lg">
                                    Start New Interview
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default EnhancedFeedback