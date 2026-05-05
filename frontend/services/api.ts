import axios from "axios";

const API = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL, 
  withCredentials: true
});

export default API;