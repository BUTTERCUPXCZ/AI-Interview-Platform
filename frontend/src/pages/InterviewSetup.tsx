import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCreateInterviewSession, useStartTextInterview, useGenerateCodingQuestion } from '../hooks/useInterview'
import { useAuth } from '../contexts/AuthContext'
import type { InterviewConfig, Difficulty, InterviewFormat } from '../domain/entities'
import {
    PlayCircle,
    Clock,
    BookOpen,
    Code,
    Layers,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    Globe,
    GraduationCap,
    MessageSquare,
    Mic,
    BarChart3,
    Users,
    Zap,
    Monitor,
    Server,
    PieChart
} from 'lucide-react'

const InterviewSetup = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const createSession = useCreateInterviewSession()
    const startTextInterview = useStartTextInterview()
    const generateCodingQuestion = useGenerateCodingQuestion()

    const [config, setConfig] = useState<InterviewConfig>({
        domain: '',
        interviewType: '',
        difficulty: 'Intermediate' as Difficulty,
        duration: 20,
        format: 'Text' as InterviewFormat,
        enableCodingSandbox: false
    })

    const [selectedLanguage, setSelectedLanguage] = useState('javascript')
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)

    const domains = [
        { id: 'frontend', name: 'Frontend Development', icon: Globe, color: 'blue', description: 'React, Vue, Angular, JavaScript' },
        { id: 'backend', name: 'Backend Development', icon: Server, color: 'green', description: 'Node.js, Python, Java, APIs' },
        { id: 'fullstack', name: 'Full Stack', icon: Layers, color: 'purple', description: 'Frontend + Backend + Database' },
        { id: 'data-science', name: 'Data Science', icon: BarChart3, color: 'orange', description: 'Python, ML, Statistics, Analytics' },
        { id: 'mobile', name: 'Mobile Development', icon: Monitor, color: 'pink', description: 'React Native, Flutter, iOS, Android' },
        { id: 'devops', name: 'DevOps', icon: Zap, color: 'yellow', description: 'AWS, Docker, Kubernetes, CI/CD' }
    ]

    const interviewTypes = [
        { id: 'technical', name: 'Technical', icon: Code, color: 'blue', description: 'Coding problems and technical concepts' },
        { id: 'behavioral', name: 'Behavioral', icon: Users, color: 'green', description: 'Soft skills and past experiences' },
        { id: 'system-design', name: 'System Design', icon: PieChart, color: 'purple', description: 'Architecture and scalability discussions' }
    ]

    const difficultyLevels = [
        { id: 'Beginner', name: 'Beginner', color: 'green', description: 'Entry level questions' },
        { id: 'Intermediate', name: 'Intermediate', color: 'yellow', description: 'Mid-level complexity' },
        { id: 'Advanced', name: 'Advanced', color: 'red', description: 'Senior level challenges' }
    ]

    const durations = [10, 20, 30]

    const formats = [
        { id: 'Text', name: 'Text-based', icon: MessageSquare, description: 'Written questions and answers' },
        { id: 'Voice', name: 'Voice-based', icon: Mic, description: 'Spoken conversation with AI' }
    ]

    const programmingLanguages = [
        { id: 'javascript', name: 'JavaScript', color: 'yellow' },
        { id: 'typescript', name: 'TypeScript', color: 'blue' },
        { id: 'python', name: 'Python', color: 'green' },
        { id: 'java', name: 'Java', color: 'orange' },
        { id: 'csharp', name: 'C#', color: 'purple' },
        { id: 'cpp', name: 'C++', color: 'blue' },
        { id: 'go', name: 'Go', color: 'cyan' },
        { id: 'rust', name: 'Rust', color: 'orange' }
    ]

    const handleStartInterview = async () => {
        if (!isConfigComplete || !user) return

        try {
            console.log('Creating interview session with config:', config)
            setIsGeneratingQuestion(true)

            // Check if it's a technical interview with coding sandbox enabled
            if (config.interviewType === 'technical' && config.enableCodingSandbox) {
                // Create a session first to get sessionId
                const session = await new Promise((resolve, reject) => {
                    createSession.mutate(
                        { config, userId: user.id },
                        {
                            onSuccess: (data) => {
                                console.log('Session created successfully:', data)
                                resolve(data)
                            },
                            onError: (error) => {
                                console.error('Failed to create session:', error)
                                reject(error)
                            }
                        }
                    )
                })

                // Generate a coding question for the session
                const question = await new Promise((resolve, reject) => {
                    generateCodingQuestion.mutate(
                        {
                            domain: config.domain,
                            difficulty: config.difficulty,
                            language: selectedLanguage,
                            sessionId: (session as any).session?.id || (session as any).id
                        },
                        {
                            onSuccess: (data) => {
                                console.log('Coding question generated successfully:', data)
                                resolve(data)
                            },
                            onError: (error) => {
                                console.error('Failed to generate coding question:', error)
                                reject(error)
                            }
                        }
                    )
                })

                // Navigate to coding sandbox with session data and generated question
                navigate('/coding-sandbox', {
                    state: {
                        sessionId: (session as any).session?.id || (session as any).id,
                        domain: config.domain,
                        difficulty: config.difficulty,
                        language: selectedLanguage,
                        duration: config.duration,
                        question: question
                    }
                })
            } else if (config.format === 'Text' || !config.enableCodingSandbox) {
                // For text-based interviews or technical interviews without coding sandbox
                const result = await new Promise((resolve, reject) => {
                    startTextInterview.mutate(
                        { config, userId: user.id },
                        {
                            onSuccess: (data) => {
                                console.log('Text interview started successfully:', data)
                                resolve(data)
                            },
                            onError: (error) => {
                                console.error('Failed to start text interview:', error)
                                reject(error)
                            }
                        }
                    )
                })

                // Navigate to text interview session with the session data
                navigate('/text-interview-session', {
                    state: {
                        ...config,
                        sessionId: (result as any).session.id,
                        currentQuestion: (result as any).currentQuestion
                    }
                })
            } else {
                // For other interview types (behavioral, system-design), create session first
                const session = await new Promise((resolve, reject) => {
                    createSession.mutate(
                        { config, userId: user.id },
                        {
                            onSuccess: (data) => {
                                console.log('Session created successfully:', data)
                                resolve(data)
                            },
                            onError: (error) => {
                                console.error('Failed to create session:', error)
                                reject(error)
                            }
                        }
                    )
                })

                // Navigate to interview session with the session data
                navigate('/interview-session', {
                    state: {
                        ...config,
                        sessionId: (session as any).id
                    }
                })
            }
        } catch (error) {
            console.error('Error starting interview:', error)
            // TODO: Show error toast/notification
        } finally {
            setIsGeneratingQuestion(false)
        }
    }

    const isConfigComplete = config.domain && config.interviewType && config.difficulty && user

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-card border-b border-border p-3">
                    <div className="max-w-6xl ">
                        <div className="flex items-center gap-4 mb-2">

                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    Interview Setup
                                </h1>

                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-background to-muted/20">
                    <div className="grid gap-8 max-w-6xl mx-auto">
                        {/* Domain Selection */}
                        <Card className="p-8 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-b border-border">
                            <div className="flex items-center gap-4 mb-8">

                                <div>
                                    <h3 className="text-2xl font-bold">Choose Your Domain</h3>
                                    <p className="text-muted-foreground">Select the area you want to be interviewed in</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {domains.map((domain) => {
                                    const Icon = domain.icon
                                    const isSelected = config.domain === domain.id

                                    return (
                                        <div
                                            key={domain.id}
                                            className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${isSelected
                                                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/50 bg-gradient-to-br from-card to-muted/20'
                                                }`}
                                            onClick={() => setConfig(prev => ({ ...prev, domain: domain.id }))}
                                        >
                                            <div className="flex flex-col items-start gap-3">
                                                <div className={`p-3 rounded-xl bg-${domain.color}-500/10 group-hover:bg-${domain.color}-500/20 transition-colors`}>
                                                    <Icon className={`h-6 w-6 text-${domain.color}-500`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg mb-1">{domain.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{domain.description}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-4 right-4">
                                                    <CheckCircle className="h-5 w-5 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>

                        {/* Interview Type Selection */}
                        <Card className="p-8 shadow-lg border-b border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-8">

                                <div>
                                    <h3 className="text-2xl font-bold">Interview Type</h3>
                                    <p className="text-muted-foreground">What kind of interview would you like?</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                {interviewTypes.map((type) => {
                                    const Icon = type.icon
                                    const isSelected = config.interviewType === type.id

                                    return (
                                        <div
                                            key={type.id}
                                            className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${isSelected
                                                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/50 bg-gradient-to-br from-card to-muted/20'
                                                }`}
                                            onClick={() => setConfig(prev => ({ ...prev, interviewType: type.id }))}
                                        >
                                            <div className="flex flex-col items-start gap-3">
                                                <div className={`p-3 rounded-xl bg-${type.color}-500/10 group-hover:bg-${type.color}-500/20 transition-colors`}>
                                                    <Icon className={`h-6 w-6 text-${type.color}-500`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg mb-1">{type.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{type.description}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-4 right-4">
                                                    <CheckCircle className="h-5 w-5 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>

                        {/* Difficulty and Duration */}
                        <div className="grid gap-8 md:grid-cols-2">
                            {/* Coding Sandbox Option - Only for technical interviews */}
                            {config.interviewType === 'technical' && (config.domain === 'frontend' || config.domain === 'backend' || config.domain === 'fullstack') && (
                                <Card className="p-8 border-b border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm md:col-span-2">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                            <Code className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">Coding Sandbox</h3>
                                            <p className="text-muted-foreground">Enable interactive code editor for hands-on coding challenges</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div
                                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${config.enableCodingSandbox
                                                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/50 bg-gradient-to-br from-card to-muted/20'
                                                }`}
                                            onClick={() => setConfig(prev => ({ ...prev, enableCodingSandbox: true }))}
                                        >
                                            <div className="flex flex-col items-start gap-3">
                                                <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                                    <Code className="h-6 w-6 text-green-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg mb-1">Enable Coding Sandbox</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Interactive Monaco Editor with syntax highlighting, code execution, and AI evaluation
                                                    </p>
                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Real-time code execution
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                                            <CheckCircle className="h-3 w-3" />
                                                            AI-powered code evaluation
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Multiple language support
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {config.enableCodingSandbox && (
                                                <div className="absolute top-4 right-4">
                                                    <CheckCircle className="h-5 w-5 text-primary" />
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${!config.enableCodingSandbox
                                                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                                                : 'border-border hover:border-primary/50 bg-gradient-to-br from-card to-muted/20'
                                                }`}
                                            onClick={() => setConfig(prev => ({ ...prev, enableCodingSandbox: false }))}
                                        >
                                            <div className="flex flex-col items-start gap-3">
                                                <div className="p-3 rounded-xl bg-gray-500/10 group-hover:bg-gray-500/20 transition-colors">
                                                    <MessageSquare className="h-6 w-6 text-gray-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg mb-1">Text-Only Interview</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Traditional question-answer format with text responses
                                                    </p>
                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Conceptual questions
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Theory-based evaluation
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Faster completion
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {!config.enableCodingSandbox && (
                                                <div className="absolute top-4 right-4">
                                                    <CheckCircle className="h-5 w-5 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Programming Language Selection - Only for technical interviews with coding sandbox */}
                            {config.interviewType === 'technical' && config.enableCodingSandbox && (
                                <Card className="p-8 border-b border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm md:col-span-2">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                                            <Code className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">Programming Language</h3>
                                            <p className="text-muted-foreground">Choose your preferred coding language</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-4">
                                        {programmingLanguages.map((language) => {
                                            const isSelected = selectedLanguage === language.id

                                            return (
                                                <div
                                                    key={language.id}
                                                    className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-105 ${isSelected
                                                        ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                                                        : 'border-border hover:border-primary/50 bg-gradient-to-br from-card to-muted/20'
                                                        }`}
                                                    onClick={() => setSelectedLanguage(language.id)}
                                                >
                                                    <div className="text-center">
                                                        <div className={`w-12 h-12 mx-auto mb-2 rounded-lg bg-${language.color}-500/10 flex items-center justify-center group-hover:bg-${language.color}-500/20 transition-colors`}>
                                                            <Code className={`h-6 w-6 text-${language.color}-500`} />
                                                        </div>
                                                        <h4 className="font-semibold text-sm">{language.name}</h4>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle className="h-4 w-4 text-primary" />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Card>
                            )}

                            {/* Difficulty Level */}
                            <Card className="p-8 border-b border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                                <div className="flex items-center gap-4 mb-8">

                                    <div>
                                        <h3 className="text-2xl font-bold">Difficulty Level</h3>
                                        <p className="text-muted-foreground">Choose your challenge level</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {difficultyLevels.map((level) => {
                                        const isSelected = config.difficulty === level.id

                                        return (
                                            <div
                                                key={level.id}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                                                    ? 'border-primary bg-gradient-to-r from-primary/10 to-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                                onClick={() => setConfig(prev => ({ ...prev, difficulty: level.id as any }))}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{level.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{level.description}</p>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                                        }`}>
                                                        {isSelected && <div className="w-full h-full rounded-full bg-white scale-50" />}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </Card>

                            {/* Duration and Format */}
                            <div className="space-y-8">
                                {/* Duration */}
                                <Card className="p-8 border-b border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                                            <Clock className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Duration</h3>
                                            <p className="text-muted-foreground">How long should it take?</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        {durations.map((duration) => {
                                            const isSelected = config.duration === duration

                                            return (
                                                <button
                                                    key={duration}
                                                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${isSelected
                                                        ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                        }`}
                                                    onClick={() => setConfig(prev => ({ ...prev, duration }))}
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold">{duration}</div>
                                                        <div className="text-sm text-muted-foreground">minutes</div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </Card>

                                {/* Format */}
                                <Card className="p-8 border-b border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl">
                                            <MessageSquare className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Format</h3>
                                            <p className="text-muted-foreground">Choose your preference</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {formats.map((format) => {
                                            const Icon = format.icon
                                            const isSelected = config.format === format.id

                                            return (
                                                <div
                                                    key={format.id}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                                                        ? 'border-primary bg-gradient-to-r from-primary/10 to-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                        }`}
                                                    onClick={() => setConfig(prev => ({ ...prev, format: format.id as any }))}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="h-5 w-5 text-primary" />
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">{format.name}</h4>
                                                            <p className="text-sm text-muted-foreground">{format.description}</p>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                                            }`}>
                                                            {isSelected && <div className="w-full h-full rounded-full bg-white scale-50" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Summary & Start Button */}
                        <Card className="p-8 border-b border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-8">

                                <div>
                                    <h3 className="text-2xl font-bold">Ready to Start?</h3>
                                    <p className="text-muted-foreground">Review your configuration and begin your AI interview</p>
                                </div>
                            </div>

                            {/* Configuration Summary */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
                                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">Domain</p>
                                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                {config.domain ? domains.find(d => d.id === config.domain)?.name : 'Not selected'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm text-green-600 dark:text-green-400">Type</p>
                                            <p className="font-semibold text-green-900 dark:text-green-100">
                                                {config.interviewType ? interviewTypes.find(t => t.id === config.interviewType)?.name : 'Not selected'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="h-5 w-5 text-purple-500" />
                                        <div>
                                            <p className="text-sm text-purple-600 dark:text-purple-400">Difficulty</p>
                                            <p className="font-semibold text-purple-900 dark:text-purple-100">{config.difficulty}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-orange-500" />
                                        <div>
                                            <p className="text-sm text-orange-600 dark:text-orange-400">Duration</p>
                                            <p className="font-semibold text-orange-900 dark:text-orange-100">{config.duration} min • {config.format}</p>
                                        </div>
                                    </div>
                                </div>
                                {config.interviewType === 'technical' && (config.domain === 'frontend' || config.domain === 'backend' || config.domain === 'fullstack') && (
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border border-cyan-200 dark:border-cyan-800">
                                        <div className="flex items-center gap-3">
                                            <Code className="h-5 w-5 text-cyan-500" />
                                            <div>
                                                <p className="text-sm text-cyan-600 dark:text-cyan-400">Coding</p>
                                                <p className="font-semibold text-cyan-900 dark:text-cyan-100">
                                                    {config.enableCodingSandbox
                                                        ? `${programmingLanguages.find(l => l.id === selectedLanguage)?.name || 'JavaScript'} Sandbox`
                                                        : 'Text Only'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>                            {/* Start Button */}
                            <div className="flex items-center justify-between pt-6 border-t border-border">
                                <div className="flex items-center gap-2 text-sm">
                                    {(createSession.isError || startTextInterview.isError || generateCodingQuestion.isError) ? (
                                        <>
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                            <span className="text-red-600 dark:text-red-400">
                                                Error: {createSession.error?.message || startTextInterview.error?.message || generateCodingQuestion.error?.message || 'Failed to start interview'}
                                            </span>
                                        </>
                                    ) : isConfigComplete ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="text-green-600 dark:text-green-400">All set! Ready to start your interview</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-5 w-5 text-amber-500" />
                                            <span className="text-amber-600 dark:text-amber-400">Please select a domain and interview type</span>
                                        </>
                                    )}
                                </div>
                                <Button
                                    onClick={handleStartInterview}
                                    size="lg"
                                    className="gap-3 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    disabled={!isConfigComplete || createSession.isPending || startTextInterview.isPending || generateCodingQuestion.isPending || isGeneratingQuestion}
                                >
                                    {(createSession.isPending || startTextInterview.isPending || generateCodingQuestion.isPending || isGeneratingQuestion) ? (
                                        <>
                                            <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                                            {config.format === 'Text' ? 'Starting Text Interview...' :
                                                config.enableCodingSandbox ? 'Generating Coding Question...' : 'Creating Session...'}
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="h-6 w-6" />
                                            Start AI Interview
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default InterviewSetup