import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { CreateInspectionInput, UpdateInspectionInput } from "@/types";

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

export function useEquipment(id: string) {
  return useQuery({
    queryKey: ["equipment", id],
    queryFn: () => api.getEquipmentById(id),
    enabled: !!id,
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
    },
  });
}
