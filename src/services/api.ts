import { http, isApiConfigured, saveToken, clearToken, saveDemoUser, getDemoUser, getToken, isNetworkError, isNotFoundError } from "./http";
import { demoData } from "./demo-data";
import {
  cacheEquipments,
  getCachedEquipmentById,
  getCachedEquipmentByQr,
  normalizeEquipmentQr,
  upsertEquipmentCache,
} from "./equipment-cache";
import { clearCachedData, getCachedData, setCachedData, StorageKeys } from "./storage";
import type {
  AuditLogEntry,
  ChangePasswordInput,
  ChecklistTemplate,
  Client,
  ClientInput,
  CreateInspectionInput,
  CreateUserInput,
  DailyRoute,
  DashboardCharts,
  DashboardStats,
  Equipment,
  EquipmentInput,
  Inspection,
  InspectionFilters,
  MaintenanceEvent,
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
    setCachedData(StorageKeys.cachedUser, data.user);
    return data.user;
  },

  async logout(): Promise<void> {
    await clearToken();
    clearCachedData(StorageKeys.cachedUser);
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

    const token = await getToken();
    if (!token) return null;

    try {
      const { data } = await http.get<User>("/auth/me", { timeout: 5000 });
      setCachedData(StorageKeys.cachedUser, data);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        return getCachedData<User>(StorageKeys.cachedUser);
      }
      await clearToken();
      clearCachedData(StorageKeys.cachedUser);
      return null;
    }
  },

  async forgotPassword(email: string): Promise<{ dev_reset_url?: string }> {
    if (!isApiConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      return { dev_reset_url: "dhe://reset-password?token=demo-token" };
    }

    const { data } = await http.post<{ message: string; dev_reset_url?: string }>(
      "/auth/forgot-password",
      { email }
    );
    return { dev_reset_url: data.dev_reset_url };
  },

  async resetPassword(email: string): Promise<void> {
    await this.forgotPassword(email);
  },

  async confirmResetPassword(token: string, password: string): Promise<void> {
    if (!isApiConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      return;
    }

    await http.post("/auth/reset-password", { token, password });
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (!isApiConfigured) return demoData.getDashboardStats();

    const { data } = await http.get<DashboardStats>("/dashboard/stats");
    return data;
  },

  async getDashboardCharts(): Promise<DashboardCharts> {
    if (!isApiConfigured) return demoData.getDashboardCharts();

    const { data } = await http.get<DashboardCharts>("/dashboard/charts");
    return data;
  },

  async searchEquipments(query: string): Promise<Equipment[]> {
    if (!isApiConfigured) return demoData.searchEquipments(query);

    const { data } = await http.get<Equipment[]>(
      `/equipments/search?q=${encodeURIComponent(query)}`
    );
    return data;
  },

  async getTodayRoute(): Promise<DailyRoute> {
    if (!isApiConfigured) return demoData.getTodayRoute();

    const { data } = await http.get<DailyRoute>("/daily-routes/today");
    return data;
  },

  async visitRouteItem(itemId: string): Promise<{ visitado_em?: string }> {
    if (!isApiConfigured) return demoData.visitRouteItem(itemId);

    const { data } = await http.patch<{ success: boolean; visitado_em?: string }>(
      `/daily-routes/items/${itemId}/visit`
    );
    return { visitado_em: data.visitado_em };
  },

  async regenerateTodayRoute(): Promise<DailyRoute> {
    if (!isApiConfigured) return demoData.regenerateTodayRoute();

    const { data } = await http.post<DailyRoute>("/daily-routes/regenerate");
    return data;
  },

  async getMaintenanceCalendar(from: string, to: string): Promise<MaintenanceEvent[]> {
    if (!isApiConfigured) return demoData.getMaintenanceCalendar(from, to);

    const params = new URLSearchParams({ from, to });
    const { data } = await http.get<MaintenanceEvent[]>(`/maintenance/calendar?${params}`);
    return data;
  },

  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    if (!isApiConfigured) return demoData.getChecklistTemplates();

    const { data } = await http.get<ChecklistTemplate[]>("/checklists");
    return data;
  },

  async getChecklistTemplate(tipo: string): Promise<ChecklistTemplate> {
    if (!isApiConfigured) return demoData.getChecklistTemplate(tipo);

    const { data } = await http.get<ChecklistTemplate>(`/checklists/${encodeURIComponent(tipo)}`);
    return data;
  },

  async updateChecklistTemplate(
    tipo: string,
    payload: Pick<ChecklistTemplate, "nome" | "itens">
  ): Promise<ChecklistTemplate> {
    if (!isApiConfigured) return demoData.updateChecklistTemplate(tipo, payload);

    const { data } = await http.put<ChecklistTemplate>(`/checklists/${encodeURIComponent(tipo)}`, {
      ...payload,
      tipo,
    });
    return data;
  },

  async getAuditLog(
    entidade: "equipamento" | "cliente",
    id: string
  ): Promise<AuditLogEntry[]> {
    if (!isApiConfigured) return demoData.getAuditLog(entidade, id);

    const { data } = await http.get<AuditLogEntry[]>(`/audit/${entidade}/${id}`);
    return data;
  },

  async exportInspectionsCsv(): Promise<string> {
    if (!isApiConfigured) return demoData.exportInspectionsCsv();

    const { data } = await http.get<string>("/inspections/export", {
      responseType: "text",
    });
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
    setCachedData(StorageKeys.cachedUser, user);
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

  async registerPushToken(token: string, platform?: string): Promise<void> {
    if (!isApiConfigured) return;

    await http.post("/push/register", { token, platform });
  },

  async sendTestPushNotification(title?: string, body?: string): Promise<{
    success: boolean;
    sent: number;
    errors: string[];
  }> {
    if (!isApiConfigured) {
      return { success: false, sent: 0, errors: ["API não configurada"] };
    }

    const { data } = await http.post<{
      success: boolean;
      sent: number;
      errors: string[];
    }>("/push/test", { title, body });

    return data;
  },
};
