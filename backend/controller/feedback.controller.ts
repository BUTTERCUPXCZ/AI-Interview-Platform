import { Request, Response } from 'express'
import { prisma } from "../lib/prisma"
import { analyzeSession } from '../services/geminiService'
import { generateComprehensiveFeedback, DetailedFeedback, QuestionAnalysis } from '../services/feedbackService'

// Unified function to get feedback/summary for any interview type
export const getUnifiedSessionFeedback = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        // First check if this session exists and get its type
        const session = await prisma.interviewSession.findUnique({
            where: { id: Number(sessionId) },
            include: {
                questions: {
                    orderBy: { id: 'asc' }
                },
                user: {
                    select: {
                        Firstname: true,
                        Lastname: true,
                        email: true
                    }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Check if AI feedback already exists
        const existingFeedback = await prisma.aIAnalysis.findFirst({
            where: { sessionId: Number(sessionId) }
        });

        if (existingFeedback) {
            // Return existing feedback in a unified format
            return res.json({
                id: existingFeedback.id,
                sessionId: existingFeedback.sessionId,
                overallScore: existingFeedback.overallScore,
                strengths: existingFeedback.strengths,
                weaknesses: existingFeedback.weaknesses,
                improvementTips: existingFeedback.improvementTips,
                createdAt: existingFeedback.createdAt,
                session: {
                    id: session.id,
                    domain: session.domain,
                    interviewType: session.interviewType,
                    difficulty: session.difficulty,
                    duration: session.duration,
                    status: session.status,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    totalScore: session.totalScore
                },
                questions: session.questions.map((q, index) => ({
                    questionNumber: index + 1,
                    questionText: q.questionText,
                    userAnswer: q.userAnswer,
                    score: q.score,
                    aiEvaluation: q.aiEvaluation,
                    isCodingQuestion: q.isCodingQuestion,
                    codingLanguage: q.codingLanguage
                }))
            });
        }

        // If no feedback exists, create summary-style response
        const totalQuestions = session.questions.length;
        const answeredQuestions = session.questions.filter(q => q.userAnswer !== null);
        const scores = answeredQuestions.map(q => q.score || 0);
        const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

        return res.json({
            id: null, // No AI feedback generated yet
            sessionId: session.id,
            overallScore: Math.round(averageScore * 100) / 100,
            strengths: [],
            weaknesses: [],
            improvementTips: [],
            createdAt: null,
            session: {
                id: session.id,
                domain: session.domain,
                interviewType: session.interviewType,
                difficulty: session.difficulty,
                duration: session.duration,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                totalScore: session.totalScore
            },
            statistics: {
                totalQuestions,
                answeredQuestions: answeredQuestions.length,
                averageScore: Math.round(averageScore * 100) / 100,
                completionRate: Math.round((answeredQuestions.length / totalQuestions) * 100)
            },
            questions: session.questions.map((q, index) => ({
                questionNumber: index + 1,
                questionText: q.questionText,
                userAnswer: q.userAnswer,
                score: q.score,
                aiEvaluation: q.aiEvaluation,
                isCodingQuestion: q.isCodingQuestion,
                codingLanguage: q.codingLanguage
            }))
        });

    } catch (error: any) {
        console.error("Error getting session feedback:", error);
        res.status(500).json({ error: "Failed to get session feedback" });
    }
};

export const generateAIFeedback = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const questions = await prisma.interviewQuestion.findMany({
            where: { sessionId: Number(sessionId) },
            select: { questionText: true, userAnswer: true, score: true, aiEvaluation: true },
        });

        const aiReport = await analyzeSession(questions);

        const feedback = await prisma.aIAnalysis.create({
            data: {
                sessionId: Number(sessionId),
                overallScore: aiReport.overallScore,
                strengths: aiReport.strengths,
                weaknesses: aiReport.weaknesses,
                improvementTips: aiReport.improvementTips,
            },
        });

        await prisma.interviewSession.update({
            where: { id: Number(sessionId) },
            data: {
                status: "COMPLETED",
                endedAt: new Date(),
                totalScore: aiReport.overallScore,
            },
        });

        res.json(feedback);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "AI feedback generation failed" });
    }
};

export const getFeedback = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const feedback = await prisma.aIAnalysis.findFirst({
            where: { sessionId: Number(sessionId) },
            include: {
                session: {
                    include: {
                        questions: {
                            select: {
                                questionText: true,
                                userAnswer: true,
                                score: true,
                                aiEvaluation: true,
                                isCodingQuestion: true,
                                codingLanguage: true
                            }
                        }
                    }
                }
            }
        });

        if (!feedback) {
            return res.status(404).json({ error: "Feedback not found" });
        }

        res.json(feedback);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve feedback" });
    }
};

// Generate comprehensive feedback using the new feedback service
export const generateComprehensiveSessionFeedback = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        // Get session data with questions
        const session = await prisma.interviewSession.findUnique({
            where: { id: Number(sessionId) },
            include: {
                questions: {
                    orderBy: { id: 'asc' }
                },
                user: {
                    select: {
                        Firstname: true,
                        Lastname: true,
                        email: true
                    }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Transform questions to the format expected by the feedback service
        const questionsAnalysis: QuestionAnalysis[] = session.questions.map(q => ({
            questionText: q.questionText,
            userAnswer: q.userAnswer,
            score: q.score,
            aiEvaluation: q.aiEvaluation,
            isCodingQuestion: q.isCodingQuestion || false,
            codingLanguage: q.codingLanguage || undefined,
            category: determineCategoryFromQuestion(q.questionText, session.domain, session.interviewType),
            difficulty: session.difficulty
        }));

        // Generate comprehensive feedback
        const comprehensiveFeedback = await generateComprehensiveFeedback(
            {
                domain: session.domain,
                interviewType: session.interviewType,
                difficulty: session.difficulty,
                duration: session.duration
            },
            questionsAnalysis
        );

        // Store the detailed feedback in the database
        const existingFeedback = await prisma.aIAnalysis.findFirst({
            where: { sessionId: Number(sessionId) }
        });

        let feedbackRecord;
        if (existingFeedback) {
            // Update existing feedback
            feedbackRecord = await prisma.aIAnalysis.update({
                where: { id: existingFeedback.id },
                data: {
                    overallScore: comprehensiveFeedback.overallScore,
                    strengths: comprehensiveFeedback.strengths.join('; '),
                    weaknesses: comprehensiveFeedback.weaknesses.join('; '),
                    improvementTips: comprehensiveFeedback.detailedFeedback.specificRecommendations.join('; ')
                }
            });
        } else {
            // Create new feedback
            feedbackRecord = await prisma.aIAnalysis.create({
                data: {
                    sessionId: Number(sessionId),
                    overallScore: comprehensiveFeedback.overallScore,
                    strengths: comprehensiveFeedback.strengths.join('; '),
                    weaknesses: comprehensiveFeedback.weaknesses.join('; '),
                    improvementTips: comprehensiveFeedback.detailedFeedback.specificRecommendations.join('; ')
                }
            });
        }

        // Update session status
        await prisma.interviewSession.update({
            where: { id: Number(sessionId) },
            data: {
                status: "COMPLETED",
                endedAt: new Date(),
                totalScore: comprehensiveFeedback.overallScore,
            },
        });

        // Return the comprehensive feedback
        res.json({
            ...feedbackRecord,
            comprehensiveFeedback,
            session: {
                id: session.id,
                domain: session.domain,
                interviewType: session.interviewType,
                difficulty: session.difficulty,
                duration: session.duration,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                totalScore: session.totalScore,
                user: session.user
            }
        });

    } catch (error: any) {
        console.error("Error generating comprehensive feedback:", error);
        res.status(500).json({ error: "Failed to generate comprehensive feedback" });
    }
};

// Helper function to determine question category
function determineCategoryFromQuestion(questionText: string, domain: string, interviewType: string): string {
    const lowerQuestion = questionText.toLowerCase();

    if (interviewType === 'technical') {
        switch (domain.toLowerCase()) {
            case 'frontend':
                if (lowerQuestion.includes('react') || lowerQuestion.includes('vue') || lowerQuestion.includes('angular')) {
                    return 'frameworks';
                } else if (lowerQuestion.includes('css') || lowerQuestion.includes('html')) {
                    return 'styling';
                } else if (lowerQuestion.includes('javascript') || lowerQuestion.includes('typescript')) {
                    return 'javascript';
                }
                return 'frontend-general';
            case 'backend':
                if (lowerQuestion.includes('database') || lowerQuestion.includes('sql')) {
                    return 'database';
                } else if (lowerQuestion.includes('api') || lowerQuestion.includes('rest')) {
                    return 'api-design';
                } else if (lowerQuestion.includes('security')) {
                    return 'security';
                }
                return 'backend-general';
            case 'data-science':
                if (lowerQuestion.includes('machine learning') || lowerQuestion.includes('ml')) {
                    return 'machine-learning';
                } else if (lowerQuestion.includes('statistics')) {
                    return 'statistics';
                }
                return 'data-analysis';
            default:
                return 'technical-general';
        }
    } else if (interviewType === 'behavioral') {
        if (lowerQuestion.includes('leadership') || lowerQuestion.includes('team')) {
            return 'leadership';
        } else if (lowerQuestion.includes('conflict') || lowerQuestion.includes('challenge')) {
            return 'problem-solving';
        }
        return 'behavioral-general';
    } else if (interviewType === 'system-design') {
        return 'system-design';
    }

    return 'general';
}
