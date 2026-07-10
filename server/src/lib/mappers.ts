import type {
  ApiChecklistItem,
  ApiClient,
  ApiDashboardStats,
  ApiEquipment,
  ApiInspection,
  ApiNotification,
  ApiUser,
} from "../types/api";

function toIso(date: Date | null | undefined): string | undefined {
  return date ? date.toISOString() : undefined;
}

function formatDateOnly(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split("T")[0];
}

export function mapUser(user: {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  empresa: string;
  role: "admin" | "tecnico";
  fotoUrl: string | null;
  createdAt: Date;
}): ApiUser {
  return {
    id: user.id,
    email: user.email,
    nome: user.nome,
    cargo: user.cargo,
    empresa: user.empresa,
    role: user.role ?? "tecnico",
    foto_url: user.fotoUrl ?? undefined,
    created_at: user.createdAt.toISOString(),
  };
}

export function mapClient(client: {
  id: string;
  nome: string;
  empresa: string;
  email: string | null;
  telefone: string | null;
  createdAt: Date;
}): ApiClient {
  return {
    id: client.id,
    nome: client.nome,
    empresa: client.empresa,
    email: client.email ?? undefined,
    telefone: client.telefone ?? undefined,
    created_at: client.createdAt.toISOString(),
  };
}

export function mapEquipment(
  equipment: {
    id: string;
    qrCode: string;
    clienteId: string;
    empresa: string;
    nome: string;
    patrimonio: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    ano: number;
  localizacao: string;
  tipo?: string | null;
  fotoUrl: string | null;
    status: "operando" | "parado" | "manutencao";
    ultimaInspecao: Date | null;
    proximaManutencao: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cliente?: {
      id: string;
      nome: string;
      empresa: string;
      email: string | null;
      telefone: string | null;
      createdAt: Date;
    } | null;
  }
): ApiEquipment {
  return {
    id: equipment.id,
    qr_code: equipment.qrCode,
    cliente_id: equipment.clienteId,
    empresa: equipment.empresa,
    nome: equipment.nome,
    patrimonio: equipment.patrimonio,
    marca: equipment.marca,
    modelo: equipment.modelo,
    numero_serie: equipment.numeroSerie,
    ano: equipment.ano,
    localizacao: equipment.localizacao,
    tipo: equipment.tipo ?? undefined,
    foto_url: equipment.fotoUrl ?? undefined,
    status: equipment.status,
    ultima_inspecao: toIso(equipment.ultimaInspecao),
    proxima_manutencao: toIso(equipment.proximaManutencao),
    created_at: equipment.createdAt.toISOString(),
    updated_at: equipment.updatedAt.toISOString(),
    cliente: equipment.cliente ? mapClient(equipment.cliente) : undefined,
  };
}

export function mapInspection(
  inspection: {
    id: string;
    equipamentoId: string;
    tecnicoId: string;
    nivelOleo: number;
    contaminacaoOleo: "baixa" | "media" | "alta";
    dataUltimaLimpeza: Date | null;
    complemento: string | null;
    checklist: unknown;
    createdAt: Date;
    tecnico?: {
      id: string;
      email: string;
      nome: string;
      cargo: string;
      empresa: string;
      role: "admin" | "tecnico";
      fotoUrl: string | null;
      createdAt: Date;
    } | null;
    fotos?: Array<{
      id: string;
      inspecaoId: string;
      url: string;
      tipo: "antes" | "depois";
      mediaKind: "image" | "video";
      createdAt: Date;
    }>;
    assinatura?: { url: string } | null;
  }
): ApiInspection {
  return {
    id: inspection.id,
    equipamento_id: inspection.equipamentoId,
    tecnico_id: inspection.tecnicoId,
    nivel_oleo: inspection.nivelOleo,
    contaminacao_oleo: inspection.contaminacaoOleo,
    data_ultima_limpeza: formatDateOnly(inspection.dataUltimaLimpeza),
    complemento: inspection.complemento ?? undefined,
    checklist: inspection.checklist as ApiChecklistItem,
    assinatura_url: inspection.assinatura?.url,
    created_at: inspection.createdAt.toISOString(),
    tecnico: inspection.tecnico ? mapUser(inspection.tecnico) : undefined,
    fotos: inspection.fotos?.map((foto) => ({
      id: foto.id,
      inspecao_id: foto.inspecaoId,
      url: foto.url,
      tipo: foto.tipo,
      media_kind: foto.mediaKind,
      created_at: foto.createdAt.toISOString(),
    })),
  };
}

export function mapNotification(notification: {
  id: string;
  usuarioId: string;
  equipamentoId: string | null;
  tipo: "inspecao_pendente" | "manutencao_vencida" | "oleo_contaminado";
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: Date;
}): ApiNotification {
  return {
    id: notification.id,
    usuario_id: notification.usuarioId,
    equipamento_id: notification.equipamentoId ?? undefined,
    tipo: notification.tipo,
    titulo: notification.titulo,
    mensagem: notification.mensagem,
    lida: notification.lida,
    created_at: notification.createdAt.toISOString(),
  };
}

export function mapDashboard(stats: ApiDashboardStats): ApiDashboardStats {
  return stats;
}
