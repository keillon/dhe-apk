import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { FileText, Save } from "lucide-react-native";
import { Button } from "./Button";
import { Card } from "./Card";
import { DateInput } from "./DateInput";
import { Input } from "./Input";
import { OilLevelSlider } from "./OilLevelSlider";
import { PhotoPickerSection } from "./PhotoPickerSection";
import { SignaturePad } from "./SignaturePad";
import { useCreateInspection, useDefaultChecklist, useNetworkStatus, useUpdateInspection } from "@/hooks";
import { useAuthStore } from "@/store";
import { feedback } from "@/services/feedback";
import { isNetworkError } from "@/services/http";
import { queuePendingInspection, generateClientRequestId } from "@/services/offline-sync";
import { saveInspectionDraft } from "@/services/draft-inspections";
import {
  formatDate,
  getApiErrorMessage,
  validateInspectionForm,
  hasInspectionFormErrors,
  getFirstInspectionError,
  type InspectionFormErrors,
} from "@/utils";
import {
  buildInspectionFotosPayloadAsync,
  countPendingVideos,
  inspectionPhotoToLocal,
} from "@/utils/inspection-media";
import type { ChecklistItem, Inspection, OilContamination } from "@/types";
import type { LocalPhoto } from "@/utils/images";
import { colors } from "@/theme";

const CONTAMINATION_OPTIONS: { value: OilContamination; label: string; color: string }[] = [
  { value: "baixa", label: "Baixa", color: colors.success },
  { value: "media", label: "Média", color: colors.warning },
  { value: "alta", label: "Alta", color: colors.danger },
];

export interface InspectionFormProps {
  mode: "create" | "edit";
  equipmentId: string;
  equipmentName: string;
  equipmentTipo?: string;
  inspection?: Inspection;
  draftId?: string;
  initialDraft?: {
    nivelOleo: number;
    contaminacao: OilContamination;
    dataLimpeza: string;
    complemento: string;
    checklist: ChecklistItem;
    fotosAntes: LocalPhoto[];
    fotosDepois: LocalPhoto[];
    assinatura: string | null;
  };
  onSaved: () => void;
}

function getInitialDate(inspection?: Inspection): string {
  if (!inspection?.data_ultima_limpeza) return "";
  return formatDate(inspection.data_ultima_limpeza);
}

function getInitialPhotos(inspection: Inspection | undefined, tipo: "antes" | "depois"): LocalPhoto[] {
  return (inspection?.fotos ?? []).filter((f) => f.tipo === tipo).map(inspectionPhotoToLocal);
}

export function InspectionForm({
  mode,
  equipmentId,
  equipmentName,
  equipmentTipo,
  inspection,
  draftId,
  initialDraft,
  onSaved,
}: InspectionFormProps) {
  const { user } = useAuthStore();
  const { isOffline } = useNetworkStatus();
  const createInspection = useCreateInspection();
  const updateInspection = useUpdateInspection();
  const savingRef = useRef(false);
  const { template, labels, checklist: defaultChecklist } = useDefaultChecklist(
    equipmentTipo,
    inspection?.checklist ?? initialDraft?.checklist
  );

  const [nivelOleo, setNivelOleo] = useState(
    initialDraft?.nivelOleo ?? inspection?.nivel_oleo ?? 75
  );
  const [contaminacao, setContaminacao] = useState<OilContamination>(
    initialDraft?.contaminacao ?? inspection?.contaminacao_oleo ?? "baixa"
  );
  const [dataLimpeza, setDataLimpeza] = useState(
    initialDraft?.dataLimpeza ?? getInitialDate(inspection)
  );
  const [complemento, setComplemento] = useState(
    initialDraft?.complemento ?? inspection?.complemento ?? ""
  );
  const [checklist, setChecklist] = useState<ChecklistItem>(
    initialDraft?.checklist ?? (inspection?.checklist ? { ...inspection.checklist } : defaultChecklist)
  );
  const [fotosAntes, setFotosAntes] = useState<LocalPhoto[]>(
    initialDraft?.fotosAntes ?? getInitialPhotos(inspection, "antes")
  );
  const [fotosDepois, setFotosDepois] = useState<LocalPhoto[]>(
    initialDraft?.fotosDepois ?? getInitialPhotos(inspection, "depois")
  );
  const [assinatura, setAssinatura] = useState<string | null>(
    initialDraft?.assinatura ?? inspection?.assinatura_url ?? null
  );
  const [formErrors, setFormErrors] = useState<InspectionFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(draftId);

  useEffect(() => {
    if (initialDraft?.checklist || inspection?.checklist) return;
    setChecklist(defaultChecklist);
  }, [defaultChecklist, initialDraft?.checklist, inspection?.checklist]);

  const isSubmitting =
    isSaving || (mode === "create" ? createInspection.isPending : updateInspection.isPending);

  const pendingVideoCount = countPendingVideos(fotosAntes, fotosDepois);

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    if (formErrors.checklist) {
      setFormErrors((prev) => ({ ...prev, checklist: undefined }));
    }
  };

  const handleSaveDraft = async () => {
    const saved = saveInspectionDraft({
      id: currentDraftId,
      equipmentId,
      equipmentName,
      equipmentTipo,
      form: {
        nivelOleo,
        contaminacao,
        dataLimpeza,
        complemento,
        checklist,
        fotosAntes,
        fotosDepois,
        assinatura,
      },
    });
    setCurrentDraftId(saved.id);
    feedback.toast.success("Rascunho salvo no dispositivo.");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

    const confirmed = await feedback.confirm(
      mode === "create" ? "Salvar inspeção?" : "Atualizar inspeção?",
      mode === "create"
        ? "Confirme para registrar a inspeção. Você poderá visualizar e editar depois no histórico."
        : "Confirme para salvar as alterações desta inspeção.",
      mode === "create" ? "Salvar" : "Atualizar"
    );

    if (!confirmed) return;

    savingRef.current = true;
    setIsSaving(true);
    setFormErrors({});

    const pendingVideos = countPendingVideos(fotosAntes, fotosDepois);
    if (pendingVideos > 0) {
      feedback.toast.info(
        `Preparando ${pendingVideos} vídeo(s) para envio. Isso pode levar alguns segundos.`
      );
    }

    let fotosPayload;
    try {
      fotosPayload = await buildInspectionFotosPayloadAsync(fotosAntes, fotosDepois);
    } catch (error) {
      savingRef.current = false;
      setIsSaving(false);
      if (error instanceof Error && error.message === "VIDEO_TOO_LARGE") {
        feedback.toast.error("Um dos vídeos excede 20 MB. Grave ou escolha um vídeo mais curto.");
        return;
      }
      feedback.toast.error("Não foi possível preparar as mídias para envio.");
      return;
    }

    const payload = {
      nivel_oleo: nivelOleo,
      contaminacao_oleo: contaminacao,
      data_ultima_limpeza: dataLimpeza,
      complemento: complemento || undefined,
      checklist,
      fotos: fotosPayload,
      assinatura_url: assinatura!,
    };

    const saveOffline = () => {
      queuePendingInspection(
        {
          equipamento_id: equipmentId,
          tecnico_id: user.id,
          client_request_id: generateClientRequestId(),
          ...payload,
        },
        equipmentName
      );
      feedback.toast.success(
        "Inspeção salva no dispositivo. Será enviada automaticamente quando houver internet."
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    };

    try {
      if (mode === "create") {
        if (isOffline) {
          saveOffline();
          return;
        }

        try {
          await createInspection.mutateAsync({
            equipamento_id: equipmentId,
            tecnico_id: user.id,
            client_request_id: generateClientRequestId(),
            ...payload,
          });
          feedback.toast.success("Inspeção salva com sucesso!");
        } catch (error) {
          if (isNetworkError(error)) {
            saveOffline();
            return;
          }
          throw error;
        }
      } else if (inspection) {
        await updateInspection.mutateAsync({
          id: inspection.id,
          data: payload,
        });
        feedback.toast.success("Inspeção atualizada com sucesso!");
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = getApiErrorMessage(
        error,
        mode === "create"
          ? "Não foi possível salvar a inspeção. Tente novamente."
          : "Não foi possível atualizar a inspeção. Tente novamente."
      );
      feedback.toast.error(message);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 px-5 pb-8"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <Text className="mb-1 text-2xl font-bold text-dhe-text">
        {mode === "create" ? "Nova Inspeção" : "Editar Inspeção"}
      </Text>
      <Text className="mb-2 text-sm text-dhe-textSecondary">{equipmentName}</Text>
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
                backgroundColor: contaminacao === opt.value ? `${opt.color}20` : colors.elevated,
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
        <Text className="mb-1 text-xs text-dhe-textMuted">{template.nome}</Text>
        {formErrors.checklist ? (
          <Text className="mb-3 text-sm text-dhe-danger">{formErrors.checklist}</Text>
        ) : (
          <Text className="mb-3 text-xs text-dhe-textMuted">
            Marque pelo menos um item verificado.
          </Text>
        )}
        {template.itens.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => toggleChecklist(item.key)}
            className="mb-2 flex-row items-center rounded-xl bg-dhe-elevated px-4 py-3"
          >
            <View
              className={`mr-3 h-6 w-6 items-center justify-center rounded-md border-2 ${
                checklist[item.key]
                  ? "border-dhe-primary bg-dhe-primary"
                  : "border-dhe-border bg-dhe-card"
              }`}
            >
              {checklist[item.key] && <Text className="text-xs font-bold text-dhe-bg">✓</Text>}
            </View>
            <Text className="text-base text-dhe-text">{labels[item.key] ?? item.label}</Text>
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

      {mode === "create" ? (
        <Button
          title="Salvar rascunho"
          onPress={() => void handleSaveDraft()}
          variant="secondary"
          fullWidth
          className="mb-3"
          icon={<FileText size={20} color={colors.text} />}
        />
      ) : null}

      <Button
        title={
          isSubmitting
            ? mode === "create"
              ? pendingVideoCount > 0
                ? "Preparando vídeos..."
                : "Salvando inspeção..."
              : "Atualizando inspeção..."
            : mode === "create"
              ? "Salvar inspeção"
              : "Atualizar inspeção"
        }
        onPress={handleSave}
        loading={isSubmitting}
        disabled={isSubmitting}
        fullWidth
        size="lg"
        icon={<Save size={20} color={colors.bg} />}
        className="mb-8"
      />
    </ScrollView>
  );
}
