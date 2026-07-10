import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  buildDefaultChecklistFromTemplate,
  DEFAULT_CHECKLIST_TEMPLATE,
} from "@/utils/checklist";

export function useChecklistTemplate(tipo?: string) {
  return useQuery({
    queryKey: ["checklist-template", tipo ?? "geral"],
    queryFn: () => api.getChecklistTemplate(tipo ?? "geral"),
    staleTime: 1000 * 60 * 30,
    placeholderData: DEFAULT_CHECKLIST_TEMPLATE,
  });
}

export function useChecklistTemplates() {
  return useQuery({
    queryKey: ["checklist-templates"],
    queryFn: () => api.getChecklistTemplates(),
    staleTime: 1000 * 60 * 30,
  });
}

export function useDefaultChecklist(tipo?: string, existing?: Record<string, boolean>) {
  const query = useChecklistTemplate(tipo);
  const template = query.data ?? DEFAULT_CHECKLIST_TEMPLATE;
  return {
    ...query,
    template,
    checklist: buildDefaultChecklistFromTemplate(template, existing),
    labels: Object.fromEntries(template.itens.map((item) => [item.key, item.label])),
  };
}
