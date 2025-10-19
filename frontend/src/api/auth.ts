import axios from "axios";

export const userlogout = async () => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
    return response.data;
};

export const userlogin = async (email: string, password: string) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, { email, password }, { withCredentials: true });
    return response.data;
};

export const userRegister = async (Firstname: string, Lastname: string, email: string, password: string) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, { Firstname, Lastname, email, password }, { withCredentials: true });
    return response.data;
};

export const sendVerification = async (email: string) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/send-verification`, { email }, { withCredentials: true });
    return response.data;
};

export const verifyEmail = async (token: string) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-email`, { token }, { withCredentials: true });
    return response.data;
};

export const requestPasswordReset = async (email: string) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/request-password-reset`, { email });
    return response.data;
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, { email, otp, newPassword });
    return response.data;
};
