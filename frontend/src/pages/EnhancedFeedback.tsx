import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/Sidebar'
import { useCareerRecommendations } from '@/hooks/useCareerRecommendations'
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
    Clock,
    Code,
    Trophy
} from 'lucide-react'

import type { InterviewConfig } from '@/domain/entities'

interface LocationState {
    sessionId?: number
    config?: InterviewConfig
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

    // Fetch AI-powered career recommendations
    const {
        recommendations,
        isLoading: isLoadingRecommendations,
        error: recommendationsError,
        overallScore,
        refetch: refetchRecommendations
    } = useCareerRecommendations(sessionId ?? null)

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
                    <div className="text-center p-8">
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
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Interview Analysis Dashboard</h1>
                            <p className="text-muted-foreground mt-1">
                                AI-powered insights and personalized recommendations
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Analysis Section */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold tracking-tight">
                                            Interviewer Performance Analysis
                                        </h2>
                                        <p className="text-muted-foreground">
                                            Comprehensive AI-powered evaluation and insights
                                        </p>
                                    </div>
                                </div>
                                {interviewerAnalysis && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        Analysis Complete
                                    </Badge>
                                )}
                            </div>
                            {!interviewerAnalysis ? (
                                <div className="text-center py-16">
                                    {analysisError ? (
                                        <div className="max-w-md mx-auto space-y-6">
                                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                                                <AlertCircle className="w-8 h-8 text-destructive" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-foreground">Analysis Failed</h3>
                                                <p className="text-muted-foreground text-sm leading-relaxed">{analysisError}</p>
                                            </div>
                                            <Button
                                                onClick={analyzeInterviewerBehavior}
                                                disabled={isAnalyzingInterviewer}
                                                variant="default"
                                                size="lg"
                                                className="w-full sm:w-auto"
                                            >
                                                {isAnalyzingInterviewer ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Retrying Analysis...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Brain className="w-4 h-4 mr-2" />
                                                        Retry Analysis
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="max-w-lg mx-auto space-y-8">
                                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                                <Brain className="w-12 h-12 text-primary" />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-bold tracking-tight">Ready to Analyze</h3>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    Generate comprehensive AI insights about interviewer performance,
                                                    communication style, and professional conduct.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={analyzeInterviewerBehavior}
                                                disabled={isAnalyzingInterviewer}
                                                size="lg"
                                                className="px-8 py-3 h-auto text-base font-medium"
                                            >
                                                {isAnalyzingInterviewer ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        AI Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Brain className="w-5 h-5 mr-2" />
                                                        Start AI Analysis
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Overall Impression - Enhanced */}
                                    <div className="rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 p-8">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Star className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-foreground">Overall Impression</h3>
                                                <p className="text-foreground/80 leading-relaxed text-lg">
                                                    {interviewerAnalysis.overall_impression}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance Summary - Enhanced */}
                                    <Card className="border-0 shadow-md">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-3 text-lg">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                                </div>
                                                Performance Highlights
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    AI Generated
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="space-y-3">
                                                {interviewerAnalysis.performance_summary && interviewerAnalysis.performance_summary.length > 0 ? (
                                                    interviewerAnalysis.performance_summary.map((point, index) => (
                                                        <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                                                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                                            <p className="text-foreground leading-relaxed">{point}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                        <p>No performance summary available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Category Analysis - Enhanced */}
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Category Analysis</h3>
                                            <p className="text-sm sm:text-base text-muted-foreground">
                                                Detailed breakdown across key interview dimensions
                                            </p>
                                        </div>

                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                                                <CardContent className="p-4 sm:p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                                        </div>
                                                        <h4 className="font-semibold text-foreground text-sm sm:text-base">Clarity & Tone</h4>
                                                    </div>
                                                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                                                        {interviewerAnalysis.categories?.clarity_and_tone || "No analysis available"}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                                                <CardContent className="p-4 sm:p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                                        </div>
                                                        <h4 className="font-semibold text-foreground text-sm sm:text-base">Question Relevance</h4>
                                                    </div>
                                                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                                                        {interviewerAnalysis.categories?.question_relevance || "No analysis available"}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                                                <CardContent className="p-4 sm:p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                                        </div>
                                                        <h4 className="font-semibold text-foreground text-sm sm:text-base">Engagement</h4>
                                                    </div>
                                                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                                                        {interviewerAnalysis.categories?.candidate_engagement || "No analysis available"}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                                                <CardContent className="p-4 sm:p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                                        </div>
                                                        <h4 className="font-semibold text-foreground text-sm sm:text-base">Professionalism</h4>
                                                    </div>
                                                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                                                        {interviewerAnalysis.categories?.professionalism || "No analysis available"}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow sm:col-span-2 xl:col-span-1">
                                                <CardContent className="p-4 sm:p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                                                        </div>
                                                        <h4 className="font-semibold text-foreground text-sm sm:text-base">Fairness</h4>
                                                    </div>
                                                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                                                        {interviewerAnalysis.categories?.fairness || "No analysis available"}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* Quality Indicators - Enhanced */}
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Quality Indicators</h3>
                                            <p className="text-sm sm:text-base text-muted-foreground">
                                                Key metrics for interview quality and professionalism
                                            </p>
                                        </div>

                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                            <Card className={`border-0 shadow-md transition-all duration-200 ${interviewerAnalysis.flags?.bias_detected
                                                ? 'bg-red-50 border-red-200 hover:shadow-red-100'
                                                : 'bg-green-50 border-green-200 hover:shadow-green-100'
                                                }`}>
                                                <CardContent className="p-6 text-center">
                                                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${interviewerAnalysis.flags?.bias_detected
                                                        ? 'bg-red-100'
                                                        : 'bg-green-100'
                                                        }`}>
                                                        {interviewerAnalysis.flags?.bias_detected ? (
                                                            <Warning className="w-6 h-6 text-red-600" />
                                                        ) : (
                                                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                        )}
                                                    </div>
                                                    <h4 className={`font-semibold mb-2 ${interviewerAnalysis.flags?.bias_detected
                                                        ? 'text-red-700'
                                                        : 'text-green-700'
                                                        }`}>
                                                        Bias Detection
                                                    </h4>
                                                    <p className={`text-sm ${interviewerAnalysis.flags?.bias_detected
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                        }`}>
                                                        {interviewerAnalysis.flags?.bias_detected
                                                            ? 'Potential bias detected'
                                                            : 'No bias detected'
                                                        }
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className={`border-0 shadow-md transition-all duration-200 ${interviewerAnalysis.flags?.unprofessional_language
                                                ? 'bg-red-50 border-red-200 hover:shadow-red-100'
                                                : 'bg-green-50 border-green-200 hover:shadow-green-100'
                                                }`}>
                                                <CardContent className="p-6 text-center">
                                                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${interviewerAnalysis.flags?.unprofessional_language
                                                        ? 'bg-red-100'
                                                        : 'bg-green-100'
                                                        }`}>
                                                        {interviewerAnalysis.flags?.unprofessional_language ? (
                                                            <Warning className="w-6 h-6 text-red-600" />
                                                        ) : (
                                                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                        )}
                                                    </div>
                                                    <h4 className={`font-semibold mb-2 ${interviewerAnalysis.flags?.unprofessional_language
                                                        ? 'text-red-700'
                                                        : 'text-green-700'
                                                        }`}>
                                                        Language Quality
                                                    </h4>
                                                    <p className={`text-sm ${interviewerAnalysis.flags?.unprofessional_language
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                        }`}>
                                                        {interviewerAnalysis.flags?.unprofessional_language
                                                            ? 'Issues detected'
                                                            : 'Professional maintained'
                                                        }
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className={`border-0 shadow-md transition-all duration-200 ${interviewerAnalysis.flags?.pacing_issues
                                                ? 'bg-amber-50 border-amber-200 hover:shadow-amber-100'
                                                : 'bg-green-50 border-green-200 hover:shadow-green-100'
                                                }`}>
                                                <CardContent className="p-6 text-center">
                                                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${interviewerAnalysis.flags?.pacing_issues
                                                        ? 'bg-amber-100'
                                                        : 'bg-green-100'
                                                        }`}>
                                                        {interviewerAnalysis.flags?.pacing_issues ? (
                                                            <Clock className="w-6 h-6 text-amber-600" />
                                                        ) : (
                                                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                        )}
                                                    </div>
                                                    <h4 className={`font-semibold mb-2 ${interviewerAnalysis.flags?.pacing_issues
                                                        ? 'text-amber-700'
                                                        : 'text-green-700'
                                                        }`}>
                                                        Pacing
                                                    </h4>
                                                    <p className={`text-sm ${interviewerAnalysis.flags?.pacing_issues
                                                        ? 'text-amber-600'
                                                        : 'text-green-600'
                                                        }`}>
                                                        {interviewerAnalysis.flags?.pacing_issues
                                                            ? 'Could be improved'
                                                            : 'Well maintained'
                                                        }
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* Interview Details - Enhanced */}
                                    <Card className="border-0 shadow-md bg-muted/20">
                                        <CardContent className="p-4 sm:p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                                    <Info className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-base sm:text-lg font-semibold">Interview Details</h3>
                                            </div>
                                            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-background/60 border gap-2">
                                                    <span className="text-muted-foreground font-medium text-sm">Interview ID</span>
                                                    <span className="text-foreground font-mono text-xs sm:text-sm bg-muted/30 px-2 py-1 rounded self-start sm:self-auto">
                                                        {interviewerAnalysis.interview_id}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-background/60 border gap-2">
                                                    <span className="text-muted-foreground font-medium text-sm">Interviewer</span>
                                                    <span className="text-foreground font-medium text-sm">
                                                        {interviewerAnalysis.interviewer_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* AI-Powered Recommendations */}
                                    <div className="space-y-6">
                                        {/* Header Section */}
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mb-4">
                                                <Brain className="w-8 h-8 text-primary" />
                                            </div>
                                            <h3 className="text-2xl font-semibold mb-2">
                                                AI-Powered Career Recommendations
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Personalized insights based on your interview performance
                                            </p>
                                        </div>

                                        {/* Loading State */}
                                        {isLoadingRecommendations && (
                                            <Card className="p-8 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                                                <h4 className="text-lg font-semibold mb-2">Analyzing Your Performance</h4>
                                                <p className="text-muted-foreground">Generating personalized recommendations...</p>
                                            </Card>
                                        )}

                                        {/* Error State */}
                                        {recommendationsError && (
                                            <Card className="p-8 text-center">
                                                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                                                <h4 className="text-lg font-semibold mb-2 text-red-700">Failed to Generate Recommendations</h4>
                                                <p className="text-red-600 mb-6">We encountered an issue while analyzing your performance.</p>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => refetchRecommendations()}
                                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                                >
                                                    <Brain className="w-4 h-4 mr-2" />
                                                    Try Again
                                                </Button>
                                            </Card>
                                        )}

                                        {/* Recommendations Content */}
                                        {recommendations && !isLoadingRecommendations && (
                                            <div className="space-y-6">
                                                {/* Priority Improvement Areas */}
                                                <Card className="p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                            <Target className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-semibold">Priority Focus Areas</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Key areas for significant improvement
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary">High Impact</Badge>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {/* Technical Skills */}
                                                        <div className="p-4 rounded-lg border bg-muted/20">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Code className="w-5 h-5 text-primary" />
                                                                <h5 className="font-semibold">{recommendations.priorityAreas.technical.title}</h5>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-4">
                                                                {recommendations.priorityAreas.technical.description}
                                                            </p>
                                                            <div className="space-y-2">
                                                                {recommendations.priorityAreas.technical.actions.map((action, index) => (
                                                                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                                                                        {action}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Communication Skills */}
                                                        <div className="p-4 rounded-lg border bg-muted/20">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <MessageSquare className="w-5 h-5 text-primary" />
                                                                <h5 className="font-semibold">{recommendations.priorityAreas.communication.title}</h5>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-4">
                                                                {recommendations.priorityAreas.communication.description}
                                                            </p>
                                                            <div className="space-y-2">
                                                                {recommendations.priorityAreas.communication.actions.map((action, index) => (
                                                                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                                                                        {action}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>

                                                {/* Final Score */}
                                                <Card className="p-6 bg-primary text-primary-foreground text-center">
                                                    <div className="flex items-center justify-center gap-3 mb-4">
                                                        <Trophy className="w-6 h-6" />
                                                        <h4 className="text-xl font-semibold">Overall Performance Score</h4>
                                                    </div>
                                                    <p className="text-2xl font-bold mb-2">{overallScore.toFixed(1)}/10</p>
                                                    <p className="text-primary-foreground/80 mb-4">
                                                        Start implementing these recommendations today for better results.
                                                    </p>
                                                </Card>
                                            </div>
                                        )}

                                        {/* Empty State - No Session ID */}
                                        {!sessionId && (
                                            <Card className="border">
                                                <CardContent className="p-8 text-center">
                                                    <Info className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                                                    <p className="text-muted-foreground mb-4">No interview session found</p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => navigate('/interview-setup')}
                                                    >
                                                        Start New Interview
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-6 border-t">
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/dashboard')}
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        <Target className="w-4 h-4 mr-2" />
                                        Back to Dashboard
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.print()}
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Report
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/interview-setup')}
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        Start New Interview
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default EnhancedFeedback