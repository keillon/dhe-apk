export type EquipmentStatus = "operando" | "parado" | "manutencao";

export type OilContamination = "baixa" | "media" | "alta";

export type NotificationType =
  | "inspecao_pendente"
  | "manutencao_vencida"
  | "oleo_contaminado";

export type UserRole = "admin" | "tecnico";

export interface User {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  empresa: string;
  role: UserRole;
  foto_url?: string;
  created_at: string;
}

export interface Client {
  id: string;
  nome: string;
  empresa: string;
  email?: string;
  telefone?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  qr_code: string;
  cliente_id: string;
  empresa: string;
  nome: string;
  patrimonio: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  ano: number;
  localizacao: string;
  tipo?: string;
  foto_url?: string;
  status: EquipmentStatus;
  ultima_inspecao?: string;
  proxima_manutencao?: string;
  created_at: string;
  updated_at: string;
  cliente?: Client;
}

export type ChecklistItem = Record<string, boolean>;

export interface ChecklistTemplateItem {
  key: string;
  label: string;
  obrigatorio: boolean;
}

export interface ChecklistTemplate {
  id: string;
  tipo: string;
  nome: string;
  itens: ChecklistTemplateItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DailyRouteItem {
  id: string;
  ordem: number;
  visitado_em?: string;
  equipamento: Equipment;
}

export interface DailyRoute {
  id: string;
  data: string;
  status: "planejada" | "em_andamento" | "concluida";
  itens: DailyRouteItem[];
}

export interface MaintenanceEvent {
  id: string;
  data?: string;
  equipamento: Equipment;
  atrasada: boolean;
}

export interface AuditLogEntry {
  id: string;
  entidade: "equipamento" | "cliente";
  entidade_id: string;
  acao: string;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  created_at: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface DashboardCharts {
  inspecoes_por_mes: Array<{ mes: string; total: number }>;
  equipamentos_por_status: Array<{ status: string; total: number }>;
  contaminacao_distribuicao: Array<{ nivel: string; total: number }>;
}

export interface InspectionDraftPhoto {
  uri: string;
  dataUrl: string;
  kind: "image" | "video";
  thumbnailUri?: string;
  withAudio?: boolean;
}

export interface InspectionDraft {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentTipo?: string;
  savedAt: string;
  form: {
    nivelOleo: number;
    contaminacao: OilContamination;
    dataLimpeza: string;
    complemento: string;
    checklist: ChecklistItem;
    fotosAntes: InspectionDraftPhoto[];
    fotosDepois: InspectionDraftPhoto[];
    assinatura: string | null;
  };
}

export interface SyncHistoryEntry {
  id: string;
  type: "sync_success" | "sync_failed" | "sync_partial";
  message: string;
  synced?: number;
  failed?: number;
  created_at: string;
}

export interface AppLockSettings {
  enabled: boolean;
  useBiometric: boolean;
  pinHash?: string;
}

export interface Inspection {
  id: string;
  equipamento_id: string;
  tecnico_id: string;
  nivel_oleo: number;
  contaminacao_oleo: OilContamination;
  data_ultima_limpeza?: string;
  complemento?: string;
  checklist: ChecklistItem;
  assinatura_url?: string;
  created_at: string;
  tecnico?: User;
  fotos?: InspectionPhoto[];
  equipamento?: Equipment;
}

export interface InspectionPhoto {
  id: string;
  inspecao_id: string;
  url: string;
  tipo: "antes" | "depois";
  media_kind?: MediaKind;
  created_at: string;
}

export type MediaKind = "image" | "video";

export interface CreateInspectionPhotoInput {
  tipo: "antes" | "depois";
  url: string;
  media_kind?: MediaKind;
}

export interface CreateInspectionInput {
  equipamento_id: string;
  tecnico_id: string;
  nivel_oleo: number;
  contaminacao_oleo: OilContamination;
  data_ultima_limpeza?: string;
  complemento?: string;
  checklist: ChecklistItem;
  fotos?: CreateInspectionPhotoInput[];
  assinatura_url?: string;
  client_request_id?: string;
}

export interface UpdateProfileInput {
  nome?: string;
  foto_url?: string;
}

export interface ChangePasswordInput {
  senha_atual: string;
  senha_nova: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  nome: string;
  cargo?: string;
  empresa?: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  nome?: string;
  cargo?: string;
  empresa?: string;
  role?: UserRole;
  password?: string;
}

export interface ClientInput {
  nome: string;
  empresa: string;
  email?: string;
  telefone?: string;
}

export interface EquipmentInput {
  cliente_id: string;
  nome: string;
  patrimonio: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  ano: number;
  localizacao: string;
  tipo?: string;
  status: EquipmentStatus;
  proxima_manutencao?: string;
  foto_url?: string;
  qr_code?: string;
}

export interface UpdateInspectionInput {
  nivel_oleo: number;
  contaminacao_oleo: OilContamination;
  data_ultima_limpeza: string;
  complemento?: string;
  checklist: ChecklistItem;
  fotos: CreateInspectionPhotoInput[];
  assinatura_url: string;
}

export interface Notification {
  id: string;
  usuario_id: string;
  equipamento_id?: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export interface DashboardStats {
  equipamentos_cadastrados: number;
  inspecoes_realizadas: number;
  pendencias: number;
  proximas_manutencoes: number;
  inspecoes_hoje: number;
}

export interface InspectionFilters {
  tecnico_id?: string;
  period?: "all" | "30d" | "90d";
  contamination?: "all" | OilContamination;
}

export interface PendingSyncItem {
  id: string;
  type: "inspection" | "equipment_update";
  payload: CreateInspectionInput | Record<string, unknown>;
  created_at: string;
  status: "pending" | "syncing" | "failed" | "synced";
  retries: number;
  last_error?: string;
  equipment_name?: string;
}
