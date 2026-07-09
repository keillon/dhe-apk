import { SafeAreaView } from "react-native-safe-area-context";
import { InspectionForm, Loading, BackHeader, PageContainer } from "@/components";
import { useEquipment, useInspection, useRequireAdmin } from "@/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function EditInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: inspection, isLoading: loadingInspection } = useInspection(id);
  const { data: equipment, isLoading: loadingEquipment } = useEquipment(
    inspection?.equipamento_id ?? ""
  );

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (loadingInspection || loadingEquipment || !inspection || !equipment) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <PageContainer className="px-5 pt-2">
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
