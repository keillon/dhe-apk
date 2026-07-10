import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Loading } from "./Loading";
import { EmptyState } from "./EmptyState";
import { formatDateTime } from "@/utils";

interface AuditLogListProps {
  entidade: "equipamento" | "cliente";
  entidadeId: string;
}

function formatJson(value: Record<string, unknown> | null): string {
  if (!value) return "—";
  const entries = Object.entries(value);
  if (entries.length === 0) return "—";
  return entries.map(([key, val]) => `${key}: ${String(val)}`).join("\n");
}

export function AuditLogList({ entidade, entidadeId }: AuditLogListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", entidade, entidadeId],
    queryFn: () => api.getAuditLog(entidade, entidadeId),
    enabled: !!entidadeId,
  });

  if (isLoading) return <Loading />;

  if (!data?.length) {
    return (
      <EmptyState
        title="Sem histórico"
        description="Nenhuma alteração registrada para este registro."
      />
    );
  }

  return (
    <View>
      {data.map((entry) => (
        <View
          key={entry.id}
          className="mb-3 rounded-2xl border border-dhe-border bg-dhe-elevated p-4"
        >
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-dhe-primary">{entry.acao}</Text>
            <Text className="text-xs text-dhe-textMuted">{formatDateTime(entry.created_at)}</Text>
          </View>
          <Text className="mb-2 text-xs text-dhe-textSecondary">
            {entry.usuario.nome} • {entry.usuario.email}
          </Text>
          {entry.antes ? (
            <View className="mb-2">
              <Text className="text-xs font-semibold text-dhe-textMuted">Antes</Text>
              <Text className="text-xs leading-5 text-dhe-textSecondary">
                {formatJson(entry.antes)}
              </Text>
            </View>
          ) : null}
          {entry.depois ? (
            <View>
              <Text className="text-xs font-semibold text-dhe-textMuted">Depois</Text>
              <Text className="text-xs leading-5 text-dhe-textSecondary">
                {formatJson(entry.depois)}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
