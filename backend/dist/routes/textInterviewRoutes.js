import express from "express";
import { startTextInterview, getNextQuestion, submitTextAnswer, getInterviewProgress, completeTextInterview, getInterviewSummary } from "../controller/textInterview.controller";
import { startTextInterviewOptimized, getNextQuestionOptimized, submitTextAnswerOptimized } from "../controller/optimizedTextInterview.controller";
import { getUserInterviewHistory } from "../controller/textInterview.controller";
const router = express.Router();
/**
 * Text Interview Routes
 */
// Start a new text-based interview session
router.post("/text/start", startTextInterview);
// Optimized endpoints for faster performance
router.post("/text/optimized-start", startTextInterviewOptimized);
router.get("/text/session/:sessionId/next-question-fast", getNextQuestionOptimized);
router.post("/text/fast-submit", submitTextAnswerOptimized);
// Get the next question in the interview
router.get("/text/session/:sessionId/next-question", getNextQuestion);
// Submit an answer for a text interview question
router.post("/text/answer", submitTextAnswer);
// Get interview progress
router.get("/text/session/:sessionId/progress", getInterviewProgress);
// Complete the interview session
router.post("/text/session/:sessionId/complete", completeTextInterview);
// Get interview summary
router.get("/text/session/:sessionId/summary", getInterviewSummary);
// Get user's interview history
router.get("/text/user/:userId/history", getUserInterviewHistory);
export default router;
