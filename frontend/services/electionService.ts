import axios from "axios";

const API = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL + "/elections",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const electionService = {
  getAll: async () => {
    const response = await API.get("/");
    return response.data;
  },

  getActive: async () => {
    const response = await API.get("/active");
    return response.data;
  },

  create: async (data: { title: string; startDate: string; endDate: string }) => {
    const response = await API.post("/", data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await API.put(`/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string) => {
    const response = await API.put(`/activate/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await API.delete(`/${id}`);
    return response.data;
  }
};