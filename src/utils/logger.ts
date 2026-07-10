type LogData = unknown;

const PREFIX = "[DHE]";

function format(scope: string, message: string): string {
  return `${PREFIX} [${scope}] ${message}`;
}

export const logger = {
  debug(scope: string, message: string, data?: LogData) {
    if (!__DEV__) return;
    if (data !== undefined) {
      console.log(format(scope, message), data);
      return;
    }
    console.log(format(scope, message));
  },

  info(scope: string, message: string, data?: LogData) {
    if (data !== undefined) {
      console.log(format(scope, message), data);
      return;
    }
    console.log(format(scope, message));
  },

  warn(scope: string, message: string, data?: LogData) {
    if (data !== undefined) {
      console.warn(format(scope, message), data);
      return;
    }
    console.warn(format(scope, message));
  },

  error(scope: string, message: string, data?: LogData) {
    if (data !== undefined) {
      console.error(format(scope, message), data);
      return;
    }
    console.error(format(scope, message));
  },
};

export function bootstrapLogging() {
  logger.info("App", `Iniciando (${__DEV__ ? "desenvolvimento" : "produção"})`);
  logger.info("App", `API: ${process.env.EXPO_PUBLIC_API_URL ?? "não configurada"}`);
}
