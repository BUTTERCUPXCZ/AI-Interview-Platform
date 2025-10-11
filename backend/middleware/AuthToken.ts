import { Request, Response, NextFunction } from "express";
import { getTokenFromCookies, verifyToken, JwtPayload } from "../utils/jwt.utils.js";

// Custom request interface with JWT user
interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

/**
 * Middleware to verify JWT authentication
 * Checks for valid JWT token in HTTP-only cookies
 */
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Get token from cookies
        const token = getTokenFromCookies(req.cookies);

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Verify and decode token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ message: "Access denied. Invalid or expired token." });
        }

        // Attach user information to request object
        req.user = decoded;

        next();
    } catch (error) {
        res.status(500).json({ message: "Error verifying authentication token" });
    }
};
