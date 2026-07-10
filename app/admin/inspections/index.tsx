import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, Pencil, Trash2 } from "lucide-react-native";
import {
  BackHeader,
  Card,
  EmptyState,
  ErrorState,
  FilterDropdown,
  InspectionDetailContent,
  Loading,
  PageContainer,
  SelectField,
} from "@/components";
import { useAllInspections, useUsers, useRequireAdmin } from "@/hooks";
import { feedback } from "@/services/feedback";
import { api } from "@/services/api";
import type { Inspection, OilContamination } from "@/types";
import { formatDateTime, getApiErrorMessage } from "@/utils";
import { colors } from "@/theme";

type PeriodFilter = "all" | "30d" | "90d";
type ContaminationFilter = "all" | OilContamination;

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

export default function AdminInspectionsScreen() {
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: users } = useUsers();

  const [tecnicoId, setTecnicoId] = useState("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [contaminationFilter, setContaminationFilter] = useState<ContaminationFilter>("all");

  const filters = useMemo(
    () => ({
      tecnico_id: tecnicoId,
      period: periodFilter,
      contamination: contaminationFilter,
    }),
    [tecnicoId, periodFilter, contaminationFilter]
  );

  const { data: inspections, isLoading, error, refetch } = useAllInspections(filters);

  const userOptions = useMemo(
    () => [
      { id: "all", label: "Todos os funcionários" },
      ...(users?.map((user) => ({ id: user.id, label: user.nome })) ?? []),
    ],
    [users]
  );

  const activeFilterCount = [
    tecnicoId !== "all",
    periodFilter !== "all",
    contaminationFilter !== "all",
  ].filter(Boolean).length;

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
      await api.deleteInspection(inspection.id);
      feedback.toast.success("Inspeção removida.");
      await refetch();
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao remover inspeção."));
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <BackHeader fallback="/(tabs)/manage" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Inspeções</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Todas as inspeções realizadas pelos funcionários
          </Text>

          <SelectField
            label="Funcionário"
            value={tecnicoId}
            options={userOptions}
            onChange={setTecnicoId}
          />

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xs text-dhe-textMuted">
              {inspections?.length ?? 0} inspeção(ões)
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
              ]}
            />
          </View>

          {(inspections?.length ?? 0) === 0 ? (
            <EmptyState
              title="Nenhuma inspeção encontrada"
              description="Ajuste os filtros ou aguarde novos registros."
            />
          ) : (
            inspections?.map((inspection, index) => (
              <Card key={inspection.id} className="mb-5">
                <View className="mb-4 flex-row items-center justify-between border-b border-dhe-border pb-3">
                  <View className="min-w-0 flex-1 pr-3">
                    <Text className="text-xs font-bold uppercase tracking-wide text-dhe-primary">
                      #{(inspections?.length ?? 0) - index}
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-dhe-text" numberOfLines={1}>
                      {inspection.tecnico?.nome ?? "Técnico"}
                    </Text>
                    <Text className="mt-1 text-xs text-dhe-textMuted">
                      {formatDateTime(inspection.created_at)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap justify-end gap-2">
                    <Pressable
                      onPress={() => router.push(`/inspection/${inspection.id}`)}
                      className="flex-row items-center rounded-full bg-dhe-elevated px-3 py-1.5"
                    >
                      <Eye size={14} color={colors.primary} />
                      <Text className="ml-1 text-xs font-bold text-dhe-primary">Ver</Text>
                    </Pressable>
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
                  </View>
                </View>
                <InspectionDetailContent inspection={inspection} />
              </Card>
            ))
          )}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
