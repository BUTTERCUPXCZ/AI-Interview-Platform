import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/Sidebar'

import { useOverallPerformance } from '@/hooks/useOverallPerformance'
import {
    Brain,
    CheckCircle2,
    AlertCircle,
    Star,
    Loader2,
    Award,
    BarChart3,
    MessageSquare,
    TrendingDown as Warning,
    Info,
    Target,
    Trophy,
    TrendingUp,
    Lightbulb,
    BookOpen
} from 'lucide-react'

import type { InterviewConfig } from '@/domain/entities'

interface LocationState {
    sessionId?: number
    config?: InterviewConfig
}


const EnhancedFeedback: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as LocationState
    const sessionId = state?.sessionId

    // Fetch overall performance evaluation from Gemini
    const {
        evaluation: overallPerformance,
        isLoading: isLoadingPerformance,
        error: performanceError,
        refetch: refetchPerformance
    } = useOverallPerformance(sessionId ?? null)


    useEffect(() => {
        if (!sessionId) {
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
                        {/* Overall Performance Score Section */}
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                                        <Trophy className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">
                                            Your Interview Performance
                                        </h2>
                                        <p className="text-muted-foreground">
                                            AI-powered comprehensive evaluation by Gemini
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {isLoadingPerformance ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                                    <p className="text-muted-foreground">Analyzing your interview performance...</p>
                                </div>
                            ) : performanceError ? (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                                    <p className="text-destructive mb-4">Failed to load performance evaluation</p>
                                    <Button onClick={() => refetchPerformance()} variant="outline">
                                        <Brain className="w-4 h-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            ) : overallPerformance ? (
                                <div className="space-y-6">
                                    {/* Overall Score Display */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
                                            <div className="relative w-32 h-32 mb-4">
                                                <svg className="transform -rotate-90 w-32 h-32">
                                                    <circle
                                                        cx="64"
                                                        cy="64"
                                                        r="56"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        className="text-gray-200 dark:text-gray-700"
                                                    />
                                                    <circle
                                                        cx="64"
                                                        cy="64"
                                                        r="56"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        strokeDasharray={`${2 * Math.PI * 56}`}
                                                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallPerformance.overallScore / 100)}`}
                                                        className="text-blue-500 transition-all duration-1000"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                            {overallPerformance.overallScore}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">/ 100</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-lg px-4 py-1 ${
                                                    overallPerformance.overallScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                                    overallPerformance.overallScore >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                                }`}
                                            >
                                                {overallPerformance.performanceRating}
                                            </Badge>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 space-y-4">
                                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                                                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                                    Summary
                                                </h3>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {overallPerformance.summary}
                                                </p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                                                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                                    <Target className="w-5 h-5 text-purple-500" />
                                                    Readiness Level
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {overallPerformance.readinessLevel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Technical Skills Assessment */}
                                    <Card className="bg-white dark:bg-gray-900">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                                Technical Skills Assessment
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {Object.entries(overallPerformance.technicalSkillsAssessment).map(([skill, score]) => (
                                                <div key={skill} className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium capitalize">
                                                            {skill.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        <span className="text-muted-foreground">{score}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                score >= 80 ? 'bg-green-500' :
                                                                score >= 60 ? 'bg-blue-500' :
                                                                'bg-amber-500'
                                                            }`}
                                                            style={{ width: `${score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Strengths and Weaknesses */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                    <TrendingUp className="w-5 h-5" />
                                                    Strengths
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {overallPerformance.strengths.map((strength, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-green-900 dark:text-green-100">{strength}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                                    <Warning className="w-5 h-5" />
                                                    Areas for Improvement
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {overallPerformance.areasForImprovement.map((area, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-amber-900 dark:text-amber-100">{area}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Detailed Feedback */}
                                    <Card className="bg-white dark:bg-gray-900">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Brain className="w-5 h-5 text-purple-500" />
                                                Detailed Feedback
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {overallPerformance.detailedFeedback}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Recommendations and Next Steps */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                                    <Lightbulb className="w-5 h-5" />
                                                    Recommendations
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {overallPerformance.recommendations.map((rec, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <Star className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-blue-900 dark:text-blue-100">{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                                    <BookOpen className="w-5 h-5" />
                                                    Next Steps
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {overallPerformance.nextSteps.map((step, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-purple-900 dark:text-purple-100">{step}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        Complete your interview to see your performance evaluation
                                    </p>
                                </div>
                            )}
                        </Card>

                        
                    </div>
                </main>
            </div>
        </div>
    )
}

export default EnhancedFeedback