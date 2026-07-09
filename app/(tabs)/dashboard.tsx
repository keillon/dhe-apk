import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react-native";
import { Card, StatCard, Loading, ErrorState } from "@/components";
import { useDashboardStats, useEquipments } from "@/hooks";
import { colors } from "@/theme";

export default function DashboardScreen() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: equipments } = useEquipments();

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  const statusCounts = {
    operando: equipments?.filter((e) => e.status === "operando").length ?? 0,
    parado: equipments?.filter((e) => e.status === "parado").length ?? 0,
    manutencao: equipments?.filter((e) => e.status === "manutencao").length ?? 0,
  };

  return (
    <SafeAreaView className="flex-1 bg-dhe-surface" edges={["top"]}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-2xl font-bold text-dhe-dark">Dashboard</Text>
        <Text className="mb-6 text-sm text-dhe-muted">
          Visão geral das operações DHE
        </Text>

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
            color={colors.light}
          />
        </View>

        <Card className="mb-6">
          <View className="mb-4 flex-row items-center">
            <TrendingUp size={20} color={colors.primary} />
            <Text className="ml-2 text-lg font-bold text-dhe-dark">
              Status dos equipamentos
            </Text>
          </View>

          {[
            { label: "Operando", count: statusCounts.operando, color: colors.success },
            { label: "Parado", count: statusCounts.parado, color: colors.warning },
            { label: "Manutenção", count: statusCounts.manutencao, color: colors.danger },
          ].map((item) => (
            <View key={item.label} className="mb-3">
              <View className="mb-1 flex-row justify-between">
                <Text className="text-sm text-dhe-dark">{item.label}</Text>
                <Text className="text-sm font-bold text-dhe-dark">{item.count}</Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full bg-dhe-border">
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
          <Text className="mb-2 text-lg font-bold text-dhe-dark">
            Resultados DHE
          </Text>
          <Text className="text-sm leading-5 text-dhe-muted">
            Nossos clientes passaram de uma média de 18 quebras por ano para 2,
            em apenas 1 ano — redução de 89% nos custos com quebra de máquinas.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
