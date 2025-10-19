import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma, safeQuery } from "../lib/prisma.js";
import {
    generateToken,
    setTokenCookie,
    clearTokenCookie,
    getTokenFromCookies,
    verifyToken,
    JwtPayload
} from "../utils/jwt.utils.js";
import { CacheService } from "../services/cacheService.js";
import { generateVerificationToken, verifyVerificationToken } from "../utils/jwt.utils.js";
import emailService from "../services/emailService.js";
import { redisOperations } from "../lib/redis.js";
import crypto from "crypto";



// REGISTER
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    const { Firstname, Lastname, email, password } = req.body;

    try {
        // Validate required fields
        if (!Firstname || !Lastname || !email || !password) {
            return res.status(400).json({ message: "Firstname, Lastname, email, and password are required" });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = await prisma.user.create({
            data: { Firstname, Lastname, email, password: hashedPassword },
            select: { id: true, Firstname: true, Lastname: true, email: true, role: true }
        });

        // Send email verification (required before login)
        try {
            const verificationToken = generateVerificationToken({ id: newUser.id, email: newUser.email });
            const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
            // fire-and-forget
            emailService.sendVerificationEmail(newUser.email, verificationUrl).catch((err: unknown) => console.error("Email send failed:", err));
        } catch (err) {
            console.warn("Failed to queue verification email:", err);
        }

        // DO NOT auto-login - user must verify email first
        res.status(201).json({
            message: "Registration successful! Please check your email to verify your account.",
            user: newUser,
            requiresVerification: true
        });
    } catch (error) {
        next(error);
    }
};

// LOGIN
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email with retry logic for prepared statement conflicts
        const user = await safeQuery(async () => {
            return await prisma.user.findUnique({
                where: { email },
                select: { id: true, Firstname: true, Lastname: true, email: true, password: true, role: true, isEmailVerified: true }
            });
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                message: "Please verify your email before logging in. Check your inbox for the verification link.",
                code: "EMAIL_NOT_VERIFIED"
            });
        }

        // Generate JWT token
        const tokenPayload: JwtPayload = {
            id: user.id,
            email: user.email,
            Firstname: user.Firstname,
            Lastname: user.Lastname,
            role: user.role
        };

        const token = generateToken(tokenPayload);

        // Set secure HTTP-only cookie
        setTokenCookie(res, token);

        // Cache user session for faster subsequent requests
        await CacheService.setUserSession(user.id.toString(), {
            id: user.id,
            email: user.email,
            Firstname: user.Firstname,
            Lastname: user.Lastname,
            role: user.role,
            lastLogin: new Date()
        });

        // Return user without password (explicit fields to avoid unused var lint)
        const userWithoutPassword = {
            id: user.id,
            Firstname: user.Firstname,
            Lastname: user.Lastname,
            email: user.email,
            role: user.role
        };

        res.json({
            message: "Login successful",
            user: userWithoutPassword
        });
    } catch (error) {
        // Forward the error to Express error handlers so a proper status/code is returned
        next(error);
    }
};

// LOGOUT
export const logoutUser = async (req: Request, res: Response) => {
    try {
        // Get user ID from token before clearing
        const token = getTokenFromCookies(req.cookies);
        if (token) {
            try {
                const decoded = verifyToken(token) as JwtPayload;
                // Clear all user caches
                await CacheService.clearUserCaches(decoded.id.toString());
            } catch {
                // Token invalid, proceed with logout anyway
                console.log("Token verification failed during logout, proceeding anyway");
            }
        }

        // Clear the authentication cookie
        clearTokenCookie(res);

        res.json({ message: "Logout successful" });
    } catch {
        res.status(500).json({ message: "Logout failed" });
    }
};

// CURRENT USER
export const getCurrentUser = (req: Request, res: Response) => {
    try {
        // Get token from cookies
        const token = getTokenFromCookies(req.cookies);

        if (!token) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        // Verify and decode token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        // Return user information from token
        res.json({
            id: decoded.id,
            Firstname: decoded.Firstname,
            Lastname: decoded.Lastname,
            email: decoded.email,
            role: decoded.role
        });
    } catch {
        res.status(500).json({ message: "Error retrieving user information" });
    }
};

// Send verification email again
export const sendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
    let { email } = req.body;
    email = typeof email === 'string' ? email.trim() : email;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isEmailVerified) return res.status(400).json({ message: "Email already verified" });

        const verificationToken = generateVerificationToken({ id: user.id, email: user.email });
        const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

        await emailService.sendVerificationEmail(email, verificationUrl);

        res.json({ message: "Verification email sent" });
    } catch (error) {
        next(error);
    }
};

// Verify email token endpoint
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    try {
        const decoded = verifyVerificationToken(token);
        if (!decoded || !decoded.id || !decoded.email) return res.status(400).json({ message: "Invalid or expired token" });

        const userId = Number(decoded.id);
        const email = String(decoded.email);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.email !== email) return res.status(400).json({ message: "User mismatch" });

        await prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true, emailVerifiedAt: new Date() } });

        res.json({ message: "Email verified" });
    } catch (error) {
        next(error);
    }
};

// Request password reset (send OTP)
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
    // Use a case-insensitive lookup to avoid mismatches due to email casing
    const user = await prisma.user.findFirst({ where: { email: { equals: String(email), mode: 'insensitive' } } });
    if (!user) return res.status(200).json({ message: "If the email exists, an OTP has been sent" }); // avoid leaking accounts

        // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store hashed OTP in Redis with TTL 10 minutes
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const redisKey = `pwdreset:${user.id}`;
    // Store hashed OTP in redis with TTL 10 minutes
    await redisOperations.set(redisKey, { otp: otpHash }, 10 * 60); // 10 minutes

        // send OTP email (don't fail the whole request if email sending fails)
        try {
            await emailService.sendOtpEmail(email, otp);
        } catch (err) {
            // Log the error but return a generic success message to the client
            const e: any = err;
            console.error("Failed to send OTP email:", e && (e.response?.body || e));
        }

        res.json({ message: "If the email exists, an OTP has been sent" });
    } catch (error) {
        next(error);
    }
};

// Verify OTP and reset password
export const resetPasswordWithOtp = async (req: Request, res: Response, next: NextFunction) => {
    let { email, otp, newPassword } = req.body;
    email = typeof email === 'string' ? email.trim() : email;
    otp = otp !== undefined && otp !== null ? String(otp).trim() : otp;
    newPassword = typeof newPassword === 'string' ? newPassword : String(newPassword || '');
    if (!email || !otp || !newPassword) return res.status(400).json({ message: "Email, otp and newPassword are required" });

    try {
    // Case-insensitive lookup so users don't get blocked by email casing
    const user = await prisma.user.findFirst({ where: { email: { equals: String(email), mode: 'insensitive' } } });
        if (!user) {
            // log for debugging in non-production
            if (process.env.NODE_ENV !== 'production') console.warn(`[resetPasswordWithOtp] user not found for email=${email}`);
            return res.status(400).json({ message: "Invalid request" });
        }

        const redisKey = `pwdreset:${user.id}`;
        const stored = await redisOperations.get(redisKey) as { otp?: string } | null;
        // Helpful debug logging (only in dev/staging)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[resetPasswordWithOtp] received body: email=${email}, otp=${otp ? otp.replace(/.(?=.{2})/g, '*') : ''}`);
            console.log(`[resetPasswordWithOtp] redis stored for key=${redisKey}:`, stored);
        }

    if (!stored || !stored.otp) return res.status(400).json({ message: "OTP expired or not found" });

    // Normalize OTP input and compare hashed values
    const otpToCompare = String(otp).replace(/\s+/g, '');
    const otpHash = crypto.createHash('sha256').update(otpToCompare).digest('hex');
    if (otpHash !== stored.otp) return res.status(400).json({ message: "Invalid OTP" });

        // update password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null } });

        // clear redis key
        await redisOperations.del(redisKey);

        res.json({ message: "Password reset successful" });
    } catch (error) {
        next(error);
    }
};
