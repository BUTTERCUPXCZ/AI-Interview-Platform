// Application layer - Use cases and business logic coordination
// This layer orchestrates the domain entities and infrastructure

import type {
    InterviewSession,
    InterviewQuestion,
    CodingQuestion,
    CodeEvaluation,
    CodeExecutionResult,
    InterviewConfig,
    ApiResponse,
    SessionFeedback
} from '../domain/entities'
import type { HttpClient } from '../infrastructure/http-client'

// Repository interfaces (dependency inversion principle)
export interface InterviewRepository {
    createSession(sessionData: CreateSessionRequest): Promise<InterviewSession>
    getSession(sessionId: number): Promise<InterviewSession>
    updateSession(sessionId: number, updates: Partial<InterviewSession>): Promise<InterviewSession>
    // Text interview methods
    startTextInterview(sessionData: CreateSessionRequest): Promise<{ session: InterviewSession; currentQuestion: any }>
    getInterviewProgress(sessionId: number): Promise<any>
    completeTextInterview(sessionId: number): Promise<any>
    getInterviewSummary(sessionId: number): Promise<any>
}

export interface QuestionRepository {
    generateCodingQuestion(request: GenerateQuestionRequest): Promise<CodingQuestion>
    getQuestions(sessionId: number): Promise<InterviewQuestion[]>
    submitAnswer(request: SubmitAnswerRequest): Promise<InterviewQuestion>
    // Text interview methods
    getNextTextQuestion(sessionId: number, currentQuestionId?: number): Promise<any>
    submitTextAnswer(sessionId: number, questionId: number, answer: string): Promise<any>
}

export interface CodingRepository {
    executeCode(request: ExecuteCodeRequest): Promise<CodeExecutionResult>
    evaluateCode(request: EvaluateCodeRequest): Promise<{ execution: CodeExecutionResult; evaluation: CodeEvaluation }>
}

export interface FeedbackRepository {
    generateFeedback(sessionId: number): Promise<SessionFeedback>
    getFeedback(sessionId: number): Promise<SessionFeedback>
}

// Request/Response DTOs
export interface CreateSessionRequest {
    userId: number
    domain: string
    interviewType: string
    difficulty: string
    duration: number
    format: string
    enableCodingSandbox?: boolean
}

export interface GenerateQuestionRequest {
    domain: string
    difficulty: string
    language: string
    sessionId?: number
}

export interface SubmitAnswerRequest {
    questionId: number
    userAnswer: string
}

export interface ExecuteCodeRequest {
    code: string
    language: string
    testCases?: Array<{
        input: string
        expectedOutput: string
        description?: string
    }>
}

export interface EvaluateCodeRequest {
    code: string
    language: string
    questionText?: string
    questionId?: number
    testCases?: Array<{
        input: string
        expectedOutput: string
        description?: string
    }>
}

// Use case implementations
export class InterviewService {
    private interviewRepo: InterviewRepository
    private questionRepo: QuestionRepository
    private codingRepo: CodingRepository
    private feedbackRepo: FeedbackRepository

    constructor(
        interviewRepo: InterviewRepository,
        questionRepo: QuestionRepository,
        codingRepo: CodingRepository,
        feedbackRepo: FeedbackRepository
    ) {
        this.interviewRepo = interviewRepo
        this.questionRepo = questionRepo
        this.codingRepo = codingRepo
        this.feedbackRepo = feedbackRepo
    }

    async createInterviewSession(config: InterviewConfig, userId: number): Promise<InterviewSession> {
        const sessionData: CreateSessionRequest = {
            userId,
            domain: config.domain,
            interviewType: config.interviewType,
            difficulty: config.difficulty,
            duration: config.duration,
            format: config.format,
            enableCodingSandbox: config.enableCodingSandbox
        }

        // Check if it's a text interview and use the appropriate endpoint
        if (config.format === 'Text') {
            const response = await this.interviewRepo.startTextInterview(sessionData)
            return response.session
        } else {
            return this.interviewRepo.createSession(sessionData)
        }
    }

    async startTextInterview(config: InterviewConfig, userId: number): Promise<{ session: InterviewSession; currentQuestion: any }> {
        const sessionData: CreateSessionRequest = {
            userId,
            domain: config.domain,
            interviewType: config.interviewType,
            difficulty: config.difficulty,
            duration: config.duration,
            format: config.format,
            enableCodingSandbox: config.enableCodingSandbox
        }

        console.log('Sending session data to backend:', sessionData)
        return this.interviewRepo.startTextInterview(sessionData)
    }

    async getNextTextQuestion(sessionId: number, currentQuestionId?: number): Promise<any> {
        return this.questionRepo.getNextTextQuestion(sessionId, currentQuestionId)
    }

    async submitTextAnswer(sessionId: number, questionId: number, answer: string): Promise<any> {
        return this.questionRepo.submitTextAnswer(sessionId, questionId, answer)
    }

    async getInterviewProgress(sessionId: number): Promise<any> {
        return this.interviewRepo.getInterviewProgress(sessionId)
    }

    async completeTextInterview(sessionId: number): Promise<any> {
        return this.interviewRepo.completeTextInterview(sessionId)
    }

    async getInterviewSummary(sessionId: number): Promise<any> {
        return this.interviewRepo.getInterviewSummary(sessionId)
    }

    async getInterviewSession(sessionId: number): Promise<InterviewSession> {
        return this.interviewRepo.getSession(sessionId)
    }

    async generateCodingQuestion(request: GenerateQuestionRequest): Promise<CodingQuestion> {
        return this.questionRepo.generateCodingQuestion(request)
    }

    async getSessionQuestions(sessionId: number): Promise<InterviewQuestion[]> {
        return this.questionRepo.getQuestions(sessionId)
    }

    async submitAnswer(questionId: number, answer: string): Promise<InterviewQuestion> {
        return this.questionRepo.submitAnswer({ questionId, userAnswer: answer })
    }

    async executeCode(request: ExecuteCodeRequest): Promise<CodeExecutionResult> {
        return this.codingRepo.executeCode(request)
    }

    async evaluateCode(request: EvaluateCodeRequest): Promise<{ execution: CodeExecutionResult; evaluation: CodeEvaluation }> {
        return this.codingRepo.evaluateCode(request)
    }

    async generateSessionFeedback(sessionId: number): Promise<SessionFeedback> {
        return this.feedbackRepo.generateFeedback(sessionId)
    }

    async getSessionFeedback(sessionId: number): Promise<SessionFeedback> {
        return this.feedbackRepo.getFeedback(sessionId)
    }

    async completeSession(sessionId: number): Promise<SessionFeedback> {
        // Generate feedback and update session status
        const feedback = await this.generateSessionFeedback(sessionId)

        // Update session to completed status
        await this.interviewRepo.updateSession(sessionId, {
            status: 'COMPLETED' as any,
            endedAt: new Date(),
            totalScore: feedback.overallScore || 0
        })

        return feedback
    }
}

// Concrete repository implementations
export class ApiInterviewRepository implements InterviewRepository {
    private httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient
    }

    async createSession(sessionData: CreateSessionRequest): Promise<InterviewSession> {
        // Check if it's a text interview and use the appropriate endpoint
        if (sessionData.format === 'Text') {
            const response = await this.httpClient.post<{ session: InterviewSession; currentQuestion: any }>('/interview/text/start', sessionData)
            return response.session
        } else {
            const response = await this.httpClient.post<ApiResponse<{ session: InterviewSession; questions: InterviewQuestion[] }>>('/interview/session/create', sessionData)
            return response.data.session
        }
    }

    async getSession(sessionId: number): Promise<InterviewSession> {
        return this.httpClient.get<InterviewSession>(`/interview/session/${sessionId}`)
    }

    async updateSession(sessionId: number, updates: Partial<InterviewSession>): Promise<InterviewSession> {
        return this.httpClient.put<InterviewSession>(`/interview/session/${sessionId}`, updates)
    }

    // Text interview methods
    async startTextInterview(sessionData: CreateSessionRequest): Promise<{ session: InterviewSession; currentQuestion: any }> {
        return this.httpClient.post<{ session: InterviewSession; currentQuestion: any }>('/interview/text/start', sessionData)
    }

    async getInterviewProgress(sessionId: number): Promise<any> {
        return this.httpClient.get(`/interview/text/session/${sessionId}/progress`)
    }

    async completeTextInterview(sessionId: number): Promise<any> {
        return this.httpClient.post(`/interview/text/session/${sessionId}/complete`, {})
    }

    async getInterviewSummary(sessionId: number): Promise<any> {
        return this.httpClient.get(`/interview/text/session/${sessionId}/summary`)
    }
}

export class ApiQuestionRepository implements QuestionRepository {
    private httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient
    }

    async generateCodingQuestion(request: GenerateQuestionRequest): Promise<CodingQuestion> {
        const params = new URLSearchParams()
        params.append('domain', request.domain)
        params.append('difficulty', request.difficulty)
        params.append('language', request.language)
        if (request.sessionId) {
            params.append('sessionId', request.sessionId.toString())
        }

        return this.httpClient.get<CodingQuestion>(`/coding/question?${params.toString()}`)
    }

    async getQuestions(sessionId: number): Promise<InterviewQuestion[]> {
        return this.httpClient.get<InterviewQuestion[]>(`/interview/session/${sessionId}/questions`)
    }

    async submitAnswer(request: SubmitAnswerRequest): Promise<InterviewQuestion> {
        return this.httpClient.post<InterviewQuestion>('/interview/question/answer', request)
    }

    // Text interview methods
    async getNextTextQuestion(sessionId: number, currentQuestionId?: number): Promise<any> {
        const params = currentQuestionId ? `?currentQuestionId=${currentQuestionId}` : ''
        return this.httpClient.get(`/interview/text/session/${sessionId}/next-question${params}`)
    }

    async submitTextAnswer(sessionId: number, questionId: number, answer: string): Promise<any> {
        return this.httpClient.post('/interview/text/answer', {
            sessionId,
            questionId,
            answer
        })
    }
}

export class ApiCodingRepository implements CodingRepository {
    private httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient
    }

    async executeCode(request: ExecuteCodeRequest): Promise<CodeExecutionResult> {
        return this.httpClient.post<CodeExecutionResult>('/coding/execute', request)
    }

    async evaluateCode(request: EvaluateCodeRequest): Promise<{ execution: CodeExecutionResult; evaluation: CodeEvaluation }> {
        return this.httpClient.post<{ execution: CodeExecutionResult; evaluation: CodeEvaluation }>('/coding/run-and-evaluate', request)
    }
}

export class ApiFeedbackRepository implements FeedbackRepository {
    private httpClient: HttpClient

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient
    }

    async generateFeedback(sessionId: number): Promise<SessionFeedback> {
        return this.httpClient.post<SessionFeedback>(`/interview/session/${sessionId}/feedback`, {})
    }

    async getFeedback(sessionId: number): Promise<SessionFeedback> {
        return this.httpClient.get<SessionFeedback>(`/interview/session/${sessionId}/feedback`)
    }
}