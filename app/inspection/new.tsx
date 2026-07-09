import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Button, Card, Input, Loading } from "@/components";
import { useCreateInspection, useEquipment } from "@/hooks";
import { useAuthStore } from "@/store";
import { CHECKLIST_LABELS, DEFAULT_CHECKLIST, getApiErrorMessage } from "@/utils";
import type { ChecklistItem, OilContamination } from "@/types";
import { colors } from "@/theme";

const CONTAMINATION_OPTIONS: { value: OilContamination; label: string; color: string }[] = [
  { value: "baixa", label: "Baixa", color: colors.success },
  { value: "media", label: "Média", color: colors.warning },
  { value: "alta", label: "Alta", color: colors.danger },
];

export default function NewInspectionScreen() {
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: equipment } = useEquipment(equipmentId);
  const createInspection = useCreateInspection();

  const [nivelOleo, setNivelOleo] = useState(75);
  const [contaminacao, setContaminacao] = useState<OilContamination>("baixa");
  const [dataLimpeza, setDataLimpeza] = useState("");
  const [complemento, setComplemento] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem>({ ...DEFAULT_CHECKLIST });

  const toggleChecklist = (key: keyof ChecklistItem) => {
    setChecklist((prev: ChecklistItem) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user || !equipmentId) return;

    try {
      await createInspection.mutateAsync({
        equipamento_id: equipmentId,
        tecnico_id: user.id,
        nivel_oleo: nivelOleo,
        contaminacao_oleo: contaminacao,
        data_ultima_limpeza: dataLimpeza || undefined,
        complemento: complemento || undefined,
        checklist,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/equipment/${equipmentId}`);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Erro ao salvar",
        getApiErrorMessage(error, "Não foi possível salvar a inspeção. Tente novamente.")
      );
    }
  };

  if (!equipment) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center pt-2">
          <ArrowLeft size={20} color={colors.text} />
          <Text className="ml-2 text-dhe-text">Voltar</Text>
        </Pressable>

        <Text className="mb-1 text-2xl font-bold text-dhe-text">Nova Inspeção</Text>
        <Text className="mb-6 text-sm text-dhe-textSecondary">{equipment.nome}</Text>

        <Card className="mb-4">
          <Text className="mb-3 text-sm font-bold text-dhe-text">
            Nível do óleo: {nivelOleo}%
          </Text>
          <View className="flex-row gap-2">
            {[0, 25, 50, 75, 100].map((val) => (
              <Pressable
                key={val}
                onPress={() => setNivelOleo(val)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  nivelOleo === val ? "bg-dhe-primary" : "bg-dhe-elevated"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    nivelOleo === val ? "text-dhe-bg" : "text-dhe-textSecondary"
                  }`}
                >
                  {val}%
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-4 h-3 overflow-hidden rounded-full bg-dhe-elevated">
            <View
              className="h-full rounded-full bg-dhe-primary"
              style={{ width: `${nivelOleo}%` }}
            />
          </View>
        </Card>

        <Card className="mb-4">
          <Text className="mb-3 text-sm font-bold text-dhe-text">Contaminação do óleo</Text>
          <View className="flex-row gap-2">
            {CONTAMINATION_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setContaminacao(opt.value)}
                className="flex-1 items-center rounded-xl py-3"
                style={{
                  backgroundColor:
                    contaminacao === opt.value ? `${opt.color}20` : colors.elevated,
                  borderWidth: contaminacao === opt.value ? 2 : 0,
                  borderColor: opt.color,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: contaminacao === opt.value ? opt.color : colors.textMuted,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Input
          label="Data da última limpeza do reservatório"
          value={dataLimpeza}
          onChangeText={setDataLimpeza}
          placeholder="DD/MM/AAAA"
        />

        <Input
          label="Complemento / Observações"
          value={complemento}
          onChangeText={setComplemento}
          placeholder="Ex: Vazamento no cilindro X"
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />

        <Card className="mb-4">
          <Text className="mb-3 text-sm font-bold text-dhe-text">Checklist</Text>
          {(Object.keys(CHECKLIST_LABELS) as Array<keyof ChecklistItem>).map((key: keyof ChecklistItem) => (
            <Pressable
              key={key}
              onPress={() => toggleChecklist(key)}
              className="mb-2 flex-row items-center rounded-xl bg-dhe-elevated px-4 py-3"
            >
              <View
                className={`mr-3 h-6 w-6 items-center justify-center rounded-md border-2 ${
                  checklist[key]
                    ? "border-dhe-primary bg-dhe-primary"
                    : "border-dhe-border bg-dhe-card"
                }`}
              >
                {checklist[key] && <Text className="text-xs font-bold text-dhe-bg">✓</Text>}
              </View>
              <Text className="text-base text-dhe-text">{CHECKLIST_LABELS[key]}</Text>
            </Pressable>
          ))}
        </Card>

        <Button
          title="Salvar inspeção"
          onPress={handleSave}
          loading={createInspection.isPending}
          fullWidth
          size="lg"
          icon={<Save size={20} color={colors.bg} />}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
