import { CacheService } from "../services/cacheService";
/**
 * Redis-based rate limiting middleware
 */
export const createRateLimit = (options) => {
    const { windowMs, max, message = "Too many requests, please try again later.", statusCode = 429, keyGenerator = (req) => req.ip || "unknown" } = options;
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);
            const current = await CacheService.getRateLimit(key) || 0;
            if (current >= max) {
                return res.status(statusCode).json({
                    error: "Rate limit exceeded",
                    message,
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
            // Increment the counter
            await CacheService.incrementRateLimit(key);
            // Set headers for client information
            res.set({
                "X-RateLimit-Limit": max.toString(),
                "X-RateLimit-Remaining": Math.max(0, max - current - 1).toString(),
                "X-RateLimit-Reset": new Date(Date.now() + windowMs).toISOString()
            });
            next();
        }
        catch (error) {
            console.error("Rate limiting error:", error);
            // If Redis fails, allow the request to proceed
            next();
        }
    };
};
// Pre-configured rate limiters for different endpoints
export const authRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: "Too many authentication attempts, please try again later.",
    keyGenerator: (req) => `auth:${req.ip}:${req.body.email || "unknown"}`
});
export const apiRateLimit = createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: "API rate limit exceeded, please slow down your requests."
});
export const interviewRateLimit = createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 interview actions per minute
    message: "Too many interview requests, please wait a moment.",
    keyGenerator: (req) => `interview:${req.ip}:${req.body.userId || req.params.userId || "unknown"}`
});
export const codingRateLimit = createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 code submissions per minute
    message: "Too many code submissions, please wait a moment.",
    keyGenerator: (req) => `coding:${req.ip}:${req.body.userId || req.params.userId || "unknown"}`
});
