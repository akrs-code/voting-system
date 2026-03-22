import axios from "axios";

const API = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL + "/candidates",
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

export const candidateService = {
  create: async (data: any) => {
    const response = await API.post("/", data);
    return response.data;
  },

  getAll: async (dept: string, electionId: string) => {
    const response = await API.get(`/${dept}`, { 
      params: { electionId } 
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await API.put(`/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await API.delete(`/${id}`);
    return response.data;
  },
};