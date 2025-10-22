import React, { createContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api, { getClientTokenCookie } from "@/api/api";
import type { AuthUser } from "@/hooks/useAuth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refetchUser: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fetch user from backend
const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    console.log("Fetching current user...");
    const response = await api.get("/auth/me");
    console.log("User fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.log("User not authenticated (401)");
      return null;
    }
    console.error("Error fetching current user:", error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isFetching,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const logout = () => {
    // Clear user from cache and cookies
    queryClient.setQueryData(["user"], null);
    queryClient.removeQueries({ queryKey: ["user"] });
    queryClient.clear();
    document.cookie = "client_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || isFetching,
    isAuthenticated: !!user || !!getClientTokenCookie(),
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
