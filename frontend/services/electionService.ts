import API from "./api.ts";

export const electionService = {
  getAll: async () => (await API.get("/elections")).data,
  getActive: async () => (await API.get("/elections/active")).data,
  create: async (data: any) => (await API.post("/elections/", data)).data,
  update: async (id: string, data: any) => (await API.patch(`/elections/${id}`, data)).data,
  toggleActive: async (id: string) => (await API.patch(`/elections/${id}/status`)).data,
  toggleLock: async (id: string) => (await API.patch(`/elections/${id}/lock`)).data,
  delete: async (id: string) => (await API.delete(`/elections/${id}`)).data,
  getVoters: async (id: string) => (await API.get(`/elections/${id}/voters`)).data,
  assignVoters: async (id: string, voterIds: string[]) => (await API.patch(`/elections/${id}/voters`, { voterIds })).data
};