import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { CheckCircle2, AlertTriangle, RefreshCw, CloudUpload } from "lucide-react-native";
import {
  BackHeader,
  Button,
  Card,
  EmptyState,
  PageContainer,
  RefreshableScrollView,
} from "@/components";
import { useNetworkStatus } from "@/hooks";
import {
  getPendingInspectionCount,
  syncPendingInspections,
} from "@/services/offline-sync";
import { clearSyncHistory, listSyncHistory } from "@/services/sync-history";
import { feedback } from "@/services/feedback";
import { formatDateTime } from "@/utils";
import { colors } from "@/theme";

export default function SyncScreen() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { isOffline } = useNetworkStatus();

  const refresh = useCallback(() => {
    setPendingCount(getPendingInspectionCount());
    setRefreshKey((value) => value + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

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
    refresh();
    feedback.toast.success("Histórico limpo.");
  };

  const handleRetry = async () => {
    if (syncing) return;
    if (getPendingInspectionCount() === 0) {
      feedback.toast.info("Nada pendente para sincronizar.");
      refresh();
      return;
    }

    setSyncing(true);
    try {
      const result = await syncPendingInspections();
      refresh();
      if (result.synced > 0) {
        feedback.toast.success(`${result.synced} inspeção(ões) enviada(s).`);
      }
      if (result.failed > 0) {
        feedback.toast.warning(
          `${result.failed} inspeção(ões) não enviada(s). Tente reenviar.`
        );
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-2"
        onRefresh={async () => refresh()}
      >
        <PageContainer>
          <BackHeader fallback="/(tabs)/profile" />

          <Text className="mb-1 text-2xl font-bold text-dhe-text">Sincronização</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Pendências offline e histórico de envios automáticos
          </Text>

          <Card className="mb-6">
            <View className="mb-3 flex-row items-center">
              <CloudUpload size={18} color={colors.primary} />
              <Text className="ml-2 text-base font-semibold text-dhe-text">Fila de envio</Text>
            </View>
            <Text className="mb-4 text-sm text-dhe-textSecondary">
              {isOffline
                ? "Sem conexão. As inspeções serão enviadas automaticamente quando a internet voltar."
                : pendingCount > 0
                  ? `${pendingCount} inspeção(ões) aguardando envio. A sync roda sozinha; use Reenviar se falhar.`
                  : "Nenhuma inspeção pendente. Tudo sincronizado."}
            </Text>
            <Button
              title={syncing ? "Sincronizando..." : "Reenviar pendentes"}
              onPress={() => void handleRetry()}
              loading={syncing}
              disabled={isOffline || pendingCount <= 0}
              fullWidth
              icon={<RefreshCw size={18} color={colors.bg} />}
            />
          </Card>

          {entries.length > 0 ? (
            <Button
              title="Limpar histórico"
              variant="outline"
              onPress={() => void handleClear()}
              fullWidth
              className="mb-6"
            />
          ) : null}

          <Text className="mb-3 text-sm font-semibold text-dhe-textSecondary">Histórico</Text>

          {entries.length === 0 ? (
            <EmptyState
              title="Sem histórico"
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
                    <Text className="ml-2 flex-1 text-sm font-semibold text-dhe-text">
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
