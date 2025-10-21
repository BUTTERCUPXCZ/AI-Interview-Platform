import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/authRoutes.js";
import codingRoutes from "../routes/codingRoutes.js";
import interview from "../routes/interview.js";
import textInterviewRoutes from "../routes/textInterviewRoutes.js";
import dashboardRoutes from "../routes/dashboardRoutes.js";
import progressRoutes from "../routes/progressRoutes.js";
import profileRoutes from "../routes/profileRoutes.js";
import cacheRoutes from "../routes/cacheRoutes.js";
import subscriptionRoutes from "../routes/subscriptionRoutes.js";
import { connectPrisma } from "../lib/prisma.js";
import { connectRedis } from "../lib/redis.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan("dev"));

// CORS middleware
const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
    : ["http://localhost:5173"];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1 && !allowedOrigins.includes("*")) {
            const msg = "The CORS policy for this site does not allow access from the specified Origin.";
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/interview", interview);
app.use("/api/interview", textInterviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cache", cacheRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Initialize Prisma connection and start server
const startServer = async () => {
    try {
        // Initialize Redis connection
        await connectRedis();

        // Skip the explicit connection test in development to avoid prepared statement conflicts
        if (process.env.NODE_ENV !== "development") {
            await connectPrisma();
        } else {
            console.log("✅ Prisma client initialized (development mode)");
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
