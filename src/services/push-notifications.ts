import { Platform } from "react-native";
import Constants from "expo-constants";
import type { PermissionStatus } from "expo-notifications";

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

type NotificationsModule = typeof import("expo-notifications");

let cachedModule: NotificationsModule | null | undefined;
let handlerConfigured = false;

export function isNotificationsSupported(): boolean {
  return Constants.appOwnership !== "expo";
}

export function getNotificationsUnavailableMessage(): string {
  return "Notificações push só funcionam no aplicativo instalado.";
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
  } catch {
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

export async function getExpoPushToken(): Promise<{ token?: string; error?: string }> {
  if (!isNotificationsSupported()) {
    return { error: getNotificationsUnavailableMessage() };
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return { error: "Módulo de notificações indisponível." };
  }

  const permission = await getPushPermissionStatus();
  if (permission !== "granted") {
    return { error: "Permissão de notificação não concedida." };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    return {
      error: "Configuração de notificações incompleta neste aplicativo.",
    };
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: result.data };
  } catch {
    return { error: "Não foi possível obter o token de notificação." };
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
): Promise<void> {
  if (!isNotificationsSupported()) return;

  const permission = await requestPushPermissions();
  if (permission !== "granted") return;

  const { token, error } = await getExpoPushToken();
  if (!token || error) return;

  await registerToken(token, Platform.OS);
}

export async function addNotificationResponseListener(
  onResponse: (url: string) => void
): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  await ensureNotificationHandler();

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  const lastUrl = lastResponse?.notification.request.content.data?.url;
  if (typeof lastUrl === "string") {
    onResponse(lastUrl);
    await Notifications.clearLastNotificationResponseAsync();
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === "string") {
      onResponse(url);
    }
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
