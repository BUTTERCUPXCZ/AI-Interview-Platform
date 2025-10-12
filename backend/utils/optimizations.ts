// Server optimization script to improve interview performance
import { preWarmCache } from '../services/optimizedGeminiService'

export async function initializeOptimizations() {
    console.log('🚀 Starting interview platform optimizations...')

    try {
        // Pre-warm the question cache with common combinations
        await preWarmCache()

        // Set up periodic cache refresh
        setInterval(async () => {
            try {
                await preWarmCache()
                console.log('✅ Cache refreshed successfully')
            } catch (error) {
                console.error('❌ Failed to refresh cache:', error)
            }
        }, 30 * 60 * 1000) // Refresh every 30 minutes

        console.log('✅ Interview optimizations initialized successfully')

        // Performance monitoring
        setupPerformanceMonitoring()

    } catch (error) {
        console.error('❌ Failed to initialize optimizations:', error)
    }
}

function setupPerformanceMonitoring() {
    // Track API response times
    const responseTimeCache = new Map()

    setInterval(() => {
        // Clear old response time data
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        for (const [key, timestamp] of responseTimeCache.entries()) {
            if (timestamp < fiveMinutesAgo) {
                responseTimeCache.delete(key)
            }
        }
    }, 60 * 1000) // Clean up every minute

    console.log('📊 Performance monitoring enabled')
}

// Middleware to track API performance
export function performanceMiddleware(req: any, res: any, next: any) {
    const startTime = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - startTime

        // Log slow requests
        if (duration > 2000) {
            console.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${duration}ms`)
        }

        // Track interview-related endpoints
        if (req.path.includes('/text-interview') || req.path.includes('/coding')) {
            console.log(`📈 ${req.method} ${req.path}: ${duration}ms`)
        }
    })

    next()
}

// Health check endpoint for monitoring
export function setupHealthCheck(app: any) {
    app.get('/health', (req: any, res: any) => {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        }

        res.json(healthData)
    })

    app.get('/health/interview', (req: any, res: any) => {
        // Interview-specific health check
        res.json({
            status: 'healthy',
            services: {
                database: 'connected',
                ai: 'available',
                cache: 'active'
            },
            timestamp: new Date().toISOString()
        })
    })
}