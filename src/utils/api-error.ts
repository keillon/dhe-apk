import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Erro desconhecido."): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Sem conexão com a API. Verifique a internet e EXPO_PUBLIC_API_URL.";
    }

    const data = error.response.data;
    if (typeof data === "object" && data !== null) {
      if ("error" in data && typeof data.error === "string") {
        return data.error;
      }
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
    }

    return `Erro ${error.response.status} na API.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
