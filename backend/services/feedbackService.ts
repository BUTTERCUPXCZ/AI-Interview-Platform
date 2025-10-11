import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface DetailedFeedback {
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

export interface SkillRating {
    skill: string
    rating: number // 1-10
    evidence: string
    improvementTips: string[]
}

export interface Resource {
    title: string
    type: 'article' | 'course' | 'book' | 'practice' | 'tutorial'
    url?: string
    description: string
    estimatedTime?: string
}

export interface QuestionAnalysis {
    questionText: string
    userAnswer: string | null
    score: number | null
    aiEvaluation: string | null
    isCodingQuestion: boolean
    codingLanguage?: string
    category: string
    difficulty: string
}

/**
 * Main function to generate comprehensive feedback for a user's interview performance
 */
export async function generateComprehensiveFeedback(
    sessionData: {
        domain: string
        interviewType: string
        difficulty: string
        duration: number
    },
    questions: QuestionAnalysis[]
): Promise<DetailedFeedback> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Calculate basic metrics
    const totalQuestions = questions.length
    const answeredQuestions = questions.filter(q => q.userAnswer !== null).length
    const completionRate = (answeredQuestions / totalQuestions) * 100
    const scores = questions.filter(q => q.score !== null).map(q => q.score!)
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0

    // Categorize questions for analysis
    const categorizedQuestions = categorizeQuestions(questions, sessionData.domain, sessionData.interviewType)

    // Generate AI analysis
    const prompt = createComprehensivePrompt(sessionData, questions, categorizedQuestions, {
        totalQuestions,
        answeredQuestions,
        completionRate,
        averageScore
    })

    try {
        const result = await model.generateContent(prompt)
        const aiAnalysis = JSON.parse(result.response.text())

        // Combine AI analysis with our calculated metrics
        const feedback: DetailedFeedback = {
            overallScore: Math.round(averageScore * 10) / 10,
            performanceAnalysis: {
                domain: sessionData.domain,
                interviewType: sessionData.interviewType,
                totalQuestions,
                answeredQuestions,
                completionRate: Math.round(completionRate * 10) / 10,
                averageScore: Math.round(averageScore * 10) / 10
            },
            skillAssessment: {
                technicalSkills: aiAnalysis.skillAssessment?.technicalSkills || [],
                softSkills: aiAnalysis.skillAssessment?.softSkills || [],
                domainSpecificSkills: aiAnalysis.skillAssessment?.domainSpecificSkills || []
            },
            strengths: aiAnalysis.strengths || [],
            weaknesses: aiAnalysis.weaknesses || [],
            detailedFeedback: aiAnalysis.detailedFeedback || {
                whatWentWell: [],
                areasForImprovement: [],
                specificRecommendations: []
            },
            learningPath: aiAnalysis.learningPath || {
                immediateActions: [],
                shortTermGoals: [],
                longTermGoals: [],
                recommendedResources: []
            },
            benchmarkComparison: calculateBenchmark(averageScore, sessionData.difficulty),
            nextSteps: aiAnalysis.nextSteps || []
        }

        return feedback
    } catch (error) {
        console.error('Error generating comprehensive feedback:', error)
        // Return fallback feedback
        return generateFallbackFeedback(sessionData, {
            totalQuestions,
            answeredQuestions,
            completionRate,
            averageScore
        })
    }
}

/**
 * Categorize questions based on domain and interview type
 */
function categorizeQuestions(
    questions: QuestionAnalysis[],
    domain: string,
    interviewType: string
): { [category: string]: QuestionAnalysis[] } {
    const categories: { [key: string]: QuestionAnalysis[] } = {}

    questions.forEach(question => {
        let category = 'general'

        if (question.isCodingQuestion) {
            category = 'coding'
        } else if (interviewType === 'technical') {
            // Categorize technical questions based on domain
            switch (domain.toLowerCase()) {
                case 'frontend':
                    if (question.questionText.toLowerCase().includes('react') ||
                        question.questionText.toLowerCase().includes('vue') ||
                        question.questionText.toLowerCase().includes('angular')) {
                        category = 'frameworks'
                    } else if (question.questionText.toLowerCase().includes('css') ||
                        question.questionText.toLowerCase().includes('html')) {
                        category = 'styling'
                    } else if (question.questionText.toLowerCase().includes('javascript') ||
                        question.questionText.toLowerCase().includes('typescript')) {
                        category = 'javascript'
                    } else {
                        category = 'frontend-general'
                    }
                    break
                case 'backend':
                    if (question.questionText.toLowerCase().includes('database') ||
                        question.questionText.toLowerCase().includes('sql')) {
                        category = 'database'
                    } else if (question.questionText.toLowerCase().includes('api') ||
                        question.questionText.toLowerCase().includes('rest')) {
                        category = 'api-design'
                    } else if (question.questionText.toLowerCase().includes('security')) {
                        category = 'security'
                    } else {
                        category = 'backend-general'
                    }
                    break
                case 'fullstack':
                    category = 'fullstack'
                    break
                case 'data-science':
                    if (question.questionText.toLowerCase().includes('machine learning') ||
                        question.questionText.toLowerCase().includes('ml')) {
                        category = 'machine-learning'
                    } else if (question.questionText.toLowerCase().includes('statistics') ||
                        question.questionText.toLowerCase().includes('statistical')) {
                        category = 'statistics'
                    } else {
                        category = 'data-analysis'
                    }
                    break
                default:
                    category = 'technical-general'
            }
        } else if (interviewType === 'behavioral') {
            if (question.questionText.toLowerCase().includes('leadership') ||
                question.questionText.toLowerCase().includes('team')) {
                category = 'leadership'
            } else if (question.questionText.toLowerCase().includes('conflict') ||
                question.questionText.toLowerCase().includes('challenge')) {
                category = 'problem-solving'
            } else {
                category = 'behavioral-general'
            }
        } else if (interviewType === 'system-design') {
            category = 'system-design'
        }

        if (!categories[category]) {
            categories[category] = []
        }
        categories[category].push(question)
    })

    return categories
}

/**
 * Create a comprehensive prompt for AI analysis
 */
function createComprehensivePrompt(
    sessionData: any,
    questions: QuestionAnalysis[],
    categorizedQuestions: { [category: string]: QuestionAnalysis[] },
    metrics: any
): string {
    return `
As an expert interview evaluator, analyze this ${sessionData.domain} ${sessionData.interviewType} interview performance and provide comprehensive feedback.

Session Details:
- Domain: ${sessionData.domain}
- Interview Type: ${sessionData.interviewType}
- Difficulty: ${sessionData.difficulty}
- Duration: ${sessionData.duration} minutes
- Completion Rate: ${metrics.completionRate}%
- Average Score: ${metrics.averageScore}/10

Question Categories and Performance:
${Object.entries(categorizedQuestions).map(([category, questions]) => `
${category}: ${questions.length} questions, Average Score: ${questions.filter(q => q.score !== null).length > 0
            ? (questions.filter(q => q.score !== null).reduce((sum, q) => sum + q.score!, 0) / questions.filter(q => q.score !== null).length).toFixed(1)
            : 'N/A'
        }/10`).join('\n')}

Questions and Answers:
${questions.map((q, i) => `
Question ${i + 1} (${q.isCodingQuestion ? 'Coding' : 'Text'} - ${q.difficulty}):
${q.questionText}

User Answer: ${q.userAnswer || 'Not answered'}
Score: ${q.score || 'Not scored'}/10
AI Evaluation: ${q.aiEvaluation || 'Not evaluated'}
`).join('\n')}

Provide a detailed analysis in JSON format with this structure:
{
  "skillAssessment": {
    "technicalSkills": [
      {
        "skill": "skill name",
        "rating": 1-10,
        "evidence": "specific evidence from answers",
        "improvementTips": ["tip1", "tip2"]
      }
    ],
    "softSkills": [similar structure],
    "domainSpecificSkills": [similar structure for ${sessionData.domain} specific skills]
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "detailedFeedback": {
    "whatWentWell": ["positive aspect 1", "positive aspect 2"],
    "areasForImprovement": ["area 1", "area 2"],
    "specificRecommendations": ["recommendation 1", "recommendation 2"]
  },
  "learningPath": {
    "immediateActions": ["action 1", "action 2"],
    "shortTermGoals": ["goal 1", "goal 2"],
    "longTermGoals": ["goal 1", "goal 2"],
    "recommendedResources": [
      {
        "title": "Resource Title",
        "type": "course|article|book|practice|tutorial",
        "description": "Description",
        "estimatedTime": "time estimate"
      }
    ]
  },
  "nextSteps": ["step 1", "step 2"]
}

Focus on:
1. ${sessionData.domain}-specific skills and knowledge gaps
2. ${sessionData.interviewType} interview performance patterns
3. Actionable improvement recommendations
4. Personalized learning path based on current level
5. Industry-relevant skills for ${sessionData.domain} developers
`
}

/**
 * Calculate benchmark comparison
 */
function calculateBenchmark(averageScore: number, difficulty: string): {
    percentileRank: number
    comparisonText: string
} {
    // Mock benchmark calculation - in production, this would use real data
    let percentileRank: number
    let comparisonText: string

    if (averageScore >= 9) {
        percentileRank = 95
        comparisonText = "Exceptional performance! You scored better than 95% of candidates."
    } else if (averageScore >= 8) {
        percentileRank = 85
        comparisonText = "Excellent performance! You scored better than 85% of candidates."
    } else if (averageScore >= 7) {
        percentileRank = 70
        comparisonText = "Good performance! You scored better than 70% of candidates."
    } else if (averageScore >= 6) {
        percentileRank = 50
        comparisonText = "Average performance. You scored at the median level."
    } else if (averageScore >= 5) {
        percentileRank = 30
        comparisonText = "Below average performance. Focus on improvement areas."
    } else {
        percentileRank = 15
        comparisonText = "Significant improvement needed. Consider additional preparation."
    }

    // Adjust based on difficulty
    if (difficulty === 'Advanced') {
        percentileRank = Math.min(percentileRank + 10, 99)
        comparisonText += " (Adjusted for advanced difficulty level)"
    } else if (difficulty === 'Beginner') {
        percentileRank = Math.max(percentileRank - 10, 1)
        comparisonText += " (Adjusted for beginner difficulty level)"
    }

    return { percentileRank, comparisonText }
}

/**
 * Generate fallback feedback when AI analysis fails
 */
function generateFallbackFeedback(
    sessionData: any,
    metrics: any
): DetailedFeedback {
    return {
        overallScore: metrics.averageScore,
        performanceAnalysis: {
            domain: sessionData.domain,
            interviewType: sessionData.interviewType,
            totalQuestions: metrics.totalQuestions,
            answeredQuestions: metrics.answeredQuestions,
            completionRate: metrics.completionRate,
            averageScore: metrics.averageScore
        },
        skillAssessment: {
            technicalSkills: [],
            softSkills: [],
            domainSpecificSkills: []
        },
        strengths: metrics.averageScore > 7 ? ["Good problem-solving approach"] : [],
        weaknesses: metrics.averageScore < 6 ? ["Need to improve technical knowledge"] : [],
        detailedFeedback: {
            whatWentWell: metrics.completionRate > 80 ? ["Completed most questions"] : [],
            areasForImprovement: ["Continue practicing interview questions"],
            specificRecommendations: [`Focus on ${sessionData.domain} fundamentals`]
        },
        learningPath: {
            immediateActions: ["Review interview performance"],
            shortTermGoals: [`Improve ${sessionData.domain} skills`],
            longTermGoals: ["Prepare for real interviews"],
            recommendedResources: []
        },
        benchmarkComparison: calculateBenchmark(metrics.averageScore, sessionData.difficulty),
        nextSteps: ["Continue practicing", "Focus on weak areas"]
    }
}