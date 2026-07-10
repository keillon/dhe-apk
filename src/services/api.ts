import { http, isApiConfigured, saveToken, clearToken, saveDemoUser, getDemoUser, getToken, isNetworkError, isNotFoundError } from "./http";
import { demoData } from "./demo-data";
import {
  cacheEquipments,
  getCachedEquipmentById,
  getCachedEquipmentByQr,
  normalizeEquipmentQr,
  upsertEquipmentCache,
} from "./equipment-cache";
import type {
  ChangePasswordInput,
  Client,
  ClientInput,
  CreateInspectionInput,
  CreateUserInput,
  DashboardStats,
  Equipment,
  EquipmentInput,
  Inspection,
  InspectionFilters,
  Notification,
  UpdateInspectionInput,
  UpdateProfileInput,
  UpdateUserInput,
  User,
} from "@/types";

interface LoginResponse {
  token: string;
  user: User;
}

export type EquipmentQrLookupResult =
  | { status: "found"; equipment: Equipment; fromCache: boolean }
  | { status: "not_found" }
  | { status: "offline_not_cached" }
  | { status: "error"; message: string };

export const api = {
  async login(email: string, password: string): Promise<User> {
    if (!isApiConfigured) {
      const user = await demoData.login(email, password);
      await saveToken("demo");
      await saveDemoUser(JSON.stringify(user));
      return user;
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
    if (!isApiConfigured) {
      const token = await getToken();
      if (token !== "demo") return null;
      const raw = await getDemoUser();
      if (!raw) return null;
      try {
        return JSON.parse(raw) as User;
      } catch {
        return null;
      }
    }

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
    cacheEquipments(data);
    return data;
  },

  async lookupEquipmentByQrCode(qrCode: string): Promise<EquipmentQrLookupResult> {
    const normalized = normalizeEquipmentQr(qrCode);

    if (!isApiConfigured) {
      const equipment = await demoData.getEquipmentByQrCode(normalized);
      return equipment
        ? { status: "found", equipment, fromCache: false }
        : { status: "not_found" };
    }

    try {
      const { data } = await http.get<Equipment>(
        `/equipments/qr/${encodeURIComponent(normalized)}`
      );
      upsertEquipmentCache(data);
      return { status: "found", equipment: data, fromCache: false };
    } catch (error) {
      if (isNotFoundError(error)) {
        return { status: "not_found" };
      }

      if (isNetworkError(error)) {
        const cached = getCachedEquipmentByQr(normalized);
        if (cached) {
          return { status: "found", equipment: cached, fromCache: true };
        }
        return { status: "offline_not_cached" };
      }

      return {
        status: "error",
        message: error instanceof Error ? error.message : "Erro ao buscar equipamento.",
      };
    }
  },

  async getEquipmentByQrCode(qrCode: string): Promise<Equipment | null> {
    const result = await this.lookupEquipmentByQrCode(qrCode);
    return result.status === "found" ? result.equipment : null;
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    if (!isApiConfigured) return demoData.getEquipmentById(id);

    try {
      const { data } = await http.get<Equipment>(`/equipments/${id}`);
      upsertEquipmentCache(data);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        return getCachedEquipmentById(id);
      }
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

  async getMyInspections(): Promise<Inspection[]> {
    if (!isApiConfigured) return demoData.getMyInspections();

    const { data } = await http.get<Inspection[]>("/inspections/me");
    return data;
  },

  async getAllInspections(filters: InspectionFilters = {}): Promise<Inspection[]> {
    if (!isApiConfigured) return demoData.getAllInspections(filters);

    const params = new URLSearchParams();
    if (filters.tecnico_id) params.set("tecnico_id", filters.tecnico_id);
    if (filters.period) params.set("period", filters.period);
    if (filters.contamination) params.set("contamination", filters.contamination);

    const query = params.toString();
    const { data } = await http.get<Inspection[]>(
      `/inspections/all${query ? `?${query}` : ""}`
    );
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

  async createInspection(data: CreateInspectionInput): Promise<Inspection> {
    if (!isApiConfigured) return demoData.createInspection(data);

    const { data: inspection } = await http.post<Inspection>("/inspections", data, {
      timeout: 120000,
    });
    return inspection;
  },

  async updateInspection(id: string, data: UpdateInspectionInput): Promise<Inspection> {
    if (!isApiConfigured) return demoData.updateInspection(id, data);

    const { data: inspection } = await http.put<Inspection>(`/inspections/${id}`, data, {
      timeout: 120000,
    });
    return inspection;
  },

  async updateProfile(data: UpdateProfileInput): Promise<User> {
    if (!isApiConfigured) {
      const user = await demoData.updateProfile(data);
      await saveDemoUser(JSON.stringify(user));
      return user;
    }

    const { data: user } = await http.patch<User>("/auth/profile", data, {
      timeout: 60000,
    });
    return user;
  },

  async changePassword(data: ChangePasswordInput): Promise<void> {
    if (!isApiConfigured) return demoData.changePassword(data);

    await http.patch("/auth/password", data);
  },

  async createUser(data: CreateUserInput): Promise<User> {
    if (!isApiConfigured) return demoData.createUser(data);

    const { data: user } = await http.post<User>("/auth/users", data);
    return user;
  },

  async getUsers(): Promise<User[]> {
    if (!isApiConfigured) return demoData.getUsers();

    const { data } = await http.get<User[]>("/auth/users");
    return data;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    if (!isApiConfigured) return demoData.updateUser(id, data);

    const { data: user } = await http.put<User>(`/auth/users/${id}`, data);
    return user;
  },

  async deleteUser(id: string): Promise<void> {
    if (!isApiConfigured) return demoData.deleteUser(id);

    await http.delete(`/auth/users/${id}`);
  },

  async createClient(data: ClientInput): Promise<Client> {
    if (!isApiConfigured) return demoData.createClient(data);

    const { data: client } = await http.post<Client>("/clients", data);
    return client;
  },

  async updateClient(id: string, data: ClientInput): Promise<Client> {
    if (!isApiConfigured) return demoData.updateClient(id, data);

    const { data: client } = await http.put<Client>(`/clients/${id}`, data);
    return client;
  },

  async deleteClient(id: string): Promise<void> {
    if (!isApiConfigured) return demoData.deleteClient(id);

    await http.delete(`/clients/${id}`);
  },

  async getNextQrCode(): Promise<string> {
    if (!isApiConfigured) return demoData.getNextQrCode();

    const { data } = await http.get<{ qr_code: string }>("/equipments/next-qr");
    return data.qr_code;
  },

  async createEquipment(data: EquipmentInput): Promise<Equipment> {
    if (!isApiConfigured) return demoData.createEquipment(data);

    const { data: equipment } = await http.post<Equipment>("/equipments", data, {
      timeout: 120000,
    });
    return equipment;
  },

  async updateEquipment(id: string, data: EquipmentInput): Promise<Equipment> {
    if (!isApiConfigured) return demoData.updateEquipment(id, data);

    const { data: equipment } = await http.put<Equipment>(`/equipments/${id}`, data, {
      timeout: 120000,
    });
    return equipment;
  },

  async deleteEquipment(id: string): Promise<void> {
    if (!isApiConfigured) return demoData.deleteEquipment(id);

    await http.delete(`/equipments/${id}`);
  },

  async deleteInspection(id: string): Promise<void> {
    if (!isApiConfigured) return demoData.deleteInspection(id);

    await http.delete(`/inspections/${id}`);
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

  async markAllNotificationsRead(): Promise<void> {
    if (!isApiConfigured) return demoData.markAllNotificationsRead();

    await http.patch("/notifications/read-all");
  },
};
