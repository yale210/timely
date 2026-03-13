import axios, { AxiosHeaders, type AxiosRequestHeaders, type InternalAxiosRequestConfig } from "axios";
import { authStore } from "@/services/authService";

// Shared axios instance that automatically sends the auth token
const api = axios.create({
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStore.getToken();
  if (token) {
    const headers: AxiosHeaders =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers as AxiosRequestHeaders | undefined);

    headers.set("Authorization", `Token ${token}`);
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authStore.clear();
      window.location.replace("/login");
    }

    throw error instanceof Error ? error : new Error("Request failed");
  }
);

export default api;
