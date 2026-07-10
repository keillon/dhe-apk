import type { CreateInspectionInput, PendingSyncItem } from "@/types";
import { api } from "./api";
import { isNetworkError } from "./http";
import { getPendingSync, setStorageValue, StorageKeys } from "./storage";

function savePendingItems(items: PendingSyncItem[]): void {
  setStorageValue(StorageKeys.pendingSync, JSON.stringify(items));
}

export function generateClientRequestId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `insp-${Date.now()}-${random}`;
}

export function getPendingInspections(): PendingSyncItem[] {
  return getPendingSync().filter((item) => item.type === "inspection");
}

export function getPendingInspectionCount(): number {
  return getPendingInspections().filter((item) => item.status !== "synced").length;
}

export function queuePendingInspection(
  payload: CreateInspectionInput,
  equipmentName?: string
): PendingSyncItem {
  const clientRequestId = payload.client_request_id ?? generateClientRequestId();
  const payloadWithId = { ...payload, client_request_id: clientRequestId };

  const items = getPendingSync().filter((item) => item.id !== clientRequestId);
  const pendingItem: PendingSyncItem = {
    id: clientRequestId,
    type: "inspection",
    payload: payloadWithId,
    created_at: new Date().toISOString(),
    status: "pending",
    retries: 0,
    equipment_name: equipmentName,
  };

  items.push(pendingItem);
  savePendingItems(items);
  return pendingItem;
}

function updatePendingItem(
  id: string,
  updater: (item: PendingSyncItem) => PendingSyncItem
): void {
  const items = getPendingSync().map((item) => (item.id === id ? updater(item) : item));
  savePendingItems(items);
}

export function removePendingInspection(id: string): void {
  const items = getPendingSync().filter((item) => item.id !== id);
  savePendingItems(items);
}

export interface SyncPendingResult {
  synced: number;
  failed: number;
  skipped: number;
}

export async function syncPendingInspections(): Promise<SyncPendingResult> {
  const pending = getPendingInspections().filter(
    (item) => item.status === "pending" || item.status === "failed"
  );

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pending) {
    if (item.status === "syncing") {
      skipped += 1;
      continue;
    }

    updatePendingItem(item.id, (current) => ({
      ...current,
      status: "syncing",
      last_error: undefined,
    }));

    try {
      await api.createInspection(item.payload as CreateInspectionInput);
      updatePendingItem(item.id, (current) => ({
        ...current,
        status: "synced",
      }));
      removePendingInspection(item.id);
      synced += 1;
    } catch (error) {
      const message = isNetworkError(error)
        ? "Sem conexão com o servidor."
        : error instanceof Error
          ? error.message
          : "Erro ao enviar inspeção.";

      updatePendingItem(item.id, (current) => ({
        ...current,
        status: "failed",
        retries: current.retries + 1,
        last_error: message,
      }));
      failed += 1;
    }
  }

  return { synced, failed, skipped };
}
