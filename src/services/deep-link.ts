import { getCachedData, setStorageValue, StorageKeys } from "./storage";

export function setPendingDeepLink(url: string): void {
  setStorageValue(StorageKeys.pendingDeepLink, url);
}

export function getPendingDeepLink(): string | null {
  const value = getCachedData<string>(StorageKeys.pendingDeepLink);
  return value && value.length > 0 ? value : null;
}

export function clearPendingDeepLink(): void {
  setStorageValue(StorageKeys.pendingDeepLink, "");
}

export function parseEquipmentDeepLink(url: string): string | null {
  const normalized = url.trim();
  const pathMatch = normalized.match(/equipment\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  try {
    const withScheme = normalized.includes("://")
      ? normalized
      : `dhe://${normalized.replace(/^\//, "")}`;
    const parsed = new URL(withScheme.replace(/^dhe:\/\//, "https://dhe.app/"));
    const segments = parsed.pathname.split("/").filter(Boolean);
    const equipmentIndex = segments.indexOf("equipment");
    if (equipmentIndex >= 0 && segments[equipmentIndex + 1]) {
      return decodeURIComponent(segments[equipmentIndex + 1]);
    }
    const id = parsed.searchParams.get("id");
    return id ? decodeURIComponent(id) : null;
  } catch {
    return null;
  }
}

export function parseResetPasswordToken(url: string): string | null {
  try {
    const withScheme = url.includes("://")
      ? url
      : `dhe://${url.replace(/^\//, "")}`;
    const parsed = new URL(withScheme.replace(/^dhe:\/\//, "https://dhe.app/"));
    const token = parsed.searchParams.get("token");
    return token ? decodeURIComponent(token) : null;
  } catch {
    const match = url.match(/[?&]token=([^&]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}
