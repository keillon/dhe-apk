import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  buildDefaultChecklistFromTemplate,
  DEFAULT_CHECKLIST_TEMPLATE,
  getChecklistLabels,
} from "@/utils/checklist";

export function useChecklistTemplate(tipo?: string) {
  return useQuery({
    queryKey: ["checklist-template", tipo ?? "geral"],
    queryFn: () => api.getChecklistTemplate(tipo ?? "geral"),
    staleTime: 1000 * 60 * 30,
    placeholderData: DEFAULT_CHECKLIST_TEMPLATE,
    retry: 1,
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
  const existingKey = useMemo(
    () => (existing ? JSON.stringify(existing) : ""),
    [existing]
  );

  const checklist = useMemo(
    () => buildDefaultChecklistFromTemplate(template, existing),
    [template, existingKey]
  );

  const labels = useMemo(() => getChecklistLabels(template), [template]);

  return {
    ...query,
    template,
    checklist,
    labels,
  };
}
