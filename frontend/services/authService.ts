import API from "./api.ts";
import { AuthResponse, LoginCredentials, User } from "../types/interface";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await API.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },
  submitApplication: async (userData: Partial<User>): Promise<void> => {
    await API.post("/auth/apply", userData); 
  },
  bulkSignup: async (usersArray: Array<Partial<User> & { password?: string }>): Promise<any> => {
    const response = await API.post("/auth/bulk", usersArray);
    return response.data;
  },
  getPendingApplications: async (): Promise<User[]> => {
    const response = await API.get('/auth/applications/pending');
    return response.data;
  },
  manageApplication: async (id: string, action: 'approved' | 'rejected') => {
    const response = await API.post(`/auth/manage-user/${id}`, { status: action });
    return response.data;
  }
};