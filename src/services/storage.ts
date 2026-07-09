import { MMKV } from "react-native-mmkv";
import type { PendingSyncItem } from "@/types";

export const storage = new MMKV({ id: "dhe-app-storage" });

const KEYS = {
  pendingSync: "pending_sync",
  cachedEquipments: "cached_equipments",
  cachedInspections: "cached_inspections",
  offlineMode: "offline_mode",
} as const;

export function getPendingSync(): PendingSyncItem[] {
  const raw = storage.getString(KEYS.pendingSync);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingSyncItem[];
  } catch {
    return [];
  }
}

export function addPendingSync(item: PendingSyncItem): void {
  const items = getPendingSync();
  items.push(item);
  storage.set(KEYS.pendingSync, JSON.stringify(items));
}

export function clearPendingSync(): void {
  storage.delete(KEYS.pendingSync);
}

export function setCachedData<T>(key: string, data: T): void {
  storage.set(key, JSON.stringify(data));
}

export function getCachedData<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setOfflineMode(offline: boolean): void {
  storage.set(KEYS.offlineMode, offline);
}

export function isOfflineMode(): boolean {
  return storage.getBoolean(KEYS.offlineMode) ?? false;
}

export { KEYS as StorageKeys };
