import AsyncStorage from "@react-native-async-storage/async-storage";
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

const INSTALLED_RELEASE_KEY = "dhe:installed_release_marker";

export function getInstalledVersionCode(): number {
  const native = Number(Application.nativeBuildVersion);
  if (Number.isFinite(native) && native > 0) return native;

  const android = Constants.expoConfig?.android as { versionCode?: number } | undefined;
  return android?.versionCode ?? 1;
}

export function getInstalledVersionName(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "1.0.0";
}

export function getReleaseMarker(remote: AppVersionInfo): string {
  return `${remote.versionCode}|${remote.publishedAt ?? ""}|${remote.version}`;
}

export async function getInstalledReleaseMarker(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(INSTALLED_RELEASE_KEY);
  } catch {
    return null;
  }
}

export async function markReleaseInstalled(remote: AppVersionInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(INSTALLED_RELEASE_KEY, getReleaseMarker(remote));
  } catch (error) {
    logger.warn("AppUpdate", "Falha ao gravar marcador de release", error);
  }
}

export async function fetchRemoteAppVersion(): Promise<AppVersionInfo | null> {
  try {
    const response = await fetch(`${API_URL}/api/app/version?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!response.ok) return null;
    return (await response.json()) as AppVersionInfo;
  } catch (error) {
    logger.warn("AppUpdate", "Falha ao consultar versão remota", error);
    return null;
  }
}

/**
 * Atualização disponível se versionCode remoto for maior,
 * ou se republicaram APK (mesmo code) com publishedAt diferente.
 */
export async function isRemoteUpdateAvailable(remote: AppVersionInfo): Promise<boolean> {
  const localCode = getInstalledVersionCode();

  if (remote.versionCode > localCode) return true;
  if (remote.versionCode < localCode) return false;

  const marker = getReleaseMarker(remote);
  const saved = await getInstalledReleaseMarker();

  if (!saved) {
    // Primeira execução: assume que o APK instalado já corresponde ao servidor.
    await markReleaseInstalled(remote);
    return false;
  }

  return saved !== marker;
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
    {
      headers: {
        "Cache-Control": "no-cache",
      },
    },
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

export async function promptAndInstallRemoteUpdate(
  remote: AppVersionInfo,
  options?: { force?: boolean }
): Promise<boolean> {
  const localName = getInstalledVersionName();
  const localCode = getInstalledVersionCode();

  const confirmed = await feedback.confirm(
    options?.force ? "Reinstalar APK" : "Nova versão disponível",
    `Instalado: v${localName} (${localCode})\nServidor: v${remote.version} (${remote.versionCode})${
      remote.notes ? `\n\n${remote.notes}` : ""
    }\n\nO app vai baixar o APK e abrir o instalador do Android.`,
    "Baixar e instalar"
  );

  if (!confirmed) return false;

  try {
    feedback.toast.info("Baixando atualização...");
    await downloadAndInstallApk(remote.apkUrl);
    await markReleaseInstalled(remote);
    feedback.toast.success("Confirme a instalação na tela do Android.");
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

  if (!(await isRemoteUpdateAvailable(remote))) return;
  if (options?.promptNative === false) return;

  await promptAndInstallRemoteUpdate(remote);
}

/** Trata toque em push de atualização do app. */
export async function handleAppUpdatePushData(
  data: Record<string, unknown> | undefined
): Promise<boolean> {
  if (!data || data.type !== "app_update") return false;

  const apkUrl =
    typeof data.apkUrl === "string"
      ? data.apkUrl
      : typeof data.url === "string"
        ? data.url
        : null;
  if (!apkUrl) return false;

  if (Platform.OS !== "android") {
    await Linking.openURL(apkUrl);
    return true;
  }

  const remote = await fetchRemoteAppVersion();
  if (remote) {
    await promptAndInstallRemoteUpdate(remote, {
      force: !(await isRemoteUpdateAvailable(remote)),
    });
    return true;
  }

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
