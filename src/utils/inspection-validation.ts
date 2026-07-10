import type { ChecklistItem } from "@/types";
import { isValidDateBR } from "./masks";

export interface InspectionFormErrors {
  dataLimpeza?: string;
  fotosAntes?: string;
  fotosDepois?: string;
  assinatura?: string;
  checklist?: string;
}

export function validateInspectionForm(input: {
  dataLimpeza: string;
  fotosAntesCount: number;
  fotosDepoisCount: number;
  assinatura: string | null;
  checklist: ChecklistItem;
}): InspectionFormErrors {
  const errors: InspectionFormErrors = {};

  if (!input.dataLimpeza.trim()) {
    errors.dataLimpeza = "Informe a data da última limpeza do reservatório.";
  } else if (!isValidDateBR(input.dataLimpeza)) {
    errors.dataLimpeza = "Data inválida. Use o formato DD/MM/AAAA.";
  }

  if (input.fotosAntesCount === 0) {
    errors.fotosAntes = "Adicione pelo menos uma foto ou vídeo em Antes.";
  }

  if (input.fotosDepoisCount === 0) {
    errors.fotosDepois = "Adicione pelo menos uma foto ou vídeo em Depois.";
  }

  if (!input.assinatura) {
    errors.assinatura = "A assinatura do cliente é obrigatória.";
  }

  const checklistOk = Object.values(input.checklist).some(Boolean);
  if (!checklistOk) {
    errors.checklist = "Marque pelo menos um item do checklist.";
  }

  return errors;
}

export function hasInspectionFormErrors(errors: InspectionFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getFirstInspectionError(errors: InspectionFormErrors): string {
  return (
    errors.dataLimpeza ??
    errors.fotosAntes ??
    errors.fotosDepois ??
    errors.assinatura ??
    errors.checklist ??
    "Preencha todos os campos obrigatórios."
  );
}
