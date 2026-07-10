import { useCallback } from "react";
import { BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { InspectionForm, Loading, BackHeader, PageContainer } from "@/components";
import { useEquipment } from "@/hooks";

export default function NewInspectionScreen() {
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const router = useRouter();
  const { data: equipment } = useEquipment(equipmentId);

  const goBackToEquipment = useCallback(() => {
    router.replace(`/equipment/${equipmentId}`);
  }, [equipmentId, router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        goBackToEquipment();
        return true;
      });

      return () => subscription.remove();
    }, [goBackToEquipment])
  );

  if (!equipment) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <PageContainer className="px-5 pt-2">
        <BackHeader
          fallback={`/equipment/${equipmentId}`}
          onBack={goBackToEquipment}
        />
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
