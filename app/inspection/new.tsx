import { useCallback, useMemo } from "react";
import { BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { InspectionForm, Loading, BackHeader, PageContainer } from "@/components";
import { useEquipment, useResponsive } from "@/hooks";
import { getInspectionDraft } from "@/services/draft-inspections";
import { getRouteParam } from "@/utils";

export default function NewInspectionScreen() {
  const params = useLocalSearchParams<{ equipmentId?: string | string[]; draftId?: string | string[] }>();
  const equipmentId = getRouteParam(params.equipmentId);
  const draftId = getRouteParam(params.draftId);
  const router = useRouter();
  const { data: equipment } = useEquipment(equipmentId);
  const { horizontalPadding } = useResponsive();

  const draft = useMemo(() => (draftId ? getInspectionDraft(draftId) : null), [draftId]);

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
      <PageContainer style={{ paddingHorizontal: horizontalPadding, paddingTop: 8 }}>
        <BackHeader
          fallback={`/equipment/${equipmentId}`}
          onBack={goBackToEquipment}
        />
      </PageContainer>

      <InspectionForm
        mode="create"
        equipmentId={equipmentId!}
        equipmentName={draft?.equipmentName ?? equipment.nome}
        equipmentTipo={draft?.equipmentTipo ?? equipment.tipo}
        draftId={draft?.id ?? draftId}
        initialDraft={draft?.form}
        onSaved={() => router.replace(`/equipment/${equipmentId}`)}
      />
    </SafeAreaView>
  );
}
