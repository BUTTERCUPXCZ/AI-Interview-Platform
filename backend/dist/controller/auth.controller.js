import bcrypt from "bcryptjs";
import { prisma, safeQuery } from "../lib/prisma";
import { generateToken, setTokenCookie, clearTokenCookie, getTokenFromCookies, verifyToken } from "../utils/jwt.utils.js";
import { CacheService } from "../services/cacheService";
// REGISTER
export const registerUser = async (req, res, next) => {
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
        // Generate JWT token
        const tokenPayload = {
            id: newUser.id,
            email: newUser.email,
            Firstname: newUser.Firstname,
            Lastname: newUser.Lastname,
            role: newUser.role
        };
        const token = generateToken(tokenPayload);
        // Set secure HTTP-only cookie
        setTokenCookie(res, token);
        res.status(201).json({
            message: "User registered successfully",
            user: newUser
        });
    }
    catch (error) {
        next(error);
    }
};
// LOGIN
export const loginUser = async (req, res, next) => {
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
                select: { id: true, Firstname: true, Lastname: true, email: true, password: true, role: true }
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
        // Generate JWT token
        const tokenPayload = {
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
    }
    catch {
        next();
    }
};
// LOGOUT
export const logoutUser = async (req, res) => {
    try {
        // Get user ID from token before clearing
        const token = getTokenFromCookies(req.cookies);
        if (token) {
            try {
                const decoded = verifyToken(token);
                // Clear all user caches
                await CacheService.clearUserCaches(decoded.id.toString());
            }
            catch {
                // Token invalid, proceed with logout anyway
                console.log("Token verification failed during logout, proceeding anyway");
            }
        }
        // Clear the authentication cookie
        clearTokenCookie(res);
        res.json({ message: "Logout successful" });
    }
    catch {
        res.status(500).json({ message: "Logout failed" });
    }
};
// CURRENT USER
export const getCurrentUser = (req, res) => {
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
    }
    catch {
        res.status(500).json({ message: "Error retrieving user information" });
    }
};
