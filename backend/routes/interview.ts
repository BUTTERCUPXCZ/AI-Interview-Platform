import express from "express";
import { createInterviewSession } from "../controller/interviewSetup.controller";
import { submitAnswer } from "../controller/interviewSession.controller";
import { generateAIFeedback, getFeedback, getUnifiedSessionFeedback, generateComprehensiveSessionFeedback, analyzeInterviewerBehavior, generateAICareerRecommendations } from "../controller/feedback.controller";

const router = express.Router();

router.post("/session/create", createInterviewSession);
router.post("/question/answer", submitAnswer);
router.post("/session/:sessionId/feedback", generateAIFeedback);
router.get("/session/:sessionId/feedback", getUnifiedSessionFeedback);
router.post("/session/:sessionId/comprehensive-feedback", generateComprehensiveSessionFeedback);
router.post("/session/:sessionId/interviewer-analysis", analyzeInterviewerBehavior);
router.get("/session/:sessionId/ai-recommendations", generateAICareerRecommendations);

export default router;
