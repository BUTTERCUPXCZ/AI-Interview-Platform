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
