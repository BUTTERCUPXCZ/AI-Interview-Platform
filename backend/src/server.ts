import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/authRoutes';
import codingRoutes from '../routes/codingRoutes';
import interview from '../routes/interview';
import textInterviewRoutes from '../routes/textInterviewRoutes';
import dashboardRoutes from '../routes/dashboardRoutes';
import progressRoutes from '../routes/progressRoutes';
import profileRoutes from '../routes/profileRoutes';
import { connectPrisma } from '../lib/prisma';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('dev'));

// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true // Allow cookies to be sent
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

// Initialize Prisma connection and start server
const startServer = async () => {
    try {
        // Skip the explicit connection test in development to avoid prepared statement conflicts
        if (process.env.NODE_ENV !== 'development') {
            await connectPrisma();
        } else {
            console.log('✅ Prisma client initialized (development mode)');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
