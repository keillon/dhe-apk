import { isSupabaseConfigured, supabase } from "./supabase";
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

export const api = {
  async login(email: string, password: string): Promise<User> {
    if (!isSupabaseConfigured) {
      return demoData.login(email, password);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (userError) throw userError;
    return userData as User;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  async resetPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (!isSupabaseConfigured) return demoData.getDashboardStats();

    const [equipments, inspections, pending] = await Promise.all([
      supabase.from("equipamentos").select("id", { count: "exact", head: true }),
      supabase.from("inspecoes").select("id", { count: "exact", head: true }),
      supabase
        .from("equipamentos")
        .select("id", { count: "exact", head: true })
        .lt("proxima_manutencao", new Date().toISOString()),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("inspecoes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`);

    const { count: upcomingCount } = await supabase
      .from("equipamentos")
      .select("id", { count: "exact", head: true })
      .gt("proxima_manutencao", new Date().toISOString())
      .lt("proxima_manutencao", new Date(Date.now() + 30 * 86400000).toISOString());

    return {
      equipamentos_cadastrados: equipments.count ?? 0,
      inspecoes_realizadas: inspections.count ?? 0,
      pendencias: pending.count ?? 0,
      proximas_manutencoes: upcomingCount ?? 0,
      inspecoes_hoje: todayCount ?? 0,
    };
  },

  async getEquipments(): Promise<Equipment[]> {
    if (!isSupabaseConfigured) return demoData.getEquipments();

    const { data, error } = await supabase
      .from("equipamentos")
      .select("*, cliente:clientes(*)")
      .order("nome");

    if (error) throw error;
    return data as Equipment[];
  },

  async getEquipmentByQrCode(qrCode: string): Promise<Equipment | null> {
    if (!isSupabaseConfigured) return demoData.getEquipmentByQrCode(qrCode);

    const { data, error } = await supabase
      .from("equipamentos")
      .select("*, cliente:clientes(*)")
      .eq("qr_code", qrCode)
      .single();

    if (error) return null;
    return data as Equipment;
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    if (!isSupabaseConfigured) return demoData.getEquipmentById(id);

    const { data, error } = await supabase
      .from("equipamentos")
      .select("*, cliente:clientes(*)")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Equipment;
  },

  async getClients(): Promise<Client[]> {
    if (!isSupabaseConfigured) return demoData.getClients();

    const { data, error } = await supabase.from("clientes").select("*").order("nome");
    if (error) throw error;
    return data as Client[];
  },

  async getClientById(id: string): Promise<Client | null> {
    if (!isSupabaseConfigured) return demoData.getClientById(id);

    const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single();
    if (error) return null;
    return data as Client;
  },

  async getInspectionsByEquipment(equipmentId: string): Promise<Inspection[]> {
    if (!isSupabaseConfigured) return demoData.getInspectionsByEquipment(equipmentId);

    const { data, error } = await supabase
      .from("inspecoes")
      .select("*, tecnico:usuarios(*), fotos(*)")
      .eq("equipamento_id", equipmentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Inspection[];
  },

  async getInspectionById(id: string): Promise<Inspection | null> {
    if (!isSupabaseConfigured) return demoData.getInspectionById(id);

    const { data, error } = await supabase
      .from("inspecoes")
      .select("*, tecnico:usuarios(*), fotos(*)")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Inspection;
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
    if (!isSupabaseConfigured) return demoData.createInspection(data);

    const { data: inspection, error } = await supabase
      .from("inspecoes")
      .insert(data)
      .select("*, tecnico:usuarios(*)")
      .single();

    if (error) throw error;
    return inspection as Inspection;
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    if (!isSupabaseConfigured) return demoData.getNotifications();

    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Notification[];
  },

  async markNotificationRead(id: string): Promise<void> {
    if (!isSupabaseConfigured) return demoData.markNotificationRead(id);

    const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    if (error) throw error;
  },
};
