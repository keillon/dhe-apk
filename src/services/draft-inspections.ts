import { generateId } from "@/utils/id";
import type { InspectionDraft } from "@/types";
import { getCachedData, setCachedData, StorageKeys } from "./storage";

function getDrafts(): InspectionDraft[] {
  return getCachedData<InspectionDraft[]>(StorageKeys.inspectionDrafts) ?? [];
}

function saveDrafts(drafts: InspectionDraft[]): void {
  setCachedData(StorageKeys.inspectionDrafts, drafts);
}

export function listInspectionDrafts(): InspectionDraft[] {
  return getDrafts().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export function getInspectionDraftCount(): number {
  return getDrafts().length;
}

export function getInspectionDraft(id: string): InspectionDraft | null {
  return getDrafts().find((draft) => draft.id === id) ?? null;
}

export function saveInspectionDraft(
  draft: Omit<InspectionDraft, "id" | "savedAt"> & { id?: string }
): InspectionDraft {
  const drafts = getDrafts();
  const now = new Date().toISOString();
  const existingIndex = draft.id ? drafts.findIndex((item) => item.id === draft.id) : -1;

  const saved: InspectionDraft = {
    id: draft.id ?? generateId(),
    equipmentId: draft.equipmentId,
    equipmentName: draft.equipmentName,
    equipmentTipo: draft.equipmentTipo,
    savedAt: now,
    form: draft.form,
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = saved;
  } else {
    drafts.push(saved);
  }

  saveDrafts(drafts);
  return saved;
}

export function deleteInspectionDraft(id: string): void {
  saveDrafts(getDrafts().filter((draft) => draft.id !== id));
}
