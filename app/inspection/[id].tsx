import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Card, Loading, ErrorState } from "@/components";
import { useInspection } from "@/hooks";
import {
  formatDateTime,
  getContaminationColor,
  getContaminationLabel,
  CHECKLIST_LABELS,
} from "@/utils";
import { colors } from "@/theme";
import type { ChecklistItem } from "@/types";

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: inspection, isLoading, error, refetch } = useInspection(id);

  if (isLoading) return <Loading fullScreen />;
  if (error || !inspection) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-surface" edges={["top"]}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center pt-2">
          <ArrowLeft size={20} color={colors.dark} />
          <Text className="ml-2 text-dhe-dark">Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-dark">Detalhes da Inspeção</Text>
        <Text className="mb-6 text-sm text-dhe-muted">
          {formatDateTime(inspection.created_at)} • {inspection.tecnico?.nome}
        </Text>

        <Card className="mb-4">
          <View className="mb-3 flex-row justify-between">
            <Text className="text-sm text-dhe-muted">Nível do óleo</Text>
            <Text className="text-sm font-bold text-dhe-primary">{inspection.nivel_oleo}%</Text>
          </View>
          <View className="mb-3 flex-row justify-between">
            <Text className="text-sm text-dhe-muted">Contaminação</Text>
            <Text
              className="text-sm font-bold"
              style={{ color: getContaminationColor(inspection.contaminacao_oleo) }}
            >
              {getContaminationLabel(inspection.contaminacao_oleo)}
            </Text>
          </View>
          {inspection.data_ultima_limpeza && (
            <View className="mb-3 flex-row justify-between">
              <Text className="text-sm text-dhe-muted">Última limpeza</Text>
              <Text className="text-sm font-medium text-dhe-dark">
                {inspection.data_ultima_limpeza}
              </Text>
            </View>
          )}
        </Card>

        {inspection.complemento && (
          <Card className="mb-4">
            <Text className="mb-2 text-sm font-bold text-dhe-dark">Observações</Text>
            <Text className="text-sm leading-5 text-dhe-muted">{inspection.complemento}</Text>
          </Card>
        )}

        <Card className="mb-8">
          <Text className="mb-3 text-sm font-bold text-dhe-dark">Checklist</Text>
          {(Object.keys(CHECKLIST_LABELS) as Array<keyof ChecklistItem>).map((key: keyof ChecklistItem) => (
            <View key={key} className="mb-2 flex-row items-center">
              <Text className="mr-2">{inspection.checklist[key] ? "✅" : "⬜"}</Text>
              <Text className="text-sm text-dhe-dark">{CHECKLIST_LABELS[key]}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
