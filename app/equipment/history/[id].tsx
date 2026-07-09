import { ScrollView, Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Card, Loading, ErrorState, EmptyState, InspectionDetailContent } from "@/components";
import { useInspections, useEquipment } from "@/hooks";
import { colors } from "@/theme";

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: equipment } = useEquipment(id);
  const { data: inspections, isLoading, error, refetch } = useInspections(id);

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
        <Text className="mb-5 text-xs text-dhe-textMuted">
          {inspections?.length ?? 0} inspeção(ões) registrada(s)
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        {inspections?.length === 0 ? (
          <EmptyState
            title="Nenhuma inspeção registrada"
            description="Realize a primeira inspeção deste equipamento."
          />
        ) : (
          inspections?.map((inspection, index) => (
            <Card key={inspection.id} className="mb-5">
              <View className="mb-4 flex-row items-center justify-between border-b border-dhe-border pb-3">
                <Text className="text-xs font-bold uppercase tracking-wide text-dhe-primary">
                  Inspeção #{inspections.length - index}
                </Text>
              </View>
              <InspectionDetailContent inspection={inspection} />
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
