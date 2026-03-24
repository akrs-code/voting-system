import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL + "/auth",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const voterService = {
  getAll: async () => {
    const response = await api.get('/voters'); 
    return response.data;
  },

  create: async (voterData: any) => {
    const response = await api.post('/signup', voterData);
    return response.data;
  },

  bulkCreate: async (voters: any[]) => {
    const response = await api.post('/bulk', voters);
    return response.data;
  },

  update: async (id: string, updateData: any) => {
    const response = await api.put(`/voter/${id}`, updateData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/voter/${id}`);
    return response.data;
  }
};