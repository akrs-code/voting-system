import axios from "axios";
import { AuthResponse, LoginCredentials, User } from "../types/auth";

const API = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL + "/auth",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await API.post<AuthResponse>("/login", credentials);
    return response.data;
  },

  signup: async (userData: Partial<User> & { password?: string }): Promise<void> => {
    await API.post("/signup", userData);
  },

  bulkSignup: async (usersArray: Array<Partial<User> & { password?: string }>): Promise<any> => {
    const response = await API.post("/bulk", usersArray);
    return response.data;
  },
};