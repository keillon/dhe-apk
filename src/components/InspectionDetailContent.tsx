import { View, Text } from "react-native";
import type { Inspection } from "@/types";
import type { ChecklistItem } from "@/types";
import {
  formatDate,
  formatDateTime,
  getContaminationColor,
  getContaminationLabel,
  CHECKLIST_LABELS,
} from "@/utils";
import { InspectionGallery } from "./InspectionGallery";
import { colors } from "@/theme";

interface InspectionDetailContentProps {
  inspection: Inspection;
  showHeader?: boolean;
}

function getChecklistLabel(key: string): string {
  return CHECKLIST_LABELS[key as keyof typeof CHECKLIST_LABELS] ?? key;
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="text-sm text-dhe-textMuted">{label}</Text>
      <Text className="text-sm font-semibold" style={{ color: valueColor ?? colors.text }}>
        {value}
      </Text>
    </View>
  );
}

export function InspectionDetailContent({
  inspection,
  showHeader = true,
}: InspectionDetailContentProps) {
  const checklistKeys = Object.keys(inspection.checklist);
  const checklistOk = checklistKeys.filter((key) => inspection.checklist[key]).length;

  return (
    <View>
      {showHeader && (
        <View className="mb-4">
          <Text className="text-base font-bold text-dhe-text">
            {formatDateTime(inspection.created_at)}
          </Text>
          <Text className="mt-1 text-sm text-dhe-textSecondary">
            Técnico: {inspection.tecnico?.nome ?? "—"}
          </Text>
        </View>
      )}

      <View className="mb-4 rounded-2xl bg-dhe-elevated p-4">
        <InfoRow label="Nível do óleo" value={`${inspection.nivel_oleo}%`} valueColor={colors.primary} />
        <View className="mb-3 h-2 overflow-hidden rounded-full bg-dhe-border">
          <View
            className="h-full rounded-full bg-dhe-primary"
            style={{ width: `${inspection.nivel_oleo}%` }}
          />
        </View>
        <InfoRow
          label="Contaminação do óleo"
          value={getContaminationLabel(inspection.contaminacao_oleo)}
          valueColor={getContaminationColor(inspection.contaminacao_oleo)}
        />
        {inspection.data_ultima_limpeza && (
          <InfoRow
            label="Última limpeza do reservatório"
            value={formatDate(inspection.data_ultima_limpeza)}
          />
        )}
      </View>

      {inspection.complemento ? (
        <View className="mb-4 rounded-2xl bg-dhe-elevated p-4">
          <Text className="mb-2 text-sm font-bold text-dhe-text">Observações</Text>
          <Text className="text-sm leading-6 text-dhe-textSecondary">{inspection.complemento}</Text>
        </View>
      ) : null}

      <View className="mb-4 rounded-2xl bg-dhe-elevated p-4">
        <Text className="mb-1 text-sm font-bold text-dhe-text">Checklist</Text>
        <Text className="mb-3 text-xs text-dhe-textMuted">
          {checklistOk} de {checklistKeys.length} itens verificados
        </Text>
        {checklistKeys.map((key) => (
          <View key={key} className="mb-2 flex-row items-center">
            <Text className="mr-2 text-base">{inspection.checklist[key] ? "✅" : "⬜"}</Text>
            <Text
              className={`text-sm ${
                inspection.checklist[key] ? "text-dhe-text" : "text-dhe-textMuted"
              }`}
            >
              {getChecklistLabel(key)}
            </Text>
          </View>
        ))}
      </View>

      {(inspection.fotos?.length || inspection.assinatura_url) ? (
        <View className="mb-2 rounded-2xl bg-dhe-elevated p-4">
          <Text className="mb-3 text-sm font-bold text-dhe-text">Fotos, vídeos e assinatura</Text>
          <InspectionGallery fotos={inspection.fotos} assinaturaUrl={inspection.assinatura_url} />
        </View>
      ) : null}
    </View>
  );
}
