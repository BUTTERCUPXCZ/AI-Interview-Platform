import { prisma } from "../lib/prisma.js";
import { evaluateAnswer } from "../services/geminiService.js";
export const submitAnswer = async (req, res) => {
    try {
        const { questionId, userAnswer } = req.body;
        const question = await prisma.interviewQuestion.findUnique({ where: { id: questionId } });
        if (!question)
            return res.status(404).json({ error: "Question not found" });
        const evaluation = await evaluateAnswer(question.questionText, userAnswer);
        const updatedQuestion = await prisma.interviewQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer,
                aiEvaluation: evaluation.aiEvaluation,
                score: evaluation.score,
            },
        });
        res.json(updatedQuestion);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error submitting answer" });
    }
};
