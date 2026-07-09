import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { InspectionForm, Loading } from "@/components";
import { useEquipment, useInspection } from "@/hooks";
import { colors } from "@/theme";

export default function EditInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: inspection, isLoading: loadingInspection } = useInspection(id);
  const { data: equipment, isLoading: loadingEquipment } = useEquipment(
    inspection?.equipamento_id ?? ""
  );

  if (loadingInspection || loadingEquipment || !inspection || !equipment) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <Pressable onPress={() => router.back()} className="mb-2 flex-row items-center px-5 pt-2">
        <ArrowLeft size={20} color={colors.text} />
        <Text className="ml-2 text-dhe-text">Voltar</Text>
      </Pressable>

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
