import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import {
  Card,
  Loading,
  ErrorState,
  EmptyState,
  InspectionDetailContent,
  RefreshableScrollView,
} from "@/components";
import { useInspections, useEquipment } from "@/hooks";
import type { Inspection, OilContamination } from "@/types";
import { colors } from "@/theme";

type PeriodFilter = "all" | "30d" | "90d";
type ContaminationFilter = "all" | OilContamination;
type MediaFilter = "all" | "photos" | "signature";

const PERIOD_OPTIONS: { id: PeriodFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
];

const CONTAMINATION_OPTIONS: { id: ContaminationFilter; label: string }[] = [
  { id: "all", label: "Contaminação" },
  { id: "baixa", label: "Baixa" },
  { id: "media", label: "Média" },
  { id: "alta", label: "Alta" },
];

const MEDIA_OPTIONS: { id: MediaFilter; label: string }[] = [
  { id: "all", label: "Mídia" },
  { id: "photos", label: "Com fotos" },
  { id: "signature", label: "Com assinatura" },
];

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full px-4 py-2 ${
        active ? "bg-dhe-primary" : "bg-dhe-elevated"
      }`}
    >
      <Text className={`text-xs font-bold ${active ? "text-dhe-bg" : "text-dhe-textSecondary"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

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
  const { data: equipment, refetch: refetchEquipment } = useEquipment(id);
  const { data: inspections, isLoading, error, refetch } = useInspections(id);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [contaminationFilter, setContaminationFilter] = useState<ContaminationFilter>("all");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");

  const filteredInspections = useMemo(
    () => filterInspections(inspections ?? [], periodFilter, contaminationFilter, mediaFilter),
    [inspections, periodFilter, contaminationFilter, mediaFilter]
  );

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchEquipment()]);
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <View className="px-5 pt-2">
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center">
          <ArrowLeft size={20} color={colors.text} />
          <Text className="ml-2 text-dhe-text">Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-text">Histórico</Text>
        <Text className="mb-2 text-sm text-dhe-textSecondary">
          {equipment?.nome ?? "Equipamento"}
        </Text>
        <Text className="mb-4 text-xs text-dhe-textMuted">
          {filteredInspections.length} de {inspections?.length ?? 0} inspeção(ões)
        </Text>

        <View className="mb-3">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-dhe-textMuted">
            Período
          </Text>
          <View className="flex-row flex-wrap">
            {PERIOD_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.id}
                label={opt.label}
                active={periodFilter === opt.id}
                onPress={() => setPeriodFilter(opt.id)}
              />
            ))}
          </View>
        </View>

        <View className="mb-3">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-dhe-textMuted">
            Contaminação
          </Text>
          <View className="flex-row flex-wrap">
            {CONTAMINATION_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.id}
                label={opt.label}
                active={contaminationFilter === opt.id}
                onPress={() => setContaminationFilter(opt.id)}
              />
            ))}
          </View>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-dhe-textMuted">
            Mídia
          </Text>
          <View className="flex-row flex-wrap">
            {MEDIA_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.id}
                label={opt.label}
                active={mediaFilter === opt.id}
                onPress={() => setMediaFilter(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <RefreshableScrollView
        className="flex-1 px-5 pb-8"
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
      >
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
              </View>
              <InspectionDetailContent inspection={inspection} />
            </Card>
          ))
        )}
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
