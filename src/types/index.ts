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
  foto_url?: string;
  status: EquipmentStatus;
  ultima_inspecao?: string;
  proxima_manutencao?: string;
  created_at: string;
  updated_at: string;
  cliente?: Client;
}

export interface ChecklistItem {
  vazamentos: boolean;
  mangueiras: boolean;
  cilindros: boolean;
  motor: boolean;
  bomba: boolean;
  pressao: boolean;
  temperatura: boolean;
  filtros: boolean;
  ruidos: boolean;
  acoplamentos: boolean;
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
  created_at: string;
}

export interface CreateInspectionPhotoInput {
  tipo: "antes" | "depois";
  url: string;
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
  status: EquipmentStatus;
  proxima_manutencao?: string;
  foto_url?: string;
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
  payload: Record<string, unknown>;
  created_at: string;
}
