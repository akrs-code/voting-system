import API from "./api.ts";

export const positionService = {
  create: async (data: any) => {
    const response = await API.post("/positions/", data);
    return response.data;
  },
  getPositions: async (dept: string, electionId?: string) => {
    const response = await API.get(`/positions/${dept}`, { 
      params: { electionId: electionId || undefined } 
    });
    return response.data;
  },
  getVotingForm: async () => {
    const response = await API.get("/positions/voting-form");
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await API.put(`/positions/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await API.delete(`/positions/${id}`);
    return response.data;
  },
};