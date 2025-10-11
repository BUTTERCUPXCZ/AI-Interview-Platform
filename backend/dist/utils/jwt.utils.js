import jwt from 'jsonwebtoken';
// JWT Configuration Constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3h';
const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
/**
 * Generates a JWT token for the given user payload
 * @param payload - User data to include in the token
 * @returns JWT token string
 */
export const generateToken = (payload) => {
    // Casts below are narrow and only used to satisfy TypeScript overloads from the
    // `jsonwebtoken` types while preserving runtime behavior.
    return jwt.sign(
    // payload must be string | object | Buffer. Cast via unknown to satisfy TS.
    payload, 
    // secret can be string or Buffer (Secret alias)
    JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
/**
 * Verifies and decodes a JWT token
 * @param token - JWT token to verify
 * @returns Decoded JWT payload or null if invalid
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
/**
 * Sets an HTTP-only secure cookie with the JWT token
 * @param res - Express response object
 * @param token - JWT token to set in cookie
 */
export const setTokenCookie = (res, token) => {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE,
    });
};
/**
 * Clears the authentication cookie
 * @param res - Express response object
 */
export const clearTokenCookie = (res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
};
/**
 * Extracts the JWT token from the cookie name
 * @param cookies - Request cookies object
 * @returns JWT token string or null if not found
 */
export const getTokenFromCookies = (cookies) => {
    return cookies[COOKIE_NAME] || null;
};
