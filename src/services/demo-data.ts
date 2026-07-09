import type {
  ChecklistItem,
  Client,
  DashboardStats,
  Equipment,
  Inspection,
  Notification,
  OilContamination,
  User,
} from "@/types";
import { generateId } from "@/utils/id";

const DEMO_USER: User = {
  id: "33333333-3333-3333-3333-333333333333",
  email: "tecnico@dhepr.com.br",
  nome: "João Silva",
  cargo: "Técnico Hidráulico",
  empresa: "DHE Componentes Hidráulicos",
  created_at: new Date().toISOString(),
};

const DEMO_CLIENTS: Client[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    nome: "Carlos Mendes",
    empresa: "FMM Indústria",
    email: "carlos@fmm.com.br",
    telefone: "(41) 99999-0001",
    created_at: new Date().toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    nome: "Ana Paula",
    empresa: "Metalúrgica Sul",
    email: "ana@metalsul.com.br",
    telefone: "(41) 99999-0002",
    created_at: new Date().toISOString(),
  },
];

const DEMO_EQUIPMENTS: Equipment[] = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    qr_code: "DHE-0001",
    cliente_id: "11111111-1111-1111-1111-111111111111",
    empresa: "FMM Indústria",
    nome: "Prensa Hidráulica 500T",
    patrimonio: "PAT-001",
    marca: "Parker",
    modelo: "PH-500",
    numero_serie: "SN-2020-001",
    ano: 2020,
    localizacao: "Setor A - Linha 1",
    status: "operando",
    ultima_inspecao: new Date(Date.now() - 15 * 86400000).toISOString(),
    proxima_manutencao: new Date(Date.now() + 15 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cliente: DEMO_CLIENTS[0],
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    qr_code: "DHE-0002",
    cliente_id: "11111111-1111-1111-1111-111111111111",
    empresa: "FMM Indústria",
    nome: "Injetora Hidráulica",
    patrimonio: "PAT-002",
    marca: "Bosch",
    modelo: "IH-200",
    numero_serie: "SN-2019-045",
    ano: 2019,
    localizacao: "Setor B - Linha 3",
    status: "manutencao",
    ultima_inspecao: new Date(Date.now() - 45 * 86400000).toISOString(),
    proxima_manutencao: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cliente: DEMO_CLIENTS[0],
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    qr_code: "DHE-0003",
    cliente_id: "22222222-2222-2222-2222-222222222222",
    empresa: "Metalúrgica Sul",
    nome: "Guindaste Hidráulico",
    patrimonio: "PAT-003",
    marca: "Liebherr",
    modelo: "GH-50",
    numero_serie: "SN-2021-112",
    ano: 2021,
    localizacao: "Pátio Externo",
    status: "operando",
    ultima_inspecao: new Date(Date.now() - 7 * 86400000).toISOString(),
    proxima_manutencao: new Date(Date.now() + 23 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cliente: DEMO_CLIENTS[1],
  },
];

let demoInspections: Inspection[] = [
  {
    id: "77777777-7777-7777-7777-777777777777",
    equipamento_id: "44444444-4444-4444-4444-444444444444",
    tecnico_id: DEMO_USER.id,
    nivel_oleo: 75,
    contaminacao_oleo: "baixa",
    data_ultima_limpeza: "2025-12-01",
    complemento: "Equipamento em bom estado. Sem vazamentos detectados.",
    checklist: {
      vazamentos: false,
      mangueiras: true,
      cilindros: true,
      motor: true,
      bomba: true,
      pressao: true,
      temperatura: true,
      filtros: true,
      ruidos: false,
      acoplamentos: true,
    },
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    tecnico: DEMO_USER,
    fotos: [],
  },
];

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    usuario_id: DEMO_USER.id,
    equipamento_id: "55555555-5555-5555-5555-555555555555",
    tipo: "manutencao_vencida",
    titulo: "Manutenção vencida",
    mensagem: "Injetora Hidráulica (DHE-0002) está com manutenção vencida há 5 dias.",
    lida: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "notif-2",
    usuario_id: DEMO_USER.id,
    equipamento_id: "55555555-5555-5555-5555-555555555555",
    tipo: "oleo_contaminado",
    titulo: "Óleo contaminado",
    mensagem: "Última inspeção da Injetora Hidráulica indicou contaminação alta.",
    lida: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const demoData = {
  async login(email: string, _password: string): Promise<User> {
    await delay(800);
    if (email === "tecnico@dhepr.com.br" || email.includes("@")) {
      return { ...DEMO_USER, email };
    }
    throw new Error("Credenciais inválidas");
  },

  async getDashboardStats(): Promise<DashboardStats> {
    await delay(400);
    const today = new Date().toDateString();
    const inspecoesHoje = demoInspections.filter(
      (i) => new Date(i.created_at).toDateString() === today
    ).length;

    return {
      equipamentos_cadastrados: DEMO_EQUIPMENTS.length,
      inspecoes_realizadas: demoInspections.length,
      pendencias: DEMO_EQUIPMENTS.filter(
        (e) => e.proxima_manutencao && new Date(e.proxima_manutencao) < new Date()
      ).length,
      proximas_manutencoes: DEMO_EQUIPMENTS.filter(
        (e) =>
          e.proxima_manutencao &&
          new Date(e.proxima_manutencao) > new Date() &&
          new Date(e.proxima_manutencao) < new Date(Date.now() + 30 * 86400000)
      ).length,
      inspecoes_hoje: inspecoesHoje,
    };
  },

  async getEquipments(): Promise<Equipment[]> {
    await delay(400);
    return DEMO_EQUIPMENTS;
  },

  async getEquipmentByQrCode(qrCode: string): Promise<Equipment | null> {
    await delay(500);
    return DEMO_EQUIPMENTS.find((e) => e.qr_code === qrCode) ?? null;
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    await delay(400);
    return DEMO_EQUIPMENTS.find((e) => e.id === id) ?? null;
  },

  async getClients(): Promise<Client[]> {
    await delay(400);
    return DEMO_CLIENTS;
  },

  async getClientById(id: string): Promise<Client | null> {
    await delay(300);
    return DEMO_CLIENTS.find((c) => c.id === id) ?? null;
  },

  async getInspectionsByEquipment(equipmentId: string): Promise<Inspection[]> {
    await delay(400);
    return demoInspections
      .filter((i) => i.equipamento_id === equipmentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getInspectionById(id: string): Promise<Inspection | null> {
    await delay(300);
    return demoInspections.find((i) => i.id === id) ?? null;
  },

  async createInspection(data: {
    equipamento_id: string;
    tecnico_id: string;
    nivel_oleo: number;
    contaminacao_oleo: OilContamination;
    data_ultima_limpeza?: string;
    complemento?: string;
    checklist: ChecklistItem;
  }): Promise<Inspection> {
    await delay(600);
    const inspection: Inspection = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      tecnico: DEMO_USER,
      fotos: [],
    };
    demoInspections = [inspection, ...demoInspections];

    const eq = DEMO_EQUIPMENTS.find((e) => e.id === data.equipamento_id);
    if (eq) {
      eq.ultima_inspecao = inspection.created_at;
    }

    return inspection;
  },

  async getNotifications(): Promise<Notification[]> {
    await delay(300);
    return DEMO_NOTIFICATIONS;
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(200);
    const notif = DEMO_NOTIFICATIONS.find((n) => n.id === id);
    if (notif) notif.lida = true;
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
