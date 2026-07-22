import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { getCachedEquipmentById } from "@/services/equipment-cache";
import { getRouteParam } from "@/utils/route-params";
import type {
  ClientInput,
  CreateInspectionInput,
  CreateUserInput,
  EquipmentInput,
  InspectionFilters,
  Notification,
  UpdateInspectionInput,
  UpdateUserInput,
} from "@/types";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats(),
  });
}

export function useEquipments() {
  return useQuery({
    queryKey: ["equipments"],
    queryFn: () => api.getEquipments(),
  });
}

export function useEquipment(id: string | string[] | undefined) {
  const equipmentId = getRouteParam(id);

  return useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: async () => {
      const equipment = await api.getEquipmentById(equipmentId!);
      if (equipment) return equipment;

      const cached = getCachedEquipmentById(equipmentId!);
      if (cached) return cached;

      throw new Error("Equipamento não encontrado.");
    },
    enabled: !!equipmentId,
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => api.getClients(),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => api.getClientById(id),
    enabled: !!id,
  });
}

export function useInspections(equipmentId: string) {
  return useQuery({
    queryKey: ["inspections", equipmentId],
    queryFn: () => api.getInspectionsByEquipment(equipmentId),
    enabled: !!equipmentId,
    staleTime: 0,
  });
}

export function useMyInspections() {
  return useQuery({
    queryKey: ["my-inspections"],
    queryFn: () => api.getMyInspections(),
    staleTime: 0,
  });
}

export function useAllInspections(filters: InspectionFilters = {}) {
  return useQuery({
    queryKey: ["all-inspections", filters],
    queryFn: () => api.getAllInspections(filters),
    staleTime: 0,
  });
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: ["inspection", id],
    queryFn: () => api.getInspectionById(id),
    enabled: !!id,
  });
}

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => api.getNotifications(userId),
    enabled: !!userId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueriesData<Notification[]>({ queryKey: ["notifications"] });

      queryClient.setQueriesData<Notification[]>({ queryKey: ["notifications"] }, (current) =>
        current?.map((item) => (item.id === id ? { ...item, lida: true } : item))
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueriesData<Notification[]>({ queryKey: ["notifications"] });

      queryClient.setQueriesData<Notification[]>({ queryKey: ["notifications"] }, (current) =>
        current?.map((item) => ({ ...item, lida: true }))
      );

      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInspectionInput) => api.createInspection(data),
    onSuccess: (inspection, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspections", variables.equipamento_id] });
      queryClient.invalidateQueries({ queryKey: ["my-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["inspection", inspection.id] });
      queryClient.invalidateQueries({ queryKey: ["equipment", variables.equipamento_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInspectionInput }) =>
      api.updateInspection(id, data),
    onSuccess: (inspection) => {
      queryClient.invalidateQueries({ queryKey: ["inspections", inspection.equipamento_id] });
      queryClient.invalidateQueries({ queryKey: ["my-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["inspection", inspection.id] });
      queryClient.invalidateQueries({ queryKey: ["equipment", inspection.equipamento_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
  });
}

export function useNextQrCode(enabled = true) {
  return useQuery({
    queryKey: ["next-qr"],
    queryFn: () => api.getNextQrCode(),
    enabled,
    staleTime: 0,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientInput) => api.createClient(data),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", client.id] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientInput }) =>
      api.updateClient(id, data),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EquipmentInput) => api.createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      queryClient.invalidateQueries({ queryKey: ["next-qr"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EquipmentInput }) =>
      api.updateEquipment(id, data),
    onSuccess: (equipment) => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      queryClient.invalidateQueries({ queryKey: ["equipment", equipment.id] });
      queryClient.invalidateQueries({ queryKey: ["next-qr"] });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
      api.deleteEquipment(id, { cascade }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["next-qr"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteInspection(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["all-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["my-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["inspection", id] });
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
