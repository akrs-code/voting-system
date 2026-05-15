import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { User } from "../types/interface";
import API from "../services/api";
import { authService } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginState: (data: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    }
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { user: backendUser } = await authService.getMe();
        setUser(backendUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginState = useCallback((data: any) => {
    setUser(data.user);
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, loading, loginState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};