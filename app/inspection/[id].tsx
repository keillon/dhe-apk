import { ScrollView, Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Card, Loading, ErrorState, InspectionDetailContent } from "@/components";
import { useInspection } from "@/hooks";
import { formatDateTime } from "@/utils";
import { colors } from "@/theme";

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

        <Card className="mb-8">
          <InspectionDetailContent inspection={inspection} showHeader={false} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
