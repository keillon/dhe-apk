import axios from "axios";

const FRIENDLY_FALLBACK = "Não foi possível concluir a operação. Tente novamente.";

const KNOWN_REWRITES: Array<{ match: RegExp; message: string }> = [
  {
    match: /credenciais inválidas|unauthorized|401/i,
    message: "E-mail ou senha incorretos.",
  },
  {
    match: /sessão|token.*(expir|inválid)|jwt/i,
    message: "Sessão expirada. Entre novamente.",
  },
  {
    match: /sem conexão|network|econn|enotfound|offline/i,
    message: "Sem conexão. Verifique sua internet e tente novamente.",
  },
  {
    match: /timeout|demorou|econnaborted/i,
    message: "A operação demorou demais. Verifique sua conexão e tente novamente.",
  },
  {
    match: /muito grande|413|entity too large/i,
    message: "Arquivo muito grande. Tente uma imagem menor.",
  },
  {
    match: /não encontrad|not found|404/i,
    message: "Registro não encontrado.",
  },
];

function containsTechnicalLeak(message: string): boolean {
  return /\b(api|axios|http|https|server|servidor|endpoint|stack|exception|undefined|null|expo go|status code|request failed|internal server)\b/i.test(
    message
  );
}

function sanitizeUserMessage(message: string, fallback = FRIENDLY_FALLBACK): string {
  const cleaned = message.trim();
  if (!cleaned) return fallback;

  for (const rule of KNOWN_REWRITES) {
    if (rule.match.test(cleaned)) {
      return rule.message;
    }
  }

  if (cleaned.length > 160) return fallback;
  if (/[{}[\]<>]/.test(cleaned)) return fallback;
  if (/^\w+Error:/i.test(cleaned)) return fallback;
  if (containsTechnicalLeak(cleaned)) return fallback;
  if (/https?:\/\//i.test(cleaned)) return fallback;

  return cleaned;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = FRIENDLY_FALLBACK
): string {
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
        return sanitizeUserMessage(data.error, fallback);
      }
      if ("message" in data && typeof data.message === "string") {
        return sanitizeUserMessage(data.message, fallback);
      }
    }

    if (error.response.status === 401 || error.response.status === 403) {
      return "Sessão expirada. Entre novamente.";
    }

    if (error.response.status === 404) {
      return "Registro não encontrado.";
    }

    if (error.response.status === 413) {
      return "Arquivo muito grande. Tente uma imagem menor.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return sanitizeUserMessage(error.message, fallback);
  }

  return fallback;
}
