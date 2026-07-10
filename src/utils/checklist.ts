import { api } from "@/services/api";
import type { ChecklistItem, ChecklistTemplate, ChecklistTemplateItem } from "@/types";
import { DEFAULT_CHECKLIST } from "@/utils";

export const DEFAULT_CHECKLIST_TEMPLATE: ChecklistTemplate = {
  id: "default",
  tipo: "geral",
  nome: "Checklist geral",
  itens: [
    { key: "vazamentos", label: "Vazamentos", obrigatorio: false },
    { key: "mangueiras", label: "Mangueiras", obrigatorio: false },
    { key: "cilindros", label: "Cilindros", obrigatorio: false },
    { key: "motor", label: "Motor", obrigatorio: false },
    { key: "bomba", label: "Bomba", obrigatorio: false },
    { key: "pressao", label: "Pressão", obrigatorio: false },
    { key: "temperatura", label: "Temperatura", obrigatorio: false },
    { key: "filtros", label: "Filtros", obrigatorio: false },
    { key: "ruidos", label: "Ruídos", obrigatorio: false },
    { key: "acoplamentos", label: "Acoplamentos", obrigatorio: false },
  ],
};

export async function loadChecklistTemplate(tipo?: string): Promise<ChecklistTemplate> {
  try {
    const template = await api.getChecklistTemplate(tipo ?? "geral");
    if (template.itens.length > 0) return template;
  } catch {
    // fallback below
  }
  return DEFAULT_CHECKLIST_TEMPLATE;
}

export function buildDefaultChecklistFromTemplate(
  template: ChecklistTemplate,
  existing?: ChecklistItem
): ChecklistItem {
  const checklist: ChecklistItem = {};
  for (const item of template.itens) {
    checklist[item.key] = existing?.[item.key] ?? false;
  }
  return checklist;
}

export function getChecklistLabels(template: ChecklistTemplate): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const item of template.itens) {
    labels[item.key] = item.label;
  }
  return labels;
}

export function mergeChecklistWithTemplate(
  template: ChecklistTemplate,
  checklist: ChecklistItem
): ChecklistItem {
  const merged = buildDefaultChecklistFromTemplate(template);
  for (const key of Object.keys(checklist)) {
    if (key in merged) {
      merged[key] = checklist[key];
    }
  }
  return merged;
}

export function getChecklistTemplateItems(template: ChecklistTemplate): ChecklistTemplateItem[] {
  return template.itens;
}

export function buildFallbackChecklist(existing?: ChecklistItem): ChecklistItem {
  return buildDefaultChecklistFromTemplate(DEFAULT_CHECKLIST_TEMPLATE, existing ?? DEFAULT_CHECKLIST);
}
