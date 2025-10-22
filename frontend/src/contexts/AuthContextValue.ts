import { createContext } from "react";
import type { AuthUser } from "@/hooks/useAuth";

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refetchUser: () => void;
}

// React context containing auth state and helpers. Kept in its own file so files that
// export components (like AuthProvider) don't also export non-component values.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
