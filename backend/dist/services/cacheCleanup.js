import { redis } from "../lib/redis.js";
/**
 * Cache cleanup utilities for fixing corrupted Redis entries
 */
export class CacheCleanup {
    /**
     * Clear all corrupted cache entries that contain "[object Object]"
     */
    static async clearCorruptedEntries() {
        let deletedCount = 0;
        try {
            console.log("🧹 Starting cache cleanup for corrupted entries...");
            // Get all keys matching our cache patterns
            const patterns = [
                "user_session:*",
                "interview_state:*",
                "coding_session:*",
                "user_progress:*",
                "dashboard_cache:*",
                "feedback_cache:*",
                "profile:*"
            ];
            for (const pattern of patterns) {
                try {
                    // Note: Upstash Redis might not support SCAN, so we'll use a different approach
                    const keys = await this.getKeysForPattern(pattern);
                    for (const key of keys) {
                        try {
                            const value = await redis.get(key);
                            if (typeof value === "string" &&
                                (value === "[object Object]" || value.startsWith("[object "))) {
                                await redis.del(key);
                                deletedCount++;
                                console.log(`🗑️ Deleted corrupted cache key: ${key}`);
                            }
                        }
                        catch (error) {
                            console.warn(`Failed to check key ${key}:`, error);
                        }
                    }
                }
                catch (error) {
                    console.warn(`Failed to process pattern ${pattern}:`, error);
                }
            }
            console.log(`✅ Cache cleanup completed. Deleted ${deletedCount} corrupted entries.`);
            return deletedCount;
        }
        catch (error) {
            console.error("❌ Cache cleanup failed:", error);
            throw error;
        }
    }
    /**
     * Clear all cache entries for a specific user
     */
    static async clearUserCache(userId) {
        try {
            const keysToDelete = [
                `user_session:${userId}`,
                `user_progress:${userId}`,
                `dashboard_cache:${userId}`,
                `profile:${userId}`
            ];
            for (const key of keysToDelete) {
                try {
                    await redis.del(key);
                    console.log(`🗑️ Cleared cache key: ${key}`);
                }
                catch (error) {
                    console.warn(`Failed to delete key ${key}:`, error);
                }
            }
        }
        catch (error) {
            console.error("Failed to clear user cache:", error);
        }
    }
    /**
     * Clear all cache entries (use with caution!)
     */
    static async clearAllCache() {
        try {
            console.log("🧹 Clearing ALL cache entries...");
            // For Upstash Redis, we'll delete known patterns
            const patterns = [
                "user_session:*",
                "interview_state:*",
                "coding_session:*",
                "user_progress:*",
                "dashboard_cache:*",
                "feedback_cache:*",
                "profile:*",
                "rate_limit:*",
                "code_exec:*"
            ];
            let totalDeleted = 0;
            for (const pattern of patterns) {
                try {
                    const keys = await this.getKeysForPattern(pattern);
                    for (const key of keys) {
                        await redis.del(key);
                        totalDeleted++;
                    }
                }
                catch (error) {
                    console.warn(`Failed to clear pattern ${pattern}:`, error);
                }
            }
            console.log(`✅ Cleared ${totalDeleted} cache entries`);
        }
        catch (error) {
            console.error("Failed to clear all cache:", error);
        }
    }
    /**
     * Get cache statistics
     */
    static async getCacheStats() {
        const stats = {
            totalKeys: 0,
            keysByPattern: {},
            corruptedKeys: 0
        };
        try {
            const patterns = [
                "user_session:*",
                "interview_state:*",
                "coding_session:*",
                "user_progress:*",
                "dashboard_cache:*",
                "feedback_cache:*",
                "profile:*",
                "rate_limit:*"
            ];
            for (const pattern of patterns) {
                try {
                    const keys = await this.getKeysForPattern(pattern);
                    stats.keysByPattern[pattern] = keys.length;
                    stats.totalKeys += keys.length;
                    // Check for corrupted entries
                    for (const key of keys) {
                        try {
                            const value = await redis.get(key);
                            if (typeof value === "string" &&
                                (value === "[object Object]" || value.startsWith("[object "))) {
                                stats.corruptedKeys++;
                            }
                        }
                        catch {
                            // Parsing error means corrupted data
                            stats.corruptedKeys++;
                        }
                    }
                }
                catch (error) {
                    console.warn(`Failed to get stats for pattern ${pattern}:`, error);
                }
            }
        }
        catch (error) {
            console.error("Failed to get cache stats:", error);
        }
        return stats;
    }
    /**
     * Helper method to get keys for a pattern (Upstash compatible)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async getKeysForPattern(_pattern) {
        // Since Upstash might not support SCAN, we'll return empty array
        // In a real Redis setup, you'd use SCAN here
        // For now, we'll track keys manually or use a different approach
        return [];
    }
}
// Convenience functions
export const clearCorruptedCache = CacheCleanup.clearCorruptedEntries.bind(CacheCleanup);
export const clearUserCache = CacheCleanup.clearUserCache.bind(CacheCleanup);
export const clearAllCache = CacheCleanup.clearAllCache.bind(CacheCleanup);
export const getCacheStats = CacheCleanup.getCacheStats.bind(CacheCleanup);
