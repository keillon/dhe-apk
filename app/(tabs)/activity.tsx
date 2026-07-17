import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Wrench,
  ClipboardCheck,
  ChevronRight,
  Eye,
  History,
} from "lucide-react-native";
import {
  Card,
  StatCard,
  Loading,
  ErrorState,
  EmptyState,
  RefreshableScrollView,
  PageContainer,
} from "@/components";
import { useMyInspections } from "@/hooks";
import { formatDateTime, getContaminationLabel, getContaminationColor, getRouteParam, logger } from "@/utils";
import type { Inspection } from "@/types";
import { colors } from "@/theme";

interface EquipmentListItem {
  id: string;
  nome: string;
  subtitle: string;
}

function getEquipmentItems(inspections: Inspection[]): EquipmentListItem[] {
  const map = new Map<string, EquipmentListItem>();

  for (const inspection of inspections) {
    const equipmentId = getRouteParam(inspection.equipamento?.id ?? inspection.equipamento_id);
    if (!equipmentId || map.has(equipmentId)) continue;

    const equipment = inspection.equipamento;
    map.set(equipmentId, {
      id: equipmentId,
      nome: equipment?.nome ?? "Equipamento",
      subtitle: `${equipment?.cliente?.empresa ?? equipment?.empresa ?? "—"} • ${equipment?.qr_code ?? equipmentId}`,
    });
  }

  return Array.from(map.values());
}

export default function ActivityScreen() {
  const router = useRouter();
  const { data: inspections, isLoading, error, refetch } = useMyInspections();

  const equipments = useMemo(
    () => getEquipmentItems(inspections ?? []),
    [inspections]
  );

  const openEquipment = (equipmentId: string) => {
    logger.info("Activity", `Abrindo equipamento ${equipmentId}`);
    router.push({
      pathname: "/equipment/[id]",
      params: { id: equipmentId },
    });
  };

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentPadding="tab"
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
      >
        <PageContainer>
            <Text className="mb-1 text-2xl font-bold text-dhe-text">Minha atividade</Text>
            <Text className="mb-6 text-sm text-dhe-textSecondary">
              Equipamentos e inspeções que você realizou
            </Text>

            <View className="mb-6 flex-row gap-3">
              <StatCard
                icon={ClipboardCheck}
                label="Inspeções"
                value={inspections?.length ?? 0}
                color={colors.primary}
              />
              <StatCard
                icon={Wrench}
                label="Equipamentos"
                value={equipments.length}
                color={colors.success}
              />
            </View>

            <Text className="mb-3 text-lg font-bold text-dhe-text">Meus equipamentos</Text>

            {equipments.length === 0 ? (
              <Card className="mb-6">
                <EmptyState
                  title="Nenhum equipamento ainda"
                  description="Escaneie um QR Code e registre sua primeira inspeção."
                />
              </Card>
            ) : (
              equipments.map((equipment) => (
                <Pressable
                  key={equipment.id}
                  onPress={() => openEquipment(equipment.id)}
                  className="mb-3"
                >
                  <Card className="flex-row items-center">
                    <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-dhe-primary/20">
                      <Wrench size={22} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-dhe-text">{equipment.nome}</Text>
                      <Text className="mt-1 text-xs text-dhe-textSecondary">
                        {equipment.subtitle}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </Card>
                </Pressable>
              ))
            )}

            <Text className="mb-3 text-lg font-bold text-dhe-text">Meu histórico</Text>

            {(inspections?.length ?? 0) === 0 ? (
              <Card>
                <EmptyState
                  title="Nenhuma inspeção registrada"
                  description="Suas inspeções aparecerão aqui após o primeiro registro."
                />
              </Card>
            ) : (
              inspections?.map((inspection) => (
                <Card key={inspection.id} className="mb-3">
                  <View className="mb-3 flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-bold text-dhe-text">
                        {inspection.equipamento?.nome ?? "Equipamento"}
                      </Text>
                      <Text className="mt-1 text-xs text-dhe-textSecondary">
                        {formatDateTime(inspection.created_at)}
                      </Text>
                    </View>
                    <Text
                      className="text-xs font-bold"
                      style={{ color: getContaminationColor(inspection.contaminacao_oleo) }}
                    >
                      {getContaminationLabel(inspection.contaminacao_oleo)}
                    </Text>
                  </View>

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => router.push(`/inspection/${inspection.id}`)}
                      className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-elevated py-2.5"
                    >
                      <Eye size={14} color={colors.primary} />
                      <Text className="ml-1 text-xs font-bold text-dhe-primary">Ver</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        router.push(`/equipment/history/${inspection.equipamento_id}`)
                      }
                      className="flex-1 flex-row items-center justify-center rounded-xl bg-dhe-primary py-2.5"
                    >
                      <History size={14} color={colors.bg} />
                      <Text className="ml-1 text-xs font-bold text-dhe-bg">Histórico</Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
