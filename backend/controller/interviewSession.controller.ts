import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { evaluateAnswer, evaluateAnswerBasic } from "../services/geminiService.js";

export const submitAnswer = async (req: Request, res: Response) => {
    try {
        const { questionId, userAnswer } = req.body;

        const question = await prisma.interviewQuestion.findUnique({ 
            where: { id: questionId },
            include: {
                session: {
                    select: { userId: true }
                }
            }
        });
        if (!question) return res.status(404).json({ error: "Question not found" });

        // Get user's plan
        const subscription = await prisma.subscription.findUnique({ 
            where: { userId: question.session.userId } 
        });
        const userPlan = subscription?.planType ?? 'FREE';
        const isPro = userPlan === 'PRO';

        // Use different evaluation based on plan
        const evaluation = isPro
            ? await evaluateAnswer(question.questionText, userAnswer) // AI evaluation for Pro
            : await evaluateAnswerBasic(question.questionText, userAnswer); // Basic evaluation for Free

        const updatedQuestion = await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer,
                aiEvaluation: evaluation.aiEvaluation,
                score: evaluation.score,
            },
        });

        res.json(updatedQuestion);
    } catch (error: unknown) {
        console.error(error);
        res.status(500).json({ error: "Error submitting answer" });
    }
};
