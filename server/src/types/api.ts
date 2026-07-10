export interface ApiUser {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  empresa: string;
  role: "admin" | "tecnico";
  foto_url?: string;
  created_at: string;
}

export interface ApiClient {
  id: string;
  nome: string;
  empresa: string;
  email?: string;
  telefone?: string;
  created_at: string;
}

export interface ApiEquipment {
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
  status: "operando" | "parado" | "manutencao";
  ultima_inspecao?: string;
  proxima_manutencao?: string;
  created_at: string;
  updated_at: string;
  cliente?: ApiClient;
}

export interface ApiChecklistItem {
  [key: string]: boolean;
}

export interface ApiInspection {
  id: string;
  equipamento_id: string;
  tecnico_id: string;
  nivel_oleo: number;
  contaminacao_oleo: "baixa" | "media" | "alta";
  data_ultima_limpeza?: string;
  complemento?: string;
  checklist: ApiChecklistItem;
  assinatura_url?: string;
  created_at: string;
  tecnico?: ApiUser;
  fotos?: Array<{
    id: string;
    inspecao_id: string;
    url: string;
    tipo: "antes" | "depois";
    media_kind: "image" | "video";
    created_at: string;
  }>;
}

export interface ApiNotification {
  id: string;
  usuario_id: string;
  equipamento_id?: string;
  tipo: "inspecao_pendente" | "manutencao_vencida" | "oleo_contaminado";
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export interface ApiDashboardStats {
  equipamentos_cadastrados: number;
  inspecoes_realizadas: number;
  pendencias: number;
  proximas_manutencoes: number;
  inspecoes_hoje: number;
}

export interface ApiDashboardCharts {
  inspecoes_por_mes: Array<{ mes: string; total: number }>;
  equipamentos_por_status: Array<{ status: string; total: number }>;
  contaminacao_distribuicao: Array<{ nivel: string; total: number }>;
}
