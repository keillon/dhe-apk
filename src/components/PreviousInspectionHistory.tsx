import { Pressable, Text, View } from "react-native";
import type { Inspection, OilContamination } from "@/types";
import {
  formatDate,
  formatDateTime,
  getContaminationColor,
  getContaminationLabel,
} from "@/utils";

const OIL_HISTORY_LIMIT = 5;

interface PreviousInspectionHistoryProps {
  inspections: Inspection[];
  onApplyLast?: (inspection: Inspection) => void;
}

export function PreviousInspectionHistory({
  inspections,
  onApplyLast,
}: PreviousInspectionHistoryProps) {
  if (inspections.length === 0) {
    return (
      <View className="mb-4 rounded-2xl border border-dashed border-dhe-border bg-dhe-elevated p-4">
        <Text className="text-sm font-bold text-dhe-text">Histórico anterior</Text>
        <Text className="mt-1 text-xs leading-5 text-dhe-textMuted">
          Ainda não há inspeções neste equipamento. Esta será a primeira.
        </Text>
      </View>
    );
  }

  const last = inspections[0];
  const oilHistory = inspections.slice(0, OIL_HISTORY_LIMIT);

  return (
    <View className="mb-4">
      <View className="mb-3 rounded-2xl bg-dhe-elevated p-4">
        <Text className="mb-1 text-sm font-bold text-dhe-text">Última inspeção</Text>
        <Text className="mb-3 text-xs text-dhe-textMuted">
          {formatDateTime(last.created_at)}
          {last.tecnico?.nome ? ` • ${last.tecnico.nome}` : ""}
        </Text>

        <View className="mb-3 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-dhe-primary/20 px-3 py-1.5">
            <Text className="text-xs font-bold text-dhe-primary">Óleo {last.nivel_oleo}%</Text>
          </View>
          <View
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: `${getContaminationColor(last.contaminacao_oleo)}22` }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: getContaminationColor(last.contaminacao_oleo) }}
            >
              Contaminação {getContaminationLabel(last.contaminacao_oleo)}
            </Text>
          </View>
        </View>

        <View className="mb-2 h-2 overflow-hidden rounded-full bg-dhe-border">
          <View
            className="h-full rounded-full bg-dhe-primary"
            style={{ width: `${last.nivel_oleo}%` }}
          />
        </View>

        {last.data_ultima_limpeza ? (
          <Text className="mb-1 text-xs text-dhe-textSecondary">
            Última limpeza registrada: {formatDate(last.data_ultima_limpeza)}
          </Text>
        ) : null}

        {last.complemento ? (
          <Text className="mt-2 text-xs leading-5 text-dhe-textSecondary" numberOfLines={3}>
            Observações: {last.complemento}
          </Text>
        ) : null}

        {onApplyLast ? (
          <Pressable
            onPress={() => onApplyLast(last)}
            className="mt-3 items-center rounded-xl bg-dhe-primary/15 py-2.5"
          >
            <Text className="text-xs font-bold text-dhe-primary">
              Usar nível e contaminação da última
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="rounded-2xl bg-dhe-elevated p-4">
        <Text className="mb-3 text-sm font-bold text-dhe-text">Níveis de óleo anteriores</Text>
        {oilHistory.map((item, index) => (
          <OilHistoryRow
            key={item.id}
            inspection={item}
            isLatest={index === 0}
            showDivider={index < oilHistory.length - 1}
          />
        ))}
        {inspections.length > OIL_HISTORY_LIMIT ? (
          <Text className="mt-2 text-xs text-dhe-textMuted">
            +{inspections.length - OIL_HISTORY_LIMIT} inspeção(ões) no histórico completo
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function OilHistoryRow({
  inspection,
  isLatest,
  showDivider,
}: {
  inspection: Inspection;
  isLatest: boolean;
  showDivider: boolean;
}) {
  return (
    <View className={showDivider ? "mb-3 border-b border-dhe-border pb-3" : undefined}>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs text-dhe-textMuted">
          {formatDateTime(inspection.created_at)}
          {isLatest ? " · atual" : ""}
        </Text>
        <Text className="text-sm font-bold text-dhe-primary">{inspection.nivel_oleo}%</Text>
      </View>
      <View className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-dhe-border">
        <View
          className="h-full rounded-full bg-dhe-primary"
          style={{ width: `${inspection.nivel_oleo}%` }}
        />
      </View>
      <Text
        className="text-xs font-semibold"
        style={{ color: getContaminationColor(inspection.contaminacao_oleo as OilContamination) }}
      >
        Contaminação {getContaminationLabel(inspection.contaminacao_oleo)}
      </Text>
    </View>
  );
}
