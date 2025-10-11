import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/authRoutes.js';
import codingRoutes from '../routes/codingRoutes.js';
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
