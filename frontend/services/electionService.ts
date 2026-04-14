import API from "./api.ts";

export const electionService = {
  getAll: async () => (await API.get("/elections/")).data,
  getActive: async () => (await API.get("/elections/active")).data,
  create: async (data: any) => (await API.post("/elections/", data)).data,
  update: async (id: string, data: any) => (await API.put(`/elections/${id}`, data)).data,
  toggleActive: async (id: string) => (await API.put(`/elections/activate/${id}`)).data,
  toggleLock: async (id: string) => (await API.put(`/elections/toggle-lock/${id}`)).data,
  delete: async (id: string) => (await API.delete(`/elections/${id}`)).data
};