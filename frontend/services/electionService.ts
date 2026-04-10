import API from "./api.ts";

export const electionService = {
  getAll: async () => {
    const response = await API.get("/elections/");
    return response.data;
  },
  getActive: async () => {
    const response = await API.get("/elections/active");
    return response.data;
  },
  create: async (data: { title: string; startDate: string; endDate: string }) => {
    const response = await API.post("/elections/", data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await API.put(`/elections/${id}`, data);
    return response.data;
  },
  toggleActive: async (id: string) => {
    const response = await API.put(`/elections/activate/${id}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await API.delete(`/elections/${id}`);
    return response.data;
  }
};