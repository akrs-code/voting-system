import API from "./api.ts";

export const candidateService = {
  create: async (data: FormData) => {
    const response = await API.post("/candidates", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  getAll: async (dept: string, electionId: string) => {
    const response = await API.get(`/candidates/dept/${dept}`, { 
      params: { electionId } 
    });
    return response.data;
  },
  update: async (id: string, data: FormData) => {
    const response = await API.patch(`/candidates/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await API.delete(`/candidates/${id}`);
    return response.data;
  },
};