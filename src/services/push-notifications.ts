import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function normalizePermissionStatus(status: Notifications.PermissionStatus): PushPermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return normalizePermissionStatus(status);
}

export async function requestPushPermissions(): Promise<PushPermissionStatus> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Alertas DHE",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00E5FF",
    });
  }

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
  const permission = await getPushPermissionStatus();
  if (permission !== "granted") {
    return { error: "Permissão de notificação não concedida." };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    return {
      error: "Project ID do EAS não configurado em app.json (extra.eas.projectId).",
    };
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: result.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível obter o token push.";
    return { error: message };
  }
}

export async function scheduleLocalTestNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Alertas DHE",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00E5FF",
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { source: "local-test" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export async function scheduleImmediateTestNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Alertas DHE",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00E5FF",
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { source: "immediate-test" },
    },
    trigger: null,
  });
}
