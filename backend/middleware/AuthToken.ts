import { Request, Response, NextFunction } from "express";
import { getTokenFromCookies, verifyToken, JwtPayload } from "../utils/jwt.utils.js";

// Custom request interface with JWT user
interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

/**
 * Middleware to verify JWT authentication
 * Checks for valid JWT token in HTTP-only cookies, and falls back to
 * Authorization: Bearer <token> header if the cookie is not present.
 * This makes the middleware tolerant to cross-origin setups where the
 * client attaches an Authorization header instead of relying on cookies.
 */
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Try getting token from cookies first
        let token = getTokenFromCookies(req.cookies);

        // If no cookie token, check Authorization header for Bearer token
        if (!token) {
            const authHeader = req.headers['authorization'] || req.headers['Authorization'];
            if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }
        }

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
    } catch {
        // Intentionally don't expose internal error details to the client
        res.status(500).json({ message: "Error verifying authentication token" });
    }
};
