import axios from "axios";

export const API_BASE_URL = window.atob(import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL", API_BASE_URL);
export default axios.create({
  baseURL: API_BASE_URL,
});

export const axiosPrivate = axios.create({
  baseURL: API_BASE_URL,
});
