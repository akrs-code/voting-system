import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { authService } from "../services/authService";
import { LoginCredentials, User } from "../types/auth";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const login = async (credentials: LoginCredentials) => {
    const data = await authService.login(credentials);
    context.loginState(data);
    return data;
  };

  const signup = async (userData: Partial<User> & { password?: string }) => {
    return await authService.signup(userData);
  };

  const bulkSignup = async (usersArray: Array<Partial<User> & { password?: string }>) => {
    return await authService.bulkSignup(usersArray);
  };

  return {
    user: context.user,
    token: context.token,
    loading: context.loading,
    isAdmin: context.user?.role === "admin",
    login,
    signup,
    bulkSignup,
    logout: context.logout,
  };
};