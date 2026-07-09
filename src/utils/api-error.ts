import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Erro desconhecido."): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "A operação demorou demais. Verifique sua conexão e tente novamente.";
      }
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

    if (error.response.status === 413) {
      return "Arquivo muito grande. Tente uma imagem menor.";
    }

    return "Não foi possível concluir a operação. Tente novamente.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
