import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || ''; // empty = same origin

export const api = axios.create({
    baseURL,
    withCredentials: true, // send cookies for cross-site requests when allowed by backend
});

export default api;