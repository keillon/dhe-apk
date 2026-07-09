import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, Pencil, Trash2 } from "lucide-react-native";
import {
  Card,
  Loading,
  ErrorState,
  EmptyState,
  InspectionDetailContent,
  RefreshableScrollView,
  FilterDropdown,
  BackHeader,
  PageContainer,
} from "@/components";
import { useInspections, useEquipment, useDeleteInspection } from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import type { Inspection, OilContamination } from "@/types";
import { getApiErrorMessage, isAdmin } from "@/utils";
import { colors } from "@/theme";

type PeriodFilter = "all" | "30d" | "90d";
type ContaminationFilter = "all" | OilContamination;
type MediaFilter = "all" | "photos" | "signature";

const PERIOD_OPTIONS = [
  { id: "all" as const, label: "Todas" },
  { id: "30d" as const, label: "30 dias" },
  { id: "90d" as const, label: "90 dias" },
];

const CONTAMINATION_OPTIONS = [
  { id: "all" as const, label: "Todas" },
  { id: "baixa" as const, label: "Baixa" },
  { id: "media" as const, label: "Média" },
  { id: "alta" as const, label: "Alta" },
];

const MEDIA_OPTIONS = [
  { id: "all" as const, label: "Todas" },
  { id: "photos" as const, label: "Com fotos" },
  { id: "signature" as const, label: "Com assinatura" },
];

function filterInspections(
  inspections: Inspection[],
  period: PeriodFilter,
  contamination: ContaminationFilter,
  media: MediaFilter
): Inspection[] {
  const now = Date.now();

  return inspections.filter((inspection) => {
    if (period !== "all") {
      const days = period === "30d" ? 30 : 90;
      const cutoff = now - days * 86400000;
      if (new Date(inspection.created_at).getTime() < cutoff) return false;
    }

    if (contamination !== "all" && inspection.contaminacao_oleo !== contamination) {
      return false;
    }

    if (media === "photos" && !(inspection.fotos?.length ?? 0)) return false;
    if (media === "signature" && !inspection.assinatura_url) return false;

    return true;
  });
}

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const admin = isAdmin(user);
  const { data: equipment, refetch: refetchEquipment } = useEquipment(id);
  const { data: inspections, isLoading, error, refetch } = useInspections(id);
  const deleteInspection = useDeleteInspection();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [contaminationFilter, setContaminationFilter] = useState<ContaminationFilter>("all");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");

  const activeFilterCount = [
    periodFilter !== "all",
    contaminationFilter !== "all",
    mediaFilter !== "all",
  ].filter(Boolean).length;

  const filteredInspections = useMemo(
    () => filterInspections(inspections ?? [], periodFilter, contaminationFilter, mediaFilter),
    [inspections, periodFilter, contaminationFilter, mediaFilter]
  );

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchEquipment()]);
  };

  const handleDelete = async (inspection: Inspection) => {
    const confirmed = await feedback.choose(
      "Excluir inspeção",
      "Deseja remover esta inspeção permanentemente?",
      [
        { text: "Cancelar", value: "cancel", style: "cancel" },
        { text: "Excluir", value: "delete", style: "destructive" },
      ]
    );

    if (confirmed !== "delete") return;

    try {
      await deleteInspection.mutateAsync(inspection.id);
      feedback.toast.success("Inspeção removida.");
      await handleRefresh();
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao remover inspeção."));
    }
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <View className="px-5 pt-2">
        <PageContainer>
          <BackHeader fallback={`/equipment/${id}`} />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Histórico</Text>
          <Text className="mb-2 text-sm text-dhe-textSecondary">
            {equipment?.nome ?? "Equipamento"}
          </Text>

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xs text-dhe-textMuted">
              {filteredInspections.length} de {inspections?.length ?? 0} inspeção(ões)
            </Text>
            <FilterDropdown
              activeCount={activeFilterCount}
              groups={[
                {
                  key: "period",
                  title: "Período",
                  options: PERIOD_OPTIONS,
                  value: periodFilter,
                  onChange: (v) => setPeriodFilter(v as PeriodFilter),
                },
                {
                  key: "contamination",
                  title: "Contaminação",
                  options: CONTAMINATION_OPTIONS,
                  value: contaminationFilter,
                  onChange: (v) => setContaminationFilter(v as ContaminationFilter),
                },
                {
                  key: "media",
                  title: "Mídia",
                  options: MEDIA_OPTIONS,
                  value: mediaFilter,
                  onChange: (v) => setMediaFilter(v as MediaFilter),
                },
              ]}
            />
          </View>
        </PageContainer>
      </View>

      <RefreshableScrollView
        className="flex-1 px-5 pb-8"
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
      >
        <PageContainer>
          {filteredInspections.length === 0 ? (
            <EmptyState
              title="Nenhuma inspeção encontrada"
              description="Ajuste os filtros ou realize uma nova inspeção."
            />
          ) : (
            filteredInspections.map((inspection, index) => (
              <Card key={inspection.id} className="mb-5">
                <View className="mb-4 flex-row items-center justify-between border-b border-dhe-border pb-3">
                  <Text className="text-xs font-bold uppercase tracking-wide text-dhe-primary">
                    Inspeção #{filteredInspections.length - index}
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => router.push(`/inspection/${inspection.id}`)}
                      className="flex-row items-center rounded-full bg-dhe-elevated px-3 py-1.5"
                    >
                      <Eye size={14} color={colors.primary} />
                      <Text className="ml-1 text-xs font-bold text-dhe-primary">Ver</Text>
                    </Pressable>
                    {admin && (
                      <>
                        <Pressable
                          onPress={() => router.push(`/inspection/edit/${inspection.id}`)}
                          className="flex-row items-center rounded-full bg-dhe-primary px-3 py-1.5"
                        >
                          <Pencil size={14} color={colors.bg} />
                          <Text className="ml-1 text-xs font-bold text-dhe-bg">Editar</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(inspection)}
                          className="flex-row items-center rounded-full bg-dhe-danger px-3 py-1.5"
                        >
                          <Trash2 size={14} color={colors.bg} />
                          <Text className="ml-1 text-xs font-bold text-dhe-bg">Excluir</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
                <InspectionDetailContent inspection={inspection} />
              </Card>
            ))
          )}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
