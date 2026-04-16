import API from "./api.ts";

export const voterService = {
  getAll: async () => {
    const response = await API.get('/auth/users');
    return response.data;
  },
  create: async (voterData: any) => {
    const response = await API.post('/auth/users', voterData);
    return response.data;
  },
  bulkCreate: async (voters: any[]) => {
    const response = await API.post('/auth/users/bulk', voters);
    return response.data;
  },
  update: async (id: string, updateData: any) => {
    const response = await API.patch(`/auth/users/${id}`, updateData);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await API.delete(`/auth/users/${id}`);
    return response.data;
  }
};