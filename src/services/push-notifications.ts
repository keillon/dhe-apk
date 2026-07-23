import { AppState, Platform, type AppStateStatus } from "react-native";
import Constants from "expo-constants";
import type { PermissionStatus } from "expo-notifications";
import { logger } from "@/utils/logger";

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

export type PushRegistrationResult = {
  ok: boolean;
  token?: string;
  permission?: PushPermissionStatus;
  error?: string;
};

type NotificationsModule = typeof import("expo-notifications");

let cachedModule: NotificationsModule | null | undefined;
let handlerConfigured = false;
let lastRegisteredToken: string | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export function isNotificationsSupported(): boolean {
  return Constants.appOwnership !== "expo";
}

export function getNotificationsUnavailableMessage(): string {
  return "Notificações push só funcionam no aplicativo instalado (APK).";
}

export function getFcmSetupMessage(): string {
  return (
    "Push Android exige Firebase (FCM): coloque google-services.json na raiz do projeto, " +
    'defina android.googleServicesFile em app.json, faça prebuild --clean e gere um APK novo.'
  );
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!isNotificationsSupported()) {
    cachedModule = null;
    return null;
  }

  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    cachedModule = await import("expo-notifications");
    return cachedModule;
  } catch (error) {
    logger.error("Push", "Falha ao carregar expo-notifications", error);
    cachedModule = null;
    return null;
  }
}

export async function ensureNotificationHandler(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications || handlerConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  handlerConfigured = true;
}

function normalizePermissionStatus(status: PermissionStatus): PushPermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Alertas DHE",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0172FE",
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  });
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  const Notifications = await getNotifications();
  if (!Notifications) return "undetermined";

  const { status } = await Notifications.getPermissionsAsync();
  return normalizePermissionStatus(status);
}

export async function requestPushPermissions(): Promise<PushPermissionStatus> {
  const Notifications = await getNotifications();
  if (!Notifications) return "undetermined";

  await ensureAndroidChannel(Notifications);

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return normalizePermissionStatus(status);
}

function formatPushTokenError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  if (
    lower.includes("firebase") ||
    lower.includes("fcm") ||
    lower.includes("default firebaseapp") ||
    lower.includes("google-services") ||
    lower.includes("messaging")
  ) {
    return `${getFcmSetupMessage()} Detalhe: ${message}`;
  }

  if (message.trim()) return message;
  return "Não foi possível obter o token de notificação.";
}

export async function getExpoPushToken(): Promise<{ token?: string; error?: string }> {
  if (!isNotificationsSupported()) {
    return { error: getNotificationsUnavailableMessage() };
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return { error: "Módulo de notificações indisponível neste APK." };
  }

  const permission = await getPushPermissionStatus();
  if (permission !== "granted") {
    return { error: "Permissão de notificação não concedida." };
  }

  await ensureAndroidChannel(Notifications);
  await ensureNotificationHandler();

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    return {
      error: "projectId EAS ausente. Verifique extra.eas.projectId no app.json.",
    };
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!result?.data) {
      return { error: "Expo retornou token vazio." };
    }
    return { token: result.data };
  } catch (error) {
    logger.error("Push", "getExpoPushTokenAsync falhou", error);
    return { error: formatPushTokenError(error) };
  }
}

export async function scheduleLocalTestNotification(
  title: string,
  body: string
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    throw new Error(getNotificationsUnavailableMessage());
  }

  await ensureNotificationHandler();
  await ensureAndroidChannel(Notifications);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { source: "local-test" },
      color: "#0172FE",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: "default",
    },
  });
}

export async function scheduleImmediateTestNotification(
  title: string,
  body: string
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    throw new Error(getNotificationsUnavailableMessage());
  }

  await ensureNotificationHandler();
  await ensureAndroidChannel(Notifications);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { source: "immediate-test" },
      color: "#0172FE",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: "default",
    },
  });
}

export async function dismissPresentedNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Ignora em plataformas sem suporte.
  }
}

export async function registerPushForCurrentUser(
  registerToken: (token: string, platform?: string) => Promise<void>
): Promise<PushRegistrationResult> {
  if (!isNotificationsSupported()) {
    return { ok: false, error: getNotificationsUnavailableMessage() };
  }

  const permission = await requestPushPermissions();
  if (permission !== "granted") {
    return {
      ok: false,
      permission,
      error: "Permissão de notificação negada. Ative nas configurações do Android.",
    };
  }

  const { token, error } = await getExpoPushToken();
  if (!token) {
    return { ok: false, permission, error: error ?? "Token indisponível." };
  }

  if (lastRegisteredToken === token) {
    return { ok: true, token, permission };
  }

  try {
    await registerToken(token, Platform.OS);
    lastRegisteredToken = token;
    logger.info("Push", "Token registrado no servidor");
    return { ok: true, token, permission };
  } catch (registerError) {
    logger.error("Push", "Falha ao salvar token no servidor", registerError);
    return {
      ok: false,
      token,
      permission,
      error: "Token obtido, mas a API não salvou. Verifique login/rede.",
    };
  }
}

/** Re-registra push ao voltar para o app (útil após conceder permissão). */
export function watchPushRegistration(
  registerToken: (token: string, platform?: string) => Promise<void>
): () => void {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  const onChange = (state: AppStateStatus) => {
    if (state !== "active") return;
    void registerPushForCurrentUser(registerToken);
  };

  appStateSubscription = AppState.addEventListener("change", onChange);
  void registerPushForCurrentUser(registerToken);

  return () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}

export async function addNotificationResponseListener(
  onResponse: (payload: { url?: string; data?: Record<string, unknown> }) => void
): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  await ensureNotificationHandler();

  const emit = (data: Record<string, unknown> | undefined) => {
    const url = typeof data?.url === "string" ? data.url : undefined;
    onResponse({ url, data });
  };

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) {
    emit(lastResponse.notification.request.content.data as Record<string, unknown> | undefined);
    await Notifications.clearLastNotificationResponseAsync();
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    emit(response.notification.request.content.data as Record<string, unknown> | undefined);
  });

  return () => subscription.remove();
}

export async function addNotificationListeners(handlers: {
  onReceived?: (title: string, body: string) => void;
  onResponse?: (title: string) => void;
}): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  await ensureNotificationHandler();

  const subscriptions: Array<{ remove: () => void }> = [];

  if (handlers.onReceived) {
    subscriptions.push(
      Notifications.addNotificationReceivedListener((notification) => {
        const content = notification.request.content;
        handlers.onReceived?.(content.title ?? "Sem título", content.body ?? "Sem mensagem");
      })
    );
  }

  if (handlers.onResponse) {
    subscriptions.push(
      Notifications.addNotificationResponseReceivedListener((response) => {
        const content = response.notification.request.content;
        handlers.onResponse?.(content.title ?? "Sem título");
      })
    );
  }

  return () => {
    for (const subscription of subscriptions) {
      subscription.remove();
    }
  };
}
