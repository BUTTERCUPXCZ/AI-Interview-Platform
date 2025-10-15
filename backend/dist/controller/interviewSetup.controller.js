import { generateQuestions } from "../services/geminiService.js";
import { prisma } from "../lib/prisma.js";
export const createInterviewSession = async (req, res) => {
    try {
        const { userId, domain, interviewType, difficulty, duration, format, enableCodingSandbox = false } = req.body;
        const session = await prisma.interviewSession.create({
            data: {
                userId,
                domain,
                interviewType,
                difficulty,
                duration,
                format,
                role: "Software Developer",
                status: "IN_PROGRESS",
                enableCodingSandbox: enableCodingSandbox
            },
        });
        const questions = await generateQuestions(domain, difficulty, interviewType);
        // Save questions sequentially to avoid prepared statement conflicts
        const savedQuestions = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const savedQuestion = await prisma.interviewQuestion.create({
                data: {
                    sessionId: session.id,
                    questionText: q.question,
                    isCodingQuestion: q.isCodingQuestion || false,
                },
            });
            savedQuestions.push(savedQuestion);
        }
        return res.status(201).json({ session, questions: savedQuestions });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create interview session" });
    }
};
