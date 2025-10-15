import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/Sidebar'
import { useGetSessionFeedback, useGenerateSessionFeedback } from '../hooks/useInterview'
import jsPDF from 'jspdf'
import {
    Trophy,
    Target,
    MessageSquare,
    Brain,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertCircle,
    Play,
    Star,
    BookOpen,
    ArrowRight,
    Clock,
    Lightbulb,
    Loader2,
    FileText,
    RotateCcw,
    Download
} from 'lucide-react'

import type { InterviewConfig } from '@/domain/entities'

interface LocationState {
    sessionId?: number
    config?: InterviewConfig
}

const Feedback = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as LocationState
    const sessionId = state?.sessionId

    // Get or generate feedback
    const { data: feedback, isLoading, error, refetch } = useGetSessionFeedback(sessionId || 0, !!sessionId)
    const generateFeedback = useGenerateSessionFeedback()

    const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)

    // Generate feedback if it doesn't exist
    useEffect(() => {
        if (sessionId && error && error && typeof error === 'object' && 'status' in error && error.status === 404 && !generateFeedback.isPending) {
            generateFeedback.mutate(sessionId)
        }
    }, [sessionId, error, generateFeedback])

    // Handle feedback generation success
    useEffect(() => {
        if (generateFeedback.isSuccess) {
            refetch()
        }
    }, [generateFeedback.isSuccess, refetch])

    if (!sessionId) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Session Found</h2>
                        <p className="text-gray-600 mb-4">Unable to load feedback. No session ID provided.</p>
                        <Button onClick={() => navigate('/interview-setup')}>
                            Start New Interview
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading || generateFeedback.isPending) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {generateFeedback.isPending ? 'Generating AI Feedback...' : 'Loading Feedback...'}
                        </h2>
                        <p className="text-gray-600">
                            {generateFeedback.isPending
                                ? 'Our AI is analyzing your interview performance. This may take a moment.'
                                : 'Please wait while we retrieve your feedback.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (error && error && typeof error === 'object' && 'status' in error && error.status !== 404) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Feedback</h2>
                        <p className="text-gray-600 mb-4">
                            {generateFeedback.error
                                ? 'Failed to generate feedback. Please try again.'
                                : 'Unable to load your interview feedback.'
                            }
                        </p>
                        <div className="space-x-2">
                            <Button onClick={() => refetch()} variant="outline">
                                Try Again
                            </Button>
                            <Button onClick={() => navigate('/interview-setup')}>
                                Start New Interview
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreIcon = (score: number) => {
        if (score >= 80) return <Trophy className="h-6 w-6 text-green-500" />
        if (score >= 60) return <Target className="h-6 w-6 text-yellow-500" />
        return <AlertCircle className="h-6 w-6 text-red-500" />
    }

    const formatDate = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const generatePDF = () => {
        if (!feedback) return

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 20
        let yPosition = margin

        // Helper function to add text with word wrapping
        const addText = (text: string, fontSize = 12, fontStyle: 'normal' | 'bold' = 'normal') => {
            doc.setFontSize(fontSize)
            if (fontStyle === 'bold') {
                doc.setFont('helvetica', 'bold')
            } else {
                doc.setFont('helvetica', 'normal')
            }

            const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
            lines.forEach((line: string) => {
                if (yPosition > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage()
                    yPosition = margin
                }
                doc.text(line, margin, yPosition)
                yPosition += fontSize * 1.2
            })
            yPosition += 5 // Add extra space after each section
        }

        // Title
        addText('AI Interview Feedback Report', 20, 'bold')
        yPosition += 10

        // Date and Session Info
        addText(`Date: ${feedback.session ? formatDate(feedback.session.endedAt || feedback.session.startedAt) : 'N/A'}`, 12)
        addText(`Session ID: ${sessionId}`, 12)
        yPosition += 10

        // Overall Score
        addText('Overall Performance', 16, 'bold')
        addText(`Score: ${feedback.overallScore}%`, 14, 'bold')
        const performanceText = feedback.overallScore >= 80 ? 'Excellent performance!' :
            feedback.overallScore >= 60 ? 'Good job! Room for improvement.' :
                'Keep practicing and you\'ll improve!'
        addText(performanceText, 12)
        yPosition += 10

        // Category Scores
        if (feedback.categoryScores) {
            addText('AI Evaluation Breakdown', 16, 'bold')
            addText(`Technical Accuracy: ${feedback.categoryScores.technicalAccuracy}%`, 12)
            addText(`Problem Solving: ${feedback.categoryScores.problemSolving}%`, 12)
            addText(`Communication Clarity: ${feedback.categoryScores.communicationClarity}%`, 12)
            addText(`Confidence & Logical Flow: ${feedback.categoryScores.confidenceLogicalFlow}%`, 12)
            yPosition += 10
        }

        // Strengths
        if (feedback.strengths && feedback.strengths.length > 0) {
            addText('Strengths', 16, 'bold')
            feedback.strengths.forEach(strength => {
                addText(`• ${strength}`, 12)
            })
            yPosition += 10
        }

        // Areas for Improvement
        if (feedback.weaknesses && feedback.weaknesses.length > 0) {
            addText('Areas for Improvement', 16, 'bold')
            feedback.weaknesses.forEach(weakness => {
                addText(`• ${weakness}`, 12)
            })
            yPosition += 10
        }

        // Improvement Tips
        if (feedback.improvementTips && feedback.improvementTips.length > 0) {
            addText('Improvement Tips', 16, 'bold')
            feedback.improvementTips.forEach(tip => {
                addText(`• ${tip}`, 12)
            })
            yPosition += 10
        }

        // Recommended Topics
        if (feedback.recommendedTopics && feedback.recommendedTopics.length > 0) {
            addText('Recommended Study Topics', 16, 'bold')
            feedback.recommendedTopics.forEach(topic => {
                addText(`• ${topic}`, 12)
            })
            yPosition += 10
        }

        // Session Details
        if (feedback.session && feedback.session.questions) {
            addText('Session Details', 16, 'bold')
            addText(`Questions Answered: ${feedback.session.questions.length}`, 12)
            addText(`Coding Questions: ${feedback.session.questions.filter(q => q.isCodingQuestion).length}`, 12)
            addText(`Session Status: ${feedback.session.status}`, 12)
            yPosition += 10
        }

        // Footer
        addText('Generated by AI Interview Platform', 10, 'normal')

        // Save the PDF
        const fileName = `interview-feedback-${sessionId}-${new Date().toISOString().split('T')[0]}.pdf`
        doc.save(fileName)
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />

            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-card border-b border-border p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Interview Feedback</h1>
                                <p className="text-muted-foreground">
                                    {feedback?.session ? (
                                        <>Session completed on {formatDate(feedback.session.endedAt || feedback.session.startedAt)}</>
                                    ) : (
                                        'Your comprehensive performance analysis'
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={generatePDF}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View History
                                </Button>
                                <Button onClick={() => navigate('/interview-setup')}>
                                    <Play className="h-4 w-4 mr-2" />
                                    New Interview
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {feedback ? (
                            <>
                                {/* Overall Score */}
                                <Card className="p-6">
                                    <div className="text-center">
                                        <div className="inline-flex items-center gap-3 mb-4">
                                            {getScoreIcon(feedback.overallScore)}
                                            <h2 className="text-2xl font-bold">Overall Performance</h2>
                                        </div>
                                        <div className={`text-6xl font-bold mb-2 ${getScoreColor(feedback.overallScore)}`}>
                                            {feedback.overallScore}%
                                        </div>
                                        <p className="text-lg text-muted-foreground">
                                            {feedback.overallScore >= 80 ? 'Excellent performance!' :
                                                feedback.overallScore >= 60 ? 'Good job! Room for improvement.' :
                                                    'Keep practicing and you\'ll improve!'}
                                        </p>
                                    </div>
                                </Card>

                                {/* AI Evaluation Categories */}
                                {feedback.categoryScores && (
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Brain className="h-5 w-5 text-blue-500" />
                                            <h3 className="text-xl font-semibold text-blue-700">AI Evaluation Breakdown</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Technical Accuracy */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Target className="h-4 w-4 text-indigo-500" />
                                                        <span className="font-medium">Technical Accuracy</span>
                                                    </div>
                                                    <span className={`font-bold ${getScoreColor(feedback.categoryScores.technicalAccuracy)}`}>
                                                        {feedback.categoryScores.technicalAccuracy}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${feedback.categoryScores.technicalAccuracy >= 80 ? 'bg-green-500' :
                                                            feedback.categoryScores.technicalAccuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${feedback.categoryScores.technicalAccuracy}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Problem Solving */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                        <span className="font-medium">Problem Solving</span>
                                                    </div>
                                                    <span className={`font-bold ${getScoreColor(feedback.categoryScores.problemSolving)}`}>
                                                        {feedback.categoryScores.problemSolving}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${feedback.categoryScores.problemSolving >= 80 ? 'bg-green-500' :
                                                            feedback.categoryScores.problemSolving >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${feedback.categoryScores.problemSolving}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Communication Clarity */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4 text-blue-500" />
                                                        <span className="font-medium">Communication Clarity</span>
                                                    </div>
                                                    <span className={`font-bold ${getScoreColor(feedback.categoryScores.communicationClarity)}`}>
                                                        {feedback.categoryScores.communicationClarity}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${feedback.categoryScores.communicationClarity >= 80 ? 'bg-green-500' :
                                                            feedback.categoryScores.communicationClarity >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${feedback.categoryScores.communicationClarity}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Confidence & Logical Flow */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        <span className="font-medium">Confidence & Logic</span>
                                                    </div>
                                                    <span className={`font-bold ${getScoreColor(feedback.categoryScores.confidenceLogicalFlow)}`}>
                                                        {feedback.categoryScores.confidenceLogicalFlow}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${feedback.categoryScores.confidenceLogicalFlow >= 80 ? 'bg-green-500' :
                                                            feedback.categoryScores.confidenceLogicalFlow >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${feedback.categoryScores.confidenceLogicalFlow}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Strengths */}
                                {feedback.strengths && feedback.strengths.length > 0 && (
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp className="h-5 w-5 text-green-500" />
                                            <h3 className="text-xl font-semibold text-green-700">Strengths</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {feedback.strengths.map((strength, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-green-800">{strength}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* Areas for Improvement */}
                                {feedback.weaknesses && feedback.weaknesses.length > 0 && (
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingDown className="h-5 w-5 text-orange-500" />
                                            <h3 className="text-xl font-semibold text-orange-700">Areas for Improvement</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {feedback.weaknesses.map((weakness, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                                                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-orange-800">{weakness}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* Improvement Tips */}
                                {feedback.improvementTips && feedback.improvementTips.length > 0 && (
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Lightbulb className="h-5 w-5 text-blue-500" />
                                            <h3 className="text-xl font-semibold text-blue-700">Improvement Tips</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {feedback.improvementTips.map((tip, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                                    <Star className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-blue-800">{tip}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* Recommended Topics */}
                                {feedback.recommendedTopics && feedback.recommendedTopics.length > 0 && (
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BookOpen className="h-5 w-5 text-purple-500" />
                                            <h3 className="text-xl font-semibold text-purple-700">Recommended Study Topics</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {feedback.recommendedTopics.map((topic, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                    <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                                    <span className="text-purple-800 font-medium">{topic}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 p-3 bg-purple-25 border border-purple-200 rounded-lg">
                                            <p className="text-sm text-purple-700">
                                                <Lightbulb className="h-4 w-4 inline mr-1" />
                                                Focus on these topics to improve your interview performance and technical skills.
                                            </p>
                                        </div>
                                    </Card>
                                )}

                                {/* Session Details */}
                                {feedback.session && (
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="h-5 w-5 text-gray-500" />
                                            <h3 className="text-xl font-semibold">Session Details</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Questions Answered</p>
                                                <p className="text-lg font-semibold">{feedback.session.questions?.length || 0}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Session Duration</p>
                                                <p className="text-lg font-semibold">
                                                    {feedback.session.startedAt && feedback.session.endedAt ? (
                                                        `${Math.round((new Date(feedback.session.endedAt).getTime() - new Date(feedback.session.startedAt).getTime()) / (1000 * 60))} minutes`
                                                    ) : (
                                                        'Not available'
                                                    )}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Coding Questions</p>
                                                <p className="text-lg font-semibold">
                                                    {feedback.session.questions?.filter(q => q.isCodingQuestion).length || 0}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Session Status</p>
                                                <p className="text-lg font-semibold capitalize">{feedback.session.status.toLowerCase()}</p>
                                            </div>
                                        </div>

                                        {showDetailedFeedback && feedback.session.questions && feedback.session.questions.length > 0 && (
                                            <div className="mt-6 pt-6 border-t">
                                                <h4 className="text-lg font-semibold mb-4">Question-by-Question Analysis</h4>
                                                <div className="space-y-4">
                                                    {feedback.session.questions.map((question, index) => (
                                                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <h5 className="font-medium">Question {index + 1}</h5>
                                                                {question.score !== null && (
                                                                    <span className={`text-sm font-medium ${getScoreColor(question.score || 0)}`}>
                                                                        {question.score}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-700 mb-2">{question.questionText}</p>
                                                            {question.userAnswer && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Your Answer: </span>
                                                                    <span className="text-gray-600">{question.userAnswer.substring(0, 100)}...</span>
                                                                </div>
                                                            )}
                                                            {question.aiEvaluation && (
                                                                <div className="mt-2 text-sm">
                                                                    <span className="font-medium">AI Feedback: </span>
                                                                    <span className="text-gray-600">{question.aiEvaluation}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
                                                className="gap-2"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                {showDetailedFeedback ? 'Hide' : 'Show'} Detailed Analysis
                                            </Button>
                                        </div>
                                    </Card>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-center gap-4 pt-6">
                                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        View All Sessions
                                    </Button>
                                    <Button onClick={() => navigate('/interview-setup')}>
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Take Another Interview
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Card className="p-8 text-center">
                                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Available</h3>
                                <p className="text-gray-600 mb-4">
                                    Feedback is still being generated or was not found for this session.
                                </p>
                                <Button onClick={() => refetch()}>
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Check Again
                                </Button>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Feedback