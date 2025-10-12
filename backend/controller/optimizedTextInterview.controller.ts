import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { generateTextInterviewQuestions, evaluateTextAnswer } from "../services/geminiService";

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
 * Optimized: Start a new text-based interview session with lazy question generation
 */
export const startTextInterviewOptimized = async (req: Request, res: Response) => {
    try {
        console.log('Received request body:', req.body);
        const { userId, domain, interviewType, difficulty, duration, enableCodingSandbox = false }: StartTextInterviewRequest = req.body;

        // Validate required fields
        if (!userId || !domain || !interviewType || !difficulty) {
            return res.status(400).json({
                error: "Missing required fields: userId, domain, interviewType, difficulty"
            });
        }

        // Helper function to convert frontend values to backend enum values
        const convertToEnum = (value: string): string => {
            return value.toUpperCase().replace(/-/g, '_');
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

        // Generate only the first question immediately to reduce initial load time
        const firstQuestionData = await generateSingleTextQuestion(domain, difficulty, interviewType, 1);

        const firstQuestion = await prisma.interviewQuestion.create({
            data: {
                sessionId: session.id,
                questionText: firstQuestionData.question,
                isCodingQuestion: false,
            },
        });

        // Return session details with first question
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
                totalQuestions: 5 // Fixed total
            },
            currentQuestion: {
                id: firstQuestion.id,
                questionText: firstQuestion.questionText,
                questionNumber: 1,
                totalQuestions: 5
            }
        });

    } catch (error: any) {
        console.error("Error starting text interview:", error);
        res.status(500).json({ error: "Failed to start text interview session" });
    }
};

/**
 * Optimized: Get next question with dynamic generation
 */
export const getNextQuestionOptimized = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const currentQuestionId = parseInt(req.query.currentQuestionId as string);

        if (!sessionId || !currentQuestionId) {
            return res.status(400).json({ error: "Missing sessionId or currentQuestionId" });
        }

        const session = await prisma.interviewSession.findUnique({
            where: { id: parseInt(sessionId) },
            include: { questions: true }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        const currentQuestionNumber = session.questions.findIndex(q => q.id === currentQuestionId) + 1;
        const nextQuestionNumber = currentQuestionNumber + 1;
        const totalQuestions = 5;

        if (nextQuestionNumber > totalQuestions) {
            return res.json({ completed: true });
        }

        // Check if next question already exists
        let nextQuestion = session.questions.find((_, index) => index + 1 === nextQuestionNumber);

        if (!nextQuestion) {
            // Generate next question dynamically
            const questionData = await generateSingleTextQuestion(
                session.domain,
                session.difficulty,
                session.interviewType,
                nextQuestionNumber
            );

            nextQuestion = await prisma.interviewQuestion.create({
                data: {
                    sessionId: session.id,
                    questionText: questionData.question,
                    isCodingQuestion: false,
                },
            });
        }

        return res.json({
            currentQuestion: {
                id: nextQuestion.id,
                questionText: nextQuestion.questionText,
                questionNumber: nextQuestionNumber,
                totalQuestions: totalQuestions
            },
            completed: false
        });

    } catch (error: any) {
        console.error("Error getting next question:", error);
        res.status(500).json({ error: "Failed to get next question" });
    }
};

/**
 * Optimized: Submit answer with background AI evaluation
 */
export const submitTextAnswerOptimized = async (req: Request, res: Response) => {
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

        if (!question || question.sessionId !== sessionId) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Save answer immediately and respond quickly
        const updatedQuestion = await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer: answer,
                // Set temporary score while AI evaluates
                score: -1, // Indicates pending evaluation
            },
        });

        // Return immediately for faster UX
        res.json({
            questionId: updatedQuestion.id,
            userAnswer: updatedQuestion.userAnswer,
            score: null, // Will be updated later
            aiEvaluation: "Evaluating...",
            feedback: "Your answer has been submitted successfully!"
        });

        // Perform AI evaluation in background (don't await)
        evaluateAnswerInBackground(questionId, question.questionText, answer, question.session);

    } catch (error: any) {
        console.error("Error submitting text answer:", error);
        res.status(500).json({ error: "Failed to submit answer" });
    }
};

// Helper function to generate a single question
async function generateSingleTextQuestion(domain: string, difficulty: string, interviewType: string, questionNumber: number) {
    // This would be a simplified version that generates one question at a time
    const prompt = `Generate 1 ${difficulty} ${interviewType} interview question for ${domain} development. 
    Question number: ${questionNumber}.
    Return only the question text, no formatting.`;

    // Simplified question generation - you'd implement this based on your existing service
    return {
        question: `${interviewType} question ${questionNumber} for ${domain} at ${difficulty} level - [This would be generated by AI]`
    };
}

// Background evaluation function
async function evaluateAnswerInBackground(questionId: number, questionText: string, answer: string, session: any) {
    try {
        const evaluation = await evaluateTextAnswer(
            questionText,
            answer,
            session.domain,
            session.difficulty,
            session.interviewType
        );

        // Update the question with evaluation results
        await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                aiEvaluation: evaluation.aiEvaluation,
                score: evaluation.score,
            },
        });

        console.log(`Background evaluation completed for question ${questionId}`);
    } catch (error) {
        console.error(`Background evaluation failed for question ${questionId}:`, error);

        // Update with error state
        await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                aiEvaluation: "Evaluation unavailable",
                score: 5, // Default neutral score
            },
        });
    }
}