import { PrismaClient, SessionStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface InterviewSessionData {
    id: number;
    userId: number;
    domain: string;
    interviewType: string;
    difficulty: string;
    duration: number;
    format: string;
    status: SessionStatus;
    startedAt: Date;
    endedAt?: Date | null;
    totalScore?: number | null;
}

export interface QuestionData {
    id: number;
    sessionId: number;
    questionText: string;
    userAnswer?: string | null;
    aiEvaluation?: string | null;
    score?: number | null;
    isCodingQuestion: boolean;
}

/**
 * Get interview session by ID with validation
 */
export const getInterviewSessionById = async (sessionId: number): Promise<InterviewSessionData | null> => {
    try {
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionId }
        });

        return session;
    } catch (error) {
        console.error(`Error fetching session ${sessionId}:`, error);
        return null;
    }
};

/**
 * Validate if user owns the session
 */
export const validateUserSession = async (sessionId: number, userId: number): Promise<boolean> => {
    try {
        const session = await prisma.interviewSession.findFirst({
            where: {
                id: sessionId,
                userId: userId
            }
        });

        return session !== null;
    } catch (error) {
        console.error(`Error validating user session:`, error);
        return false;
    }
};

/**
 * Get all questions for a session in order
 */
export const getSessionQuestions = async (sessionId: number): Promise<QuestionData[]> => {
    try {
        const questions = await prisma.interviewQuestion.findMany({
            where: { sessionId },
            orderBy: { id: 'asc' }
        });

        return questions;
    } catch (error) {
        console.error(`Error fetching questions for session ${sessionId}:`, error);
        return [];
    }
};

/**
 * Get current question index for a session
 */
export const getCurrentQuestionIndex = async (sessionId: number): Promise<number> => {
    try {
        const questions = await getSessionQuestions(sessionId);

        // Find the first unanswered question
        const unansweredIndex = questions.findIndex(q => !q.userAnswer);

        // If all questions are answered, return the last index + 1 (completed)
        return unansweredIndex === -1 ? questions.length : unansweredIndex;
    } catch (error) {
        console.error(`Error getting current question index:`, error);
        return 0;
    }
};

/**
 * Check if interview session is completed
 */
export const isInterviewCompleted = async (sessionId: number): Promise<boolean> => {
    try {
        const questions = await getSessionQuestions(sessionId);

        if (questions.length === 0) return false;

        // Check if all questions have answers
        const allAnswered = questions.every(q => q.userAnswer !== null && q.userAnswer !== undefined);

        return allAnswered;
    } catch (error) {
        console.error(`Error checking if interview is completed:`, error);
        return false;
    }
};

/**
 * Calculate session statistics
 */
export const calculateSessionStats = async (sessionId: number) => {
    try {
        const questions = await getSessionQuestions(sessionId);

        const totalQuestions = questions.length;
        const answeredQuestions = questions.filter(q => q.userAnswer !== null).length;
        const scores = questions.filter(q => q.score !== null).map(q => q.score || 0);

        const averageScore = scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;

        const completionRate = totalQuestions > 0
            ? (answeredQuestions / totalQuestions) * 100
            : 0;

        return {
            totalQuestions,
            answeredQuestions,
            remainingQuestions: totalQuestions - answeredQuestions,
            averageScore: Math.round(averageScore * 100) / 100,
            completionRate: Math.round(completionRate),
            isCompleted: answeredQuestions === totalQuestions && totalQuestions > 0
        };
    } catch (error) {
        console.error(`Error calculating session stats:`, error);
        return {
            totalQuestions: 0,
            answeredQuestions: 0,
            remainingQuestions: 0,
            averageScore: 0,
            completionRate: 0,
            isCompleted: false
        };
    }
};

/**
 * Get session duration in minutes
 */
export const getSessionDuration = (startedAt: Date, endedAt?: Date): number => {
    const end = endedAt || new Date();
    const diffMs = end.getTime() - startedAt.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
};

/**
 * Update session status
 */
export const updateSessionStatus = async (sessionId: number, status: SessionStatus, totalScore?: number) => {
    try {
        const updateData: any = {
            status
        };

        if (status === 'COMPLETED') {
            updateData.endedAt = new Date();
            if (totalScore !== undefined) {
                updateData.totalScore = totalScore;
            }
        }

        const updatedSession = await prisma.interviewSession.update({
            where: { id: sessionId },
            data: updateData
        });

        return updatedSession;
    } catch (error) {
        console.error(`Error updating session status:`, error);
        throw error;
    }
};

/**
 * Check if session has expired based on duration
 */
export const isSessionExpired = (session: InterviewSessionData): boolean => {
    if (session.status === 'COMPLETED' || session.status === 'CANCELED') {
        return false;
    }

    const now = new Date();
    const sessionDurationMs = session.duration * 60 * 1000; // Convert minutes to milliseconds
    const sessionEndTime = new Date(session.startedAt.getTime() + sessionDurationMs);

    return now > sessionEndTime;
};

/**
 * Get remaining time for session in minutes
 */
export const getRemainingTime = (session: InterviewSessionData): number => {
    if (session.status === 'COMPLETED' || session.status === 'CANCELED') {
        return 0;
    }

    const now = new Date();
    const sessionDurationMs = session.duration * 60 * 1000;
    const sessionEndTime = new Date(session.startedAt.getTime() + sessionDurationMs);

    const remainingMs = sessionEndTime.getTime() - now.getTime();
    return Math.max(0, Math.round(remainingMs / (1000 * 60)));
};

/**
 * Get user's recent interview sessions
 */
export const getUserRecentSessions = async (userId: number, limit: number = 10) => {
    try {
        const sessions = await prisma.interviewSession.findMany({
            where: { userId },
            orderBy: { startedAt: 'desc' },
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

        return sessions.map(session => {
            const stats = {
                totalQuestions: session.questions.length,
                answeredQuestions: session.questions.filter(q => q.userAnswer !== null).length,
                averageScore: session.questions.length > 0
                    ? session.questions
                        .filter(q => q.score !== null)
                        .reduce((sum, q) => sum + (q.score || 0), 0) / session.questions.length
                    : 0
            };

            return {
                ...session,
                statistics: stats
            };
        });
    } catch (error) {
        console.error(`Error fetching user recent sessions:`, error);
        return [];
    }
};