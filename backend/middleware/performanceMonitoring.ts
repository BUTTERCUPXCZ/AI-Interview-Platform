import { Request, Response, NextFunction } from "express";
import { CacheService } from "../services/cacheService.js";

interface PerformanceMetrics {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    timestamp: Date;
    cacheHit?: boolean;
    userId?: string;
}

/**
 * Performance monitoring middleware with Redis-based metrics storage
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    let cacheHit = false;

    // Override res.json to detect cache hits
    const originalJson = res.json;
    res.json = function (data: unknown) {
        // Check if this was served from cache (based on custom header or response payload)
        try {
            const headerHit = res.getHeaders()["x-cache-hit"] === "true";
            let payloadHit = false;
            if (data !== null && typeof data === "object" && "_cacheHit" in data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                payloadHit = (data as any)._cacheHit === true;
            }
            cacheHit = headerHit || payloadHit;
        } catch {
            // ignore header inspection errors
        }

        return originalJson.call(this, data);
    };

    // Capture response metrics when request finishes
    res.on("finish", async () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const metrics: PerformanceMetrics = {
            endpoint: req.path,
            method: req.method,
            responseTime,
            statusCode: res.statusCode,
            timestamp: new Date(),
            cacheHit,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            userId: (req as any).user?.id?.toString()
        };

        // Store metrics in Redis for analysis (with 24h TTL)
        try {
            const metricsKey = `metrics:${new Date().toISOString().split("T")[0]}:${req.path}:${req.method}`;

            // Get existing metrics for this endpoint today
            const existingMetrics = await CacheService.get(metricsKey) || [];
            existingMetrics.push(metrics);

            // Keep only last 1000 entries per endpoint per day
            if (existingMetrics.length > 1000) {
                existingMetrics.splice(0, existingMetrics.length - 1000);
            }

            await CacheService.set(metricsKey, existingMetrics, 86400); // 24 hours

            // Log slow requests (over 2 seconds)
            if (responseTime > 2000) {
                console.warn(`🐌 Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
            }

            // Log cache hit/miss for optimization insights
            if (cacheHit) {
                console.log(`⚡ Cache hit: ${req.method} ${req.path} - ${responseTime}ms`);
            }

        } catch (error) {
            console.error("Failed to store performance metrics:", error);
        }
    });

    next();
};

/**
 * Get performance analytics for a specific endpoint
 */
export const getEndpointAnalytics = async (endpoint: string, method: string, days: number = 7) => {
    type DailyBreakdownEntry = {
        date: string;
        requests: number;
        averageResponseTime: number;
        cacheHitRate: number;
        errorRate: number;
        slowRequests: number;
    };

    const analytics = {
        averageResponseTime: 0,
        totalRequests: 0,
        cacheHitRate: 0,
        errorRate: 0,
        slowRequests: 0,
        dailyBreakdown: [] as DailyBreakdownEntry[]
    };

    try {
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split("T")[0];

            const metricsKey = `metrics:${dateKey}:${endpoint}:${method}`;
            const dayMetrics: PerformanceMetrics[] = (await CacheService.get(metricsKey)) || [];

            if (dayMetrics.length > 0) {
                const avgResponseTime = dayMetrics.reduce((sum, m) => sum + m.responseTime, 0) / dayMetrics.length;
                const cacheHits = dayMetrics.filter(m => m.cacheHit).length;
                const errors = dayMetrics.filter(m => m.statusCode >= 400).length;
                const slowRequests = dayMetrics.filter(m => m.responseTime > 2000).length;

                analytics.totalRequests += dayMetrics.length;
                analytics.averageResponseTime += avgResponseTime * dayMetrics.length;
                analytics.slowRequests += slowRequests;

                analytics.dailyBreakdown.push({
                    date: dateKey,
                    requests: dayMetrics.length,
                    averageResponseTime: Math.round(avgResponseTime),
                    cacheHitRate: Math.round((cacheHits / dayMetrics.length) * 100),
                    errorRate: Math.round((errors / dayMetrics.length) * 100),
                    slowRequests
                });
            }
        }

        if (analytics.totalRequests > 0) {
            analytics.averageResponseTime = Math.round(analytics.averageResponseTime / analytics.totalRequests);
            analytics.cacheHitRate = Math.round((analytics.dailyBreakdown.reduce((sum, day) =>
                sum + (day.cacheHitRate * day.requests), 0) / analytics.totalRequests));
            analytics.errorRate = Math.round((analytics.dailyBreakdown.reduce((sum, day) =>
                sum + (day.errorRate * day.requests), 0) / analytics.totalRequests));
        }

    } catch (error: unknown) {
        console.error("Failed to get endpoint analytics:", error);
    }

    return analytics;
};

/**
 * Cache health monitoring
 */
export const cacheHealthCheck = async (req: Request, res: Response) => {
    try {
        const testKey = "health_test:" + Date.now();

        // Test write, read, delete operations
        const startTime = Date.now();
        await CacheService.set(testKey, { test: true }, 60);
        const testData = await CacheService.get(testKey);
        await CacheService.delete(testKey);
        const latency = Date.now() - startTime;

        const healthStatus = {
            status: testData ? "healthy" : "degraded",
            latency: latency + "ms",
            timestamp: new Date(),
            redis: {
                connected: true,
                operations: {
                    write: "ok",
                    read: testData ? "ok" : "failed",
                    delete: "ok"
                }
            }
        };

        res.json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date(),
            redis: {
                connected: false
            }
        });
    }
};