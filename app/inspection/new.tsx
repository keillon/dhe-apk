import { useState, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Save } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  Button,
  Card,
  DateInput,
  Input,
  Loading,
  OilLevelSlider,
  PhotoPickerSection,
  SignaturePad,
} from "@/components";
import { useCreateInspection, useEquipment } from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import {
  CHECKLIST_LABELS,
  DEFAULT_CHECKLIST,
  getApiErrorMessage,
  validateInspectionForm,
  hasInspectionFormErrors,
  getFirstInspectionError,
  type InspectionFormErrors,
} from "@/utils";
import type { ChecklistItem, OilContamination } from "@/types";
import type { LocalPhoto } from "@/utils/images";
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
  const savingRef = useRef(false);

  const [nivelOleo, setNivelOleo] = useState(75);
  const [contaminacao, setContaminacao] = useState<OilContamination>("baixa");
  const [dataLimpeza, setDataLimpeza] = useState("");
  const [complemento, setComplemento] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem>({ ...DEFAULT_CHECKLIST });
  const [fotosAntes, setFotosAntes] = useState<LocalPhoto[]>([]);
  const [fotosDepois, setFotosDepois] = useState<LocalPhoto[]>([]);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<InspectionFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const isSubmitting = isSaving || createInspection.isPending;

  const toggleChecklist = (key: keyof ChecklistItem) => {
    setChecklist((prev: ChecklistItem) => ({ ...prev, [key]: !prev[key] }));
    if (formErrors.checklist) {
      setFormErrors((prev) => ({ ...prev, checklist: undefined }));
    }
  };

  const handleSave = async () => {
    if (!user || !equipmentId || isSubmitting || savingRef.current) return;

    const errors = validateInspectionForm({
      dataLimpeza,
      fotosAntesCount: fotosAntes.length,
      fotosDepoisCount: fotosDepois.length,
      assinatura,
      checklist,
    });

    if (hasInspectionFormErrors(errors)) {
      setFormErrors(errors);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      feedback.toast.warning(getFirstInspectionError(errors));
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setFormErrors({});

    const fotos = [
      ...fotosAntes.map((f) => ({ tipo: "antes" as const, url: f.dataUrl })),
      ...fotosDepois.map((f) => ({ tipo: "depois" as const, url: f.dataUrl })),
    ];

    try {
      await createInspection.mutateAsync({
        equipamento_id: equipmentId,
        tecnico_id: user.id,
        nivel_oleo: nivelOleo,
        contaminacao_oleo: contaminacao,
        data_ultima_limpeza: dataLimpeza,
        complemento: complemento || undefined,
        checklist,
        fotos,
        assinatura_url: assinatura!,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      feedback.toast.success("Inspeção salva com sucesso!");
      router.replace(`/equipment/${equipmentId}`);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = getApiErrorMessage(
        error,
        "Não foi possível salvar a inspeção. Tente novamente."
      );
      feedback.toast.error(message);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  if (!equipment) return <Loading fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5 pb-8"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
          <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center pt-2">
            <ArrowLeft size={20} color={colors.text} />
            <Text className="ml-2 text-dhe-text">Voltar</Text>
          </Pressable>

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Nova Inspeção</Text>
          <Text className="mb-2 text-sm text-dhe-textSecondary">{equipment.nome}</Text>
          <Text className="mb-6 text-xs text-dhe-textMuted">
            Campos com * são obrigatórios para salvar.
          </Text>

          <Card className="mb-4">
            <OilLevelSlider value={nivelOleo} onChange={setNivelOleo} />
          </Card>

          <Card className="mb-4">
            <Text className="mb-3 text-sm font-bold text-dhe-text">Contaminação do óleo *</Text>
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

          <DateInput
            label="Data da última limpeza do reservatório *"
            value={dataLimpeza}
            onChangeText={(text) => {
              setDataLimpeza(text);
              if (formErrors.dataLimpeza) {
                setFormErrors((prev) => ({ ...prev, dataLimpeza: undefined }));
              }
            }}
            error={formErrors.dataLimpeza}
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

          <Card className={`mb-4 ${formErrors.checklist ? "border border-dhe-danger" : ""}`}>
            <Text className="mb-1 text-sm font-bold text-dhe-text">Checklist *</Text>
            {formErrors.checklist ? (
              <Text className="mb-3 text-sm text-dhe-danger">{formErrors.checklist}</Text>
            ) : (
              <Text className="mb-3 text-xs text-dhe-textMuted">
                Marque pelo menos um item verificado.
              </Text>
            )}
            {(Object.keys(CHECKLIST_LABELS) as Array<keyof ChecklistItem>).map((key) => (
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

          <Card className="mb-4">
            <PhotoPickerSection
              fotosAntes={fotosAntes}
              fotosDepois={fotosDepois}
              onChangeAntes={(photos) => {
                setFotosAntes(photos);
                if (formErrors.fotosAntes) {
                  setFormErrors((prev) => ({ ...prev, fotosAntes: undefined }));
                }
              }}
              onChangeDepois={(photos) => {
                setFotosDepois(photos);
                if (formErrors.fotosDepois) {
                  setFormErrors((prev) => ({ ...prev, fotosDepois: undefined }));
                }
              }}
              errorAntes={formErrors.fotosAntes}
              errorDepois={formErrors.fotosDepois}
            />
          </Card>

          <Card className="mb-4">
            <SignaturePad
              value={assinatura}
              onChange={(value) => {
                setAssinatura(value);
                if (formErrors.assinatura) {
                  setFormErrors((prev) => ({ ...prev, assinatura: undefined }));
                }
              }}
              error={formErrors.assinatura}
            />
          </Card>

          <Button
            title={isSubmitting ? "Salvando inspeção..." : "Salvar inspeção"}
            onPress={handleSave}
            loading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
            size="lg"
            icon={<Save size={20} color={colors.bg} />}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
