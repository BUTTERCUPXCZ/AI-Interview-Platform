// Dependency injection container and service factory
// This ensures we follow the dependency inversion principle

import { httpClient } from '../infrastructure/http-client'
import {
    InterviewService,
    ApiInterviewRepository,
    ApiQuestionRepository,
    ApiCodingRepository,
    ApiFeedbackRepository,
} from '../application/services'

// Create service instances with dependency injection
const interviewRepository = new ApiInterviewRepository(httpClient)
const questionRepository = new ApiQuestionRepository(httpClient)
const codingRepository = new ApiCodingRepository(httpClient)
const feedbackRepository = new ApiFeedbackRepository(httpClient)

// Main service instance
export const interviewService = new InterviewService(
    interviewRepository,
    questionRepository,
    codingRepository,
    feedbackRepository
)

// Export individual repositories if needed for specific use cases
export {
    interviewRepository,
    questionRepository,
    codingRepository,
    feedbackRepository,
}