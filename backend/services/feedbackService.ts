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
        categoryBreakdown?: CategoryPerformance[]
        difficultyAnalysis?: DifficultyBreakdown
        timeManagement?: TimeAnalysis
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

export interface CategoryPerformance {
    category: string
    questionsCount: number
    averageScore: number
    percentage: number
    strongestAreas: string[]
    weakestAreas: string[]
    improvement: string[]
}

export interface DifficultyBreakdown {
    beginner: { score: number; count: number }
    intermediate: { score: number; count: number }
    advanced: { score: number; count: number }
}

export interface TimeAnalysis {
    averageTimePerQuestion: number
    fastestCategory: string
    slowestCategory: string
    timeManagementTips: string[]
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

    // Generate enhanced performance analysis
    const categoryBreakdown = generateCategoryBreakdown(categorizedQuestions)
    const difficultyAnalysis = generateDifficultyAnalysis(questions)
    const timeManagement = generateTimeAnalysis(categorizedQuestions)

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
                averageScore: Math.round(averageScore * 10) / 10,
                categoryBreakdown,
                difficultyAnalysis,
                timeManagement
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
 * Generate category-based performance breakdown
 */
function generateCategoryBreakdown(categorizedQuestions: { [category: string]: QuestionAnalysis[] }): CategoryPerformance[] {
    const breakdown: CategoryPerformance[] = []
    const totalQuestions = Object.values(categorizedQuestions).flat().length

    Object.entries(categorizedQuestions).forEach(([category, questions]) => {
        const answeredQuestions = questions.filter(q => q.score !== null)
        const averageScore = answeredQuestions.length > 0
            ? answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length
            : 0

        // Generate insights based on category and performance
        const strongestAreas = generateStrongestAreas(category, averageScore, questions)
        const weakestAreas = generateWeakestAreas(category, averageScore, questions)
        const improvement = generateImprovementTips(category, averageScore, questions)

        breakdown.push({
            category,
            questionsCount: questions.length,
            averageScore: Math.round(averageScore * 10) / 10,
            percentage: Math.round((questions.length / totalQuestions) * 100 * 10) / 10,
            strongestAreas,
            weakestAreas,
            improvement
        })
    })

    return breakdown.sort((a, b) => b.averageScore - a.averageScore)
}

/**
 * Generate difficulty-based analysis
 */
function generateDifficultyAnalysis(questions: QuestionAnalysis[]): DifficultyBreakdown {
    const difficultyGroups = {
        beginner: questions.filter(q => q.difficulty.toLowerCase() === 'beginner' || q.difficulty.toLowerCase() === 'easy'),
        intermediate: questions.filter(q => q.difficulty.toLowerCase() === 'intermediate' || q.difficulty.toLowerCase() === 'medium'),
        advanced: questions.filter(q => q.difficulty.toLowerCase() === 'advanced' || q.difficulty.toLowerCase() === 'hard')
    }

    const analysis: DifficultyBreakdown = {
        beginner: { score: 0, count: 0 },
        intermediate: { score: 0, count: 0 },
        advanced: { score: 0, count: 0 }
    }

    Object.entries(difficultyGroups).forEach(([level, questions]) => {
        const answeredQuestions = questions.filter(q => q.score !== null)
        const averageScore = answeredQuestions.length > 0
            ? answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / answeredQuestions.length
            : 0

        analysis[level as keyof DifficultyBreakdown] = {
            score: Math.round(averageScore * 10) / 10,
            count: questions.length
        }
    })

    return analysis
}

/**
 * Generate time management analysis
 */
function generateTimeAnalysis(categorizedQuestions: { [category: string]: QuestionAnalysis[] }): TimeAnalysis {
    // Mock time data - in production, you would track actual response times
    const avgTimePerQuestion = Math.floor(Math.random() * 180) + 60 // 60-240 seconds

    const categories = Object.keys(categorizedQuestions)
    const fastestCategory = categories[Math.floor(Math.random() * categories.length)]
    let slowestCategory = categories[Math.floor(Math.random() * categories.length)]
    while (slowestCategory === fastestCategory && categories.length > 1) {
        slowestCategory = categories[Math.floor(Math.random() * categories.length)]
    }

    const timeManagementTips = [
        "Practice coding problems with time constraints",
        "Read questions carefully before starting your answer",
        "Plan your approach before writing code",
        "Use the STAR method for behavioral questions",
        "Practice explaining your thought process clearly"
    ]

    return {
        averageTimePerQuestion: avgTimePerQuestion,
        fastestCategory,
        slowestCategory,
        timeManagementTips: timeManagementTips.slice(0, 3)
    }
}

/**
 * Generate strongest areas based on category performance
 */
function generateStrongestAreas(category: string, averageScore: number, questions: QuestionAnalysis[]): string[] {
    if (averageScore < 6) return []

    const strengths: { [key: string]: string[] } = {
        'javascript': [
            'Strong understanding of ES6+ features',
            'Good grasp of asynchronous programming',
            'Proficient with array and object manipulation'
        ],
        'react': [
            'Solid component architecture knowledge',
            'Good understanding of hooks and state management',
            'Effective use of React patterns'
        ],
        'database': [
            'Strong SQL query optimization skills',
            'Good database design principles',
            'Understanding of indexing strategies'
        ],
        'api-design': [
            'Good RESTful API design principles',
            'Understanding of HTTP status codes',
            'Knowledge of API authentication methods'
        ],
        'coding': [
            'Strong problem-solving approach',
            'Good algorithm understanding',
            'Clean and readable code structure'
        ],
        'system-design': [
            'Good scalability considerations',
            'Understanding of distributed systems',
            'Knowledge of caching strategies'
        ]
    }

    return strengths[category] || ['Good overall understanding of the topic']
}

/**
 * Generate weakest areas based on category performance
 */
function generateWeakestAreas(category: string, averageScore: number, questions: QuestionAnalysis[]): string[] {
    if (averageScore >= 7) return []

    const weaknesses: { [key: string]: string[] } = {
        'javascript': [
            'Need to improve closure understanding',
            'Struggling with prototype chain concepts',
            'Difficulty with event loop mechanics'
        ],
        'react': [
            'Need better understanding of useEffect',
            'Struggling with performance optimization',
            'Difficulty with state management patterns'
        ],
        'database': [
            'Need to improve complex query writing',
            'Struggling with normalization concepts',
            'Difficulty with transaction management'
        ],
        'api-design': [
            'Need better error handling strategies',
            'Struggling with API versioning',
            'Difficulty with rate limiting concepts'
        ],
        'coding': [
            'Need to improve time complexity analysis',
            'Struggling with recursive solutions',
            'Difficulty with edge case handling'
        ],
        'system-design': [
            'Need better understanding of load balancing',
            'Struggling with database sharding concepts',
            'Difficulty with microservices architecture'
        ]
    }

    return weaknesses[category] || ['Need to deepen understanding of fundamental concepts']
}

/**
 * Generate improvement tips based on category and performance
 */
function generateImprovementTips(category: string, averageScore: number, questions: QuestionAnalysis[]): string[] {
    const tips: { [key: string]: string[] } = {
        'javascript': [
            'Practice with MDN JavaScript tutorials',
            'Complete JavaScript algorithms on HackerRank',
            'Study "You Don\'t Know JS" book series'
        ],
        'react': [
            'Build small projects with different React patterns',
            'Practice with React Testing Library',
            'Study the official React documentation thoroughly'
        ],
        'database': [
            'Practice SQL queries on SQLBolt or HackerRank',
            'Study database design patterns',
            'Learn about database performance optimization'
        ],
        'api-design': [
            'Build RESTful APIs with Express.js',
            'Study API design best practices',
            'Practice with Postman for API testing'
        ],
        'coding': [
            'Solve daily problems on LeetCode',
            'Practice explaining solutions out loud',
            'Study common algorithm patterns'
        ],
        'system-design': [
            'Study system design interview resources',
            'Practice designing simple systems',
            'Learn about cloud architecture patterns'
        ]
    }

    return tips[category] || ['Continue practicing and studying fundamentals']
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
            averageScore: metrics.averageScore,
            categoryBreakdown: [],
            difficultyAnalysis: {
                beginner: { score: 0, count: 0 },
                intermediate: { score: 0, count: 0 },
                advanced: { score: 0, count: 0 }
            },
            timeManagement: {
                averageTimePerQuestion: 120,
                fastestCategory: 'general',
                slowestCategory: 'coding',
                timeManagementTips: ['Practice time management', 'Read questions carefully']
            }
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

/**
 * Generate AI-powered career recommendations
 */
export async function generateCareerRecommendations(
    sessionData: {
        domain: string,
        interviewType: string,
        difficulty: string,
        duration: number
    },
    questions: QuestionAnalysis[],
    overallScore: number
): Promise<{
    priorityAreas: {
        technical: {
            title: string,
            description: string,
            actions: string[]
        },
        communication: {
            title: string,
            description: string,
            actions: string[]
        }
    },
    learningRoadmap: {
        weeks1to2: {
            title: string,
            focus: string,
            tasks: string[]
        },
        weeks3to4: {
            title: string,
            focus: string,
            tasks: string[]
        },
        ongoing: {
            title: string,
            focus: string,
            tasks: string[]
        }
    },
    resources: {
        courses: string[],
        practice: string[],
        books: string[],
        communities: string[]
    }
}> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Calculate performance metrics
    const totalQuestions = questions.length
    const answeredQuestions = questions.filter(q => q.userAnswer !== null).length
    const completionRate = (answeredQuestions / totalQuestions) * 100
    const scores = questions.filter(q => q.score !== null).map(q => q.score!)
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0

    // Categorize questions for better analysis
    const categorizedQuestions = categorizeQuestions(questions, sessionData.domain, sessionData.interviewType)

    const prompt = `
As an expert career coach specializing in ${sessionData.domain} development, analyze this interview performance and provide personalized career growth recommendations.

Interview Performance Analysis:
- Domain: ${sessionData.domain}
- Interview Type: ${sessionData.interviewType}
- Difficulty Level: ${sessionData.difficulty}
- Overall Score: ${overallScore}/10
- Completion Rate: ${completionRate}%
- Average Score: ${averageScore.toFixed(1)}/10

Question Categories Performance:
${Object.entries(categorizedQuestions).map(([category, questions]) => `
${category}: ${questions.length} questions, Average Score: ${questions.filter(q => q.score !== null).length > 0
            ? (questions.filter(q => q.score !== null).reduce((sum, q) => sum + q.score!, 0) / questions.filter(q => q.score !== null).length).toFixed(1)
            : 'N/A'
        }/10`).join('\n')}

Detailed Question Analysis:
${questions.slice(0, 5).map((q, i) => `
Q${i + 1}: ${q.questionText.substring(0, 100)}...
Answer Quality: ${q.score || 'Not scored'}/10
Evaluation: ${q.aiEvaluation?.substring(0, 200) || 'Not evaluated'}...
`).join('\n')}

Based on this performance, provide personalized career recommendations in JSON format:

{
  "priorityAreas": {
    "technical": {
      "title": "Technical Depth/Skills/Foundation",
      "description": "Specific technical area to focus on based on weak performance",
      "actions": ["3 specific, actionable steps tailored to this candidate's ${sessionData.domain} level"]
    },
    "communication": {
      "title": "Communication/Problem-Solving/Soft Skills",
      "description": "Communication or soft skill area needing improvement",
      "actions": ["3 specific, actionable steps for improving interview communication"]
    }
  },
  "learningRoadmap": {
    "weeks1to2": {
      "title": "Week 1-2",
      "focus": "Foundation Building/Review Basics/etc",
      "tasks": ["4 specific tasks for weeks 1-2 based on current level and weaknesses"]
    },
    "weeks3to4": {
      "title": "Week 3-4", 
      "focus": "Advanced Concepts/Practice/etc",
      "tasks": ["4 specific tasks for weeks 3-4 building on previous weeks"]
    },
    "ongoing": {
      "title": "Ongoing",
      "focus": "Maintenance & Growth/Continuous Learning/etc", 
      "tasks": ["4 specific ongoing tasks for continuous improvement"]
    }
  },
  "resources": {
    "courses": ["3 specific online courses relevant to ${sessionData.domain} and current skill level"],
    "practice": ["3 specific practice platforms/tools relevant to identified weak areas"],
    "books": ["3 specific books that address this candidate's learning needs"],
    "communities": ["3 specific communities/forums for ${sessionData.domain} developers"]
  }
}

Requirements:
1. Make recommendations SPECIFIC to ${sessionData.domain} development
2. Tailor advice to the candidate's current skill level (score: ${overallScore}/10)
3. Address the specific weak areas identified in the interview
4. Provide actionable, time-bound tasks
5. Include relevant, current resources (courses, books, tools)
6. Consider the ${sessionData.difficulty} difficulty level attempted
7. Make all advice practical and immediately implementable
`

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Clean the response to ensure it's valid JSON
        const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        return JSON.parse(cleanedResponse)
    } catch (error) {
        console.error('Error generating career recommendations:', error)

        // Fallback recommendations if AI fails
        return {
            priorityAreas: {
                technical: {
                    title: "Technical Foundation",
                    description: `Strengthen your core ${sessionData.domain} technical skills to improve problem-solving ability`,
                    actions: [
                        "Practice data structures and algorithms daily (30 minutes)",
                        "Build 2-3 projects showcasing your skills",
                        "Study system design fundamentals"
                    ]
                },
                communication: {
                    title: "Communication Skills",
                    description: "Enhance your ability to explain complex concepts clearly and concisely",
                    actions: [
                        "Practice explaining code solutions out loud",
                        "Record yourself solving problems to review communication",
                        "Join technical discussion groups to practice articulation"
                    ]
                }
            },
            learningRoadmap: {
                weeks1to2: {
                    title: "Week 1-2",
                    focus: "Foundation Building",
                    tasks: [
                        "Review core algorithms (sorting, searching)",
                        "Practice 5 easy coding problems daily",
                        "Study time/space complexity analysis",
                        "Read programming fundamentals"
                    ]
                },
                weeks3to4: {
                    title: "Week 3-4",
                    focus: "Advanced Concepts",
                    tasks: [
                        "Master advanced programming patterns",
                        "Practice 3 medium-level problems daily",
                        "Learn system design basics",
                        "Conduct mock interviews with peers"
                    ]
                },
                ongoing: {
                    title: "Ongoing",
                    focus: "Maintenance & Growth",
                    tasks: [
                        "Daily coding practice (1 hour)",
                        "Weekly system design study",
                        "Monthly mock interviews",
                        "Contribute to open source projects"
                    ]
                }
            },
            resources: {
                courses: [
                    "AlgoExpert (Interview Preparation)",
                    "Educative.io (System Design)",
                    "Coursera (Algorithms Specialization)"
                ],
                practice: [
                    "LeetCode (Daily Practice)",
                    "HackerRank (Skills Assessment)",
                    "CodeSignal (Mock Interviews)"
                ],
                books: [
                    "Cracking the Coding Interview",
                    "Clean Code by Robert Martin",
                    "Designing Data-Intensive Applications"
                ],
                communities: [
                    "r/cscareerquestions (Reddit)",
                    "Blind (Anonymous professional forum)",
                    "Discord coding communities"
                ]
            }
        }
    }
}