import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { generateTextInterviewQuestions, evaluateTextAnswer } from "../services/geminiService";
import { CacheService } from "../services/cacheService";
import {
    getInterviewSessionById,
    validateUserSession,
    getSessionQuestions,
    getCurrentQuestionIndex,
    isInterviewCompleted,
    calculateSessionStats,
    updateSessionStatus,
    isSessionExpired,
    getRemainingTime
} from "../services/interviewSessionService";

interface StartTextInterviewRequest {
    userId: number;
    domain: string;
    interviewType: string;
    difficulty: string;
    duration: number;
    enableCodingSandbox?: boolean;
}

interface SubmitTextAnswerRequest {
    sessionId: number;
    questionId: number;
    answer: string;
}

/**
 * Start a new text-based interview session
 */
export const startTextInterview = async (req: Request, res: Response) => {
    try {
        console.log("Received request body:", req.body);
        const { userId, domain, interviewType, difficulty, duration, enableCodingSandbox = false }: StartTextInterviewRequest = req.body;

        console.log("Extracted fields:", { userId, domain, interviewType, difficulty, duration, enableCodingSandbox });

        // Validate required fields
        if (!userId || !domain || !interviewType || !difficulty) {
            console.log("Validation failed - missing fields:", {
                userId: !!userId,
                domain: !!domain,
                interviewType: !!interviewType,
                difficulty: !!difficulty
            });
            return res.status(400).json({
                error: "Missing required fields: userId, domain, interviewType, difficulty"
            });
        }

        // Helper function to convert frontend values to backend enum values
        const convertToEnum = (value: string): string => {
            return value.toUpperCase().replace(/-/g, "_");
        };

        // Create interview session
        const session = await prisma.interviewSession.create({
            data: {
                userId,
                domain: convertToEnum(domain) as any,
                interviewType: convertToEnum(interviewType) as any,
                difficulty: difficulty.toUpperCase() as any,
                duration: duration || 30,
                format: "TEXT",
                role: "Software Developer",
                status: "IN_PROGRESS",
                enableCodingSandbox: enableCodingSandbox
            },
        });

        // Generate text-based questions
        const questions = await generateTextInterviewQuestions(domain, difficulty, interviewType);

        // Save questions to database sequentially to avoid prepared statement conflicts
        const savedQuestions = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const savedQuestion = await prisma.interviewQuestion.create({
                data: {
                    sessionId: session.id,
                    questionText: q.question,
                    isCodingQuestion: false,
                },
            });
            savedQuestions.push(savedQuestion);
        }

        // Cache interview session state for faster access
        await CacheService.setInterviewState(session.id.toString(), {
            sessionId: session.id,
            userId: session.userId,
            domain: session.domain,
            interviewType: session.interviewType,
            difficulty: session.difficulty,
            currentQuestionIndex: 0,
            totalQuestions: savedQuestions.length,
            startedAt: session.startedAt,
            questions: savedQuestions.map(q => ({ id: q.id, questionText: q.questionText }))
        });

        // Return session details with first question
        const firstQuestion = savedQuestions[0];

        return res.status(201).json({
            session: {
                id: session.id,
                domain: session.domain,
                interviewType: session.interviewType,
                difficulty: session.difficulty,
                duration: session.duration,
                format: session.format,
                status: session.status,
                startedAt: session.startedAt,
                totalQuestions: savedQuestions.length
            },
            currentQuestion: {
                id: firstQuestion.id,
                questionText: firstQuestion.questionText,
                questionNumber: 1,
                totalQuestions: savedQuestions.length
            }
        });

    } catch (error: any) {
        console.error("Error starting text interview:", error);
        res.status(500).json({ error: "Failed to start text interview session" });
    }
};

/**
 * Get the next question in the interview
 */
export const getNextQuestion = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const currentQuestionId = parseInt(req.query.currentQuestionId as string);

        // Try to get session from cache first
        const cachedState = await CacheService.getInterviewState(sessionId);
        let sessionQuestions;

        const session = await getInterviewSessionById(parseInt(sessionId));
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Check if session has expired
        if (isSessionExpired(session)) {
            await updateSessionStatus(parseInt(sessionId), "CANCELED");
            return res.status(400).json({
                error: "Session has expired",
                expired: true
            });
        }

        // Use cached questions if available, otherwise fetch from DB
        if (cachedState && cachedState.questions) {
            sessionQuestions = cachedState.questions;
        } else {
            sessionQuestions = await getSessionQuestions(parseInt(sessionId));

            // Update cache with questions for next time
            await CacheService.setInterviewState(sessionId, {
                sessionId: session.id,
                userId: session.userId,
                domain: session.domain,
                interviewType: session.interviewType,
                difficulty: session.difficulty,
                currentQuestionIndex: 0,
                totalQuestions: sessionQuestions.length,
                startedAt: session.startedAt,
                questions: sessionQuestions.map((q: any) => ({ id: q.id, questionText: q.questionText }))
            });
        }

        // Get all questions for the session
        const questions = sessionQuestions;

        if (questions.length === 0) {
            return res.status(404).json({ error: "No questions found for this session" });
        }

        // Find current question index
        const currentIndex = questions.findIndex((q: any) => q.id === currentQuestionId);

        if (currentIndex === -1) {
            return res.status(404).json({ error: "Current question not found" });
        }

        // Check if there's a next question
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
            // Check if interview is completed
            const completed = await isInterviewCompleted(parseInt(sessionId));
            if (completed) {
                await updateSessionStatus(parseInt(sessionId), "COMPLETED");
            }

            return res.json({
                completed: true,
                message: "Interview completed! All questions have been answered.",
                sessionCompleted: completed
            });
        }

        const nextQuestion = questions[nextIndex];
        const remainingTime = getRemainingTime(session);

        return res.json({
            currentQuestion: {
                id: nextQuestion.id,
                questionText: nextQuestion.questionText,
                questionNumber: nextIndex + 1,
                totalQuestions: questions.length
            },
            sessionInfo: {
                remainingTime,
                progress: Math.round(((nextIndex + 1) / questions.length) * 100)
            },
            completed: false
        });

    } catch (error: any) {
        console.error("Error getting next question:", error);
        res.status(500).json({ error: "Failed to get next question" });
    }
};

/**
 * Submit an answer for a text interview question
 */
export const submitTextAnswer = async (req: Request, res: Response) => {
    try {
        const { sessionId, questionId, answer }: SubmitTextAnswerRequest = req.body;

        if (!sessionId || !questionId || !answer) {
            return res.status(400).json({
                error: "Missing required fields: sessionId, questionId, answer"
            });
        }

        // Get the question
        const question = await prisma.interviewQuestion.findUnique({
            where: { id: questionId },
            include: { session: true }
        });

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        if (question.sessionId !== sessionId) {
            return res.status(400).json({ error: "Question does not belong to this session" });
        }

        // Evaluate the answer using AI
        const evaluation = await evaluateTextAnswer(
            question.questionText,
            answer,
            question.session.domain,
            question.session.difficulty,
            question.session.interviewType
        );

        // Update the question with user answer and evaluation
        const updatedQuestion = await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer: answer,
                aiEvaluation: evaluation.aiEvaluation,
                score: evaluation.score,
            },
        });

        return res.json({
            questionId: updatedQuestion.id,
            userAnswer: updatedQuestion.userAnswer,
            score: updatedQuestion.score,
            aiEvaluation: updatedQuestion.aiEvaluation,
            feedback: evaluation.feedback || null
        });

    } catch (error: any) {
        console.error("Error submitting text answer:", error);
        res.status(500).json({ error: "Failed to submit answer" });
    }
};

/**
 * Get interview session progress
 */
export const getInterviewProgress = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = await getInterviewSessionById(parseInt(sessionId));
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        const stats = await calculateSessionStats(parseInt(sessionId));
        const remainingTime = getRemainingTime(session);
        const expired = isSessionExpired(session);

        return res.json({
            sessionId: session.id,
            domain: session.domain,
            interviewType: session.interviewType,
            difficulty: session.difficulty,
            status: session.status,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            totalQuestions: stats.totalQuestions,
            answeredQuestions: stats.answeredQuestions,
            remainingQuestions: stats.remainingQuestions,
            averageScore: stats.averageScore,
            progress: stats.completionRate,
            remainingTime,
            expired,
            isCompleted: stats.isCompleted
        });

    } catch (error: any) {
        console.error("Error getting interview progress:", error);
        res.status(500).json({ error: "Failed to get interview progress" });
    }
};

/**
 * Complete the text interview session
 */
export const completeTextInterview = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        // Get session with all questions
        const session = await prisma.interviewSession.findUnique({
            where: { id: parseInt(sessionId) },
            include: {
                questions: true
            }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Calculate total score
        const scores = session.questions
            .filter(q => q.score !== null)
            .map(q => q.score || 0);

        const totalScore = scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;

        // Update session as completed
        const updatedSession = await prisma.interviewSession.update({
            where: { id: parseInt(sessionId) },
            data: {
                status: "COMPLETED",
                endedAt: new Date(),
                totalScore: Math.round(totalScore * 100) / 100
            }
        });

        return res.json({
            sessionId: updatedSession.id,
            status: updatedSession.status,
            totalScore: updatedSession.totalScore,
            endedAt: updatedSession.endedAt,
            message: "Interview completed successfully!"
        });

    } catch (error: any) {
        console.error("Error completing text interview:", error);
        res.status(500).json({ error: "Failed to complete interview" });
    }
};

/**
 * Get interview session summary
 */
export const getInterviewSummary = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = await prisma.interviewSession.findUnique({
            where: { id: parseInt(sessionId) },
            include: {
                questions: {
                    orderBy: { id: "asc" }
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

        const totalQuestions = session.questions.length;
        const answeredQuestions = session.questions.filter(q => q.userAnswer !== null);
        const scores = answeredQuestions.map(q => q.score || 0);
        const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

        return res.json({
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
            user: session.user,
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
                aiEvaluation: q.aiEvaluation
            }))
        });

    } catch (error: any) {
        console.error("Error getting interview summary:", error);
        res.status(500).json({ error: "Failed to get interview summary" });
    }
};

/**
 * Get user's interview history
 */
export const getUserInterviewHistory = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;

        const sessions = await prisma.interviewSession.findMany({
            where: {
                userId: parseInt(userId),
                format: "TEXT" // Only get text interviews
            },
            orderBy: { startedAt: "desc" },
            take: limit,
            include: {
                questions: {
                    select: {
                        id: true,
                        score: true,
                        userAnswer: true
                    }
                }
            }
        });

        const history = sessions.map(session => {
            const totalQuestions = session.questions.length;
            const answeredQuestions = session.questions.filter(q => q.userAnswer !== null).length;
            const scores = session.questions.filter(q => q.score !== null).map(q => q.score || 0);
            const averageScore = scores.length > 0
                ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                : 0;

            return {
                sessionId: session.id,
                domain: session.domain,
                interviewType: session.interviewType,
                difficulty: session.difficulty,
                duration: session.duration,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                totalScore: session.totalScore,
                statistics: {
                    totalQuestions,
                    answeredQuestions,
                    averageScore: Math.round(averageScore * 100) / 100,
                    completionRate: Math.round((answeredQuestions / totalQuestions) * 100) || 0
                }
            };
        });

        return res.json({
            userId: parseInt(userId),
            totalSessions: history.length,
            sessions: history
        });

    } catch (error: any) {
        console.error("Error getting user interview history:", error);
        res.status(500).json({ error: "Failed to get interview history" });
    }
};