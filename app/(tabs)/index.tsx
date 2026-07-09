import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  QrCode,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  Bell,
  ChevronRight,
  Printer,
} from "lucide-react-native";
import { DheLogo, Button, Card, StatCard, Loading, ErrorState, OfflineBanner } from "@/components";
import { useDashboardStats, useEquipments, useNetworkStatus } from "@/hooks";
import { useAuthStore } from "@/store";
import { getGreeting } from "@/utils";
import { colors } from "@/theme";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: equipments } = useEquipments();

  const pendingEquipments = equipments?.filter(
    (e) => e.proxima_manutencao && new Date(e.proxima_manutencao) < new Date()
  );

  if (isLoading) return <Loading fullScreen />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-dhe-bg" edges={["top"]}>
      {isOffline && <OfflineBanner />}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-dhe-surface px-5 pb-8 pt-4">
          <View className="mb-5 flex-row items-center justify-between">
            <DheLogo variant="white" size="sm" />
            <Pressable
              onPress={() => router.push("/notifications")}
              className="relative rounded-full bg-dhe-elevated p-3"
            >
              <Bell size={22} color={colors.text} />
              {(stats?.pendencias ?? 0) > 0 && (
                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-dhe-danger">
                  <Text className="text-xs font-bold text-white">
                    {stats?.pendencias}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          <Text className="text-2xl font-bold text-dhe-text">
            {getGreeting()}, {user?.nome?.split(" ")[0] ?? "Técnico"}.
          </Text>
          <Text className="mt-1 text-sm text-dhe-textSecondary">
            DHE Componentes Hidráulicos
          </Text>
        </View>

        <View className="-mt-4 px-5 pb-8">
          <View className="mb-6 flex-row gap-3">
            <StatCard
              icon={Wrench}
              label="Equipamentos"
              value={stats?.equipamentos_cadastrados ?? 0}
            />
            <StatCard
              icon={ClipboardCheck}
              label="Inspeções hoje"
              value={stats?.inspecoes_hoje ?? 0}
              color={colors.success}
            />
          </View>

          {(pendingEquipments?.length ?? 0) > 0 && (
            <Card className="mb-6 border-l-4 border-l-dhe-warning">
              <View className="flex-row items-center">
                <AlertTriangle size={20} color={colors.warning} />
                <Text className="ml-3 flex-1 text-sm font-semibold text-dhe-text">
                  {pendingEquipments?.length} equipamento(s) pendente(s)
                </Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Card>
          )}

          <Button
            title="ESCANEAR QR CODE"
            onPress={() => router.push("/scan")}
            fullWidth
            size="lg"
            icon={<QrCode size={24} color={colors.bg} />}
            className="mb-3"
          />

          <Button
            title="GERAR QR CODES PARA IMPRESSÃO"
            onPress={() => router.push("/qrcodes" as Href)}
            variant="secondary"
            fullWidth
            size="lg"
            icon={<Printer size={22} color={colors.text} />}
            className="mb-6"
          />

          <Text className="mb-4 text-lg font-bold text-dhe-text">
            Equipamentos recentes
          </Text>

          {equipments?.slice(0, 3).map((eq) => (
            <Pressable
              key={eq.id}
              onPress={() => router.push(`/equipment/${eq.id}`)}
            >
              <Card className="mb-3 flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-dhe-primary/20">
                  <Wrench size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-dhe-text">{eq.nome}</Text>
                  <Text className="mt-1 text-xs text-dhe-textSecondary">
                    {eq.cliente?.empresa ?? eq.empresa} • {eq.qr_code}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
