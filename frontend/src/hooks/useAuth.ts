import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setClientTokenCookie } from "@/api/api";
import axios from "axios";
import api from "@/api/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  Firstname: string;
  Lastname: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  Firstname: string;
  Lastname: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token?: string;
}

// Login hook
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const res = await api.post<AuthResponse>("/auth/login", { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
      if (data.token) setClientTokenCookie(data.token);
      console.log("✅ Login successful:", data.message);
    },
    onError: (error) => {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || "Login failed"
        : "Login failed";
      console.error("❌ Login error:", errorMessage);
    },
  });
};

// Register hook
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creds: RegisterCredentials) => {
      const res = await api.post<AuthResponse>("/auth/register", creds);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
      console.log("✅ Registration successful:", data.message);
    },
    onError: (error) => {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || "Registration failed"
        : "Registration failed";
      console.error("❌ Registration error:", msg);
    },
  });
};

// Logout hook
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setClientTokenCookie(null);
      console.log("✅ Logout successful");
    },
    onError: (error) => {
      console.error("❌ Logout error:", error);
      queryClient.clear();
      setClientTokenCookie(null);
    },
  });
};
