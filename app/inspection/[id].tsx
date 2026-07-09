import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pencil } from "lucide-react-native";
import {
  Card,
  Loading,
  ErrorState,
  InspectionDetailContent,
  Button,
  BackHeader,
  PageContainer,
} from "@/components";
import { useInspection } from "@/hooks";
import { useAuthStore } from "@/store";
import { formatDateTime, isAdmin } from "@/utils";
import { colors } from "@/theme";

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const admin = isAdmin(user);
  const { data: inspection, isLoading, error, refetch } = useInspection(id);

  if (isLoading) return <Loading fullScreen />;
  if (error || !inspection) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <PageContainer>
          <BackHeader />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Detalhes da Inspeção</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            {formatDateTime(inspection.created_at)} • {inspection.tecnico?.nome}
          </Text>

          {admin && (
            <View className="mb-4">
              <Button
                title="Editar inspeção"
                variant="outline"
                size="sm"
                icon={<Pencil size={16} color={colors.primary} />}
                onPress={() => router.push(`/inspection/edit/${inspection.id}`)}
              />
            </View>
          )}

          <Card className="mb-8">
            <InspectionDetailContent inspection={inspection} showHeader={false} />
          </Card>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
