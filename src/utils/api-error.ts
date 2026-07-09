import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Erro desconhecido."): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Sem conexão. Verifique sua internet e tente novamente.";
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

    return "Não foi possível concluir a operação. Tente novamente.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
