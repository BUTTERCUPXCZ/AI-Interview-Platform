// src/api/api.ts
import axios from "axios";

// Base axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // IMPORTANT: always send cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional helpers
export const getClientTokenCookie = (): string | null => {
  const match = document.cookie.match(/(?:^|; )client_auth_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const setClientTokenCookie = (token: string | null) => {
  if (token) {
    document.cookie = `client_auth_token=${token}; path=/; SameSite=None; Secure`;
  } else {
    document.cookie = `client_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
};

// Attach Authorization header if client-side cookie exists
api.interceptors.request.use((config) => {
  const token = getClientTokenCookie();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
