import API from "./api.ts";

export const voterService = {
  getAll: async () => {
    const response = await API.get('/auth/voters');
    return response.data;
  },
  create: async (voterData: any) => {
    const response = await API.post('/auth/signup', voterData);
    return response.data;
  },
  bulkCreate: async (voters: any[]) => {
    const response = await API.post('/auth/bulk', voters);
    return response.data;
  },
  update: async (id: string, updateData: any) => {
    const response = await API.put(`/auth/voter/${id}`, updateData);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await API.delete(`/auth/voter/${id}`);
    return response.data;
  }
};