import { Platform, Linking } from "react-native";
import Constants from "expo-constants";
import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import type { AppVersionInfo } from "@/types";
import { feedback } from "@/services/feedback";
import { logger } from "@/utils/logger";
import { checkAndApplyOtaUpdate } from "@/services/ota-updates";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://195.35.40.86:8090").replace(
  /\/$/,
  ""
);

export function getInstalledVersionCode(): number {
  const native = Number(Application.nativeBuildVersion);
  if (Number.isFinite(native) && native > 0) return native;

  const android = Constants.expoConfig?.android as { versionCode?: number } | undefined;
  return android?.versionCode ?? 1;
}

export function getInstalledVersionName(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "1.0.0";
}

export async function fetchRemoteAppVersion(): Promise<AppVersionInfo | null> {
  try {
    const response = await fetch(`${API_URL}/api/app/version`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as AppVersionInfo;
  } catch (error) {
    logger.warn("AppUpdate", "Falha ao consultar versão remota", error);
    return null;
  }
}

export function isRemoteUpdateAvailable(remote: AppVersionInfo): boolean {
  return remote.versionCode > getInstalledVersionCode();
}

export async function downloadAndInstallApk(
  apkUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("Instalação de APK disponível apenas no Android.");
  }

  const target = `${FileSystem.cacheDirectory}dhe-hidraulicos-update.apk`;

  const download = FileSystem.createDownloadResumable(
    apkUrl,
    target,
    {},
    (progress) => {
      if (!progress.totalBytesExpectedToWrite) return;
      const pct = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
      onProgress?.(pct);
    }
  );

  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error("Download do APK falhou.");
  }

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: 1,
    type: "application/vnd.android.package-archive",
  });
}

export async function promptAndInstallRemoteUpdate(remote: AppVersionInfo): Promise<boolean> {
  const confirmed = await feedback.confirm(
    "Nova versão disponível",
    `Versão ${remote.version} pronta para instalar${
      remote.notes ? `\n\n${remote.notes}` : ""
    }\n\nO app vai baixar o APK e abrir o instalador.`,
    "Baixar e instalar"
  );

  if (!confirmed) return false;

  try {
    feedback.toast.info("Baixando atualização...");
    await downloadAndInstallApk(remote.apkUrl);
    feedback.toast.success("Abra o instalador e confirme a atualização.");
    return true;
  } catch (error) {
    logger.error("AppUpdate", "Falha ao baixar/instalar APK", error);
    feedback.toast.error("Não foi possível baixar a atualização. Tente de novo.");
    return false;
  }
}

/** Checa OTA (JS) e, se necessário, APK nativo. */
export async function checkAppUpdates(options?: {
  promptNative?: boolean;
}): Promise<void> {
  const otaApplied = await checkAndApplyOtaUpdate();
  if (otaApplied) return;

  if (Platform.OS !== "android") return;

  const remote = await fetchRemoteAppVersion();
  if (!remote) return;

  if (!isRemoteUpdateAvailable(remote)) return;
  if (options?.promptNative === false) return;

  await promptAndInstallRemoteUpdate(remote);
}

/** Trata toque em push de atualização do app. */
export async function handleAppUpdatePushData(data: Record<string, unknown> | undefined): Promise<boolean> {
  if (!data || data.type !== "app_update") return false;

  const apkUrl = typeof data.apkUrl === "string" ? data.apkUrl : typeof data.url === "string" ? data.url : null;
  if (!apkUrl) return false;

  if (Platform.OS !== "android") {
    await Linking.openURL(apkUrl);
    return true;
  }

  const remote = await fetchRemoteAppVersion();
  if (remote && isRemoteUpdateAvailable(remote)) {
    await promptAndInstallRemoteUpdate(remote);
    return true;
  }

  // Mesmo se já estiver atualizado, oferece baixar (ou abre link).
  const confirmed = await feedback.confirm(
    "Baixar APK",
    "Deseja baixar o instalador do DHE agora?",
    "Baixar"
  );
  if (!confirmed) return true;

  try {
    await downloadAndInstallApk(apkUrl);
  } catch {
    await Linking.openURL(apkUrl);
  }
  return true;
}
