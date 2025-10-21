import express from "express";
import { createInterviewSession } from "../controller/interviewSetup.controller.js";
import { isAuthenticated } from "../middleware/AuthToken.js";
import { checkPlanLimit } from "../middleware/checkplanlimit.js";
import { submitAnswer } from "../controller/interviewSession.controller.js";
import { generateAIFeedback, getUnifiedSessionFeedback, generateComprehensiveSessionFeedback, analyzeInterviewerBehavior, generateAICareerRecommendations } from "../controller/feedback.controller.js";

const router = express.Router();

// Only authenticated users can create sessions. checkPlanLimit enforces Free vs Pro limits.
router.post("/session/create", isAuthenticated, checkPlanLimit, createInterviewSession);
router.post("/question/answer", submitAnswer);
router.post("/session/:sessionId/feedback", generateAIFeedback);
router.get("/session/:sessionId/feedback", getUnifiedSessionFeedback);

// PRO-only: Advanced AI feedback & detailed analytics
router.post("/session/:sessionId/comprehensive-feedback", isAuthenticated, generateComprehensiveSessionFeedback);

// PRO-only: Advanced analytics features
router.post("/session/:sessionId/interviewer-analysis", isAuthenticated, analyzeInterviewerBehavior);
router.get("/session/:sessionId/ai-recommendations", isAuthenticated, generateAICareerRecommendations);

export default router;
