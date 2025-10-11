import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Sidebar from '@/components/Sidebar'
import {
    Trophy,
    Target,
    Brain,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertCircle,
    Star,
    BookOpen,
    ArrowRight,
    Clock,
    Lightbulb,
    Loader2,
    FileText,
    Download,
    Award,
    BarChart3,
    Users,
    Code,
    Globe,
    Server,
    Layers,
    MessageSquare
} from 'lucide-react'

// Simple Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
        <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
    </div>
)

interface LocationState {
    sessionId?: number
    config?: any
}

interface SkillRating {
    skill: string
    rating: number
    evidence: string
    improvementTips: string[]
}

interface Resource {
    title: string
    type: string
    description: string
    estimatedTime?: string
}

interface DetailedFeedback {
    overallScore: number
    performanceAnalysis: {
        domain: string
        interviewType: string
        totalQuestions: number
        answeredQuestions: number
        completionRate: number
        averageScore: number
    }
    skillAssessment: {
        technicalSkills: SkillRating[]
        softSkills: SkillRating[]
        domainSpecificSkills: SkillRating[]
    }
    strengths: string[]
    weaknesses: string[]
    detailedFeedback: {
        whatWentWell: string[]
        areasForImprovement: string[]
        specificRecommendations: string[]
    }
    learningPath: {
        immediateActions: string[]
        shortTermGoals: string[]
        longTermGoals: string[]
        recommendedResources: Resource[]
    }
    benchmarkComparison: {
        percentileRank: number
        comparisonText: string
    }
    nextSteps: string[]
}

const EnhancedFeedback = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as LocationState
    const sessionId = state?.sessionId

    const [feedback, setFeedback] = useState<DetailedFeedback | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (sessionId) {
            generateComprehensiveFeedback()
        } else {
            setError('Session ID not found')
            setIsLoading(false)
        }
    }, [sessionId])

    const generateComprehensiveFeedback = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/interview/session/${sessionId}/comprehensive-feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to generate feedback')
            }

            const data = await response.json()
            setFeedback(data.comprehensiveFeedback)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const getDomainIcon = (domain: string) => {
        switch (domain.toLowerCase()) {
            case 'frontend': return Globe
            case 'backend': return Server
            case 'fullstack': return Layers
            case 'data-science': return BarChart3
            case 'mobile': return Target
            case 'devops': return Code
            default: return Target
        }
    }

    const getInterviewTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'technical': return Code
            case 'behavioral': return Users
            case 'system-design': return BarChart3
            default: return MessageSquare
        }
    }

    const getSkillColor = (rating: number) => {
        if (rating >= 8) return 'text-green-600 bg-green-50 border-green-200'
        if (rating >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    const getResourceIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'course': return BookOpen
            case 'article': return FileText
            case 'book': return BookOpen
            case 'practice': return Target
            case 'tutorial': return Lightbulb
            default: return BookOpen
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p className="text-lg font-medium">Analyzing your performance...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            AI is generating comprehensive feedback
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !feedback) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-medium">Failed to load feedback</p>
                        <p className="text-sm text-muted-foreground mt-2">{error}</p>
                        <Button onClick={() => navigate('/dashboard')} className="mt-4">
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-6xl mx-auto p-6 space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Interview Performance Report</h1>
                                <div className="flex items-center gap-4 text-blue-100">
                                    <div className="flex items-center gap-2">
                                        {React.createElement(getDomainIcon(feedback.performanceAnalysis.domain), { className: "w-5 h-5" })}
                                        <span>{feedback.performanceAnalysis.domain}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {React.createElement(getInterviewTypeIcon(feedback.performanceAnalysis.interviewType), { className: "w-5 h-5" })}
                                        <span>{feedback.performanceAnalysis.interviewType}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold">{feedback.overallScore.toFixed(1)}</div>
                                <div className="text-sm">Overall Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Overview */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Completion Rate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-2">
                                    {feedback.performanceAnalysis.completionRate}%
                                </div>
                                <Progress value={feedback.performanceAnalysis.completionRate} className="mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    {feedback.performanceAnalysis.answeredQuestions} of {feedback.performanceAnalysis.totalQuestions} questions answered
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-500" />
                                    Average Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-2">
                                    {feedback.performanceAnalysis.averageScore.toFixed(1)}/10
                                </div>
                                <Progress value={feedback.performanceAnalysis.averageScore * 10} className="mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Based on answered questions
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-purple-500" />
                                    Percentile Rank
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-2">
                                    {feedback.benchmarkComparison.percentileRank}%
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {feedback.benchmarkComparison.comparisonText}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Analysis Tabs */}
                    <Card>
                        <CardContent className="p-6">
                            <Tabs defaultValue="skills" className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="skills">Skills Assessment</TabsTrigger>
                                    <TabsTrigger value="strengths">Strengths & Weaknesses</TabsTrigger>
                                    <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
                                    <TabsTrigger value="learning">Learning Path</TabsTrigger>
                                    <TabsTrigger value="next">Next Steps</TabsTrigger>
                                </TabsList>

                                <TabsContent value="skills" className="space-y-6 mt-6">
                                    <div className="space-y-6">
                                        {/* Technical Skills */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Code className="w-5 h-5" />
                                                Technical Skills
                                            </h3>
                                            <div className="space-y-3">
                                                {feedback.skillAssessment.technicalSkills.map((skill, index) => (
                                                    <div key={index} className={`p-4 rounded-lg border ${getSkillColor(skill.rating)}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium">{skill.skill}</span>
                                                            <Badge variant="outline" className="bg-white">
                                                                {skill.rating}/10
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm mb-2">{skill.evidence}</p>
                                                        {skill.improvementTips.length > 0 && (
                                                            <ul className="text-xs space-y-1">
                                                                {skill.improvementTips.map((tip, tipIndex) => (
                                                                    <li key={tipIndex} className="flex items-start gap-2">
                                                                        <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                        {tip}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Domain Specific Skills */}
                                        {feedback.skillAssessment.domainSpecificSkills.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                    {React.createElement(getDomainIcon(feedback.performanceAnalysis.domain), { className: "w-5 h-5" })}
                                                    {feedback.performanceAnalysis.domain} Skills
                                                </h3>
                                                <div className="space-y-3">
                                                    {feedback.skillAssessment.domainSpecificSkills.map((skill, index) => (
                                                        <div key={index} className={`p-4 rounded-lg border ${getSkillColor(skill.rating)}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-medium">{skill.skill}</span>
                                                                <Badge variant="outline" className="bg-white">
                                                                    {skill.rating}/10
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm mb-2">{skill.evidence}</p>
                                                            {skill.improvementTips.length > 0 && (
                                                                <ul className="text-xs space-y-1">
                                                                    {skill.improvementTips.map((tip, tipIndex) => (
                                                                        <li key={tipIndex} className="flex items-start gap-2">
                                                                            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                            {tip}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Soft Skills */}
                                        {feedback.skillAssessment.softSkills.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    Soft Skills
                                                </h3>
                                                <div className="space-y-3">
                                                    {feedback.skillAssessment.softSkills.map((skill, index) => (
                                                        <div key={index} className={`p-4 rounded-lg border ${getSkillColor(skill.rating)}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-medium">{skill.skill}</span>
                                                                <Badge variant="outline" className="bg-white">
                                                                    {skill.rating}/10
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm mb-2">{skill.evidence}</p>
                                                            {skill.improvementTips.length > 0 && (
                                                                <ul className="text-xs space-y-1">
                                                                    {skill.improvementTips.map((tip, tipIndex) => (
                                                                        <li key={tipIndex} className="flex items-start gap-2">
                                                                            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                            {tip}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="strengths" className="space-y-6 mt-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <Card className="border-green-200 bg-green-50">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-green-700">
                                                    <TrendingUp className="w-5 h-5" />
                                                    Strengths
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {feedback.strengths.map((strength, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-green-700">
                                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                            {strength}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-red-200 bg-red-50">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-red-700">
                                                    <TrendingDown className="w-5 h-5" />
                                                    Areas for Improvement
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {feedback.weaknesses.map((weakness, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-red-700">
                                                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                            {weakness}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="feedback" className="space-y-6 mt-6">
                                    <div className="space-y-6">
                                        <Card className="border-green-200">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-green-700">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    What Went Well
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {feedback.detailedFeedback.whatWentWell.map((item, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <Star className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-yellow-200">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-yellow-700">
                                                    <Target className="w-5 h-5" />
                                                    Areas for Improvement
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {feedback.detailedFeedback.areasForImprovement.map((item, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <ArrowRight className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-blue-200">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-blue-700">
                                                    <Lightbulb className="w-5 h-5" />
                                                    Specific Recommendations
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2">
                                                    {feedback.detailedFeedback.specificRecommendations.map((item, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <Brain className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="learning" className="space-y-6 mt-6">
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-red-600">
                                                        <Clock className="w-5 h-5" />
                                                        Immediate Actions
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {feedback.learningPath.immediateActions.map((action, index) => (
                                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                                                {action}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                                                        <Target className="w-5 h-5" />
                                                        Short-term Goals
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {feedback.learningPath.shortTermGoals.map((goal, index) => (
                                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                                                {goal}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-green-600">
                                                        <Trophy className="w-5 h-5" />
                                                        Long-term Goals
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {feedback.learningPath.longTermGoals.map((goal, index) => (
                                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                                                {goal}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Recommended Resources */}
                                        {feedback.learningPath.recommendedResources.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <BookOpen className="w-5 h-5" />
                                                        Recommended Resources
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {feedback.learningPath.recommendedResources.map((resource, index) => (
                                                            <div key={index} className="p-4 border rounded-lg">
                                                                <div className="flex items-start gap-3">
                                                                    {React.createElement(getResourceIcon(resource.type), {
                                                                        className: "w-5 h-5 mt-0.5 text-blue-500 flex-shrink-0"
                                                                    })}
                                                                    <div className="flex-1">
                                                                        <h4 className="font-medium">{resource.title}</h4>
                                                                        <Badge variant="outline" className="mt-1 mb-2">
                                                                            {resource.type}
                                                                        </Badge>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {resource.description}
                                                                        </p>
                                                                        {resource.estimatedTime && (
                                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                                Estimated time: {resource.estimatedTime}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="next" className="space-y-6 mt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <ArrowRight className="w-5 h-5" />
                                                Next Steps
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {feedback.nextSteps.map((step, index) => (
                                                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <p className="text-sm">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t">
                        <Button variant="outline" onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => window.print()}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Report
                            </Button>
                            <Button onClick={() => navigate('/interview-setup')}>
                                Start New Interview
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EnhancedFeedback