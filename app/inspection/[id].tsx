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
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center pt-2">
          <ArrowLeft size={20} color={colors.text} />
          <Text className="ml-2 text-dhe-text">Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-text">Detalhes da Inspeção</Text>
        <Text className="mb-6 text-sm text-dhe-textSecondary">
          {formatDateTime(inspection.created_at)} • {inspection.tecnico?.nome}
        </Text>

        <Card className="mb-4">
          <View className="mb-3 flex-row justify-between">
            <Text className="text-sm text-dhe-textMuted">Nível do óleo</Text>
            <Text className="text-sm font-bold text-dhe-primary">{inspection.nivel_oleo}%</Text>
          </View>
          <View className="mb-3 flex-row justify-between">
            <Text className="text-sm text-dhe-textMuted">Contaminação</Text>
            <Text
              className="text-sm font-bold"
              style={{ color: getContaminationColor(inspection.contaminacao_oleo) }}
            >
              {getContaminationLabel(inspection.contaminacao_oleo)}
            </Text>
          </View>
          {inspection.data_ultima_limpeza && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-dhe-textMuted">Última limpeza</Text>
              <Text className="text-sm font-medium text-dhe-text">
                {inspection.data_ultima_limpeza}
              </Text>
            </View>
          )}
        </Card>

        {inspection.complemento && (
          <Card className="mb-4">
            <Text className="mb-2 text-sm font-bold text-dhe-text">Observações</Text>
            <Text className="text-sm leading-6 text-dhe-textSecondary">{inspection.complemento}</Text>
          </Card>
        )}

        <Card className="mb-8">
          <Text className="mb-3 text-sm font-bold text-dhe-text">Checklist</Text>
          {(Object.keys(CHECKLIST_LABELS) as Array<keyof ChecklistItem>).map((key: keyof ChecklistItem) => (
            <View key={key} className="mb-2 flex-row items-center">
              <Text className="mr-2">{inspection.checklist[key] ? "✅" : "⬜"}</Text>
              <Text className="text-sm text-dhe-text">{CHECKLIST_LABELS[key]}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
