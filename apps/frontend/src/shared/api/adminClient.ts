import axios from "axios";
import { useAdminAuthStore } from "../auth/adminAuthStore";

export const adminApiClient = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api/admin` });

adminApiClient.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAdminAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);
