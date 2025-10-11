// Domain entities representing the core business objects
// These are framework-agnostic and contain the business logic

export interface User {
    id: number
    firstname: string
    lastname: string
    email: string
    role: string
}

export interface InterviewSession {
    id: number
    userId: number
    domain: Domain
    interviewType: InterviewType
    difficulty: Difficulty
    duration: number
    format: InterviewFormat
    role: string
    status: SessionStatus
    startedAt: Date
    endedAt?: Date
    totalScore?: number
}

export interface InterviewQuestion {
    id: number
    sessionId: number
    questionText: string
    userAnswer?: string
    aiEvaluation?: string
    score?: number
    isCodingQuestion: boolean
    codingLanguage?: ProgrammingLanguage
    starterCode?: string
    expectedOutput?: string
    createdAt: Date
    testCases?: TestCase[]
}

export interface TestCase {
    id: number
    questionId: number
    input: string
    expectedOutput: string
    description?: string
}

export interface CodeSubmission {
    id: number
    questionId: number
    code: string
    language: ProgrammingLanguage
    isCorrect?: boolean
    passedTests: number
    totalTests: number
    submittedAt: Date
}

export interface AIAnalysis {
    id: number
    sessionId: number
    overallScore?: number
    strengths?: string
    weaknesses?: string
    improvementTips?: string
    createdAt: Date
}

export interface CodingQuestion {
    id?: number
    title: string
    description: string
    difficulty: string
    language: string
    starterCode: string
    testCases: TestCase[]
    hints: string[]
    timeComplexityExpected: string
    spaceComplexityExpected: string
    isCodingQuestion?: boolean
}

export interface CodeEvaluation {
    overallScore: number
    breakdown: {
        correctness: number
        codeQuality: number
        efficiency: number
        edgeCaseHandling: number
    }
    feedback: string
    strengths: string[]
    improvements: string[]
    timeComplexity: string
    spaceComplexity: string
    passedAllTests: boolean
    recommendations: string
}

export interface CodeExecutionResult {
    success: boolean
    output?: string
    error?: string
    executionTime: number
    testResults?: Array<{
        passed: boolean
        input: string
        expectedOutput: string
        actualOutput?: string
        error?: string
    }>
}

export interface SessionFeedback {
    id: number
    sessionId: number
    overallScore: number
    strengths: string[]
    weaknesses: string[]
    improvementTips: string[]
    createdAt: Date
    // New AI evaluation categories
    categoryScores?: {
        technicalAccuracy: number
        problemSolving: number
        communicationClarity: number
        confidenceLogicalFlow: number
    }
    recommendedTopics?: string[]
    session: {
        id: number
        status: string
        startedAt: Date
        endedAt?: Date
        questions: Array<{
            questionText: string
            userAnswer?: string
            score?: number
            aiEvaluation?: string
            isCodingQuestion: boolean
            codingLanguage?: string
        }>
    }
}

// Enums as const objects for better compatibility
export const Domain = {
    FRONTEND: 'FRONTEND',
    BACKEND: 'BACKEND',
    FULLSTACK: 'FULLSTACK',
    DATA_SCIENCE: 'DATA_SCIENCE',
    MOBILE: 'MOBILE',
    DEVOPS: 'DEVOPS'
} as const

export const InterviewType = {
    TECHNICAL: 'TECHNICAL',
    BEHAVIORAL: 'BEHAVIORAL',
    SYSTEM_DESIGN: 'SYSTEM_DESIGN'
} as const

export const Difficulty = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced'
} as const

export const InterviewFormat = {
    TEXT: 'Text',
    VOICE: 'Voice'
} as const

export const SessionStatus = {
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELED: 'CANCELED'
} as const

export const ProgrammingLanguage = {
    JAVASCRIPT: 'JAVASCRIPT',
    TYPESCRIPT: 'TYPESCRIPT',
    PYTHON: 'PYTHON',
    JAVA: 'JAVA',
    CSHARP: 'CSHARP',
    CPP: 'CPP',
    GO: 'GO',
    RUST: 'RUST'
} as const

// Type definitions for the const objects
export type Domain = typeof Domain[keyof typeof Domain]
export type InterviewType = typeof InterviewType[keyof typeof InterviewType]
export type Difficulty = typeof Difficulty[keyof typeof Difficulty]
export type InterviewFormat = typeof InterviewFormat[keyof typeof InterviewFormat]
export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus]
export type ProgrammingLanguage = typeof ProgrammingLanguage[keyof typeof ProgrammingLanguage]

// Value objects for configuration
export interface InterviewConfig {
    domain: string
    interviewType: string
    difficulty: Difficulty
    duration: number
    format: InterviewFormat
    enableCodingSandbox?: boolean
}

// API Response types
export interface ApiResponse<T> {
    data: T
    message?: string
    error?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
}

// Error types
export class DomainError extends Error {
    public code: string
    public statusCode: number

    constructor(
        message: string,
        code: string,
        statusCode: number = 400
    ) {
        super(message)
        this.name = 'DomainError'
        this.code = code
        this.statusCode = statusCode
    }
}

export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400)
    }
}

export class NotFoundError extends DomainError {
    constructor(resource: string) {
        super(`${resource} not found`, 'NOT_FOUND', 404)
    }
}

export class UnauthorizedError extends DomainError {
    constructor() {
        super('Unauthorized', 'UNAUTHORIZED', 401)
    }
}