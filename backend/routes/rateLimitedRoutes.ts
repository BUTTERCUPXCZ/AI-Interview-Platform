import express from 'express';
import { authRateLimit, apiRateLimit, interviewRateLimit, codingRateLimit } from '../middleware/rateLimiter';
import authRoutes from './authRoutes';
import codingRoutes from './codingRoutes';
import interview from './interview';
import textInterviewRoutes from './textInterviewRoutes';
import dashboardRoutes from './dashboardRoutes';
import progressRoutes from './progressRoutes';
import profileRoutes from './profileRoutes';

const router = express.Router();

// Apply rate limiting to different route groups
router.use('/auth', authRateLimit, authRoutes);
router.use('/coding', codingRateLimit, codingRoutes);
router.use('/interview', interviewRateLimit, interview);
router.use('/interview', interviewRateLimit, textInterviewRoutes);
router.use('/dashboard', apiRateLimit, dashboardRoutes);
router.use('/progress', apiRateLimit, progressRoutes);
router.use('/profile', apiRateLimit, profileRoutes);

export default router;