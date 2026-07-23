import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { InspectionForm, Loading, BackHeader, PageContainer, Button, ErrorState } from "@/components";
import { useEquipment, useInspection, useResponsive } from "@/hooks";
import { useAuthStore } from "@/store";
import { canManageInspection } from "@/utils";

export default function EditInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { horizontalPadding } = useResponsive();
  const { data: inspection, isLoading: loadingInspection, error, refetch } = useInspection(id);
  const { data: equipment, isLoading: loadingEquipment } = useEquipment(
    inspection?.equipamento_id ?? ""
  );

  if (loadingInspection || (inspection && loadingEquipment)) return <Loading fullScreen />;
  if (error || !inspection) return <ErrorState onRetry={refetch} />;

  if (!canManageInspection(user, inspection.tecnico_id)) {
    return (
      <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
        <PageContainer style={{ paddingHorizontal: horizontalPadding, paddingTop: 8 }}>
          <BackHeader fallback={`/inspection/${inspection.id}`} />
          <View className="mt-10 items-center px-4">
            <Text className="mb-2 text-center text-lg font-bold text-dhe-text">
              Sem permissão
            </Text>
            <Text className="mb-6 text-center text-sm text-dhe-textSecondary">
              Você só pode editar inspeções que você mesmo registrou.
            </Text>
            <Button
              title="Voltar"
              onPress={() => router.replace(`/inspection/${inspection.id}`)}
              fullWidth
            />
          </View>
        </PageContainer>
      </SafeAreaView>
    );
  }

  if (!equipment) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <PageContainer style={{ paddingHorizontal: horizontalPadding, paddingTop: 8 }}>
        <BackHeader fallback={`/inspection/${inspection.id}`} />
      </PageContainer>

      <InspectionForm
        mode="edit"
        equipmentId={equipment.id}
        equipmentName={equipment.nome}
        inspection={inspection}
        onSaved={() => router.replace(`/inspection/${inspection.id}`)}
      />
    </SafeAreaView>
  );
}
