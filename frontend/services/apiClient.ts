import { useRuntimeConfig } from "#app";
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "@/stores/authStore";
import { navigateTo } from "#app";

const createApiClient = (): AxiosInstance => {
  const config = useRuntimeConfig();
  const client = axios.create({
    baseURL: config.public.apiBaseUrl as string,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((reqConfig) => {
    const authStore = useAuthStore();
    if (authStore.tokenString) {
      reqConfig.headers.Authorization = `Bearer ${authStore.tokenString}`;
    }
    return reqConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        const authStore = useAuthStore();
        authStore.clearToken();
        if (window.location.pathname !== "/") {
          navigateTo("/");
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
};

let instance: AxiosInstance | null = null;
const getClient = (): AxiosInstance => {
  if (!instance) instance = createApiClient();
  return instance;
};

const apiClient = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return getClient().get<T>(url, config);
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return getClient().post<T>(url, data, config);
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return getClient().put<T>(url, data, config);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return getClient().delete<T>(url, config);
  },
};

export default apiClient;
