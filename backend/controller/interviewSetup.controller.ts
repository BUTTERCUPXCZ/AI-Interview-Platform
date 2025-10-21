import { Request, Response } from "express";
import { generateQuestions } from "../services/geminiService.js";
import { prisma } from "../lib/prisma.js";


export const createInterviewSession = async (req: Request, res: Response) => {
    try {
        // Prefer authenticated user id (attached by isAuthenticated middleware)
        const authUserId = (req as any).user?.id;
        const bodyUserId = req.body.userId;
        const userId = authUserId ?? bodyUserId;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const { domain, interviewType, difficulty, duration, format } = req.body;

        // Get user's plan (attached by checkPlanLimit middleware)
        const userPlan = (req as any).userPlan ?? 'FREE';

        // ==================== PLAN-BASED RESTRICTIONS ====================
        
        // 1. FREE users can only access 1 role specialization (frontend only)
        const allowedDomains = userPlan === 'PRO' 
            ? ['frontend', 'backend', 'fullstack', 'data-science', 'mobile', 'devops'] 
            : ['frontend']; // FREE users only get frontend

        if (!allowedDomains.includes(domain)) {
            return res.status(403).json({ 
                error: 'Upgrade to Pro to access all role specializations',
                message: 'Free plan users can only access Frontend Development. Upgrade to Pro for all 5 specializations.',
                requiredPlan: 'PRO'
            });
        }

        // 2. FREE users can only do technical interviews (no system-design)
        const allowedInterviewTypes = userPlan === 'PRO' 
            ? ['technical', 'behavioral', 'system-design'] 
            : ['technical', 'behavioral']; // System design is PRO-only custom scenario

        if (!allowedInterviewTypes.includes(interviewType)) {
            return res.status(403).json({ 
                error: 'Upgrade to Pro for custom interview scenarios',
                message: 'System Design interviews are a Pro feature. Upgrade to access advanced interview types.',
                requiredPlan: 'PRO'
            });
        }

        // 3. FREE users limited to Beginner and Intermediate difficulty
        const allowedDifficulty = userPlan === 'PRO' 
            ? ['Beginner', 'Intermediate', 'Advanced'] 
            : ['Beginner', 'Intermediate']; // Advanced is PRO-only

        if (!allowedDifficulty.includes(difficulty)) {
            return res.status(403).json({ 
                error: 'Upgrade to Pro for advanced difficulty',
                message: 'Advanced difficulty interviews are a Pro feature.',
                requiredPlan: 'PRO'
            });
        }

        // 4. Coding sandbox only for PRO users
        const enableCodingSandbox = userPlan === 'PRO';

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
    } catch (error: unknown) {
        console.error(error);
        res.status(500).json({ error: "Failed to create interview session" });
    }
};
