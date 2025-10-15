import express from "express";
import { clearCorruptedCache, clearUserCache, getCacheStats } from "../services/cacheCleanup.js";
import { CacheService } from "../services/cacheService.js";
const router = express.Router();
// Get cache health status
router.get("/health", async (req, res) => {
    try {
        const stats = await getCacheStats();
        res.json({
            status: "healthy",
            stats,
            timestamp: new Date()
        });
    }
    catch (error) {
        res.status(500).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date()
        });
    }
});
// Clear corrupted cache entries
router.post("/cleanup/corrupted", async (req, res) => {
    try {
        const deletedCount = await clearCorruptedCache();
        res.json({
            success: true,
            message: `Cleared ${deletedCount} corrupted cache entries`,
            deletedCount,
            timestamp: new Date()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date()
        });
    }
});
// Clear cache for a specific user
router.delete("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        await clearUserCache(userId);
        res.json({
            success: true,
            message: `Cleared cache for user ${userId}`,
            timestamp: new Date()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date()
        });
    }
});
// Test cache operations
router.post("/test", async (req, res) => {
    try {
        const testKey = "test:cache:" + Date.now();
        const testData = { message: "Hello Redis!", timestamp: new Date() };
        // Test set operation
        await CacheService.set(testKey, testData, 60);
        // Test get operation
        const retrievedData = await CacheService.get(testKey);
        // Test delete operation
        await CacheService.delete(testKey);
        res.json({
            success: true,
            message: "Cache operations test successful",
            testData,
            retrievedData,
            match: JSON.stringify(testData) === JSON.stringify(retrievedData),
            timestamp: new Date()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date()
        });
    }
});
export default router;
