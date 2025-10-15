import express from "express";
import { getProgressAnalytics } from "../controller/progress.controller.js";
const router = express.Router();
// Get comprehensive progress analytics for a user
router.get("/user/:userId", getProgressAnalytics);
export default router;
