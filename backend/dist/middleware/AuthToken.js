import { getTokenFromCookies, verifyToken } from "../utils/jwt.utils.js";
/**
 * Middleware to verify JWT authentication
 * Checks for valid JWT token in HTTP-only cookies
 */
export const isAuthenticated = (req, res, next) => {
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
    }
    catch (error) {
        res.status(500).json({ message: "Error verifying authentication token" });
    }
};
