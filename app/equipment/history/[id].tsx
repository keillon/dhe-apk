import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { Card, Loading, ErrorState, EmptyState } from "@/components";
import { useInspections, useEquipment } from "@/hooks";
import {
  formatDateTime,
  getContaminationColor,
  getContaminationLabel,
} from "@/utils";
import { colors } from "@/theme";

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: equipment } = useEquipment(id);
  const { data: inspections, isLoading, error, refetch } = useInspections(id);

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-surface" edges={["top"]}>
      <View className="px-6 pt-2">
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center">
          <ArrowLeft size={20} color={colors.dark} />
          <Text className="ml-2 text-dhe-dark">Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-dark">Histórico</Text>
        <Text className="mb-4 text-sm text-dhe-muted">
          {equipment?.nome ?? "Equipamento"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {inspections?.length === 0 ? (
          <EmptyState
            title="Nenhuma inspeção registrada"
            description="Realize a primeira inspeção deste equipamento."
          />
        ) : (
          inspections?.map((inspection) => (
            <Pressable
              key={inspection.id}
              onPress={() => router.push(`/inspection/${inspection.id}`)}
            >
              <Card className="mb-3">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-dhe-dark">
                    {formatDateTime(inspection.created_at)}
                  </Text>
                  <ChevronRight size={16} color={colors.muted} />
                </View>
                <Text className="mb-2 text-xs text-dhe-muted">
                  Técnico: {inspection.tecnico?.nome ?? "—"}
                </Text>
                <View className="flex-row gap-4">
                  <Text className="text-xs text-dhe-muted">
                    Óleo: {inspection.nivel_oleo}%
                  </Text>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: getContaminationColor(inspection.contaminacao_oleo) }}
                  >
                    {getContaminationLabel(inspection.contaminacao_oleo)}
                  </Text>
                </View>
                {inspection.complemento && (
                  <Text className="mt-2 text-xs text-dhe-muted" numberOfLines={2}>
                    {inspection.complemento}
                  </Text>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
