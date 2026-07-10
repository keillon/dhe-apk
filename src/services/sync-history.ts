import { generateId } from "@/utils/id";
import type { SyncHistoryEntry } from "@/types";
import { getCachedData, setCachedData, StorageKeys } from "./storage";

const MAX_ENTRIES = 200;

function getEntries(): SyncHistoryEntry[] {
  return getCachedData<SyncHistoryEntry[]>(StorageKeys.syncHistory) ?? [];
}

function saveEntries(entries: SyncHistoryEntry[]): void {
  setCachedData(StorageKeys.syncHistory, entries.slice(0, MAX_ENTRIES));
}

export function listSyncHistory(): SyncHistoryEntry[] {
  return getEntries().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function appendSyncHistory(
  entry: Omit<SyncHistoryEntry, "id" | "created_at">
): SyncHistoryEntry {
  const saved: SyncHistoryEntry = {
    ...entry,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  saveEntries([saved, ...getEntries()]);
  return saved;
}

export function clearSyncHistory(): void {
  setCachedData(StorageKeys.syncHistory, []);
}
