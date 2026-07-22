import type {
  ChangePasswordInput,
  ClientInput,
  CreateInspectionInput,
  CreateUserInput,
  EquipmentInput,
  UpdateInspectionInput,
  UpdateProfileInput,
  UpdateUserInput,
  Client,
  DashboardStats,
  Equipment,
  Inspection,
  InspectionFilters,
  InspectionPhoto,
  Notification,
  User,
  DailyRoute,
} from "@/types";
import { generateId } from "@/utils/id";

const DEMO_USER: User = {
  id: "33333333-3333-3333-3333-333333333333",
  email: "tecnico@dhepr.com.br",
  nome: "João Silva",
  cargo: "Técnico Hidráulico",
  empresa: "DHE Componentes Hidráulicos",
  role: "tecnico",
  created_at: new Date().toISOString(),
};

const DEMO_ADMIN: User = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  email: "admin@dhepr.com.br",
  nome: "Administrador DHE",
  cargo: "Administrador",
  empresa: "DHE Componentes Hidráulicos",
  role: "admin",
  created_at: new Date().toISOString(),
};

let demoSessionUser: User = DEMO_USER;

let demoUsers: User[] = [DEMO_ADMIN, DEMO_USER];

function nextDemoQrCode(): string {
  const numbers = demoEquipments
    .map((e) => {
      const match = e.qr_code.match(/^DHE-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `DHE-${String(next).padStart(4, "0")}`;
}

let demoClients: Client[] = [
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

let demoEquipments: Equipment[] = [
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
    cliente: demoClients[0],
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
    cliente: demoClients[0],
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
    cliente: demoClients[1],
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
  {
    id: "88888888-8888-8888-8888-888888888888",
    equipamento_id: "55555555-5555-5555-5555-555555555555",
    tecnico_id: DEMO_USER.id,
    nivel_oleo: 40,
    contaminacao_oleo: "alta",
    data_ultima_limpeza: "2025-10-01",
    complemento: "Óleo com contaminacao elevada. Recomendada troca.",
    checklist: {
      vazamentos: true,
      mangueiras: true,
      cilindros: false,
      motor: true,
      bomba: true,
      pressao: false,
      temperatura: true,
      filtros: false,
      ruidos: true,
      acoplamentos: false,
    },
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    tecnico: DEMO_USER,
    fotos: [],
  },
];

let demoNotifications: Notification[] = [];
let demoDailyRoute: DailyRoute | null = null;

function buildDemoNotifications(userId: string): Notification[] {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;
  const notifications: Notification[] = [];

  for (const equipment of demoEquipments) {
    if (equipment.proxima_manutencao && new Date(equipment.proxima_manutencao).getTime() < now) {
      notifications.push({
        id: `notif-maint-${equipment.id}-${userId}`,
        usuario_id: userId,
        equipamento_id: equipment.id,
        tipo: "manutencao_vencida",
        titulo: "Manutenção vencida",
        mensagem: `${equipment.nome} (${equipment.qr_code}) está com manutenção atrasada.`,
        lida: false,
        created_at: new Date().toISOString(),
      });
    }

    if (
      !equipment.ultima_inspecao ||
      new Date(equipment.ultima_inspecao).getTime() < thirtyDaysAgo
    ) {
      notifications.push({
        id: `notif-insp-${equipment.id}-${userId}`,
        usuario_id: userId,
        equipamento_id: equipment.id,
        tipo: "inspecao_pendente",
        titulo: "Inspeção pendente",
        mensagem: `${equipment.nome} (${equipment.qr_code}) está sem inspeção recente.`,
        lida: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  for (const inspection of demoInspections) {
    if (inspection.contaminacao_oleo !== "alta") continue;
    const equipment = demoEquipments.find((e) => e.id === inspection.equipamento_id);
    if (!equipment) continue;

    notifications.push({
      id: `notif-oil-${inspection.id}-${userId}`,
      usuario_id: userId,
      equipamento_id: equipment.id,
      tipo: "oleo_contaminado",
      titulo: "Óleo contaminado",
      mensagem: `${equipment.nome} (${equipment.qr_code}) com contaminação alta na última inspeção.`,
      lida: false,
      created_at: inspection.created_at,
    });
    break;
  }

  return notifications;
}

export const demoData = {
  async login(email: string, password: string): Promise<User> {
    await delay(800);
    const normalized = email.trim().toLowerCase();

    if (normalized === "admin@dhepr.com.br") {
      if (password !== "123456") throw new Error("Credenciais inválidas");
      demoSessionUser = { ...DEMO_ADMIN, email: normalized };
      return demoSessionUser;
    }

    if (normalized === "tecnico@dhepr.com.br") {
      if (password !== "123456") throw new Error("Credenciais inválidas");
      demoSessionUser = { ...DEMO_USER, email: normalized };
      return demoSessionUser;
    }

    if (normalized.includes("@")) {
      demoSessionUser = { ...DEMO_USER, email: normalized };
      return demoSessionUser;
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
      equipamentos_cadastrados: demoEquipments.length,
      inspecoes_realizadas: demoInspections.length,
      pendencias: demoEquipments.filter(
        (e) => e.proxima_manutencao && new Date(e.proxima_manutencao) < new Date()
      ).length,
      proximas_manutencoes: demoEquipments.filter(
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
    return demoEquipments;
  },

  async getEquipmentByQrCode(qrCode: string): Promise<Equipment | null> {
    await delay(500);
    return demoEquipments.find((e) => e.qr_code === qrCode) ?? null;
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    await delay(400);
    return demoEquipments.find((e) => e.id === id) ?? null;
  },

  async getClients(): Promise<Client[]> {
    await delay(400);
    return demoClients;
  },

  async getClientById(id: string): Promise<Client | null> {
    await delay(300);
    return demoClients.find((c) => c.id === id) ?? null;
  },

  async getInspectionsByEquipment(equipmentId: string): Promise<Inspection[]> {
    await delay(400);
    return demoInspections
      .filter((i) => i.equipamento_id === equipmentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getMyInspections(): Promise<Inspection[]> {
    await delay(400);
    return demoInspections
      .filter((i) => i.tecnico_id === demoSessionUser.id)
      .map((inspection) => {
        const equipment = demoEquipments.find((e) => e.id === inspection.equipamento_id);
        return equipment ? { ...inspection, equipamento: equipment } : inspection;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getAllInspections(filters: InspectionFilters = {}): Promise<Inspection[]> {
    await delay(400);
    const now = Date.now();

    return demoInspections
      .filter((inspection) => {
        if (filters.tecnico_id && filters.tecnico_id !== "all") {
          if (inspection.tecnico_id !== filters.tecnico_id) return false;
        }

        if (filters.contamination && filters.contamination !== "all") {
          if (inspection.contaminacao_oleo !== filters.contamination) return false;
        }

        if (filters.period === "30d") {
          if (new Date(inspection.created_at).getTime() < now - 30 * 86400000) return false;
        } else if (filters.period === "90d") {
          if (new Date(inspection.created_at).getTime() < now - 90 * 86400000) return false;
        }

        return true;
      })
      .map((inspection) => {
        const equipment = demoEquipments.find((e) => e.id === inspection.equipamento_id);
        const tecnico = demoUsers.find((u) => u.id === inspection.tecnico_id) ?? inspection.tecnico;
        return {
          ...inspection,
          equipamento: equipment,
          tecnico,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getInspectionById(id: string): Promise<Inspection | null> {
    await delay(300);
    const inspection = demoInspections.find((i) => i.id === id);
    if (!inspection) return null;
    const equipamento = demoEquipments.find((e) => e.id === inspection.equipamento_id);
    return { ...inspection, equipamento };
  },

  async createInspection(data: CreateInspectionInput): Promise<Inspection> {
    await delay(600);

    if (!data.data_ultima_limpeza) {
      throw new Error("Data da última limpeza é obrigatória.");
    }
    if (!data.fotos?.some((f) => f.tipo === "antes")) {
      throw new Error("Adicione pelo menos uma foto em Antes.");
    }
    if (!data.assinatura_url) {
      throw new Error("A assinatura do técnico é obrigatória.");
    }
    if (!Object.values(data.checklist).some(Boolean)) {
      throw new Error("Marque pelo menos um item do checklist.");
    }

    const fotos: InspectionPhoto[] =
      data.fotos?.map((foto, index) => ({
        id: `foto-${generateId()}-${index}`,
        inspecao_id: "",
        url: foto.url,
        tipo: foto.tipo,
        created_at: new Date().toISOString(),
      })) ?? [];

    const inspection: Inspection = {
      id: generateId(),
      equipamento_id: data.equipamento_id,
      tecnico_id: data.tecnico_id,
      nivel_oleo: data.nivel_oleo,
      contaminacao_oleo: data.contaminacao_oleo,
      data_ultima_limpeza: data.data_ultima_limpeza,
      complemento: data.complemento,
      checklist: data.checklist,
      assinatura_url: data.assinatura_url,
      created_at: new Date().toISOString(),
      tecnico: DEMO_USER,
      fotos: fotos.map((f) => ({ ...f, inspecao_id: "" })),
    };

    inspection.fotos = fotos.map((f) => ({ ...f, inspecao_id: inspection.id }));
    demoInspections = [inspection, ...demoInspections];

    const eq = demoEquipments.find((e) => e.id === data.equipamento_id);
    if (eq) {
      eq.ultima_inspecao = inspection.created_at;
    }

    return inspection;
  },

  async updateInspection(id: string, data: UpdateInspectionInput): Promise<Inspection> {
    await delay(600);

    const index = demoInspections.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Inspeção não encontrada.");

    if (!data.fotos.some((f) => f.tipo === "antes")) {
      throw new Error("Adicione pelo menos uma foto em Antes.");
    }
    if (!data.assinatura_url) {
      throw new Error("A assinatura do técnico é obrigatória.");
    }
    if (!Object.values(data.checklist).some(Boolean)) {
      throw new Error("Marque pelo menos um item do checklist.");
    }

    const existing = demoInspections[index];
    const fotos: InspectionPhoto[] = data.fotos.map((foto, fotoIndex) => ({
      id: `foto-${generateId()}-${fotoIndex}`,
      inspecao_id: existing.id,
      url: foto.url,
      tipo: foto.tipo,
      created_at: new Date().toISOString(),
    }));

    const updated: Inspection = {
      ...existing,
      nivel_oleo: data.nivel_oleo,
      contaminacao_oleo: data.contaminacao_oleo,
      data_ultima_limpeza: data.data_ultima_limpeza,
      complemento: data.complemento,
      checklist: data.checklist,
      assinatura_url: data.assinatura_url,
      fotos,
    };

    demoInspections = [
      ...demoInspections.slice(0, index),
      updated,
      ...demoInspections.slice(index + 1),
    ];

    return updated;
  },

  async updateProfile(data: UpdateProfileInput): Promise<User> {
    await delay(400);
    const next: User = { ...demoSessionUser };

    if (data.nome) next.nome = data.nome;
    if (data.foto_url) next.foto_url = data.foto_url;

    demoSessionUser = next;
    return { ...demoSessionUser };
  },

  async changePassword(data: ChangePasswordInput): Promise<void> {
    await delay(500);
    if (data.senha_atual !== "123456") {
      throw new Error("Senha atual incorreta");
    }
    if (data.senha_nova.length < 6) {
      throw new Error("A nova senha deve ter pelo menos 6 caracteres");
    }
  },

  async createUser(data: CreateUserInput): Promise<User> {
    await delay(500);
    const user: User = {
      id: generateId(),
      email: data.email,
      nome: data.nome,
      cargo: data.cargo ?? "Técnico",
      empresa: data.empresa ?? "DHE Componentes Hidráulicos",
      role: data.role ?? "tecnico",
      created_at: new Date().toISOString(),
    };
    demoUsers = [...demoUsers, user];
    return user;
  },

  async getUsers(): Promise<User[]> {
    await delay(300);
    return demoUsers;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    await delay(400);
    const index = demoUsers.findIndex((u) => u.id === id);
    if (index < 0) throw new Error("Usuário não encontrado");

    const updated: User = {
      ...demoUsers[index],
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.cargo !== undefined ? { cargo: data.cargo } : {}),
      ...(data.empresa !== undefined ? { empresa: data.empresa } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
    };

    demoUsers = [
      ...demoUsers.slice(0, index),
      updated,
      ...demoUsers.slice(index + 1),
    ];

    if (demoSessionUser.id === id) {
      demoSessionUser = { ...demoSessionUser, ...updated };
    }

    return updated;
  },

  async deleteUser(id: string): Promise<void> {
    await delay(400);
    if (demoSessionUser.id === id) {
      throw new Error("Não é possível excluir o usuário logado.");
    }

    const hasInspections = demoInspections.some((i) => i.tecnico_id === id);
    if (hasInspections) {
      throw new Error("Usuário possui inspeções registradas.");
    }

    const index = demoUsers.findIndex((u) => u.id === id);
    if (index < 0) throw new Error("Usuário não encontrado");

    demoUsers = demoUsers.filter((u) => u.id !== id);
  },

  async createClient(data: ClientInput): Promise<Client> {
    await delay(400);
    const client: Client = {
      id: generateId(),
      nome: data.nome,
      empresa: data.empresa,
      email: data.email,
      telefone: data.telefone,
      created_at: new Date().toISOString(),
    };
    demoClients = [...demoClients, client];
    return client;
  },

  async updateClient(id: string, data: ClientInput): Promise<Client> {
    await delay(400);
    const index = demoClients.findIndex((c) => c.id === id);
    if (index < 0) throw new Error("Cliente não encontrado");

    const updated: Client = {
      ...demoClients[index],
      nome: data.nome,
      empresa: data.empresa,
      email: data.email,
      telefone: data.telefone,
    };

    demoClients = [
      ...demoClients.slice(0, index),
      updated,
      ...demoClients.slice(index + 1),
    ];

    demoEquipments = demoEquipments.map((eq) =>
      eq.cliente_id === id
        ? { ...eq, empresa: data.empresa, cliente: updated }
        : eq
    );

    return updated;
  },

  async deleteClient(id: string): Promise<void> {
    await delay(400);
    const hasEquipments = demoEquipments.some((e) => e.cliente_id === id);
    if (hasEquipments) {
      throw new Error("Cliente possui equipamentos cadastrados.");
    }

    demoClients = demoClients.filter((c) => c.id !== id);
  },

  async getNextQrCode(): Promise<string> {
    await delay(200);
    return nextDemoQrCode();
  },

  async createEquipment(data: EquipmentInput): Promise<Equipment> {
    await delay(500);
    const client = demoClients.find((c) => c.id === data.cliente_id);
    if (!client) throw new Error("Cliente não encontrado");

    const equipment: Equipment = {
      id: generateId(),
      qr_code: nextDemoQrCode(),
      cliente_id: data.cliente_id,
      empresa: client.empresa,
      nome: data.nome,
      patrimonio: data.patrimonio,
      marca: data.marca,
      modelo: data.modelo,
      numero_serie: data.numero_serie,
      ano: data.ano,
      localizacao: data.localizacao,
      tipo: data.tipo,
      status: data.status,
      foto_url: data.foto_url,
      proxima_manutencao: data.proxima_manutencao,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cliente: client,
    };

    demoEquipments = [...demoEquipments, equipment];
    return equipment;
  },

  async updateEquipment(id: string, data: EquipmentInput): Promise<Equipment> {
    await delay(400);
    const index = demoEquipments.findIndex((e) => e.id === id);
    if (index < 0) throw new Error("Equipamento não encontrado");

    const client = demoClients.find((c) => c.id === data.cliente_id);
    if (!client) throw new Error("Cliente não encontrado");

    const updated: Equipment = {
      ...demoEquipments[index],
      cliente_id: data.cliente_id,
      empresa: client.empresa,
      nome: data.nome,
      patrimonio: data.patrimonio,
      marca: data.marca,
      modelo: data.modelo,
      numero_serie: data.numero_serie,
      ano: data.ano,
      localizacao: data.localizacao,
      tipo: data.tipo,
      status: data.status,
      foto_url: data.foto_url,
      proxima_manutencao: data.proxima_manutencao,
      updated_at: new Date().toISOString(),
      cliente: client,
    };

    demoEquipments = [
      ...demoEquipments.slice(0, index),
      updated,
      ...demoEquipments.slice(index + 1),
    ];

    return updated;
  },

  async deleteEquipment(id: string): Promise<void> {
    await delay(400);
    const hasInspections = demoInspections.some((i) => i.equipamento_id === id);
    if (hasInspections) {
      throw new Error("Equipamento possui inspeções registradas.");
    }

    demoEquipments = demoEquipments.filter((e) => e.id !== id);
  },

  async deleteInspection(id: string): Promise<void> {
    await delay(400);
    const inspection = demoInspections.find((i) => i.id === id);
    if (!inspection) throw new Error("Inspeção não encontrada");

    demoInspections = demoInspections.filter((i) => i.id !== id);

    const remaining = demoInspections
      .filter((i) => i.equipamento_id === inspection.equipamento_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const lastDate = remaining[0]?.created_at;

    demoEquipments = demoEquipments.map((eq) =>
      eq.id === inspection.equipamento_id
        ? { ...eq, ultima_inspecao: lastDate, updated_at: new Date().toISOString() }
        : eq
    );
  },

  async getNotifications(): Promise<Notification[]> {
    await delay(300);
    const fresh = buildDemoNotifications(demoSessionUser.id);

    for (const notif of fresh) {
      const existing = demoNotifications.find((n) => n.id === notif.id);
      if (!existing) {
        demoNotifications.push(notif);
      }
    }

    return demoNotifications
      .filter((n) => n.usuario_id === demoSessionUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(200);
    const notif = demoNotifications.find((n) => n.id === id);
    if (notif) notif.lida = true;
  },

  async markAllNotificationsRead(): Promise<void> {
    await delay(200);
    demoNotifications = demoNotifications.map((notif) =>
      notif.usuario_id === demoSessionUser.id ? { ...notif, lida: true } : notif
    );
  },

  async getDashboardCharts() {
    await delay(300);
    return {
      inspecoes_por_mes: [
        { mes: "2026-02", total: 3 },
        { mes: "2026-03", total: 5 },
        { mes: "2026-04", total: 4 },
        { mes: "2026-05", total: 6 },
        { mes: "2026-06", total: 8 },
        { mes: "2026-07", total: 2 },
      ],
      equipamentos_por_status: [
        { status: "operando", total: demoEquipments.filter((e) => e.status === "operando").length },
        { status: "parado", total: demoEquipments.filter((e) => e.status === "parado").length },
        { status: "manutencao", total: demoEquipments.filter((e) => e.status === "manutencao").length },
      ],
      contaminacao_distribuicao: [
        { nivel: "baixa", total: 4 },
        { nivel: "media", total: 2 },
        { nivel: "alta", total: 1 },
      ],
    };
  },

  async searchEquipments(query: string) {
    await delay(300);
    const q = query.toLowerCase();
    return demoEquipments.filter(
      (eq) =>
        eq.qr_code.toLowerCase().includes(q) ||
        eq.patrimonio.toLowerCase().includes(q) ||
        eq.nome.toLowerCase().includes(q) ||
        eq.empresa.toLowerCase().includes(q)
    );
  },

  async getTodayRoute() {
    await delay(300);
    const today = new Date().toISOString().split("T")[0];
    if (!demoDailyRoute || demoDailyRoute.data !== today) {
      demoDailyRoute = {
        id: "demo-route",
        data: today,
        status: "planejada" as const,
        itens: demoEquipments.slice(0, Math.min(5, demoEquipments.length)).map((equipamento, index) => ({
          id: `route-item-${equipamento.id}`,
          ordem: index + 1,
          visitado_em: undefined as string | undefined,
          equipamento,
        })),
      };
    }
    return structuredClone(demoDailyRoute);
  },

  async startTodayRoute() {
    const route = await this.getTodayRoute();
    if (route.status === "concluida") return route;
    demoDailyRoute = { ...route, status: "em_andamento" };
    return structuredClone(demoDailyRoute);
  },

  async visitRouteItem(itemId: string) {
    await delay(200);
    const route = await this.getTodayRoute();
    const visitado_em = new Date().toISOString();
    demoDailyRoute = {
      ...route,
      status: "em_andamento",
      itens: route.itens.map((item) =>
        item.id === itemId ? { ...item, visitado_em } : item
      ),
    };
    const pending = demoDailyRoute.itens.some((item) => !item.visitado_em);
    if (!pending) {
      demoDailyRoute = { ...demoDailyRoute, status: "concluida" };
    }
    return { visitado_em };
  },

  async regenerateTodayRoute() {
    await delay(250);
    demoDailyRoute = null;
    return this.getTodayRoute();
  },

  async getMaintenanceCalendar(from: string, to: string) {
    await delay(300);
    return demoEquipments
      .filter((eq) => eq.proxima_manutencao)
      .map((equipamento) => ({
        id: equipamento.id,
        data: equipamento.proxima_manutencao,
        equipamento,
        atrasada: equipamento.proxima_manutencao
          ? new Date(equipamento.proxima_manutencao) < new Date()
          : false,
      }));
  },

  async getChecklistTemplates() {
    await delay(200);
    return [
      {
        id: "demo-checklist",
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
          { key: "analise_oleo", label: "Análise de óleo", obrigatorio: false },
          { key: "filtragem_oleo", label: "Filtragem de óleo", obrigatorio: false },
          { key: "limpeza_reservatorio", label: "Limpeza de Reservatório", obrigatorio: false },
          { key: "substituicao_filtros", label: "Substituição de filtros", obrigatorio: false },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  async getChecklistTemplate(tipo: string) {
    const templates = await this.getChecklistTemplates();
    return templates.find((t) => t.tipo === tipo) ?? templates[0];
  },

  async updateChecklistTemplate(
    tipo: string,
    payload: { nome: string; itens: Array<{ key: string; label: string; obrigatorio: boolean }> }
  ) {
    await delay(300);
    return {
      id: "demo-checklist",
      tipo,
      nome: payload.nome,
      itens: payload.itens,
    };
  },

  async getAuditLog(entidade: "equipamento" | "cliente", id: string) {
    await delay(200);
    return [
      {
        id: "audit-1",
        entidade,
        entidade_id: id,
        acao: "atualizacao",
        antes: { status: "parado" },
        depois: { status: "operando" },
        created_at: new Date().toISOString(),
        usuario: {
          id: DEMO_ADMIN.id,
          nome: DEMO_ADMIN.nome,
          email: DEMO_ADMIN.email,
        },
      },
    ];
  },

  async exportInspectionsCsv(filters?: {
    tecnico_id?: string;
    contaminacao?: string;
    period?: string;
  }) {
    await delay(300);
    const rows = demoInspections
      .filter((inspection) => {
        if (filters?.tecnico_id && filters.tecnico_id !== "all" && inspection.tecnico_id !== filters.tecnico_id) {
          return false;
        }
        if (
          filters?.contaminacao &&
          filters.contaminacao !== "all" &&
          inspection.contaminacao_oleo !== filters.contaminacao
        ) {
          return false;
        }
        return true;
      })
      .map((inspection) => {
        const equipment = demoEquipments.find((item) => item.id === inspection.equipamento_id);
        const tecnico = demoUsers.find((item) => item.id === inspection.tecnico_id);
        return [
          inspection.id,
          inspection.created_at,
          equipment?.nome ?? "",
          equipment?.qr_code ?? "",
          equipment?.patrimonio ?? "",
          equipment?.localizacao ?? "",
          equipment?.cliente?.empresa ?? equipment?.empresa ?? "",
          tecnico?.nome ?? "",
          String(inspection.nivel_oleo),
          inspection.contaminacao_oleo,
          inspection.data_ultima_limpeza ?? "",
          String(inspection.fotos?.length ?? 0),
          inspection.assinatura_url ? "Sim" : "Não",
          (inspection.complemento ?? "").replace(/"/g, '""'),
        ]
          .map((value) => `"${value}"`)
          .join(",");
      });

    const header =
      "ID,Data,Equipamento,QR Code,Patrimônio,Localização,Cliente,Técnico,Nível óleo (%),Contaminação,Última limpeza,Fotos,Assinatura,Observações";
    return `\uFEFF${[header, ...rows].join("\r\n")}`;
  },

  async exportInspectionsExcel(filters?: {
    tecnico_id?: string;
    contaminacao?: string;
    period?: string;
  }) {
    return this.exportInspectionsCsv(filters);
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
