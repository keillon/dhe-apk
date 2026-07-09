import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { InspectionForm, Loading, BackHeader, PageContainer } from "@/components";
import { useEquipment } from "@/hooks";

export default function NewInspectionScreen() {
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const router = useRouter();
  const { data: equipment } = useEquipment(equipmentId);

  if (!equipment) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <PageContainer className="px-5 pt-2">
        <BackHeader fallback={`/equipment/${equipmentId}`} />
      </PageContainer>

      <InspectionForm
        mode="create"
        equipmentId={equipmentId}
        equipmentName={equipment.nome}
        onSaved={() => router.replace(`/equipment/${equipmentId}`)}
      />
    </SafeAreaView>
  );
}
