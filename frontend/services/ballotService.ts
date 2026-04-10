import API from "./api.ts";

export const ballotService = {
  getBallot: async (electionId: string) => {
    if (!electionId) return [];
    const response = await API.get(`/ballot/${electionId}/ballot`);
    return response.data;
  },
  castBallot: async (data: { electionId: string; votes: any[] }) => {
    const response = await API.post('/ballot/cast', data);
    return response.data;
  },
  getStats: async (electionId: string, dept: string = 'ALL') => {
    const response = await API.get(`/ballot/stats/${electionId}`, {
      params: { dept } 
    });
    return response.data;
  },
  getResults: async (electionId: string) => {
    const response = await API.get(`/ballot/results/${electionId}`);
    return response.data;
  },
};