import { http, isApiConfigured, saveToken, clearToken } from "./http";
import { demoData } from "./demo-data";
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

interface LoginResponse {
  token: string;
  user: User;
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    if (!isApiConfigured) {
      return demoData.login(email, password);
    }

    const { data } = await http.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    await saveToken(data.token);
    return data.user;
  },

  async logout(): Promise<void> {
    await clearToken();
  },

  async restoreSession(): Promise<User | null> {
    if (!isApiConfigured) return null;

    try {
      const { data } = await http.get<User>("/auth/me");
      return data;
    } catch {
      await clearToken();
      return null;
    }
  },

  async resetPassword(email: string): Promise<void> {
    if (!isApiConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      return;
    }

    await http.post("/auth/forgot-password", { email });
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (!isApiConfigured) return demoData.getDashboardStats();

    const { data } = await http.get<DashboardStats>("/dashboard/stats");
    return data;
  },

  async getEquipments(): Promise<Equipment[]> {
    if (!isApiConfigured) return demoData.getEquipments();

    const { data } = await http.get<Equipment[]>("/equipments");
    return data;
  },

  async getEquipmentByQrCode(qrCode: string): Promise<Equipment | null> {
    if (!isApiConfigured) return demoData.getEquipmentByQrCode(qrCode);

    try {
      const { data } = await http.get<Equipment>(`/equipments/qr/${encodeURIComponent(qrCode)}`);
      return data;
    } catch {
      return null;
    }
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    if (!isApiConfigured) return demoData.getEquipmentById(id);

    try {
      const { data } = await http.get<Equipment>(`/equipments/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  async getClients(): Promise<Client[]> {
    if (!isApiConfigured) return demoData.getClients();

    const { data } = await http.get<Client[]>("/clients");
    return data;
  },

  async getClientById(id: string): Promise<Client | null> {
    if (!isApiConfigured) return demoData.getClientById(id);

    try {
      const { data } = await http.get<Client>(`/clients/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  async getInspectionsByEquipment(equipmentId: string): Promise<Inspection[]> {
    if (!isApiConfigured) return demoData.getInspectionsByEquipment(equipmentId);

    const { data } = await http.get<Inspection[]>(`/inspections/equipment/${equipmentId}`);
    return data;
  },

  async getInspectionById(id: string): Promise<Inspection | null> {
    if (!isApiConfigured) return demoData.getInspectionById(id);

    try {
      const { data } = await http.get<Inspection>(`/inspections/${id}`);
      return data;
    } catch {
      return null;
    }
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
    if (!isApiConfigured) return demoData.createInspection(data);

    const { data: inspection } = await http.post<Inspection>("/inspections", data);
    return inspection;
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    if (!isApiConfigured) return demoData.getNotifications();

    const { data } = await http.get<Notification[]>("/notifications");
    return data;
  },

  async markNotificationRead(id: string): Promise<void> {
    if (!isApiConfigured) return demoData.markNotificationRead(id);

    await http.patch(`/notifications/${id}/read`);
  },
};
