import { redisOperations } from "../lib/redis.js";

// Cache keys constants
export const CACHE_KEYS = {
    USER_SESSION: "user_session:",
    INTERVIEW_STATE: "interview_state:",
    CODING_SESSION: "coding_session:",
    USER_PROGRESS: "user_progress:",
    RATE_LIMIT: "rate_limit:",
    FEEDBACK_CACHE: "feedback_cache:",
    DASHBOARD_CACHE: "dashboard_cache:"
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    USER_SESSION: 3600 * 24, // 24 hours
    INTERVIEW_STATE: 3600 * 2, // 2 hours
    CODING_SESSION: 3600 * 4, // 4 hours
    USER_PROGRESS: 3600 * 6, // 6 hours
    RATE_LIMIT: 60, // 1 minute
    FEEDBACK_CACHE: 3600 * 12, // 12 hours
    DASHBOARD_CACHE: 3600 // 1 hour
} as const;

export class CacheService {
    // User session management
    static async setUserSession(userId: string, sessionData: unknown) {
        const key = `${CACHE_KEYS.USER_SESSION}${userId}`;
        return await redisOperations.set(key, sessionData, CACHE_TTL.USER_SESSION);
    }

    static async getUserSession(userId: string) {
        const key = `${CACHE_KEYS.USER_SESSION}${userId}`;
        return await redisOperations.get(key);
    }

    static async deleteUserSession(userId: string) {
        const key = `${CACHE_KEYS.USER_SESSION}${userId}`;
        return await redisOperations.del(key);
    }

    // Interview state management
    static async setInterviewState(sessionId: string, state: unknown) {
        const key = `${CACHE_KEYS.INTERVIEW_STATE}${sessionId}`;
        return await redisOperations.set(key, state, CACHE_TTL.INTERVIEW_STATE);
    }

    static async getInterviewState(sessionId: string) {
        const key = `${CACHE_KEYS.INTERVIEW_STATE}${sessionId}`;
        return await redisOperations.get(key);
    }

    static async deleteInterviewState(sessionId: string) {
        const key = `${CACHE_KEYS.INTERVIEW_STATE}${sessionId}`;
        return await redisOperations.del(key);
    }

    // Coding session management
    static async setCodingSession(sessionId: string, sessionData: unknown) {
        const key = `${CACHE_KEYS.CODING_SESSION}${sessionId}`;
        return await redisOperations.set(key, sessionData, CACHE_TTL.CODING_SESSION);
    }

    static async getCodingSession(sessionId: string) {
        const key = `${CACHE_KEYS.CODING_SESSION}${sessionId}`;
        return await redisOperations.get(key);
    }

    static async deleteCodingSession(sessionId: string) {
        const key = `${CACHE_KEYS.CODING_SESSION}${sessionId}`;
        return await redisOperations.del(key);
    }

    // User progress caching
    static async setUserProgress(userId: string, progressData: unknown) {
        const key = `${CACHE_KEYS.USER_PROGRESS}${userId}`;
        return await redisOperations.set(key, progressData, CACHE_TTL.USER_PROGRESS);
    }

    static async getUserProgress(userId: string) {
        const key = `${CACHE_KEYS.USER_PROGRESS}${userId}`;
        return await redisOperations.get(key);
    }

    static async invalidateUserProgress(userId: string) {
        const key = `${CACHE_KEYS.USER_PROGRESS}${userId}`;
        return await redisOperations.del(key);
    }

    // Rate limiting
    static async setRateLimit(identifier: string, attempts: number = 1) {
        const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
        return await redisOperations.set(key, attempts, CACHE_TTL.RATE_LIMIT);
    }

    static async getRateLimit(identifier: string) {
        const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
        return await redisOperations.get(key);
    }

    static async incrementRateLimit(identifier: string) {
        const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
        const current = await redisOperations.get(key) || 0;
        return await redisOperations.set(key, current + 1, CACHE_TTL.RATE_LIMIT);
    }

    // Dashboard data caching
    static async setDashboardCache(userId: string, dashboardData: unknown) {
        const key = `${CACHE_KEYS.DASHBOARD_CACHE}${userId}`;
        return await redisOperations.set(key, dashboardData, CACHE_TTL.DASHBOARD_CACHE);
    }

    static async getDashboardCache(userId: string) {
        const key = `${CACHE_KEYS.DASHBOARD_CACHE}${userId}`;
        return await redisOperations.get(key);
    }

    static async invalidateDashboardCache(userId: string) {
        const key = `${CACHE_KEYS.DASHBOARD_CACHE}${userId}`;
        return await redisOperations.del(key);
    }

    // Feedback caching
    static async setFeedbackCache(sessionId: string, feedback: unknown) {
        const key = `${CACHE_KEYS.FEEDBACK_CACHE}${sessionId}`;
        return await redisOperations.set(key, feedback, CACHE_TTL.FEEDBACK_CACHE);
    }

    static async getFeedbackCache(sessionId: string) {
        const key = `${CACHE_KEYS.FEEDBACK_CACHE}${sessionId}`;
        return await redisOperations.get(key);
    }

    // Generic cache operations
    static async set(key: string, value: unknown, ttl?: number) {
        return await redisOperations.set(key, value, ttl);
    }

    static async get(key: string) {
        return await redisOperations.get(key);
    }

    static async delete(key: string) {
        return await redisOperations.del(key);
    }

    static async exists(key: string) {
        return await redisOperations.exists(key);
    }

    // Clear all caches for a user (useful for logout)
    static async clearUserCaches(userId: string) {
        const promises = [
            this.deleteUserSession(userId),
            this.invalidateUserProgress(userId),
            this.invalidateDashboardCache(userId)
        ];

        return await Promise.all(promises);
    }
}