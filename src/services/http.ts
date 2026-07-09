import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export const isApiConfigured =
  API_URL.length > 0 && !API_URL.includes("seudominio");

export function getConnectionInfo() {
  return {
    mode: isApiConfigured ? ("api" as const) : ("demo" as const),
    url: isApiConfigured ? API_URL : null,
  };
}

const TOKEN_KEY = "dhe_auth_token";

export const http = axios.create({
  baseURL: isApiConfigured ? `${API_URL}/api` : undefined,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
