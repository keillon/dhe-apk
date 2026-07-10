import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  EmptyState,
  PageContainer,
  RefreshableScrollView,
} from "@/components";
import { clearSyncHistory, listSyncHistory } from "@/services/sync-history";
import { feedback } from "@/services/feedback";
import { formatDateTime } from "@/utils";
import { colors } from "@/theme";

export default function SyncLogsScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  const entries = useMemo(() => {
    void refreshKey;
    return listSyncHistory();
  }, [refreshKey]);

  const handleClear = async () => {
    const confirmed = await feedback.confirm(
      "Limpar histórico",
      "Deseja remover todos os registros de sincronização?",
      "Limpar"
    );
    if (!confirmed) return;
    clearSyncHistory();
    setRefreshKey((value) => value + 1);
    feedback.toast.success("Histórico limpo.");
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-2"
        onRefresh={async () => setRefreshKey((value) => value + 1)}
      >
        <PageContainer>
          <BackHeader fallback="/(tabs)/profile" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Logs de sincronização</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Histórico de envios offline e falhas de sync
          </Text>

          {entries.length > 0 ? (
            <Button
              title="Limpar histórico"
              variant="outline"
              onPress={() => void handleClear()}
              fullWidth
              className="mb-6"
            />
          ) : null}

          {entries.length === 0 ? (
            <EmptyState
              title="Sem registros"
              description="Quando houver sincronizações offline, elas aparecerão aqui."
            />
          ) : (
            entries.map((entry) => {
              const Icon =
                entry.type === "sync_success"
                  ? CheckCircle2
                  : entry.type === "sync_failed"
                    ? AlertTriangle
                    : RefreshCw;
              const iconColor =
                entry.type === "sync_success"
                  ? colors.success
                  : entry.type === "sync_failed"
                    ? colors.danger
                    : colors.warning;

              return (
                <Card key={entry.id} className="mb-3">
                  <View className="mb-2 flex-row items-center">
                    <Icon size={18} color={iconColor} />
                    <Text className="ml-2 text-sm font-semibold text-dhe-text">
                      {entry.message}
                    </Text>
                  </View>
                  <Text className="text-xs text-dhe-textMuted">
                    {formatDateTime(entry.created_at)}
                  </Text>
                  {entry.synced != null || entry.failed != null ? (
                    <Text className="mt-2 text-xs text-dhe-textSecondary">
                      Enviadas: {entry.synced ?? 0} • Falhas: {entry.failed ?? 0}
                    </Text>
                  ) : null}
                </Card>
              );
            })
          )}
        </PageContainer>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}
