import { Redis } from "@upstash/redis";

// Redis configuration using environment variables for security
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "https://exciting-clam-23022.upstash.io",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "AVnuAAIncDIyZjNiYTVkMWNhZjU0MjYyYTMxODAwZWQzZjUwYTFiZXAyMjMwMjI",
});

// Connection test function
export const connectRedis = async (): Promise<void> => {
    try {
        // Test the connection
        await redis.ping();
        console.log("✅ Redis connected successfully");
    } catch (error) {
        console.error("❌ Redis connection failed:", error);
        throw error;
    }
};

// Utility functions for common Redis operations
export const redisOperations = {
    // Set a key-value pair with optional expiration
    set: async (key: string, value: unknown, expireInSeconds?: number) => {
        try {
            // Ensure we can serialize the value before storing
            let serializedValue: string;
            try {
                serializedValue = JSON.stringify(value);
            } catch (serializationError: unknown) {
                console.error(`Error serializing data for Redis key ${key}:`, serializationError);
                throw new Error(`Cannot serialize data for key ${key}`);
            }

            if (expireInSeconds) {
                return await redis.setex(key, expireInSeconds, serializedValue);
            }
            return await redis.set(key, serializedValue);
        } catch (error) {
            console.error(`Error setting Redis key ${key}:`, error);
            throw error;
        }
    },

    // Get a value by key
    get: async (key: string) => {
        try {
            const value = await redis.get(key);
            if (!value) return null;

            // Check if the value is already a valid JSON string
            if (typeof value !== "string") {
                console.warn(`Redis key ${key} contains non-string value:`, typeof value);
                return null;
            }

            // Handle the case where "[object Object]" was stored
            if (value === "[object Object]" || value.startsWith("[object ")) {
                console.warn(`Invalid serialized data found for key ${key}, removing corrupted cache`);
                await redis.del(key);
                return null;
            }

            return JSON.parse(value);
        } catch (error: unknown) {
            console.error(`Error getting Redis key ${key}:`, error);
            // If JSON parsing fails, delete the corrupted key and return null
            if (error instanceof SyntaxError) {
                console.warn(`Corrupted JSON data in Redis key ${key}, cleaning up`);
                try {
                    await redis.del(key);
                } catch (deleteError) {
                    console.error(`Failed to delete corrupted key ${key}:`, deleteError);
                }
                return null;
            }
            throw error;
        }
    },

    // Delete a key
    del: async (key: string) => {
        try {
            return await redis.del(key);
        } catch (error) {
            console.error(`Error deleting Redis key ${key}:`, error);
            throw error;
        }
    },

    // Check if key exists
    exists: async (key: string) => {
        try {
            return await redis.exists(key);
        } catch (error) {
            console.error(`Error checking Redis key existence ${key}:`, error);
            throw error;
        }
    },

    // Set expiration for a key
    expire: async (key: string, seconds: number) => {
        try {
            return await redis.expire(key, seconds);
        } catch (error) {
            console.error(`Error setting expiration for Redis key ${key}:`, error);
            throw error;
        }
    },

    // Get time to live for a key
    ttl: async (key: string) => {
        try {
            return await redis.ttl(key);
        } catch (error) {
            console.error(`Error getting TTL for Redis key ${key}:`, error);
            throw error;
        }
    }
};

// Export the redis client for direct usage if needed
export { redis };
export default redis;