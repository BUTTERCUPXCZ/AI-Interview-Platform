// prismaClient.ts
import { PrismaClient } from "@prisma/client";

declare global {
    var __prisma: PrismaClient | undefined;
}

// Create a new Prisma client with proper configuration for PostgreSQL
const createPrismaClient = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        errorFormat: "pretty",
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
};

// Simple singleton pattern that works reliably
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = prisma;
}

// Simplified connection helper
export const connectPrisma = async () => {
    try {
        // Just connect without any prepared statement testing
        await prisma.$connect();
        console.log("✅ Prisma connected successfully");
    } catch (error) {
        console.error("❌ Failed to connect to Prisma:", error);
        throw error;
    }
};

// Enhanced graceful shutdown handling
const gracefulShutdown = async () => {
    try {
        await prisma.$disconnect();
        console.log("✅ Prisma disconnected gracefully");
    } catch (error) {
        console.error("❌ Error during Prisma disconnect:", error);
    }
};

// Wrapper function to handle prepared statement conflicts
export const safeQuery = async <T>(queryFunction: () => Promise<T>): Promise<T> => {
    try {
        return await queryFunction();
    } catch (error: any) {
        // Check if it's a prepared statement conflict
        if (error?.code === "P2024" ||
            (error?.message && error.message.includes("prepared statement") && error.message.includes("already exists"))) {
            console.log("🔄 Detected prepared statement conflict, reconnecting...");

            // Disconnect and reconnect
            await prisma.$disconnect();
            await prisma.$connect();

            // Retry the query
            return await queryFunction();
        }
        throw error;
    }
};

if (process.env.NODE_ENV === "development") {
    // Handle hot reloads and process termination
    process.on("beforeExit", gracefulShutdown);
    process.on("SIGTERM", async () => {
        await gracefulShutdown();
        process.exit(0);
    });
    process.on("SIGINT", async () => {
        await gracefulShutdown();
        process.exit(0);
    });
    process.on("SIGUSR2", async () => {
        // Handle nodemon restarts
        await gracefulShutdown();
        process.kill(process.pid, "SIGUSR2");
    });
}
