import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Download,
} from "lucide-react-native";
import { Card, StatCard, Loading, ErrorState, PageContainer, Button } from "@/components";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { useDashboardStats, useEquipments, useRequireAdmin } from "@/hooks";
import { api } from "@/services/api";
import { feedback } from "@/services/feedback";
import { getApiErrorMessage, getStatusLabel } from "@/utils";
import { colors } from "@/theme";

function formatMonthLabel(mes: string): string {
  const [, month] = mes.split("-");
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const index = Number(month) - 1;
  return labels[index] ?? mes;
}

export default function DashboardScreen() {
  const { allowed, isLoading: authLoading } = useRequireAdmin();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: equipments } = useEquipments();
  const { data: charts } = useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: () => api.getDashboardCharts(),
    enabled: allowed,
  });
  const [exporting, setExporting] = useState(false);

  const statusCounts = {
    operando: equipments?.filter((e) => e.status === "operando").length ?? 0,
    parado: equipments?.filter((e) => e.status === "parado").length ?? 0,
    manutencao: equipments?.filter((e) => e.status === "manutencao").length ?? 0,
  };

  const inspectionsChart = useMemo(
    () =>
      (charts?.inspecoes_por_mes ?? []).map((item) => ({
        label: formatMonthLabel(item.mes),
        value: item.total,
        color: colors.primary,
      })),
    [charts?.inspecoes_por_mes]
  );

  const statusChart = useMemo(
    () =>
      (charts?.equipamentos_por_status ?? []).map((item) => ({
        label: getStatusLabel(item.status as "operando" | "parado" | "manutencao"),
        value: item.total,
        color:
          item.status === "operando"
            ? colors.success
            : item.status === "parado"
              ? colors.warning
              : colors.danger,
      })),
    [charts?.equipamentos_por_status]
  );

  const contaminationChart = useMemo(
    () =>
      (charts?.contaminacao_distribuicao ?? []).map((item) => ({
        label: item.nivel,
        value: item.total,
        color:
          item.nivel === "baixa"
            ? colors.success
            : item.nivel === "media"
              ? colors.warning
              : colors.danger,
      })),
    [charts?.contaminacao_distribuicao]
  );

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const csv = await api.exportInspectionsCsv();
      const path = `${FileSystem.cacheDirectory}inspecoes-dhe-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        feedback.toast.error("Compartilhamento não disponível neste dispositivo.");
        return;
      }

      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: "Exportar inspeções",
      });
    } catch (err) {
      feedback.toast.error(getApiErrorMessage(err, "Erro ao exportar inspeções."));
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || !allowed) return <Loading fullScreen />;
  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          <Text className="mb-1 text-2xl font-bold text-dhe-text">Dashboard</Text>
          <Text className="mb-6 text-sm text-dhe-textSecondary">
            Visão geral das operações DHE
          </Text>

          <Button
            title="Exportar inspeções (CSV)"
            onPress={() => void handleExportCsv()}
            loading={exporting}
            variant="secondary"
            fullWidth
            className="mb-6"
            icon={<Download size={18} color={colors.text} />}
          />

          <View className="mb-4 flex-row gap-3">
            <StatCard
              icon={Wrench}
              label="Equipamentos"
              value={stats?.equipamentos_cadastrados ?? 0}
            />
            <StatCard
              icon={ClipboardCheck}
              label="Inspeções"
              value={stats?.inspecoes_realizadas ?? 0}
              color={colors.success}
            />
          </View>

          <View className="mb-6 flex-row gap-3">
            <StatCard
              icon={AlertTriangle}
              label="Pendências"
              value={stats?.pendencias ?? 0}
              color={colors.warning}
            />
            <StatCard
              icon={Calendar}
              label="Próx. manutenções"
              value={stats?.proximas_manutencoes ?? 0}
              color={colors.textSecondary}
            />
          </View>

          <Card className="mb-6">
            <Text className="mb-4 text-lg font-bold text-dhe-text">Inspeções por mês</Text>
            <SimpleBarChart data={inspectionsChart} barColor={colors.primary} />
          </Card>

          <Card className="mb-6">
            <Text className="mb-4 text-lg font-bold text-dhe-text">Equipamentos por status</Text>
            <SimpleBarChart data={statusChart} />
          </Card>

          <Card className="mb-6">
            <Text className="mb-4 text-lg font-bold text-dhe-text">Contaminação do óleo</Text>
            <SimpleBarChart data={contaminationChart} />
          </Card>

          <Card className="mb-6">
            <View className="mb-5 flex-row items-center">
              <TrendingUp size={20} color={colors.primary} />
              <Text className="ml-3 text-lg font-bold text-dhe-text">
                Status dos equipamentos
              </Text>
            </View>

            {[
              { label: "Operando", count: statusCounts.operando, color: colors.success },
              { label: "Parado", count: statusCounts.parado, color: colors.warning },
              { label: "Manutenção", count: statusCounts.manutencao, color: colors.danger },
            ].map((item, index, arr) => (
              <View key={item.label} className={index < arr.length - 1 ? "mb-4" : ""}>
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-sm text-dhe-text">{item.label}</Text>
                  <Text className="text-sm font-bold text-dhe-text">{item.count}</Text>
                </View>
                <View className="h-3 overflow-hidden rounded-full bg-dhe-elevated">
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: item.color,
                      width: `${equipments?.length ? (item.count / equipments.length) * 100 : 0}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <Text className="mb-3 text-lg font-bold text-dhe-text">Resultados DHE</Text>
            <Text className="text-sm leading-6 text-dhe-textSecondary">
              Nossos clientes passaram de uma média de 18 quebras por ano para 2,
              em apenas 1 ano — redução de 89% nos custos com quebra de máquinas.
            </Text>
          </Card>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
