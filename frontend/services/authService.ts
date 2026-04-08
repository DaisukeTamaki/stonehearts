import apiClient from "@/services/apiClient";
import type { GoogleLoginResponse, UserResponse } from "@/types/apiAuthTypes";
import { useAuthStore } from "@/stores/authStore";

export async function googleLogin(token: string): Promise<GoogleLoginResponse> {
  const response = await apiClient.post<GoogleLoginResponse>(
    "/auth/google-login",
    { token },
  );
  const authStore = useAuthStore();
  authStore.setToken(response.data.access_token);
  return response.data;
}

export async function getUserInfo(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>("/users/me");
  return response.data;
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete("/users/me");
}
