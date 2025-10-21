// middleware/checkPlanLimit.js
import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export const checkPlanLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id; // from JWT auth middleware
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: missing user in request" });
    }

    // Determine user's plan from Subscription (default to FREE)
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    const plan = subscription?.planType ?? "FREE";
    // Attach plan info to request for downstream handlers
    (req as any).userPlan = plan;
    (req as any).subscription = subscription;

    // Count interview sessions started in the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const interviewsThisWeek = await prisma.interviewSession.count({
      where: {
        userId,
        startedAt: { gte: oneWeekAgo },
      },
    });

    // Free plan limit: 2 sessions per week
    if (plan === "FREE" && interviewsThisWeek >= 2) {
      return res.status(403).json({
        message: "Free plan users can only take 2 practice interviews per week.",
      });
    }

    // All checks passed
    next();
  } catch (error) {
    console.error("checkPlanLimit error:", error);
    res.status(500).json({ message: "Failed to verify plan limits" });
  }
};
