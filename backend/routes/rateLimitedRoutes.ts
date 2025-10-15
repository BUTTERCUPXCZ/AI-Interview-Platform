import express from "express";
import { authRateLimit, apiRateLimit, interviewRateLimit, codingRateLimit } from "../middleware/rateLimiter.js";
import authRoutes from "./authRoutes.js";
import codingRoutes from "./codingRoutes.js";
import interview from "./interview.js";
import textInterviewRoutes from "./textInterviewRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import progressRoutes from "./progressRoutes.js";
import profileRoutes from "./profileRoutes.js";

const router = express.Router();

// Apply rate limiting to different route groups
router.use("/auth", authRateLimit, authRoutes);
router.use("/coding", codingRateLimit, codingRoutes);
router.use("/interview", interviewRateLimit, interview);
router.use("/interview", interviewRateLimit, textInterviewRoutes);
router.use("/dashboard", apiRateLimit, dashboardRoutes);
router.use("/progress", apiRateLimit, progressRoutes);
router.use("/profile", apiRateLimit, profileRoutes);

export default router;