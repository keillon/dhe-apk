import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PendingSyncItem } from "@/types";

const STORAGE_PREFIX = "dhe:";

const KEYS = {
  pendingSync: "pending_sync",
  cachedEquipments: "cached_equipments",
  cachedInspections: "cached_inspections",
  offlineMode: "offline_mode",
} as const;

const memory = new Map<string, string>();

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function persist(key: string, value: string): void {
  memory.set(key, value);
  void AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
}

function remove(key: string): void {
  memory.delete(key);
  void AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}

export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter((key) => key.startsWith(STORAGE_PREFIX));

      if (appKeys.length === 0) return;

      const entries = await AsyncStorage.multiGet(appKeys);
      for (const [fullKey, value] of entries) {
        if (value == null) continue;
        memory.set(fullKey.slice(STORAGE_PREFIX.length), value);
      }
    } catch {
      memory.clear();
    } finally {
      hydrated = true;
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

export function getPendingSync(): PendingSyncItem[] {
  const raw = memory.get(KEYS.pendingSync);
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
  persist(KEYS.pendingSync, JSON.stringify(items));
}

export function clearPendingSync(): void {
  remove(KEYS.pendingSync);
}

export function setCachedData<T>(key: string, data: T): void {
  persist(key, JSON.stringify(data));
}

export function getCachedData<T>(key: string): T | null {
  const raw = memory.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setOfflineMode(offline: boolean): void {
  persist(KEYS.offlineMode, offline ? "1" : "0");
}

export function isOfflineMode(): boolean {
  return memory.get(KEYS.offlineMode) === "1";
}

export function setStorageValue(key: string, value: string): void {
  persist(key, value);
}

export { KEYS as StorageKeys };
