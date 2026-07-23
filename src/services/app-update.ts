import { Platform } from "react-native";
import Constants from "expo-constants";
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
  const android = Constants.expoConfig?.android as { versionCode?: number } | undefined;
  return android?.versionCode ?? 1;
}

export function getInstalledVersionName(): string {
  return Constants.expoConfig?.version ?? "1.0.0";
}

export async function fetchRemoteAppVersion(): Promise<AppVersionInfo | null> {
  try {
    const response = await fetch(`${API_URL}/api/app/version`);
    if (!response.ok) return null;
    return (await response.json()) as AppVersionInfo;
  } catch (error) {
    logger.warn("AppUpdate", "Falha ao consultar versão remota", error);
    return null;
  }
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

/** Checa OTA (JS) e, se necessário, APK nativo. */
export async function checkAppUpdates(options?: {
  promptNative?: boolean;
}): Promise<void> {
  const otaApplied = await checkAndApplyOtaUpdate();
  if (otaApplied) return;

  if (Platform.OS !== "android") return;

  const remote = await fetchRemoteAppVersion();
  if (!remote) return;

  const localCode = getInstalledVersionCode();
  if (remote.versionCode <= localCode) return;

  if (options?.promptNative === false) return;

  const confirmed = await feedback.confirm(
    "Nova versão disponível",
    `Versão ${remote.version} pronta para instalar${
      remote.notes ? `\n\n${remote.notes}` : ""
    }\n\nO app vai baixar o APK e abrir o instalador.`,
    "Baixar e instalar"
  );

  if (!confirmed) return;

  try {
    feedback.toast.info("Baixando atualização...");
    await downloadAndInstallApk(remote.apkUrl);
    feedback.toast.success("Abra o instalador e confirme a atualização.");
  } catch (error) {
    logger.error("AppUpdate", "Falha ao baixar/instalar APK", error);
    feedback.toast.error("Não foi possível baixar a atualização. Tente de novo.");
  }
}
