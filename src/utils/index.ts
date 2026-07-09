import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EquipmentStatus, OilContamination } from "@/types";
import { colors } from "@/theme";

export { generateId } from "./id";
export { getApiErrorMessage } from "./api-error";
export { maskDateInput, isValidDateBR, dateBRToISO } from "./masks";
export { normalizeSignatureDataUrl } from "./signature";
export {
  validateInspectionForm,
  hasInspectionFormErrors,
  getFirstInspectionError,
  type InspectionFormErrors,
} from "./inspection-validation";
export type { LocalPhoto } from "./images";
export { getPhotoPreviewUri } from "./images";

export function formatDate(date: string | undefined): string {
  if (!date) return "—";
  return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | undefined): string {
  if (!date) return "—";
  return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatRelative(date: string | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: ptBR });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function getStatusLabel(status: EquipmentStatus): string {
  switch (status) {
    case "operando":
      return "Operando";
    case "parado":
      return "Parado";
    case "manutencao":
      return "Manutenção";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function getStatusColor(status: EquipmentStatus): string {
  switch (status) {
    case "operando":
      return colors.success;
    case "parado":
      return colors.warning;
    case "manutencao":
      return colors.danger;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function getContaminationLabel(level: OilContamination): string {
  switch (level) {
    case "baixa":
      return "Baixa";
    case "media":
      return "Média";
    case "alta":
      return "Alta";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function getContaminationColor(level: OilContamination): string {
  switch (level) {
    case "baixa":
      return colors.success;
    case "media":
      return colors.warning;
    case "alta":
      return colors.danger;
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export const DEFAULT_CHECKLIST = {
  vazamentos: false,
  mangueiras: false,
  cilindros: false,
  motor: false,
  bomba: false,
  pressao: false,
  temperatura: false,
  filtros: false,
  ruidos: false,
  acoplamentos: false,
} as const;

export const CHECKLIST_LABELS: Record<keyof typeof DEFAULT_CHECKLIST, string> = {
  vazamentos: "Vazamentos",
  mangueiras: "Mangueiras",
  cilindros: "Cilindros",
  motor: "Motor",
  bomba: "Bomba",
  pressao: "Pressão",
  temperatura: "Temperatura",
  filtros: "Filtros",
  ruidos: "Ruídos",
  acoplamentos: "Acoplamentos",
};
