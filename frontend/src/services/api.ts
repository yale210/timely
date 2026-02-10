import axios from "axios";
import { authStore } from "./authService";

// Shared axios instance that automatically sends the auth token
const api = axios.create({
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

api.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
