import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { logger } from "@/utils/logger";

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
const DEMO_USER_KEY = "dhe_demo_user";

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

  const method = config.method?.toUpperCase() ?? "GET";
  const path = config.url ?? "";
  logger.info("API", `→ ${method} ${path}`);

  return config;
});

http.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase() ?? "GET";
    const path = response.config.url ?? "";
    logger.info("API", `← ${response.status} ${method} ${path}`);
    return response;
  },
  (error) => {
    const method = error.config?.method?.toUpperCase() ?? "GET";
    const path = error.config?.url ?? "";
    const status = error.response?.status ?? "sem status";
    logger.error("API", `← ${status} ${method} ${path}`, error.message);
    return Promise.reject(error);
  }
);

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(DEMO_USER_KEY);
}

export async function saveDemoUser(userJson: string): Promise<void> {
  await SecureStore.setItemAsync(DEMO_USER_KEY, userJson);
}

export async function getDemoUser(): Promise<string | null> {
  return SecureStore.getItemAsync(DEMO_USER_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
