import { CacheService } from "../services/cacheService.js";
// Extended cache keys for different operations
export const EXTENDED_CACHE_KEYS = {
    // Profile related
    USER_PROFILE: "profile:",
    USER_SKILLS: "skills:",
    USER_SETTINGS: "settings:",
    // Question related
    GENERATED_QUESTIONS: "questions:",
    QUESTION_POOL: "pool:",
    // AI Analysis
    AI_EVALUATION: "ai_eval:",
    AI_FEEDBACK: "ai_feedback:",
    // Performance metrics
    PERFORMANCE_STATS: "perf_stats:",
    LEADERBOARD: "leaderboard:",
    // System cache
    RUNTIME_INFO: "runtime:",
    LANGUAGE_SUPPORT: "lang_support:"
};
// Extended TTL configurations (in seconds)
export const EXTENDED_CACHE_TTL = {
    // Short term (for dynamic content)
    VERY_SHORT: 60, // 1 minute
    SHORT: 300, // 5 minutes
    // Medium term (for user data)
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    // Long term (for relatively static content)
    VERY_LONG: 3600 * 6, // 6 hours
    DAILY: 3600 * 24, // 24 hours
    WEEKLY: 3600 * 24 * 7 // 1 week
};
/**
 * Cache service wrapper with enhanced functionality
 */
export class EnhancedCacheService extends CacheService {
    // Cache AI-generated content with longer TTL
    static async cacheAIContent(key, content, type = "evaluation") {
        const ttl = {
            "question": EXTENDED_CACHE_TTL.DAILY, // Questions can be reused
            "evaluation": EXTENDED_CACHE_TTL.LONG, // Evaluations are session-specific
            "feedback": EXTENDED_CACHE_TTL.VERY_LONG // Feedback is valuable for longer
        };
        return await this.set(`${EXTENDED_CACHE_KEYS.AI_EVALUATION}${key}`, content, ttl[type]);
    }
    // Cache user performance metrics
    static async cachePerformanceStats(userId, stats) {
        const key = `${EXTENDED_CACHE_KEYS.PERFORMANCE_STATS}${userId}`;
        return await this.set(key, stats, EXTENDED_CACHE_TTL.MEDIUM);
    }
    // Cache question pools for faster retrieval
    static async cacheQuestionPool(domain, difficulty, type, questions) {
        const key = `${EXTENDED_CACHE_KEYS.QUESTION_POOL}${domain}:${difficulty}:${type}`;
        return await this.set(key, questions, EXTENDED_CACHE_TTL.DAILY);
    }
    static async getQuestionPool(domain, difficulty, type) {
        const key = `${EXTENDED_CACHE_KEYS.QUESTION_POOL}${domain}:${difficulty}:${type}`;
        return await this.get(key);
    }
    // Cache system runtime information (language support, etc.)
    static async cacheRuntimeInfo(language, info) {
        const key = `${EXTENDED_CACHE_KEYS.RUNTIME_INFO}${language}`;
        return await this.set(key, info, EXTENDED_CACHE_TTL.WEEKLY);
    }
    static async getRuntimeInfo(language) {
        const key = `${EXTENDED_CACHE_KEYS.RUNTIME_INFO}${language}`;
        return await this.get(key);
    }
    // Batch invalidation for user-related caches
    static async invalidateUserCaches(userId) {
        const keys = [
            `${EXTENDED_CACHE_KEYS.USER_PROFILE}${userId}`,
            `${EXTENDED_CACHE_KEYS.USER_SKILLS}${userId}`,
            `${EXTENDED_CACHE_KEYS.USER_SETTINGS}${userId}`,
            `${EXTENDED_CACHE_KEYS.PERFORMANCE_STATS}${userId}`
        ];
        const promises = keys.map(key => this.delete(key));
        return await Promise.all(promises);
    }
    // Cache warming functions for frequently accessed data
    static async warmUserCache(userId, userData) {
        const promises = [
            this.setUserSession(userId, userData.session),
            this.setUserProgress(userId, userData.progress),
            this.setDashboardCache(userId, userData.dashboard)
        ];
        return await Promise.allSettled(promises);
    }
    // Health check for cache system
    static async healthCheck() {
        const startTime = Date.now();
        try {
            const testKey = "health_check:test";
            const testValue = { timestamp: Date.now() };
            // Test write
            await this.set(testKey, testValue, 60);
            // Test read
            const result = await this.get(testKey);
            // Test delete
            await this.delete(testKey);
            const latency = Date.now() - startTime;
            if (result && result.timestamp === testValue.timestamp) {
                return { status: "healthy", latency };
            }
            else {
                return { status: "degraded", latency, error: "Data integrity issue" };
            }
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                status: "unhealthy",
                latency,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
}
// Export convenience functions
export const cacheAIContent = EnhancedCacheService.cacheAIContent.bind(EnhancedCacheService);
export const cachePerformanceStats = EnhancedCacheService.cachePerformanceStats.bind(EnhancedCacheService);
export const cacheQuestionPool = EnhancedCacheService.cacheQuestionPool.bind(EnhancedCacheService);
export const getQuestionPool = EnhancedCacheService.getQuestionPool.bind(EnhancedCacheService);
export const warmUserCache = EnhancedCacheService.warmUserCache.bind(EnhancedCacheService);
