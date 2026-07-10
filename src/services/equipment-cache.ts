import type { Equipment } from "@/types";
import { StorageKeys, getCachedData, setCachedData } from "./storage";

interface EquipmentCacheIndex {
  byId: Record<string, Equipment>;
  byQr: Record<string, string>;
  updatedAt: string;
}

function emptyCache(): EquipmentCacheIndex {
  return { byId: {}, byQr: {}, updatedAt: new Date(0).toISOString() };
}

export function normalizeEquipmentQr(qrCode: string): string {
  return qrCode.trim().toUpperCase();
}

export function getEquipmentCache(): EquipmentCacheIndex {
  return getCachedData<EquipmentCacheIndex>(StorageKeys.cachedEquipments) ?? emptyCache();
}

function saveEquipmentCache(cache: EquipmentCacheIndex): void {
  setCachedData(StorageKeys.cachedEquipments, cache);
}

export function cacheEquipments(equipments: Equipment[]): void {
  const cache = getEquipmentCache();

  for (const equipment of equipments) {
    cache.byId[equipment.id] = equipment;
    cache.byQr[normalizeEquipmentQr(equipment.qr_code)] = equipment.id;
  }

  cache.updatedAt = new Date().toISOString();
  saveEquipmentCache(cache);
}

export function upsertEquipmentCache(equipment: Equipment): void {
  const cache = getEquipmentCache();
  cache.byId[equipment.id] = equipment;
  cache.byQr[normalizeEquipmentQr(equipment.qr_code)] = equipment.id;
  cache.updatedAt = new Date().toISOString();
  saveEquipmentCache(cache);
}

export function getCachedEquipmentById(id: string): Equipment | null {
  return getEquipmentCache().byId[id] ?? null;
}

export function getCachedEquipmentByQr(qrCode: string): Equipment | null {
  const cache = getEquipmentCache();
  const equipmentId = cache.byQr[normalizeEquipmentQr(qrCode)];
  if (!equipmentId) return null;
  return cache.byId[equipmentId] ?? null;
}

export async function prefetchEquipmentCache(
  fetchEquipments: () => Promise<Equipment[]>
): Promise<void> {
  try {
    const equipments = await fetchEquipments();
    cacheEquipments(equipments);
  } catch {
    // Mantém cache existente quando offline.
  }
}
