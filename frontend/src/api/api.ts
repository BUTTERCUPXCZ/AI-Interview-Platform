import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || ''; // empty = same origin

export const api = axios.create({
    baseURL,
    withCredentials: true, // send cookies for cross-site requests when allowed by backend
});

// Simple client-side cookie helpers for the token. Note: the server also sets
// an HTTP-only cookie; these helpers are for the optional client-visible token
// stored so we can attach an Authorization header when needed (e.g. on cross-origin setups).
export const setClientTokenCookie = (token: string | null, maxAgeSeconds = 3 * 60 * 60) => {
    if (!token) {
        // clear cookie
        document.cookie = `client_auth_token=; Path=/; Max-Age=0; SameSite=None; Secure`;
        return;
    }
    // set cookie accessible to JS
    document.cookie = `client_auth_token=${token}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=None; Secure`;
};

export const getClientTokenCookie = (): string | null => {
    const match = document.cookie.match(/(^|;)\s*client_auth_token=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : null;
};

// Request interceptor: if Authorization header is not set, try to use the client cookie
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const headers = (config.headers as AxiosRequestHeaders) || {};
    if (!headers['Authorization'] && !headers['authorization']) {
        const token = getClientTokenCookie();
        if (token) {
            headers['Authorization'] = `Bearer ${token}` as unknown as string;
        }
    }
    config.headers = headers;
    return config;
});

export default api;