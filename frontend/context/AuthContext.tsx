import { createContext, useState, ReactNode, useCallback, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { User, AuthResponse } from "../types/interface";

interface JwtPayload {
  userId: string;
  role: string;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginState: (data: AuthResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(storedToken);

      const isExpired = decoded.exp * 1000 < Date.now();
      if (isExpired) {
        logout();
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.role !== decoded.role) {
        logout(); 
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(parsedUser);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const loginState = useCallback((data: AuthResponse) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, loading, loginState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};