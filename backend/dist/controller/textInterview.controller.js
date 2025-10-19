import { prisma } from "../lib/prisma.js";
import { generateTextInterviewQuestions } from "../services/geminiService.js";
import { CacheService } from "../services/cacheService.js";
import { getInterviewSessionById, 
// validateUserSession,
getSessionQuestions, 
// getCurrentQuestionIndex,
isInterviewCompleted, calculateSessionStats, updateSessionStatus, isSessionExpired, getRemainingTime } from "../services/interviewSessionService.js";
/**
 * Start a new text-based interview session
 */
export const startTextInterview = async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        const { userId, domain, interviewType, difficulty, duration, enableCodingSandbox = false } = req.body;
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
        const convertToEnum = (value) => {
            return value.toUpperCase().replace(/-/g, "_");
        };
        // Create interview session
        const session = await prisma.interviewSession.create({
            data: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                domain: convertToEnum(domain),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                interviewType: convertToEnum(interviewType),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                difficulty: difficulty.toUpperCase(),
                userId,
                duration: duration || 30,
                format: "TEXT",
                role: "Software Developer",
                status: "IN_PROGRESS",
                enableCodingSandbox: enableCodingSandbox
            },
        });
        // Generate text-based questions
        const questions = await generateTextInterviewQuestions(domain, difficulty, interviewType);
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
    }
    catch (error) {
        console.error("Error starting text interview:", error);
        res.status(500).json({ error: "Failed to start text interview session" });
    }
};
/**
 * Get the next question in the interview
 */
export const getNextQuestion = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const currentQuestionId = parseInt(req.query.currentQuestionId);
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
        }
        else {
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
                questions: sessionQuestions.map((q) => ({ id: q.id, questionText: q.questionText }))
            });
        }
        // Get all questions for the session
        const questions = sessionQuestions;
        if (questions.length === 0) {
            return res.status(404).json({ error: "No questions found for this session" });
        }
        // Find current question index
        const currentIndex = questions.findIndex((q) => q.id === currentQuestionId);
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
    }
    catch (error) {
        console.error("Error getting next question:", error);
        res.status(500).json({ error: "Failed to get next question" });
    }
};
/**
 * Submit an answer for a text interview question
 */
export const submitTextAnswer = async (req, res) => {
    try {
        const { sessionId, questionId, answer } = req.body;
        if (!sessionId || !questionId || !answer) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: { userAnswer: answer },
        });
        return res.status(200).json({ message: "Answer saved successfully" });
    }
    catch (error) {
        console.error("Error submitting text answer:", error);
        res.status(500).json({ error: "Failed to submit answer" });
    }
};
/**
 * Get interview session progress
 */
export const getInterviewProgress = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error getting interview progress:", error);
        res.status(500).json({ error: "Failed to get interview progress" });
    }
};
/**
 * Complete the text interview session
 */
export const completeTextInterview = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error completing text interview:", error);
        res.status(500).json({ error: "Failed to complete interview" });
    }
};
/**
 * Get interview session summary
 */
export const getInterviewSummary = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error getting interview summary:", error);
        res.status(500).json({ error: "Failed to get interview summary" });
    }
};
/**
 * Get user's interview history
 */
export const getUserInterviewHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const sessions = await prisma.interviewSession.findMany({
            where: {
                userId: parseInt(userId),
                format: "TEXT" /* Lines 430-431 omitted */
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
        const history = sessions.map(session => { });
        return res.json({
            userId: parseInt(userId),
            totalSessions: history.length,
            sessions: history
        });
    }
    catch (error) {
        console.error("Error getting user interview history:", error);
        res.status(500).json({ error: "Failed to get interview history" });
    }
};
/**
 * Get overall performance evaluation using Gemini AI
 */
export const getOverallPerformance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Fetch complete session data
        const session = await prisma.interviewSession.findUnique({
            where: { id: parseInt(sessionId) },
            include: {
                questions: {
                    orderBy: { id: "asc" },
                    select: {
                        questionText: true,
                        userAnswer: true,
                        score: true
                    }
                }
            }
        });
        if (!session) {
            return res.status(404).json({ error: "Interview session not found" });
        }
        // Check if session is completed
        if (session.status !== "COMPLETED") {
            return res.status(400).json({
                error: "Interview must be completed before generating overall performance evaluation"
            });
        }
        // Import Gemini service
        const { evaluateOverallPerformance } = await import("../services/geminiService.js");
        // Prepare session data for evaluation
        const sessionData = {
            domain: session.domain,
            difficulty: session.difficulty,
            interviewType: session.interviewType,
            duration: session.duration,
            questions: session.questions
        };
        console.log(`Generating overall performance evaluation for session ${sessionId}...`);
        // Get AI evaluation
        const evaluation = await evaluateOverallPerformance(sessionData);
        // Optionally save evaluation to session
        await prisma.interviewSession.update({
            where: { id: parseInt(sessionId) },
            data: {
                totalScore: evaluation.overallScore
            }
        });
        return res.json({
            sessionId: session.id,
            evaluation: {
                ...evaluation,
                sessionInfo: {
                    domain: session.domain,
                    difficulty: session.difficulty,
                    interviewType: session.interviewType,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    totalQuestions: session.questions.length,
                    answeredQuestions: session.questions.filter(q => q.userAnswer).length
                }
            }
        });
    }
    catch (error) {
        console.error("Error getting overall performance:", error);
        res.status(500).json({ error: "Failed to generate overall performance evaluation" });
    }
};
