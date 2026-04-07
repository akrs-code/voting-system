import axios from "axios";

const API = axios.create({
  // Ensure your .env has the trailing /api if your backend expects it
  baseURL: (import.meta as any).env.VITE_API_URL + "/ballot",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const ballotService = {
  getBallot: async (electionId: string) => {
    if (!electionId) return [];
    const response = await API.get(`/${electionId}/ballot`);
    return response.data;
  },

  castBallot: async (data: { electionId: string; votes: any[] }) => {
    const response = await API.post('/cast', data);
    return response.data;
  },

  getStats: async (electionId: string, dept: string = 'ALL') => {
    const response = await API.get(`/stats/${electionId}`, {
      params: { dept } 
    });
    return response.data;
  },

  getResults: async (electionId: string) => {
    const response = await API.get(`/results/${electionId}`);
    return response.data;
  },
};