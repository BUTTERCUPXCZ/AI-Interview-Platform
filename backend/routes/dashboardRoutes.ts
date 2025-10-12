import express from "express";
import { getDashboardData } from "../controller/dashboard.controller";

const router = express.Router();

// Get comprehensive dashboard data for a user
router.get("/user/:userId", getDashboardData);

export default router;